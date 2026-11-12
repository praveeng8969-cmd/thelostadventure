import * as THREE from 'three';
import { Water } from 'three/examples/jsm/objects/Water.js';

export class Ocean {
  public mesh: THREE.Mesh;
  public water: Water;
  private waterLevel: number = 0.0;

  constructor(scene: THREE.Scene) {
    const waterGeometry = new THREE.PlaneGeometry(850, 850);

    const textureLoader = new THREE.TextureLoader();
    const waterNormals = textureLoader.load('/textures/waternormals.jpg', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });

    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(120, 150, 90).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x075e7a, // Lush tropical turquoise
      distortionScale: 3.5,
      fog: scene.fog !== undefined
    });

    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = this.waterLevel;

    this.mesh = this.water;
    scene.add(this.water);
  }

  public update(elapsedTime: number): void {
    if (this.water.material && (this.water.material as THREE.ShaderMaterial).uniforms) {
      (this.water.material as THREE.ShaderMaterial).uniforms['time'].value = elapsedTime * 0.45;
    }
  }

  public setSunDirection(sunDir: THREE.Vector3): void {
    if (this.water.material && (this.water.material as THREE.ShaderMaterial).uniforms) {
      (this.water.material as THREE.ShaderMaterial).uniforms['sunDirection'].value.copy(sunDir).normalize();
    }
  }

  public getWaterHeight(): number {
    return this.waterLevel;
  }
}
