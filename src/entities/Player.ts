import * as THREE from 'three';
import { SurvivorVisual } from './SurvivorVisual';

export type CharacterAnimState = 'IDLE' | 'WALK' | 'RUN' | 'SPRINT';

export class Player {
  public mesh: THREE.Group; // Character root (physics & position)
  private survivor: SurvivorVisual;
  private rightHandBone: THREE.Object3D | null = null;
  private equippedAxeGroup: THREE.Group | null = null;

  public isLoaded: boolean = false;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    scene.add(this.mesh);

    this.survivor = new SurvivorVisual();
    this.mesh.add(this.survivor.group);
    this.rightHandBone = this.survivor.rightHand;
    this.isLoaded = true;
  }

  public setEquippedTool(tool: 'stone_axe' | null): void {

    // Clean up existing
    if (this.equippedAxeGroup) {
      if (this.equippedAxeGroup.parent) {
        this.equippedAxeGroup.parent.remove(this.equippedAxeGroup);
      }
      this.equippedAxeGroup = null;
    }

    if (tool === 'stone_axe') {
      const axe = this.createDetailedStoneAxeMesh();
      this.equippedAxeGroup = axe;

      if (this.rightHandBone) {
        // Attach to rigged humanoid hand bone
        axe.position.set(0.01, -0.06, 0.02);
        axe.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
        axe.scale.set(0.65, 0.65, 0.65);
        this.rightHandBone.add(axe);
      } else {
        // Fallback offset if model still loading
        axe.position.set(0.35, 0.8, 0.2);
        this.mesh.add(axe);
      }
    }
  }

  private createDetailedStoneAxeMesh(): THREE.Group {
    const axe = new THREE.Group();

    // Weathered timber handle
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x6e4726,
      roughness: 0.85,
      metalness: 0.05
    });
    const handleGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.75, 8);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.15;
    handle.castShadow = true;
    axe.add(handle);

    // Leather binding straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const strapGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.y = 0.16;
    axe.add(strap);

    // Chipped volcanic stone blade
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x3f3d39,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true
    });
    const stoneGeo = new THREE.ConeGeometry(0.12, 0.32, 5);
    stoneGeo.rotateZ(Math.PI / 2);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(0.08, 0.18, 0);
    stone.scale.set(1.4, 0.6, 1.0);
    stone.castShadow = true;
    axe.add(stone);

    return axe;
  }

  public updateAnimation(deltaTime: number, speed: number, isSprinting: boolean): void {
    this.survivor.update(deltaTime, speed, isSprinting);
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
