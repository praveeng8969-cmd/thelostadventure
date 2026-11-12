import * as THREE from 'three';

export type WeatherState = 'CLEAR' | 'SUNSET' | 'RAIN' | 'STORM';

export class Atmosphere {
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;

  private skyMesh: THREE.Mesh | null = null;
  private skyMaterial: THREE.ShaderMaterial | null = null;

  // Weather & Particles
  private rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  public currentWeather: WeatherState = 'CLEAR';
  private lightningTimer: number = 0;
  private isLightningFlashing: boolean = false;

  constructor(scene: THREE.Scene) {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0xa0d2e7, 0.0035);

    // Directional Sun
    this.sunLight = new THREE.DirectionalLight(0xfffaee, 1.85);
    this.sunLight.position.set(120, 150, 90);
    this.sunLight.castShadow = true;

    // Shadow map tuning for high-detail character & terrain
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    const shadowD = 140;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0002;
    this.sunLight.shadow.normalBias = 0.025;
    scene.add(this.sunLight);

    // Hemisphere light (sky blue above, warm beach bounce below)
    this.hemiLight = new THREE.HemisphereLight(0x7ec0ee, 0xd4ba8a, 0.75);
    this.hemiLight.position.set(0, 50, 0);
    scene.add(this.hemiLight);

    // Soft global ambient
    this.ambientLight = new THREE.AmbientLight(0xfff3e0, 0.4);
    scene.add(this.ambientLight);

    this.createSkyDome(scene);
    this.createRainSystem(scene);
  }

  private createSkyDome(scene: THREE.Scene): void {
    const skyGeo = new THREE.SphereGeometry(650, 32, 16);
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
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;

      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 col;
        if (h > 0.0) {
          col = mix(horizonColor, topColor, pow(max(h, 0.0), 0.65));
        } else {
          col = mix(horizonColor, bottomColor, pow(clamp(-h * 4.0, 0.0, 1.0), 0.5));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    this.skyMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a73e8) },
        horizonColor: { value: new THREE.Color(0xa2dbf2) },
        bottomColor: { value: new THREE.Color(0xd2c4a7) }
      },
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMaterial);
    scene.add(this.skyMesh);
  }

  private createRainSystem(scene: THREE.Scene): void {
    const count = 1200;
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0xa5d8ff,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);
  }

  public setWeather(weather: WeatherState): void {
    this.currentWeather = weather;

    if (weather === 'CLEAR') {
      if (this.skyMaterial) {
        this.skyMaterial.uniforms.topColor.value.setHex(0x1a73e8);
        this.skyMaterial.uniforms.horizonColor.value.setHex(0xa2dbf2);
      }
      this.sunLight.color.setHex(0xfffaee);
      this.sunLight.intensity = 1.85;
      this.hemiLight.color.setHex(0x7ec0ee);
      this.hemiLight.groundColor.setHex(0xd4ba8a);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'SUNSET') {
      if (this.skyMaterial) {
        this.skyMaterial.uniforms.topColor.value.setHex(0x3a2062);
        this.skyMaterial.uniforms.horizonColor.value.setHex(0xf97316);
      }
      this.sunLight.color.setHex(0xff8833);
      this.sunLight.intensity = 1.4;
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x78350f);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'RAIN' || weather === 'STORM') {
      if (this.skyMaterial) {
        this.skyMaterial.uniforms.topColor.value.setHex(0x273444);
        this.skyMaterial.uniforms.horizonColor.value.setHex(0x4b5563);
      }
      this.sunLight.color.setHex(0xcfd8dc);
      this.sunLight.intensity = 0.8;
      this.hemiLight.color.setHex(0x475569);
      this.hemiLight.groundColor.setHex(0x334155);
      if (this.rainParticles) this.rainParticles.visible = true;
    }
  }

  public cycleWeather(): void {
    const states: WeatherState[] = ['CLEAR', 'SUNSET', 'RAIN', 'STORM'];
    const idx = (states.indexOf(this.currentWeather) + 1) % states.length;
    this.setWeather(states[idx]);
  }

  public update(elapsedTime: number, playerCenter?: THREE.Vector3): void {
    // Subtle sun position sway
    this.sunLight.position.x = 120 + Math.sin(elapsedTime * 0.04) * 12;

    // Update rain particle positions
    if (this.rainParticles && this.rainParticles.visible && this.rainGeometry) {
      if (playerCenter) {
        this.rainParticles.position.set(playerCenter.x, 0, playerCenter.z);
      }

      const posAttr = this.rainGeometry.attributes.position;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        let y = posAttr.getY(i) - 0.95; // Rain fall speed
        if (y < 0) {
          y = 55 + Math.random() * 5;
        }
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;

      // Occasional lightning flash during storms
      if (this.currentWeather === 'STORM') {
        this.lightningTimer += 0.016;
        if (this.lightningTimer > 8.0 && Math.random() < 0.04) {
          this.lightningTimer = 0;
          this.isLightningFlashing = true;
          this.ambientLight.intensity = 2.5;
          setTimeout(() => {
            this.ambientLight.intensity = 0.4;
            this.isLightningFlashing = false;
          }, 120);
        }
      }
    }
  }

  public setShadowResolution(size: number): void {
    this.sunLight.shadow.mapSize.width = size;
    this.sunLight.shadow.mapSize.height = size;
    if (this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
      this.sunLight.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    }
  }
}
