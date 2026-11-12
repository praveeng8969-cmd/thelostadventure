import * as THREE from 'three';
import { StructureType, StructurePieces, STRUCTURE_SIZE } from './StructurePieces';
import { Island } from '../world/Island';
import { soundManager } from '../core/SoundManager';
import { CampfireManager } from '../world/Campfire';

export interface PlacedStructure {
  id: string;
  type: StructureType;
  position: THREE.Vector3;
  rotationY: number;
  mesh: THREE.Group;
}

export interface PlacedStructureSaveData {
  id: string;
  type: StructureType;
  position: { x: number; y: number; z: number };
  rotationY: number;
}

export class BuildingManager {
  private scene: THREE.Scene;
  private island: Island;
  private campfireManager: CampfireManager;

  private placedStructures: PlacedStructure[] = [];
  private activePlacementType: StructureType | null = null;
  private previewMesh: THREE.Group | null = null;
  private previewRotationY: number = 0;
  private isCurrentPlacementValid: boolean = false;
  private previewTargetPos: THREE.Vector3 = new THREE.Vector3();

  private onStructurePlacedCallback: ((type: StructureType) => void) | null = null;
  private onShelterStatusChangedCallback: ((isShelterComplete: boolean) => void) | null = null;

  public isShelterComplete: boolean = false;

  constructor(scene: THREE.Scene, island: Island, campfireManager: CampfireManager) {
    this.scene = scene;
    this.island = island;
    this.campfireManager = campfireManager;
  }

  public setCallbacks(cbs: {
    onStructurePlaced?: (type: StructureType) => void;
    onShelterStatusChanged?: (isComplete: boolean) => void;
  }): void {
    if (cbs.onStructurePlaced) this.onStructurePlacedCallback = cbs.onStructurePlaced;
    if (cbs.onShelterStatusChanged) this.onShelterStatusChangedCallback = cbs.onShelterStatusChanged;
  }

  public startPlacement(type: StructureType): void {
    this.cancelPlacement();
    this.activePlacementType = type;
    this.previewRotationY = 0;
    this.previewMesh = StructurePieces.createMesh(type);
    this.scene.add(this.previewMesh);
    StructurePieces.setPreviewColor(this.previewMesh, false);
  }

