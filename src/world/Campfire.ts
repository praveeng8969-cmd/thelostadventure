import * as THREE from 'three';
import { StructurePieces } from '../building/StructurePieces';
import { soundManager } from '../core/SoundManager';

export interface CampfireData {
  id: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  isLit: boolean;
}

export class CampfireInstance {
  public id: string;
  public group: THREE.Group;
  public isLit: boolean = false;
  public isCooking: boolean = false;
  public cookingTimer: number = 0;
  private flameMesh: THREE.Mesh | null = null;
  private fireLight: THREE.PointLight | null = null;

  constructor(id: string, group: THREE.Group, initiallyLit: boolean = false) {
    this.id = id;
    this.group = group;

    group.traverse((child) => {
      if (child.name === 'flameMesh') {
        this.flameMesh = child as THREE.Mesh;
      }
      if (child.name === 'fireLight') {
        this.fireLight = child as THREE.PointLight;
      }
    });

    if (initiallyLit) {
      this.light();
    } else {
      this.extinguish();
    }
  }

  public light(): void {
    this.isLit = true;
    if (this.flameMesh) this.flameMesh.visible = true;
    if (this.fireLight) this.fireLight.intensity = 2.4;
    soundManager.playInteract();
  }

  public extinguish(): void {
    this.isLit = false;
    this.isCooking = false;
    this.cookingTimer = 0;
    if (this.flameMesh) this.flameMesh.visible = false;
    if (this.fireLight) this.fireLight.intensity = 0;
    soundManager.playInteract();
  }

  public startCooking(): void {
    if (!this.isLit) return;
    this.isCooking = true;
    this.cookingTimer = 5.0; // 5 seconds
    soundManager.playInteract();
  }

  public update(deltaTime: number): { cookingFinished: boolean } {
    let cookingFinished = false;

    if (this.isLit && this.flameMesh && this.fireLight) {
      // Subtle dynamic fire flicker
      const flicker = (Math.sin(Date.now() * 0.015) + Math.cos(Date.now() * 0.027)) * 0.25;
      this.fireLight.intensity = Math.max(1.8, Math.min(3.0, 2.4 + flicker));
      this.flameMesh.scale.set(
        1.0 + flicker * 0.1,
        1.0 + flicker * 0.2,
        1.0 + flicker * 0.1
      );
    }

    if (this.isCooking) {
      this.cookingTimer -= deltaTime;
      if (this.cookingTimer <= 0) {
        this.isCooking = false;
        this.cookingTimer = 0;
        cookingFinished = true;
        soundManager.playInteract();
      }
    }

    return { cookingFinished };
  }

  public get position(): THREE.Vector3 {
    return this.group.position;
  }
}

export class CampfireManager {
  private campfires: CampfireInstance[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public addCampfire(
    position: THREE.Vector3,
    rotationY: number,
    initiallyLit: boolean = false,
    id?: string
  ): CampfireInstance {
    const mesh = StructurePieces.createCampfireMesh();
    mesh.position.copy(position);
    mesh.rotation.y = rotationY;
    this.scene.add(mesh);

    const campfireId = id || `campfire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const instance = new CampfireInstance(campfireId, mesh, initiallyLit);
    this.campfires.push(instance);
    return instance;
  }

  public getNearestCampfire(pos: THREE.Vector3, maxDistance: number = 3.2): CampfireInstance | null {
    let nearest: CampfireInstance | null = null;
    let minDist = maxDistance;

    for (const c of this.campfires) {
      const d = pos.distanceTo(c.position);
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    }

    return nearest;
  }

  public update(deltaTime: number): { finishedCampfire: CampfireInstance | null } {
    let finishedCampfire: CampfireInstance | null = null;
    for (const c of this.campfires) {
      const res = c.update(deltaTime);
      if (res.cookingFinished) {
        finishedCampfire = c;
      }
    }
    return { finishedCampfire };
  }

  public getAll(): CampfireInstance[] {
    return this.campfires;
  }

  public serialize(): CampfireData[] {
    return this.campfires.map((c) => ({
      id: c.id,
      position: { x: c.position.x, y: c.position.y, z: c.position.z },
      rotationY: c.group.rotation.y,
      isLit: c.isLit
    }));
  }

  public deserialize(data: CampfireData[] | null | undefined): void {
    // Clear existing
    for (const c of this.campfires) {
      this.scene.remove(c.group);
    }
    this.campfires = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        const pos = new THREE.Vector3(item.position.x, item.position.y, item.position.z);
        this.addCampfire(pos, item.rotationY, item.isLit, item.id);
      }
    }
  }

  public clear(): void {
    for (const c of this.campfires) {
      this.scene.remove(c.group);
    }
    this.campfires = [];
  }
}

