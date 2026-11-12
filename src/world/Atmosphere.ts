import * as THREE from 'three';

export class Atmosphere {
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;

  constructor(scene: THREE.Scene) {
    // Sky background color
    scene.background = new THREE.Color(0x87ceeb);

    // Exponential distance fog for tropical atmospheric depth
    scene.fog = new THREE.FogExp2(0xa3d4e8, 0.0038);

    // Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.sunLight.position.set(120, 150, 90);
    this.sunLight.castShadow = true;

    // Configure Sun shadow frustum & resolution
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    const shadowD = 140;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0003;
    scene.add(this.sunLight);

    // Hemisphere light: warm sky blue above, tropical warm sandy-green bounce below
    this.hemiLight = new THREE.HemisphereLight(0x7ec0ee, 0xd4ba8a, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    scene.add(this.hemiLight);

    // Soft global ambient light
    this.ambientLight = new THREE.AmbientLight(0xfff1dc, 0.35);
    scene.add(this.ambientLight);

    // Sky dome sphere for a soft horizon gradient
    this.createSkyDome(scene);
  }

  private createSkyDome(scene: THREE.Scene): void {
    const skyGeo = new THREE.SphereGeometry(600, 32, 16);
    // Invert geometry normals
    skyGeo.scale(-1, 1, 1);

    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 topColor = vec3(0.22, 0.55, 0.92);
        vec3 horizonColor = vec3(0.72, 0.88, 0.96);
        vec3 bottomColor = vec3(0.85, 0.78, 0.65);
        
        vec3 col;
        if (h > 0.0) {
          col = mix(horizonColor, topColor, pow(max(h, 0.0), 0.6));
        } else {
          col = mix(horizonColor, bottomColor, pow(clamp(-h * 4.0, 0.0, 1.0), 0.5));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false
    });

    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
  }

  public update(elapsedTime: number): void {
    // Subtle sun sway for dynamic soft shadows
    this.sunLight.position.x = 120 + Math.sin(elapsedTime * 0.05) * 10;
  }
}

