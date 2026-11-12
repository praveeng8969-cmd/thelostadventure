import * as THREE from 'three';
import { Island } from '../world/Island';
import { soundManager } from '../core/SoundManager';

export class FishingSpot {
  public position: THREE.Vector3;
  private group: THREE.Group;
  private lastCatchTime: number = 0;
  private catchCooldown: number = 2.0; // 2 seconds between catches

  constructor(scene: THREE.Scene, island: Island) {
    // Shoreline shallow water location (x: 45, z: 45)
    const x = 45;
    const z = 45;
    const y = Math.max(0.1, island.getHeightAt(x, z));

    this.position = new THREE.Vector3(x, y, z);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // Fishing post / weathered pier bollard
    const postMat = new THREE.MeshStandardMaterial({ color: 0x4d3824, roughness: 0.9 });
    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.8, 7);
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 0.9;
    post.castShadow = true;
    post.receiveShadow = true;
    this.group.add(post);

    // Fishing line / buoy
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const buoyGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const buoy = new THREE.Mesh(buoyGeo, buoyMat);
    buoy.position.set(0.6, 0.25, 0.4);
    buoy.castShadow = true;
    this.group.add(buoy);

    // Gentle bobbing fish silhouette
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.2
    });
    const fishGeo = new THREE.ConeGeometry(0.16, 0.5, 5);
    fishGeo.rotateZ(Math.PI / 2);
    const fish = new THREE.Mesh(fishGeo, fishMat);
    fish.position.set(0.8, 0.1, 0.5);
    fish.name = 'fishModel';
    this.group.add(fish);

    scene.add(this.group);
  }

  public update(elapsedTime: number): void {
    const fish = this.group.getObjectByName('fishModel');
    if (fish) {
      fish.position.y = 0.1 + Math.sin(elapsedTime * 2.5) * 0.05;
      fish.rotation.y = Math.sin(elapsedTime * 1.8) * 0.4;
    }
  }

  public isPlayerNear(playerPos: THREE.Vector3, maxDistance: number = 3.5): boolean {
    return playerPos.distanceTo(this.position) < maxDistance;
  }

  public catchFish(): { success: boolean; message: string } {
    const now = performance.now() / 1000;
    if (now - this.lastCatchTime < this.catchCooldown) {
      return { success: false, message: 'Waiting for fish to bite...' };
    }

    this.lastCatchTime = now;
    soundManager.playFootstep(false); // Splash sound
    return { success: true, message: 'Caught Raw Fish (+1)!' };
  }
}

