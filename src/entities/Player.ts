import * as THREE from 'three';
import { SurvivorVisual } from './SurvivorVisual';

export type CharacterAnimState = 'IDLE' | 'WALK' | 'RUN' | 'SPRINT';

export class Player {
  public mesh: THREE.Group; // Character root (physics & position)
  private survivor: SurvivorVisual;
  private importedModel: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animations = new Map<string, THREE.AnimationAction>();
  private activeAnimation: THREE.AnimationAction | null = null;
  private legBones: THREE.Bone[] = [];
  private armBones: THREE.Bone[] = [];
  private elapsed = 0;
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
    this.loadExpeditionModel();
  }

  private loadExpeditionModel(): void {
    new GLTFLoader().load('/models/characters/casual-character.glb', gltf => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      if (size.y < 0.01 || !Number.isFinite(size.y)) return;
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 2.05 / size.y;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      model.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
        if (obj instanceof THREE.Bone) {
          const name = obj.name.toLowerCase();
          if (/right.*hand|hand.*right/.test(name)) this.rightHandBone = obj;
          if (/thigh|upper.?leg/.test(name)) this.legBones.push(obj);
          if (/upper.?arm|shoulder/.test(name)) this.armBones.push(obj);
        }
      });
      this.mesh.add(model);
      this.importedModel = model;
      this.survivor.group.visible = false;
      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) {
          this.animations.set(clip.name.toLowerCase(), this.mixer.clipAction(clip));
        }
      }
      if (this.equippedAxeGroup) {
        const axe = this.equippedAxeGroup;
        axe.removeFromParent();
        if (this.rightHandBone) {
          axe.position.set(0, 0.02, 0);
          axe.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
          axe.scale.setScalar(0.65);
          this.rightHandBone.add(axe);
        } else {
          axe.position.set(0.35, 0.8, 0.2);
          this.mesh.add(axe);
        }
      }
      console.info('[Player] Quaternius civilian explorer GLB loaded.');
    }, undefined, err => console.warn('[Player] Civilian GLB unavailable; using procedural explorer.', err));
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
    if (!this.importedModel) return;
    this.elapsed += deltaTime;
    this.mixer?.update(deltaTime);
    const desired = speed > 5 ? 'run' : speed > 0.2 ? 'walk' : 'idle';
    const clip = [...this.animations.entries()].find(([name]) => name.includes(desired))?.[1];
    if (clip && clip !== this.activeAnimation) {
      this.activeAnimation?.fadeOut(0.2);
      clip.reset().fadeIn(0.2).play();
      this.activeAnimation = clip;
    }
    if (!this.mixer || this.animations.size === 0) {
      // Lightweight locomotion when the source rig has no animation clips.
      const amount = Math.min(0.42, speed * 0.08);
      const step = Math.sin(this.elapsed * (isSprinting ? 12 : 8)) * amount;
      for (let i = 0; i < this.legBones.length; i++) {
        this.legBones[i].rotation.x = (i % 2 ? -step : step);
      }
      for (let i = 0; i < this.armBones.length; i++) {
        this.armBones[i].rotation.x = (i % 2 ? step : -step) * 0.65;
      }
    }
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
