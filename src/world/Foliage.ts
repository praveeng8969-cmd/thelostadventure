import * as THREE from 'three';
import { Island } from './Island';

export class Foliage {
  private group: THREE.Group;

  constructor(scene: THREE.Scene, island: Island) {
    this.group = new THREE.Group();
    this.populateFoliage(island);
    scene.add(this.group);
  }

  private populateFoliage(island: Island): void {
    const palmTreeTemplate = this.createPalmTreeMesh();
    const jungleTreeTemplate = this.createJungleTreeMesh();
    const fernTemplate = this.createFernMesh();

    const palmInstances: { x: number; z: number; scale: number; rotY: number }[] = [];
    const jungleInstances: { x: number; z: number; scale: number; rotY: number }[] = [];
    const fernInstances: { x: number; z: number; scale: number; rotY: number }[] = [];

    // Deterministic distribution across island
    const sampleCount = 380;
    for (let i = 0; i < sampleCount; i++) {
      // Golden spiral distribution
      const r = Math.sqrt((i + 1) / sampleCount) * 115;
      const theta = i * 2.39996; // Golden angle
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Keep ship area clean around (x: 42, z: 25)
      const distToShip = Math.hypot(x - 42, z - 25);
      if (distToShip < 20) continue;

      const y = island.getHeightAt(x, z);

      // Palm trees prefer beach dunes and coastal edges (y: 1.2 to 6.5)
      if (y >= 1.2 && y <= 6.5) {
        if (Math.random() < 0.65) {
          palmInstances.push({
            x,
            z,
            scale: 0.8 + Math.random() * 0.45,
            rotY: Math.random() * Math.PI * 2
          });
        }
      }
      // Lush jungle interior (y: 6.0 to 16.5)
      else if (y > 6.0 && y < 16.5) {
        if (Math.random() < 0.55) {
          jungleInstances.push({
            x,
            z,
            scale: 0.85 + Math.random() * 0.5,
            rotY: Math.random() * Math.PI * 2
          });
        }
        if (Math.random() < 0.7) {
          fernInstances.push({
            x: x + (Math.random() - 0.5) * 4,
            z: z + (Math.random() - 0.5) * 4,
            scale: 0.6 + Math.random() * 0.5,
            rotY: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // Instantiate Palm Trees
    palmInstances.forEach((inst) => {
      const palm = palmTreeTemplate.clone();
      const y = island.getHeightAt(inst.x, inst.z);
      palm.position.set(inst.x, y, inst.z);
      palm.rotation.y = inst.rotY;
      palm.scale.setScalar(inst.scale);
      this.group.add(palm);
    });

    // Instantiate Jungle Trees
    jungleInstances.forEach((inst) => {
      const tree = jungleTreeTemplate.clone();
      const y = island.getHeightAt(inst.x, inst.z);
      tree.position.set(inst.x, y, inst.z);
      tree.rotation.y = inst.rotY;
      tree.scale.setScalar(inst.scale);
      this.group.add(tree);
    });

    // Instantiate Ferns & Undergrowth
    fernInstances.forEach((inst) => {
      const fern = fernTemplate.clone();
      const y = island.getHeightAt(inst.x, inst.z);
      fern.position.set(inst.x, y, inst.z);
      fern.rotation.y = inst.rotY;
      fern.scale.setScalar(inst.scale);
      this.group.add(fern);
    });
  }

  private createPalmTreeMesh(): THREE.Group {
    const palm = new THREE.Group();

    // Segmented curved trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x6e4b2d,
      roughness: 0.9,
      metalness: 0.05
    });

    const segments = 6;
    let currentY = 0;
    let currentX = 0;
    const trunkCurve = (Math.random() - 0.5) * 0.6;

    for (let s = 0; s < segments; s++) {
      const radiusTop = 0.28 - s * 0.025;
      const radiusBottom = 0.35 - s * 0.025;
      const segHeight = 1.35;
      const segGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, segHeight, 7);
      const segMesh = new THREE.Mesh(segGeo, trunkMat);

      currentX += trunkCurve * 0.45;
      segMesh.position.set(currentX, currentY + segHeight / 2, 0);
      segMesh.rotation.z = -trunkCurve * 0.25;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      palm.add(segMesh);

      currentY += segHeight * 0.95;
    }

    // Palm Fronds / Leaves
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2e8b28,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currentX, currentY, 0);
      frondGroup.rotation.y = angle;

      // Curved leaf geometry
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.4, 1.6, 0.05, 3.4);
      leafShape.quadraticCurveTo(-0.4, 1.6, 0, 0);

      const leafGeo = new THREE.ShapeGeometry(leafShape);
      leafGeo.rotateX(Math.PI / 2);
      const leafMesh = new THREE.Mesh(leafGeo, frondMat);
      leafMesh.rotation.x = 0.65; // Arch downwards
      leafMesh.castShadow = true;

      frondGroup.add(leafMesh);
      palm.add(frondGroup);
    }

    // Coconuts
    const coconutMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.8
    });
    const coconutGeo = new THREE.SphereGeometry(0.22, 6, 6);
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(coconutGeo, coconutMat);
      const ang = (c / 3) * Math.PI * 2;
      coco.position.set(
        currentX + Math.cos(ang) * 0.28,
        currentY - 0.15,
        Math.sin(ang) * 0.28
      );
      coco.castShadow = true;
      palm.add(coco);
    }

    return palm;
  }

  private createJungleTreeMesh(): THREE.Group {
    const tree = new THREE.Group();

    // Sturdy broad trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x48321e,
      roughness: 0.9
    });
    const trunkGeo = new THREE.CylinderGeometry(0.45, 0.75, 4.5, 8);
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.y = 2.25;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    tree.add(trunkMesh);

    // Tiered dense tropical canopy
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x1f6625,
      roughness: 0.75,
      flatShading: true
    });

    const canopyTiers = [
      { y: 3.8, r: 2.8, h: 2.0 },
      { y: 5.2, r: 2.2, h: 1.8 },
      { y: 6.3, r: 1.4, h: 1.5 }
    ];

    canopyTiers.forEach((tier) => {
      const sphereGeo = new THREE.DodecahedronGeometry(tier.r, 1);
      const sphereMesh = new THREE.Mesh(sphereGeo, foliageMat);
      sphereMesh.position.y = tier.y;
      sphereMesh.scale.set(1.1, 0.75, 1.1);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      tree.add(sphereMesh);
    });

    return tree;
  }

  private createFernMesh(): THREE.Group {
    const fern = new THREE.Group();
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x3d9c32,
      side: THREE.DoubleSide,
      roughness: 0.7
    });

    for (let f = 0; f < 5; f++) {
      const bladeGeo = new THREE.ConeGeometry(0.35, 1.6, 4);
      bladeGeo.translate(0, 0.8, 0);
      const blade = new THREE.Mesh(bladeGeo, fernMat);
      const angle = (f / 5) * Math.PI * 2;
      blade.rotation.y = angle;
      blade.rotation.z = 0.65;
      blade.scale.set(1, 1, 0.15);
      blade.castShadow = true;
      fern.add(blade);
    }

    return fern;
  }
}

