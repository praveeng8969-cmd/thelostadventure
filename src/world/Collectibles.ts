import * as THREE from 'three';
import { Island } from './Island';
import { ResourceType } from '../inventory/Item';
import { soundManager } from '../core/SoundManager';

export interface CollectibleItem {
  id: string;
  type: ResourceType;
  promptText: string;
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  collected: boolean;
}

export class CollectiblesManager {
  public group: THREE.Group;
  private collectibles: CollectibleItem[] = [];
  private island: Island;

  constructor(scene: THREE.Scene, island: Island) {
    this.island = island;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.spawnCollectibles();
  }

  private spawnCollectibles(): void {
    // 1. Collectible Wood (Driftwood logs along the beach and forest edge)
    const woodCoords = [
      { x: 34, z: 28 },
      { x: 22, z: 12 },
      { x: 48, z: 18 },
      { x: 15, z: 32 },
      { x: 38, z: 40 },
      { x: 10, z: 18 },
      { x: -5, z: 35 },
      { x: 55, z: 10 },
      { x: 25, z: 45 },
      { x: -12, z: 22 }
    ];

    woodCoords.forEach((pt, i) => {
      const y = this.island.getHeightAt(pt.x, pt.z);
      const mesh = this.createWoodMesh();
      mesh.position.set(pt.x, y + 0.15, pt.z);
      mesh.rotation.set(
        (Math.random() - 0.5) * 0.2,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.2
      );
      this.group.add(mesh);

      this.collectibles.push({
        id: `wood_${i + 1}`,
        type: 'wood',
        promptText: 'Collect Wood',
        position: new THREE.Vector3(pt.x, y, pt.z),
        mesh,
        collected: false
      });
    });

    // 2. Collectible Stones (Smooth beach and volcanic pebbles)
    const stoneCoords = [
      { x: 20, z: 26 },
      { x: 32, z: 15 },
      { x: 45, z: 32 },
      { x: 12, z: 8 },
      { x: 28, z: 36 },
      { x: 52, z: 22 },
      { x: 5, z: 25 },
      { x: -8, z: 14 }
    ];

    stoneCoords.forEach((pt, i) => {
      const y = this.island.getHeightAt(pt.x, pt.z);
      const mesh = this.createStoneMesh();
      mesh.position.set(pt.x, y + 0.12, pt.z);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      this.group.add(mesh);

      this.collectibles.push({
        id: `stone_${i + 1}`,
        type: 'stone',
        promptText: 'Collect Stone',
        position: new THREE.Vector3(pt.x, y, pt.z),
        mesh,
        collected: false
      });
    });

    // 3. Fallen Coconuts (Under coastal palm groves)
    const coconutCoords = [
      { x: 26, z: 18 },
      { x: 36, z: 22 },
      { x: 18, z: 35 },
      { x: 42, z: 12 },
      { x: 14, z: 20 },
      { x: 30, z: 42 },
      { x: -2, z: 28 }
    ];

    coconutCoords.forEach((pt, i) => {
      const y = this.island.getHeightAt(pt.x, pt.z);
      const mesh = this.createCoconutMesh();
      mesh.position.set(pt.x, y + 0.18, pt.z);
      this.group.add(mesh);

      this.collectibles.push({
        id: `coconut_${i + 1}`,
        type: 'coconut',
        promptText: 'Collect Coconut',
        position: new THREE.Vector3(pt.x, y, pt.z),
        mesh,
        collected: false
      });
    });

    // 4. Freshwater Collection Location (Inland Spring Oasis in rocky glade)
    this.createFreshwaterLocation();
  }

