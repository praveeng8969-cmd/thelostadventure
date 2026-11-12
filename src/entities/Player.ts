import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CharacterAnimState = 'IDLE' | 'WALK' | 'RUN' | 'SPRINT';

export class Player {
  public mesh: THREE.Group; // Character root (physics & position)
  private model: THREE.Group | null = null; // Visual skinned mesh hierarchy
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private currentAnimState: CharacterAnimState = 'IDLE';

  private rightHandBone: THREE.Object3D | null = null;
  private equippedAxeGroup: THREE.Group | null = null;
  private equippedToolType: 'stone_axe' | null = null;

  public isLoaded: boolean = false;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    scene.add(this.mesh);

    this.loadCharacterModel();
  }

  private loadCharacterModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      '/models/Soldier.glb',
      (gltf) => {
        const model = gltf.scene;
        this.model = model;

        // Realistic scale and grounding (Soldier model is ~1.8m height)
        model.scale.set(1.0, 1.0, 1.0);
        model.position.set(0, 0, 0);
        model.rotation.y = 0;

        // Configure shadows & materials on skinned meshes
        model.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            const mesh = child as THREE.SkinnedMesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                if ('roughness' in m) {
                  (m as THREE.MeshStandardMaterial).roughness = 0.8;
                }
              });
            }
          }

          // Locate Right Hand bone for equipment attachment
          if (child.name && (child.name === 'mixamorig:RightHand' || child.name.includes('RightHand'))) {
            this.rightHandBone = child;
          }
        });

        this.mesh.add(model);

        // Setup Animation Mixer & Actions
        this.mixer = new THREE.AnimationMixer(model);

        for (const clip of gltf.animations) {
          const action = this.mixer.clipAction(clip);
          this.actions.set(clip.name.toLowerCase(), action);
        }

        // Start in Idle
        const idleAction = this.actions.get('idle');
        if (idleAction) {
          idleAction.play();
          this.currentAction = idleAction;
        }

        this.isLoaded = true;

        // If tool was equipped before model finished loading, re-attach it
        if (this.equippedToolType) {
          this.setEquippedTool(this.equippedToolType);
        }
      },
      undefined,
      (err) => {
        console.warn('Could not load /models/Soldier.glb, falling back to procedural rig:', err);
      }
    );
  }

  public setEquippedTool(tool: 'stone_axe' | null): void {
    this.equippedToolType = tool;

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
        axe.position.set(0.02, 0.08, 0.02);
        axe.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
        axe.scale.set(0.85, 0.85, 0.85);
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
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Determine target animation state
    let targetState: CharacterAnimState = 'IDLE';
    if (speed > 5.5) {
      targetState = isSprinting ? 'SPRINT' : 'RUN';
    } else if (speed > 0.2) {
      targetState = 'WALK';
    }

    if (targetState !== this.currentAnimState) {
      this.transitionToState(targetState);
    }

    // Dynamic animation playback speed scaling
    if (this.currentAction) {
      if (this.currentAnimState === 'SPRINT') {
        this.currentAction.setEffectiveTimeScale(1.35);
      } else if (this.currentAnimState === 'RUN') {
        this.currentAction.setEffectiveTimeScale(1.05);
      } else if (this.currentAnimState === 'WALK') {
        this.currentAction.setEffectiveTimeScale(speed / 4.5);
      } else {
        this.currentAction.setEffectiveTimeScale(1.0);
      }
    }
  }

  private transitionToState(nextState: CharacterAnimState): void {
    if (!this.mixer) return;

    let targetClipName = 'idle';
    if (nextState === 'WALK') {
      targetClipName = 'walk';
    } else if (nextState === 'RUN' || nextState === 'SPRINT') {
      targetClipName = 'run';
    }

    const nextAction = this.actions.get(targetClipName);
    if (!nextAction || nextAction === this.currentAction) {
      this.currentAnimState = nextState;
      return;
    }

    const prevAction = this.currentAction;
    this.currentAnimState = nextState;
    this.currentAction = nextAction;

    nextAction.reset();
    nextAction.setEffectiveTimeScale(1.0);
    nextAction.setEffectiveWeight(1.0);
    nextAction.play();

    if (prevAction) {
      prevAction.crossFadeTo(nextAction, 0.25, true);
    }
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}
