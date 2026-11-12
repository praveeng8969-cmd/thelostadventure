import * as THREE from 'three';
import { Island } from './Island';

/** First explorable story landmark: abandoned weather relay in the jungle. */
export class SignalRelay {
  public readonly group = new THREE.Group();
  public readonly interactionPosition = new THREE.Vector3();
  public discovered = false;
  private beacon: THREE.Mesh;
  private halo: THREE.PointLight;

  constructor(scene: THREE.Scene, island: Island) {
    const x = -40, z = -32;
    const y = island.getHeightAt(x, z);
    this.group.position.set(x, y, z);
    this.interactionPosition.set(x + 2.0, y + 1.0, z + 2.0);
    const rust = new THREE.MeshStandardMaterial({ color: 0x57594c, roughness: 0.85, metalness: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x262e2c, roughness: 0.88, metalness: 0.3 });
    const red = new THREE.MeshStandardMaterial({ color: 0xff513f, emissive: 0x8b1307, emissiveIntensity: 1.3 });
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, pos: [number, number, number]) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      return mesh;
    };
    const height = 19;
    const feet: [number, number][] = [[-1.5,-1.5],[1.5,-1.5],[1.5,1.5],[-1.5,1.5]];
    for (const [fx,fz] of feet) {
      const leg = add(new THREE.CylinderGeometry(0.07,0.14,height,6),rust,[fx*0.24,height/2,fz*0.24]);
      leg.rotation.z = fx > 0 ? 0.11 : -0.11;
      for (let k=1;k<=6;k++) {
        const beam = add(new THREE.CylinderGeometry(0.035,0.035,3.3,5),rust,[0,k*2.65,0]);
        beam.rotation.z = Math.PI/2;
        beam.rotation.y = fx > 0 ? 0 : Math.PI/2;
      }
    }
    add(new THREE.CylinderGeometry(0.18,0.18,5,8),dark,[0,19.5,0]);
    add(new THREE.BoxGeometry(2.5,0.18,2.5),dark,[0,16,0]);
    add(new THREE.BoxGeometry(1.4,1.3,0.8),rust,[2.1,0.75,2.0]);
    add(new THREE.BoxGeometry(1.15,0.5,0.07),dark,[2.1,0.98,2.42]);
    const dish = add(new THREE.SphereGeometry(1.2,12,8,0,Math.PI*2,0,Math.PI*0.52),rust,[0,18,0]);
    dish.rotation.z = Math.PI/2.5;
    this.beacon = add(new THREE.SphereGeometry(0.3,8,6),red,[0,22.1,0]);
    this.halo = new THREE.PointLight(0xff4733,1.0,11);
    this.halo.position.set(0,22.1,0);
    this.group.add(this.halo);
    scene.add(this.group);
  }

  public isNear(position: THREE.Vector3): boolean {
    return position.distanceTo(this.interactionPosition) < 4.5;
  }

  public inspect(): string {
    if (this.discovered) return 'RELAY 04: A repeating signal points toward the abandoned inland village.';
    this.discovered = true;
    return 'RELAY 04 // EMERGENCY LOG: "Evacuate the village. Do not enter the mountain facility." Signal origin marked inland.';
  }

  public update(elapsed: number): void {
    const blink = Math.sin(elapsed * 3.4) > 0.5;
    this.beacon.visible = blink;
    this.halo.intensity = blink ? 0.8 : 0;
  }
}