  private createFreshwaterLocation(): void {
    // Freshwater spring located near inland transition (x: 2, z: -12)
    const springX = 2;
    const springZ = -12;
    const springY = this.island.getHeightAt(springX, springZ);

    const springGroup = new THREE.Group();
    springGroup.position.set(springX, springY, springZ);

    // Natural stone spring pool basin
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x474643,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });
    const basinGeo = new THREE.CylinderGeometry(2.4, 2.0, 0.6, 10);
    const basinMesh = new THREE.Mesh(basinGeo, basinMat);
    basinMesh.position.y = 0.2;
    basinMesh.castShadow = true;
    basinMesh.receiveShadow = true;
    springGroup.add(basinMesh);

    // Crystal clear pool water
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85
    });
    const poolGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 12);
    const poolWater = new THREE.Mesh(poolGeo, poolWaterMat);
    poolWater.position.y = 0.45;
    springGroup.add(poolWater);

    // Surrounding mossy rocks
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4f3b,
      roughness: 0.9,
      flatShading: true
    });
    for (let r = 0; r < 6; r++) {
      const ang = (r / 6) * Math.PI * 2;
      const rockGeo = new THREE.DodecahedronGeometry(0.7, 0);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(Math.cos(ang) * 2.3, 0.4, Math.sin(ang) * 2.3);
      rock.scale.set(1.1, 0.8, 1.1);
      rock.castShadow = true;
      rock.receiveShadow = true;
      springGroup.add(rock);
    }

    this.group.add(springGroup);

    // Freshwater collection interactive node(s)
    // 3 collectible water containers/points at the spring
    const waterNodes = [
      { id: 'water_spring_1', dx: 0, dz: 0 },
      { id: 'water_spring_2', dx: 1.2, dz: 0.8 },
      { id: 'water_spring_3', dx: -1.0, dz: 1.1 }
    ];

    waterNodes.forEach((node) => {
      const nodePos = new THREE.Vector3(springX + node.dx, springY + 0.5, springZ + node.dz);
      const bottleMesh = this.createWaterVesselMesh();
      bottleMesh.position.copy(nodePos);
      this.group.add(bottleMesh);

      this.collectibles.push({
        id: node.id,
        type: 'water',
        promptText: 'Collect Water',
        position: nodePos,
        mesh: bottleMesh,
        collected: false
      });
    });
  }

  private createWoodMesh(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x6e4726,
      roughness: 0.9
    });

    // Main log
    const logGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.6, 6);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, woodMat);
    log.castShadow = true;
    log.receiveShadow = true;
    group.add(log);

    // Small branch
    const branchGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 5);
    branchGeo.rotateZ(Math.PI / 3);
    const branch = new THREE.Mesh(branchGeo, woodMat);
    branch.position.set(0.3, 0.1, 0.2);
    branch.castShadow = true;
    group.add(branch);

    return group;
  }

  private createStoneMesh(): THREE.Mesh {
    const stoneGeo = new THREE.DodecahedronGeometry(0.32, 0);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x696660,
      roughness: 0.85,
      flatShading: true
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.scale.set(1.2, 0.7, 1.0);
    stone.castShadow = true;
    stone.receiveShadow = true;
    return stone;
  }

  private createCoconutMesh(): THREE.Group {
    const group = new THREE.Group();
    const cocoMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a14,
      roughness: 0.8
    });
    const cocoGeo = new THREE.SphereGeometry(0.26, 8, 8);
    cocoGeo.scale(1.0, 1.25, 1.0);
    const coco = new THREE.Mesh(cocoGeo, cocoMat);
    coco.castShadow = true;
    coco.receiveShadow = true;
    group.add(coco);
    return group;
  }

  private createWaterVesselMesh(): THREE.Group {
    const group = new THREE.Group();
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75
    });
    const geo = new THREE.CylinderGeometry(0.16, 0.22, 0.5, 8);
    const mesh = new THREE.Mesh(geo, glassMat);
    mesh.castShadow = true;
    group.add(mesh);

    const corkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
    const corkGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.12, 6);
    const cork = new THREE.Mesh(corkGeo, corkMat);
    cork.position.y = 0.3;
    group.add(cork);
    return group;
  }

  public getNearestCollectible(playerPos: THREE.Vector3, maxRange: number = 2.8): CollectibleItem | null {
    let nearest: CollectibleItem | null = null;
    let minDist = maxRange;

    for (const item of this.collectibles) {
      if (item.collected) continue;
      const d = playerPos.distanceTo(item.position);
      if (d < minDist) {
        minDist = d;
        nearest = item;
      }
    }

    return nearest;
  }

  public collectItem(item: CollectibleItem): boolean {
    if (item.collected) return false;
    item.collected = true;
    item.mesh.visible = false;
    soundManager.playInteract();
    return true;
  }

  public getCollectedIds(): string[] {
    return this.collectibles.filter((c) => c.collected).map((c) => c.id);
  }

  public restoreCollectedIds(ids: string[]): void {
    const idSet = new Set(ids);
    for (const item of this.collectibles) {
      if (idSet.has(item.id)) {
        item.collected = true;
        item.mesh.visible = false;
      } else {
        item.collected = false;
        item.mesh.visible = true;
      }
    }
  }

  public resetAll(): void {
    for (const item of this.collectibles) {
      item.collected = false;
      item.mesh.visible = true;
    }
  }
}
