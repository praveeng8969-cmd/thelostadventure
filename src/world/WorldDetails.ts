import * as THREE from 'three';
import { Island } from './Island';

/** Instanced scenic details add scale and exploration atmosphere at low draw-call cost. */
export class WorldDetails {
  public group = new THREE.Group();

  constructor(scene: THREE.Scene, island: Island) {
    // Crossed tapered grass blades: the former 3-sided cones looked like
    // miniature trees. Thin crossed blades create an organic grass silhouette.
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let blade = 0; blade < 3; blade++) {
      const angle = blade * Math.PI / 3;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const start = vertices.length / 3;
      const bend = (blade - 1) * 0.075;
      vertices.push(
        -dx * 0.115, 0, -dz * 0.115,
         dx * 0.115, 0,  dz * 0.115,
        -dx * 0.05 + bend, 0.46, -dz * 0.05,
         dx * 0.05 + bend, 0.46,  dz * 0.05,
         bend * 1.6, 0.74, 0.025
      );
      uvs.push(0, 0, 1, 0, 0.2, 0.65, 0.8, 0.65, 0.5, 1);
      indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2,
        start + 2, start + 3, start + 4);
    }
    const grassGeometry = new THREE.BufferGeometry();
    grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    grassGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    grassGeometry.setIndex(indices);
    grassGeometry.computeVertexNormals();
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x587342, roughness: 1, side: THREE.DoubleSide
    });
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 5500);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let count = 0;
    // Deterministic scatter, preserving the open starting beach.
    for (let i = 0; i < 9000 && count < 5500; i++) {
      const a = i * 2.399963;
      const r = Math.sqrt((i + 0.5) / 9000) * 126;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = island.getHeightAt(x, z);
      if (y < 4 || y > 22 || Math.hypot(x - 28, z - 20) < 8 || Math.hypot(x - 42, z - 25) < 12) continue;
      const noise = Math.abs(Math.sin(i * 9.43) * Math.cos(i * 1.73));
      if (noise < 0.25) continue;
      dummy.position.set(x, y - 0.02, z);
      dummy.rotation.set(0, a, 0.08 * Math.sin(i));
      const size = 0.35 + noise * 1.25;
      dummy.scale.set(size, size * (0.6 + noise), size);
      dummy.updateMatrix();
      grass.setMatrixAt(count, dummy.matrix);
      color.setHSL(0.24 + noise * 0.035, 0.25 + noise * 0.13, 0.21 + noise * 0.12);
      grass.setColorAt(count, color);
      count++;
    }
    grass.count = count;
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    grass.computeBoundingSphere();
    grass.castShadow = false;
    grass.receiveShadow = false;
    this.group.add(grass);

    // Shoreline driftwood and washed-up debris give the shipwreck a grounded scale.
    const wood = new THREE.MeshStandardMaterial({ color: 0x806347, roughness: 0.97 });
    const logGeo = new THREE.CylinderGeometry(0.11, 0.16, 1, 7);
    const logs = new THREE.InstancedMesh(logGeo, wood, 90);
    count = 0;
    for (let i = 0; i < 230 && count < 90; i++) {
      const a = i * 2.399963;
      const r = 103 + Math.abs(Math.sin(i * 4.71)) * 29;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      const y = island.getHeightAt(x, z);
      if (y < 0.2 || y > 4.5 || Math.hypot(x - 42, z - 25) < 9) continue;
      dummy.position.set(x, y + 0.12, z);
      dummy.rotation.set(Math.PI / 2 + Math.sin(i) * 0.1, a, 0);
      dummy.scale.set(0.6 + (i % 4) * 0.2, 1.0 + (i % 5) * 0.45, 1);
      dummy.updateMatrix();
      logs.setMatrixAt(count++, dummy.matrix);
    }
    logs.count = count;
    logs.instanceMatrix.needsUpdate = true;
    logs.castShadow = false;
    this.group.add(logs);
    scene.add(this.group);
  }
}
