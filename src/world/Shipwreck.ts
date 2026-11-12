import * as THREE from 'three';
import { Island } from './Island';
import { TextureGenerator } from './TextureGenerator';

export class Shipwreck {
  public group: THREE.Group;
  public salvageChest: THREE.Mesh;
  public isSalvaged: boolean = false;
  public interactionPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, island: Island) {
    this.group = new THREE.Group();

    // Position on the sandy shoreline (x: 42, z: 25)
    const shipX = 42;
    const shipZ = 25;
    const shipY = island.getHeightAt(shipX, shipZ);

    this.group.position.set(shipX, shipY, shipZ);
    this.group.rotation.set(0.18, 0.75, -0.22); // Tilted grounded roll & pitch

    this.buildDetailedShipwreck();
    this.spawnCargoDebris(scene, island, shipX, shipZ);

    // Interactive survival cache / salvage chest
    const chestWood = TextureGenerator.createWoodPlankTexture();
    const chestMat = new THREE.MeshStandardMaterial({
      map: chestWood.diffuse,
      normalMap: chestWood.normal,
      roughness: 0.65,
      metalness: 0.25
    });
    const chestGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    this.salvageChest = new THREE.Mesh(chestGeo, chestMat);
    this.salvageChest.position.set(shipX + 4.5, island.getHeightAt(shipX + 4.5, shipZ + 2.0) + 0.4, shipZ + 2.0);
    this.salvageChest.castShadow = true;
    this.salvageChest.receiveShadow = true;
    scene.add(this.salvageChest);

    this.interactionPosition = this.salvageChest.position.clone();
    scene.add(this.group);
  }

  private buildDetailedShipwreck(): void {
    const woodPbr = TextureGenerator.createWoodPlankTexture();

    const hullMat = new THREE.MeshStandardMaterial({
      map: woodPbr.diffuse,
      normalMap: woodPbr.normal,
      roughness: 0.82,
      metalness: 0.08
    });

    const darkRibMat = new THREE.MeshStandardMaterial({
      color: 0x3a2211,
      roughness: 0.92
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x2e3033,
      roughness: 0.6,
      metalness: 0.7
    });

    const sailMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb0,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    // 1. Curved Bow Section with Planking
    const bowGeo = new THREE.BoxGeometry(4.8, 3.4, 12);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(0, 1.4, -4);
    bow.castShadow = true;
    bow.receiveShadow = true;
    this.group.add(bow);

    // Hull iron keel band
    const keelGeo = new THREE.BoxGeometry(0.35, 0.6, 12.2);
    const keel = new THREE.Mesh(keelGeo, ironMat);
    keel.position.set(0, -0.2, -4);
    keel.castShadow = true;
    this.group.add(keel);

    // 2. Broken Stern (tilted separately from storm fracture)
    const sternGeo = new THREE.BoxGeometry(4.6, 3.6, 9.2);
    const stern = new THREE.Mesh(sternGeo, hullMat);
    stern.position.set(0.65, 2.0, 6.8);
    stern.rotation.set(0.28, 0.14, 0);
    stern.castShadow = true;
    stern.receiveShadow = true;
    this.group.add(stern);

    // 3. Exposed structural ribs jutting out from fracture gap
    for (let r = 0; r < 6; r++) {
      const ribGeo = new THREE.BoxGeometry(0.28, 3.2, 0.28);
      const rib = new THREE.Mesh(ribGeo, darkRibMat);
      rib.position.set(-2.2 + (r % 2) * 4.4, 2.8, 0.4 + (r - 2) * 1.3);
      rib.rotation.z = r % 2 === 0 ? 0.38 : -0.38;
      rib.rotation.x = (Math.random() - 0.5) * 0.35;
      rib.castShadow = true;
      this.group.add(rib);
    }

    // 4. Snapped Mainmast & Crossbeam
    const mastGeo = new THREE.CylinderGeometry(0.32, 0.44, 9.5, 9);
    const mast = new THREE.Mesh(mastGeo, darkRibMat);
    mast.position.set(0, 5.2, -3.5);
    mast.rotation.set(-0.22, 0, 0.38);
    mast.castShadow = true;
    this.group.add(mast);

    const yardarmGeo = new THREE.CylinderGeometry(0.16, 0.18, 6.8, 7);
    const yardarm = new THREE.Mesh(yardarmGeo, darkRibMat);
    yardarm.position.set(0.85, 7.0, -3.2);
    yardarm.rotation.z = 1.38;
    yardarm.castShadow = true;
    this.group.add(yardarm);

    // Tattered canvas sail
    const sailGeo = new THREE.PlaneGeometry(5.0, 4.4, 4, 4);
    const sail = new THREE.Mesh(sailGeo, sailMat);
    sail.position.set(1.4, 5.4, -3.0);
    sail.rotation.set(0.12, 0.22, 0);
    sail.castShadow = true;
    this.group.add(sail);

    // 5. Captain's Helm Wheel
    const wheelStandGeo = new THREE.CylinderGeometry(0.1, 0.14, 1.3, 6);
    const wheelStand = new THREE.Mesh(wheelStandGeo, darkRibMat);
    wheelStand.position.set(0.65, 4.2, 5.2);
    this.group.add(wheelStand);

    const wheelGeo = new THREE.TorusGeometry(0.62, 0.08, 6, 12);
    const wheel = new THREE.Mesh(wheelGeo, darkRibMat);
    wheel.position.set(0.65, 4.8, 5.0);
    wheel.castShadow = true;
    this.group.add(wheel);
  }

  private spawnCargoDebris(scene: THREE.Scene, island: Island, shipX: number, shipZ: number): void {
    const woodPbr = TextureGenerator.createWoodPlankTexture();
    const crateMat = new THREE.MeshStandardMaterial({
      map: woodPbr.diffuse,
      normalMap: woodPbr.normal,
      roughness: 0.8
    });

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e1b,
      roughness: 0.75
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
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 9);
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
      this.salvageChest.rotation.y += 0.35;
      return 'Ship Log & Emergency Flare retrieved! Clues point to secrets inland.';
    }
    return 'The emergency cache has already been searched.';
  }

  public setSalvaged(salvaged: boolean): void {
    if (this.isSalvaged === salvaged) return;
    this.isSalvaged = salvaged;
    if (salvaged) {
      this.salvageChest.rotation.y += 0.35;
    }
  }
}