  public cancelPlacement(): void {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }
    this.activePlacementType = null;
  }

  public isPlacing(): boolean {
    return this.activePlacementType !== null;
  }

  public getActivePlacementType(): StructureType | null {
    return this.activePlacementType;
  }

  public rotatePreview(): void {
    if (!this.previewMesh) return;
    this.previewRotationY = (this.previewRotationY + Math.PI / 2) % (Math.PI * 2);
    this.previewMesh.rotation.y = this.previewRotationY;
    soundManager.playClick();
  }

  /**
   * Updates preview position and snapping based on player gaze or target ground position.
   */
  public updatePreview(playerPos: THREE.Vector3, forwardDir: THREE.Vector3): void {
    if (!this.previewMesh || !this.activePlacementType) return;

    // Project ~4.5 meters in front of the player
    const desiredPos = new THREE.Vector3(
      playerPos.x + forwardDir.x * 4.5,
      0,
      playerPos.z + forwardDir.z * 4.5
    );

    // Compute snapped target
    const snapped = this.computeSnappedTransform(this.activePlacementType, desiredPos, this.previewRotationY);
    this.previewTargetPos.copy(snapped.position);
    this.previewMesh.position.copy(snapped.position);
    this.previewMesh.rotation.y = snapped.rotationY;

    // Validate placement
    this.isCurrentPlacementValid = this.validatePlacement(this.activePlacementType, snapped.position, snapped.rotationY);
    StructurePieces.setPreviewColor(this.previewMesh, this.isCurrentPlacementValid);
  }

  private computeSnappedTransform(
    type: StructureType,
    rawPos: THREE.Vector3,
    baseRotY: number
  ): { position: THREE.Vector3; rotationY: number } {
    const floorSize = STRUCTURE_SIZE.FLOOR_WIDTH;

    if (type === 'wooden_floor') {
      // Find nearest existing floor to snap to
      const floors = this.placedStructures.filter((s) => s.type === 'wooden_floor');
      let nearestFloor: PlacedStructure | null = null;
      let minFloorDist = 5.5;

      for (const f of floors) {
        const d = rawPos.distanceTo(f.position);
        if (d < minFloorDist) {
          minFloorDist = d;
          nearestFloor = f;
        }
      }

      if (nearestFloor) {
        // Snap to one of the 4 cardinal adjacent slots
        const dx = rawPos.x - nearestFloor.position.x;
        const dz = rawPos.z - nearestFloor.position.z;
        let snapX = nearestFloor.position.x;
        let snapZ = nearestFloor.position.z;

        if (Math.abs(dx) > Math.abs(dz)) {
          snapX += dx > 0 ? floorSize : -floorSize;
        } else {
          snapZ += dz > 0 ? floorSize : -floorSize;
        }

        const terrainY = this.island.getHeightAt(snapX, snapZ);
        const y = Math.max(terrainY + 0.15, nearestFloor.position.y);
        return { position: new THREE.Vector3(snapX, y, snapZ), rotationY: baseRotY };
      } else {
        // Snap to 4m grid on terrain
        const gridX = Math.round(rawPos.x / floorSize) * floorSize;
        const gridZ = Math.round(rawPos.z / floorSize) * floorSize;
        const terrainY = this.island.getHeightAt(gridX, gridZ);
        return { position: new THREE.Vector3(gridX, terrainY + 0.15, gridZ), rotationY: baseRotY };
      }
    }

    if (type === 'wooden_wall') {
      // Walls snap to floor perimeter edges
      const floors = this.placedStructures.filter((s) => s.type === 'wooden_floor');
      let bestEdge: { pos: THREE.Vector3; rot: number } | null = null;
      let minEdgeDist = 4.0;

      for (const f of floors) {
        const half = floorSize / 2;
        const edges = [
          { pos: new THREE.Vector3(f.position.x, f.position.y, f.position.z - half), rot: 0 },
          { pos: new THREE.Vector3(f.position.x, f.position.y, f.position.z + half), rot: 0 },
          { pos: new THREE.Vector3(f.position.x + half, f.position.y, f.position.z), rot: Math.PI / 2 },
          { pos: new THREE.Vector3(f.position.x - half, f.position.y, f.position.z), rot: Math.PI / 2 }
        ];

        for (const edge of edges) {
          const d = rawPos.distanceTo(edge.pos);
          if (d < minEdgeDist) {
            minEdgeDist = d;
            bestEdge = edge;
          }
        }
      }

      if (bestEdge) {
        return { position: bestEdge.pos, rotationY: bestEdge.rot };
      }

      const terrainY = this.island.getHeightAt(rawPos.x, rawPos.z);
      return { position: new THREE.Vector3(rawPos.x, terrainY, rawPos.z), rotationY: baseRotY };
    }

    if (type === 'wooden_roof') {
      // Roofs snap on top of floors/walls
      const floors = this.placedStructures.filter((s) => s.type === 'wooden_floor');
      let bestRoofPos: THREE.Vector3 | null = null;
      let minRoofDist = 5.0;

      for (const f of floors) {
        const target = new THREE.Vector3(f.position.x, f.position.y + STRUCTURE_SIZE.WALL_HEIGHT, f.position.z);
        const d = rawPos.distanceTo(target);
        if (d < minRoofDist) {
          minRoofDist = d;
          bestRoofPos = target;
        }
      }

      if (bestRoofPos) {
        return { position: bestRoofPos, rotationY: baseRotY };
      }

      const terrainY = this.island.getHeightAt(rawPos.x, rawPos.z);
      return { position: new THREE.Vector3(rawPos.x, terrainY + 3.0, rawPos.z), rotationY: baseRotY };
    }

    // Campfire & Cooking Station follow ground
    const terrainY = this.island.getHeightAt(rawPos.x, rawPos.z);
    return { position: new THREE.Vector3(rawPos.x, terrainY, rawPos.z), rotationY: baseRotY };
  }

  private validatePlacement(type: StructureType, pos: THREE.Vector3, rotY: number): boolean {
    // 1. Within island boundary
    const distToCenter = Math.hypot(pos.x, pos.z);
    if (distToCenter > 135) return false;

    // 2. Not submerged in deep ocean water
    const terrainY = this.island.getHeightAt(pos.x, pos.z);
    if (terrainY < 0.3) return false;

    // 3. Not colliding into the shipwreck
    if (Math.hypot(pos.x - 42, pos.z - 25) < 9.0) return false;

    // 4. Prevent duplicate overlapping piece of exact same type at same position
    for (const s of this.placedStructures) {
      if (s.type === type && s.position.distanceTo(pos) < 0.6) {
        return false;
      }
    }

    // 5. Structure specific support rules
    if (type === 'wooden_wall') {
      // Must have a floor near its base
      const hasFloor = this.placedStructures.some(
        (s) => s.type === 'wooden_floor' && Math.hypot(s.position.x - pos.x, s.position.z - pos.z) < 2.5
      );
      if (!hasFloor) return false;
    }

    if (type === 'wooden_roof') {
      // Must have supporting walls or floor below
      const hasFloorBelow = this.placedStructures.some(
        (s) => s.type === 'wooden_floor' && Math.hypot(s.position.x - pos.x, s.position.z - pos.z) < 2.5
      );
      if (!hasFloorBelow) return false;
    }

    return true;
  }

  public placeCurrent(): { success: boolean; type?: StructureType; message: string } {
    if (!this.previewMesh || !this.activePlacementType) {
      return { success: false, message: 'No item selected for placement.' };
    }

    if (!this.isCurrentPlacementValid) {
      soundManager.playClick();
      return { success: false, message: 'Invalid placement location!' };
    }

    const type = this.activePlacementType;
    const finalPos = this.previewMesh.position.clone();
    const finalRotY = this.previewMesh.rotation.y;

    if (type === 'campfire') {
      // Create via campfire manager
      const camp = this.campfireManager.addCampfire(finalPos, finalRotY, false);
      this.placedStructures.push({
        id: camp.id,
        type: 'campfire',
        position: finalPos,
        rotationY: finalRotY,
        mesh: camp.group
      });
    } else {
      const mesh = StructurePieces.createMesh(type);
      mesh.position.copy(finalPos);
      mesh.rotation.y = finalRotY;
      this.scene.add(mesh);

      this.placedStructures.push({
        id: `struct_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type,
        position: finalPos,
        rotationY: finalRotY,
        mesh
      });
    }

    soundManager.playInteract();

    // Check shelter completion
    this.evaluateShelter();

    if (this.onStructurePlacedCallback) {
      this.onStructurePlacedCallback(type);
    }

    return { success: true, type, message: `Placed ${type.replace('_', ' ')}!` };
  }

  /**
   * Evaluates if there is a completed shelter (Floor + at least 3 enclosing walls + Roof overhead).
   */
  public evaluateShelter(): boolean {
    const floors = this.placedStructures.filter((s) => s.type === 'wooden_floor');
    const walls = this.placedStructures.filter((s) => s.type === 'wooden_wall');
    const roofs = this.placedStructures.filter((s) => s.type === 'wooden_roof');

    let completed = false;
    for (const f of floors) {
      // Check for walls on boundaries (within half width 2.0m)
      const surroundingWalls = walls.filter((w) => {
        const dx = Math.abs(w.position.x - f.position.x);
        const dz = Math.abs(w.position.z - f.position.z);
        return (dx <= 2.2 && dz <= 2.2) && (dx >= 1.7 || dz >= 1.7);
      });

      // Check for roof overhead
      const hasRoof = roofs.some((r) => {
        const horizDist = Math.hypot(r.position.x - f.position.x, r.position.z - f.position.z);
        const heightDiff = r.position.y - f.position.y;
        return horizDist < 1.5 && heightDiff >= 2.5 && heightDiff <= 3.8;
      });

      if (surroundingWalls.length >= 3 && hasRoof) {
        completed = true;
        break;
      }
    }

    if (completed !== this.isShelterComplete) {
      this.isShelterComplete = completed;
      if (this.onShelterStatusChangedCallback) {
        this.onShelterStatusChangedCallback(completed);
      }
    }

    return completed;
  }

  /**
   * Checks if player is currently sheltered inside a completed structure.
   */
  public checkPlayerInsideShelter(playerPos: THREE.Vector3): boolean {
    if (!this.isShelterComplete) return false;

    const floors = this.placedStructures.filter((s) => s.type === 'wooden_floor');
    for (const f of floors) {
      const dx = Math.abs(playerPos.x - f.position.x);
      const dz = Math.abs(playerPos.z - f.position.z);
      const dy = playerPos.y - f.position.y;

      if (dx <= 2.0 && dz <= 2.0 && dy >= -0.2 && dy <= 3.2) {
        return true;
      }
    }
    return false;
  }

  public serialize(): PlacedStructureSaveData[] {
    return this.placedStructures
      .filter((s) => s.type !== 'campfire') // campfires serialized separately by campfireManager
      .map((s) => ({
        id: s.id,
        type: s.type,
        position: { x: s.position.x, y: s.position.y, z: s.position.z },
        rotationY: s.rotationY
      }));
  }

  public deserialize(data: PlacedStructureSaveData[] | null | undefined): void {
    // Remove existing non-campfire structures
    const toRemove = this.placedStructures.filter((s) => s.type !== 'campfire');
    for (const s of toRemove) {
      this.scene.remove(s.mesh);
    }
    this.placedStructures = this.placedStructures.filter((s) => s.type === 'campfire');

    if (Array.isArray(data)) {
      for (const item of data) {
        const pos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
        const mesh = StructurePieces.createMesh(item.type);
        mesh.position.copy(pos);
        mesh.rotation.y = item.rotationY;
        this.scene.add(mesh);

        this.placedStructures.push({
          id: item.id,
          type: item.type,
          position: pos,
          rotationY: item.rotationY,
          mesh
        });
      }
    }

    this.evaluateShelter();
  }

  public clear(): void {
    for (const s of this.placedStructures) {
      if (s.type !== 'campfire') {
        this.scene.remove(s.mesh);
      }
    }
    this.placedStructures = [];
    this.cancelPlacement();
    this.isShelterComplete = false;
  }
}
