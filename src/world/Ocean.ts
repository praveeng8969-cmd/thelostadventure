import * as THREE from 'three';

export class Ocean {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private waterLevel: number = 0.0;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(800, 800, 128, 128);
    geometry.rotateX(-Math.PI / 2);

    const vertexShader = `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      // Wave calculation
      float getWave(vec2 p, float time) {
        float w1 = sin(p.x * 0.08 + time * 1.4) * cos(p.y * 0.08 + time * 1.2) * 0.35;
        float w2 = sin(p.x * 0.18 - time * 2.0 + p.y * 0.12) * 0.15;
        float w3 = cos(p.x * 0.35 + p.y * 0.35 + time * 2.8) * 0.08;
        return w1 + w2 + w3;
      }

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        
        float wave = getWave(worldPos.xz, uTime);
        worldPos.y += wave;
        
        // Approximate normal from wave gradient
        float delta = 0.2;
        float wX = getWave(worldPos.xz + vec2(delta, 0.0), uTime);
        float wZ = getWave(worldPos.xz + vec2(0.0, delta), uTime);
        vec3 normalApprox = normalize(vec3(wave - wX, delta, wave - wZ));

        vNormal = normalMatrix * normalApprox;
        vWorldPosition = worldPos.xyz;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uSunDirection;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 normal = normalize(vNormal);

        // Tropical ocean colors: shallow turquoise to deep oceanic azure
        vec3 shallowColor = vec3(0.08, 0.68, 0.76);
        vec3 deepColor = vec3(0.02, 0.24, 0.48);
        vec3 foamColor = vec3(0.92, 0.98, 1.0);

        // Fresnel term
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
        vec3 waterColor = mix(shallowColor, deepColor, 0.55);

        // Sun specular highlight
        vec3 sunDir = normalize(uSunDirection);
        vec3 halfVector = normalize(sunDir + viewDir);
        float NdotH = max(dot(normal, halfVector), 0.0);
        float specular = pow(NdotH, 120.0) * 1.8;

        // Foam tips on wave peaks
        float waveTip = smoothstep(0.35, 0.52, vWorldPosition.y);
        vec3 finalColor = mix(waterColor, foamColor, waveTip * 0.6);
        finalColor += specular * vec3(1.0, 0.95, 0.85);
        finalColor = mix(finalColor, vec3(0.7, 0.88, 0.95), fresnel * 0.5);

        // Tropical water transparency
        float alpha = mix(0.85, 0.96, fresnel);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(120, 150, 90).normalize() }
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = this.waterLevel;
    scene.add(this.mesh);
  }

  public update(elapsedTime: number): void {
    this.material.uniforms.uTime.value = elapsedTime;
  }

  public getWaterHeight(): number {
    return this.waterLevel;
  }
}

