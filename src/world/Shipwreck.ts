import * as THREE from 'three';
import { Island } from './Island';

export class Shipwreck {
  public group: THREE.Group;
  public salvageChest: THREE.Mesh;
  public isSalvaged: boolean = false;
  public interactionPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, island: Island) {
    this.group = new THREE.Group();

    // Position ship on the eastern sandy beach shore
    const shipX = 42;
    const shipZ = 25;
    const shipY = island.getHeightAt(shipX, shipZ);

    this.group.position.set(shipX, shipY, shipZ);
    // Tilted stranded angle
    this.group.rotation.set(0.18, 0.75, -0.22);

    this.buildShipwreck();

    // Spawn scattered cargo crates around the wreck on the beach
    this.spawnCargoDebris(scene, island, shipX, shipZ);

    // Create interactive salvage chest
    const chestGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.6,
      metalness: 0.3
    });
    this.salvageChest = new THREE.Mesh(chestGeo, chestMat);
    this.salvageChest.position.set(shipX + 4.5, island.getHeightAt(shipX + 4.5, shipZ + 2.0) + 0.4, shipZ + 2.0);
    this.salvageChest.castShadow = true;
    this.salvageChest.receiveShadow = true;
    scene.add(this.salvageChest);

    this.interactionPosition = this.salvageChest.position.clone();

    scene.add(this.group);
  }

  private buildShipwreck(): void {
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a3319,
      roughness: 0.88,
      metalness: 0.05
    });

    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d0c,
      roughness: 0.95
    });

    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xd9cca9,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    // 1. Lower Keel & Hull (Bow)
    const hullBowGeo = new THREE.BoxGeometry(4.8, 3.2, 12);
    const hullBow = new THREE.Mesh(hullBowGeo, woodMat);
    hullBow.position.set(0, 1.2, -4);
    hullBow.scale.set(1.0, 1.0, 1.0);
    hullBow.castShadow = true;
    hullBow.receiveShadow = true;
    this.group.add(hullBow);

    // 2. Broken Stern (tilted separately as if cracked in half by the storm)
    const hullSternGeo = new THREE.BoxGeometry(4.6, 3.4, 9);
    const hullStern = new THREE.Mesh(hullSternGeo, woodMat);
    hullStern.position.set(0.6, 1.8, 6.5);
    hullStern.rotation.x = 0.25;
    hullStern.rotation.y = 0.12;
    hullStern.castShadow = true;
    hullStern.receiveShadow = true;
    this.group.add(hullStern);

    // 3. Exposed broken ribs/timbers protruding from fracture
    for (let r = 0; r < 5; r++) {
      const ribGeo = new THREE.BoxGeometry(0.3, 2.8, 0.3);
      const rib = new THREE.Mesh(ribGeo, darkWoodMat);
      rib.position.set(-2.2 + (r % 2) * 4.4, 2.6, 0.5 + (r - 2) * 1.2);
      rib.rotation.z = (r % 2 === 0 ? 0.35 : -0.35);
      rib.rotation.x = (Math.random() - 0.5) * 0.4;
      rib.castShadow = true;
      this.group.add(rib);
    }

    // 4. Broken Main Mast
    const mastGeo = new THREE.CylinderGeometry(0.35, 0.45, 9, 8);
    const mast = new THREE.Mesh(mastGeo, woodMat);
    mast.position.set(0, 5.0, -3.5);
    mast.rotation.z = 0.35;
    mast.rotation.x = -0.2;
    mast.castShadow = true;
    this.group.add(mast);

    // 5. Snapped Yardarm & Tattered Sail
    const yardarmGeo = new THREE.CylinderGeometry(0.18, 0.18, 6.5, 6);
    const yardarm = new THREE.Mesh(yardarmGeo, darkWoodMat);
    yardarm.position.set(0.8, 6.8, -3.2);
    yardarm.rotation.z = 1.35;
    yardarm.castShadow = true;
    this.group.add(yardarm);

    // Tattered canvas sail
    const sailGeo = new THREE.PlaneGeometry(4.8, 4.2, 4, 4);
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(1.4, 5.2, -3.0);
    sail.rotation.y = 0.2;
    sail.rotation.x = 0.1;
    sail.castShadow = true;
    this.group.add(sail);

    // 6. Captain's Wheel on Stern Deck
    const wheelStandGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6);
    const wheelStand = new THREE.Mesh(wheelStandGeo, darkWoodMat);
    wheelStand.position.set(0.6, 4.0, 5.0);
    this.group.add(wheelStand);

    const wheelGeo = new THREE.TorusGeometry(0.6, 0.08, 6, 12);
    const wheel = new THREE.Mesh(wheelGeo, darkWoodMat);
    wheel.position.set(0.6, 4.6, 4.8);
    wheel.castShadow = true;
    this.group.add(wheel);
  }

  private spawnCargoDebris(scene: THREE.Scene, island: Island, shipX: number, shipZ: number): void {
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x8a6237,
      roughness: 0.85
    });

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e1b,
      roughness: 0.8
    });

    const debrisOffsets = [
      { dx: -5, dz: -3, type: 'crate', rot: 0.3 },
      { dx: 3, dz: -7, type: 'barrel', rot: 1.2 },
      { dx: 7, dz: 4, type: 'crate', rot: -0.4 },
      { dx: -6, dz: 6, type: 'barrel', rot: 0.8 },
      { dx: 2, dz: 8, type: 'crate', rot: 0.15 },
      { dx: -2, dz: -9, type: 'crate', rot: -0.6 }
    ];

    debrisOffsets.forEach((item) => {
      const x = shipX + item.dx;
      const z = shipZ + item.dz;
      const y = island.getHeightAt(x, z);

      if (item.type === 'crate') {
        const crateGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(x, y + 0.55, z);
        crate.rotation.set(0.1, item.rot, -0.08);
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);
      } else {
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(x, y + 0.6, z);
        barrel.rotation.set(0.3, item.rot, 0.2);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
      }
    });
  }

  public getInteractionDistance(playerPos: THREE.Vector3): number {
    return playerPos.distanceTo(this.interactionPosition);
  }

  public salvage(): string {
    if (!this.isSalvaged) {
      this.isSalvaged = true;
      // Slight visual opening of chest
      this.salvageChest.rotation.y += 0.35;
      return "Ship Log & Emergency Flare retrieved! You discovered clues pointing to an abandoned military bunker inland.";
    }
    return "The emergency cache has already been searched.";
  }

  public setSalvaged(salvaged: boolean): void {
    if (this.isSalvaged === salvaged) return;
    this.isSalvaged = salvaged;
    if (salvaged) {
      this.salvageChest.rotation.y += 0.35;
    }
  }
}

