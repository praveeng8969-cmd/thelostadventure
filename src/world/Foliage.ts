import * as THREE from 'three';
import { Island } from './Island';

export class Foliage {
  public group: THREE.Group;
  private palmTrees: THREE.Group[] = [];
  private ferns: THREE.Group[] = [];

  constructor(scene: THREE.Scene, island: Island) {
    this.group = new THREE.Group();
    this.populateFoliage(island);
    scene.add(this.group);
  }

  private populateFoliage(island: Island): void {
    const palmTemplate = this.createRealisticPalmMesh();
    const jungleTreeTemplate = this.createJungleCanopyMesh();
    const fernTemplate = this.createDetailedFernMesh();

    const sampleCount = 360;
    for (let i = 0; i < sampleCount; i++) {
      // Golden angle distribution for natural organic spread
      const r = Math.sqrt((i + 1) / sampleCount) * 118;
      const theta = i * 2.39996;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);

      // Keep clearance around shipwreck (x: 42, z: 25) and initial spawn (x: 28, z: 20)
      if (Math.hypot(x - 42, z - 25) < 18) continue;
      if (Math.hypot(x - 28, z - 20) < 10) continue;
      // Keep clearance around freshwater spring (x: 2, z: -12)
      if (Math.hypot(x - 2, z - (-12)) < 8) continue;

      const y = island.getHeightAt(x, z);

      // 1. Coconut Palms along beach dunes and coastal slopes (y: 1.2 to 7.0)
      if (y >= 1.2 && y <= 7.0) {
        if (Math.random() < 0.62) {
          const palm = palmTemplate.clone();
          palm.position.set(x, y, z);
          palm.rotation.y = Math.random() * Math.PI * 2;
          const s = 0.85 + Math.random() * 0.45;
          palm.scale.set(s, s * (0.9 + Math.random() * 0.25), s);
          this.group.add(palm);
          this.palmTrees.push(palm);
        }
      }
      // 2. Dense Lush Jungle Interior (y: 6.5 to 17.5)
      else if (y > 6.5 && y < 17.5) {
        if (Math.random() < 0.52) {
          const tree = jungleTreeTemplate.clone();
          tree.position.set(x, y, z);
          tree.rotation.y = Math.random() * Math.PI * 2;
          const s = 0.9 + Math.random() * 0.5;
          tree.scale.set(s, s * (0.9 + Math.random() * 0.25), s);
          this.group.add(tree);
        }
        if (Math.random() < 0.72) {
          const fern = fernTemplate.clone();
          fern.position.set(x + (Math.random() - 0.5) * 5, y, z + (Math.random() - 0.5) * 5);
          fern.rotation.y = Math.random() * Math.PI * 2;
          const s = 0.7 + Math.random() * 0.5;
          fern.scale.set(s, s, s);
          this.group.add(fern);
          this.ferns.push(fern);
        }
      }
    }
  }

  private createRealisticPalmMesh(): THREE.Group {
    const palm = new THREE.Group();

    // Trunk Material: natural weathered brown bark with roughness
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e26,
      roughness: 0.88,
      metalness: 0.04
    });

    // Frond Material: vibrant tropical green with double-sided rendering
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x228b22,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const coconutMat = new THREE.MeshStandardMaterial({
      color: 0x3d2511,
      roughness: 0.85
    });

    // Segmented curved trunk
    const segments = 8;
    let currentY = 0;
    let currentX = 0;
    const curveAmount = (Math.random() - 0.5) * 0.7;

    for (let s = 0; s < segments; s++) {
      const rTop = 0.25 - s * 0.016;
      const rBottom = 0.32 - s * 0.016;
      const segH = 1.25;
      const segGeo = new THREE.CylinderGeometry(rTop, rBottom, segH, 8);
      const segMesh = new THREE.Mesh(segGeo, trunkMat);

      currentX += curveAmount * 0.35;
      segMesh.position.set(currentX, currentY + segH / 2, 0);
      segMesh.rotation.z = -curveAmount * 0.18;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      palm.add(segMesh);

      currentY += segH * 0.94;
    }

    // Crown of graceful, arched coconut palm fronds
    const frondCount = 9;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currentX, currentY, 0);
      frondGroup.rotation.y = angle;

      // Realistic curved leaf geometry
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.45, 1.8, 0.04, 3.8);
      leafShape.quadraticCurveTo(-0.45, 1.8, 0, 0);

      const leafGeo = new THREE.ShapeGeometry(leafShape);
      leafGeo.rotateX(Math.PI / 2);
      const leafMesh = new THREE.Mesh(leafGeo, frondMat);
      leafMesh.rotation.x = 0.62 + (f % 2) * 0.15; // Natural staggered droop
      leafMesh.castShadow = true;

      frondGroup.add(leafMesh);
      palm.add(frondGroup);
    }

    // Coconuts nestled in the crown
    const cocoGeo = new THREE.SphereGeometry(0.2, 7, 7);
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(cocoGeo, coconutMat);
      const ang = (c / 3) * Math.PI * 2;
      coco.position.set(
        currentX + Math.cos(ang) * 0.24,
        currentY - 0.12,
        Math.sin(ang) * 0.24
      );
      coco.castShadow = true;
      palm.add(coco);
    }

    return palm;
  }

  private createJungleCanopyMesh(): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x48321e,
      roughness: 0.92
    });
    const trunkGeo = new THREE.CylinderGeometry(0.45, 0.75, 4.8, 9);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.4;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Multi-tiered foliage canopies
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x1d5c22,
      roughness: 0.75,
      flatShading: true
    });

    const tiers = [
      { y: 4.2, r: 3.0, h: 2.2 },
      { y: 5.8, r: 2.4, h: 2.0 },
      { y: 7.0, r: 1.6, h: 1.6 }
    ];

    tiers.forEach((tier) => {
      const geo = new THREE.DodecahedronGeometry(tier.r, 1);
      const mesh = new THREE.Mesh(geo, canopyMat);
      mesh.position.y = tier.y;
      mesh.scale.set(1.15, 0.72, 1.15);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      tree.add(mesh);
    });

    return tree;
  }

  private createDetailedFernMesh(): THREE.Group {
    const fern = new THREE.Group();
    const fernMat = new THREE.MeshStandardMaterial({
      color: 0x2e8b28,
      side: THREE.DoubleSide,
      roughness: 0.65
    });

    const bladeCount = 7;
    for (let f = 0; f < bladeCount; f++) {
      const bladeGeo = new THREE.ConeGeometry(0.38, 1.8, 4);
      bladeGeo.translate(0, 0.9, 0);
      const blade = new THREE.Mesh(bladeGeo, fernMat);
      const angle = (f / bladeCount) * Math.PI * 2;
      blade.rotation.y = angle;
      blade.rotation.z = 0.68;
      blade.scale.set(1, 1, 0.12);
      blade.castShadow = true;
      fern.add(blade);
    }

    return fern;
  }

  /**
   * Subtle tropical wind sway animation for palm crowns and ferns.
   */
  public update(elapsedTime: number): void {
    const windSpeed = 1.2;
    const sway = Math.sin(elapsedTime * windSpeed) * 0.025;

    for (let i = 0; i < this.palmTrees.length; i++) {
      const palm = this.palmTrees[i];
      palm.rotation.z = sway * Math.cos(i * 0.5);
    }
  }
}
