import * as THREE from 'three';
import { Island } from './Island';

export class Rocks {
  private group: THREE.Group;

  constructor(scene: THREE.Scene, island: Island) {
    this.group = new THREE.Group();
    this.populateRocks(island);
    scene.add(this.group);
  }

  private populateRocks(island: Island): void {
    const rockGeo1 = new THREE.DodecahedronGeometry(1.6, 0);
    const rockGeo2 = new THREE.IcosahedronGeometry(2.2, 0);

    const coastalRockMat = new THREE.MeshStandardMaterial({
      color: 0x5a574f,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });

    const cliffRockMat = new THREE.MeshStandardMaterial({
      color: 0x474542,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    // Rock clusters along beaches and shoreline
    const coastalRockCount = 45;
    for (let i = 0; i < coastalRockCount; i++) {
      const angle = (i / coastalRockCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 110 + Math.random() * 22;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Don't spawn right on top of shipwreck
      if (Math.hypot(x - 42, z - 25) < 18) continue;

      const y = island.getHeightAt(x, z);
      const geo = Math.random() > 0.5 ? rockGeo1 : rockGeo2;
      const mesh = new THREE.Mesh(geo, coastalRockMat);

      mesh.position.set(x, y - 0.2, z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const s = 0.8 + Math.random() * 1.6;
      mesh.scale.set(s * (0.8 + Math.random() * 0.4), s, s * (0.8 + Math.random() * 0.4));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    // Inland mountain boulders and ridges (high altitude)
    const mountainRockCount = 35;
    for (let i = 0; i < mountainRockCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = island.getHeightAt(x, z);

      if (y > 10.0) {
        const mesh = new THREE.Mesh(rockGeo2, cliffRockMat);
        mesh.position.set(x, y - 0.5, z);
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        const s = 1.2 + Math.random() * 2.2;
        mesh.scale.set(s, s * 1.3, s);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);
      }
    }
  }
}

