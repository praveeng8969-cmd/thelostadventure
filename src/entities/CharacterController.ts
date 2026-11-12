import * as THREE from 'three';
import { Player } from './Player';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { InputManager } from '../core/InputManager';
import { Island } from '../world/Island';
import { soundManager } from '../core/SoundManager';
import { ResourceType } from '../inventory/Item';

export interface PlayerStats {
  health: number;
  hunger: number;
  thirst: number;
}

export class CharacterController {
  public player: Player;
  private camera: ThirdPersonCamera;
  private input: InputManager;
  private island: Island;

  private walkSpeed: number = 5.2;
  private sprintSpeed: number = 9.4;
  private currentSpeed: number = 0;
  private readonly maxClimbGrade = 1.15;
  private readonly slopeProbeDistance = 0.8;
  private targetRotation: number = 0;
  private stepTimer: number = 0;

  // Survival timers
  private starvationDamageTimer: number = 0;
  private onMoveDistanceCallback: ((dist: number) => void) | null = null;

  public equippedTool: 'stone_axe' | null = null;
  public isSheltered: boolean = false;

  public stats: PlayerStats = {
    health: 100,
    hunger: 100,
    thirst: 100
  };

  constructor(
    player: Player,
    camera: ThirdPersonCamera,
    input: InputManager,
    island: Island
  ) {
    this.player = player;
    this.camera = camera;
    this.input = input;
    this.island = island;

    // Start on the beach near the shipwreck
    this.spawnOnBeach();
  }

  public setOnMoveDistance(cb: (dist: number) => void): void {
    this.onMoveDistanceCallback = cb;
  }

  public equipTool(tool: 'stone_axe' | null): void {
    this.equippedTool = tool;
    this.player.setEquippedTool(tool);
    soundManager.playInteract();
  }

  public spawnOnBeach(): void {
    // Initial spawn coordinates near wreckage (x: 28, z: 20)
    const spawnX = 28;
    const spawnZ = 20;
    const spawnY = this.island.getHeightAt(spawnX, spawnZ);
    this.player.mesh.position.set(spawnX, spawnY, spawnZ);
    this.targetRotation = Math.PI * 0.4;
    this.player.mesh.rotation.y = this.targetRotation;
  }

  public update(deltaTime: number): void {
    const moveInput = this.input.getMoveVector();
    const moveStrength = Math.min(1, Math.hypot(moveInput.forward, moveInput.strafe));
    const isMoving = moveStrength > 0.05;
    const isSprinting = isMoving && this.input.isSprinting() && this.stats.thirst > 5;

    // Determine target speed
    let speed = 0;
    if (isMoving) {
      speed = (isSprinting ? this.sprintSpeed : this.walkSpeed) * moveStrength;
    }

    // Water resistance if wading in shallows
    const currentGroundY = this.island.getHeightAt(
      this.player.mesh.position.x,
      this.player.mesh.position.z
    );
    if (currentGroundY < 0.2) {
      speed *= 0.65; // Sluggish movement in deep water
    }

    // Frame-rate independent acceleration and deceleration, consistent on 30/60/120 FPS.
    const acceleration = isMoving ? 7.0 : 10.0;
    const speedBlend = 1 - Math.exp(-acceleration * deltaTime);
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, speed, speedBlend);

    if (isMoving) {
      // Camera-relative movement
      const forwardVec = this.camera.getForwardVector();
      const rightVec = this.camera.getRightVector();

      const moveDir = new THREE.Vector3()
        .addScaledVector(forwardVec, moveInput.forward)
        .addScaledVector(rightVec, moveInput.strafe)
        .normalize();

      // Terrain slope physics: climb steep ground slowly, block near-vertical
      // terrain, and slide movement along the contour where possible.
      const originX = this.player.mesh.position.x;
      const originZ = this.player.mesh.position.z;
      const probe = this.slopeProbeDistance;
      const groundX = this.island.getHeightAt(originX + probe, originZ) -
        this.island.getHeightAt(originX - probe, originZ);
      const groundZ = this.island.getHeightAt(originX, originZ + probe) -
        this.island.getHeightAt(originX, originZ - probe);
      const gradient = new THREE.Vector2(groundX / (2 * probe), groundZ / (2 * probe));
      const uphillGrade = gradient.x * moveDir.x + gradient.y * moveDir.z;

      if (uphillGrade > this.maxClimbGrade) {
        // Remove uphill component without preventing sideways movement.
        const slopeLengthSq = gradient.lengthSq();
        if (slopeLengthSq > 0.001) {
          const gradientDir = gradient.clone().normalize();
          const projected = moveDir.x * gradientDir.x + moveDir.z * gradientDir.y;
          moveDir.x -= projected * gradientDir.x;
          moveDir.z -= projected * gradientDir.y;
          const remaining = Math.hypot(moveDir.x, moveDir.z);
          if (remaining > 0.01) moveDir.divideScalar(remaining);
          else moveDir.set(0, 0, 0);
        }
      }

      const climbFactor = uphillGrade > 0 ? Math.max(0.35, 1 - uphillGrade * 0.35) : 1;
      const moveDelta = this.currentSpeed * climbFactor * deltaTime;
      const newX = originX + moveDir.x * moveDelta;
      const newZ = originZ + moveDir.z * moveDelta;

      // Check the destination slope as well to prevent tunneling through
      // sharp cliff faces at high speed or low frame rates.
      const currentHeight = this.island.getHeightAt(originX, originZ);
      const nextHeight = this.island.getHeightAt(newX, newZ);
      const stepDistance = Math.hypot(newX - originX, newZ - originZ);
      const stepGrade = stepDistance > 0.001 ? (nextHeight - currentHeight) / stepDistance : 0;
      const withinBounds = Math.hypot(newX, newZ) < 145;
      if (withinBounds && stepGrade <= this.maxClimbGrade && stepDistance > 0) {
        this.player.mesh.position.x = newX;
        this.player.mesh.position.z = newZ;
        this.onMoveDistanceCallback?.(stepDistance);
      }

      // Smooth rotation toward movement vector
      this.targetRotation = Math.atan2(moveDir.x, moveDir.z);
      // Shortest angle interpolation
      let diff = this.targetRotation - this.player.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.player.mesh.rotation.y += diff * Math.min(1.0, 14.0 * deltaTime);

      // Footstep audio cadence
      const stepInterval = isSprinting ? 0.32 : 0.48;
      this.stepTimer += deltaTime;
      if (this.stepTimer >= stepInterval) {
        this.stepTimer = 0;
        soundManager.playFootstep(isSprinting);
      }
    } else {
      this.stepTimer = 0;
    }

    // Snap smoothly to terrain elevation
    const targetY = this.island.getHeightAt(
      this.player.mesh.position.x,
      this.player.mesh.position.z
    );
    this.player.mesh.position.y = THREE.MathUtils.lerp(
      this.player.mesh.position.y,
      targetY,
      0.35
    );

    // Update player limb animations
    this.player.updateAnimation(deltaTime, this.currentSpeed, isSprinting);

    // Update survival stats decay
    this.updateSurvivalStats(deltaTime);
  }

  /**
   * Survival rules:
   * - Hunger decreases by 1 every 60 seconds (rate: 1/60 per sec).
   * - Thirst decreases by 1 every 40 seconds (rate: 1/40 per sec).
   * - When hunger or thirst is 0, health decreases gradually via rate-limited timer (not every animation frame).
   * - Clamped between 0 and 100.
   */
  private updateSurvivalStats(deltaTime: number): void {
    // 1 point per 60s for hunger, 1 point per 40s for thirst
    const hungerRate = 1.0 / 60.0;
    const thirstRate = 1.0 / 40.0;

    this.stats.hunger = Math.max(0, Math.min(100, this.stats.hunger - hungerRate * deltaTime));
    this.stats.thirst = Math.max(0, Math.min(100, this.stats.thirst - thirstRate * deltaTime));

    // Health damage when starved or dehydrated (1 damage tick every 2.5 seconds)
    if (this.stats.hunger <= 0 || this.stats.thirst <= 0) {
      this.starvationDamageTimer += deltaTime;
      if (this.starvationDamageTimer >= 2.5) {
        this.starvationDamageTimer = 0;
        let damage = 0;
        if (this.stats.hunger <= 0) damage += 1.5;
        if (this.stats.thirst <= 0) damage += 2.0;
        this.stats.health = Math.max(0, Math.min(100, this.stats.health - damage));
      }
    } else {
      this.starvationDamageTimer = 0;
    }
  }

  /**
   * Consumes an item from inventory to restore stats.
   * Clamps stats, prevents consumption if stat is already full.
   */
  public consume(type: ResourceType): { success: boolean; message: string } {
    if (type === 'coconut') {
      if (this.stats.hunger >= 100) {
        return { success: false, message: 'Hunger is already full!' };
      }
      const restore = 20;
      this.stats.hunger = Math.min(100, this.stats.hunger + restore);
      soundManager.playInteract();
      return { success: true, message: `Ate Coconut (+${restore} Hunger)` };
    }

    if (type === 'cooked_fish') {
      if (this.stats.hunger >= 100) {
        return { success: false, message: 'Hunger is already full!' };
      }
      const restore = 35;
      this.stats.hunger = Math.min(100, this.stats.hunger + restore);
      soundManager.playInteract();
      return { success: true, message: `Ate Grilled Fish (+${restore} Hunger)` };
    }

    if (type === 'water') {
      if (this.stats.thirst >= 100) {
        return { success: false, message: 'Thirst is already full!' };
      }
      const restore = 30;
      this.stats.thirst = Math.min(100, this.stats.thirst + restore);
      soundManager.playInteract();
      return { success: true, message: `Drank Fresh Water (+${restore} Thirst)` };
    }

    return { success: false, message: 'This item cannot be consumed.' };
  }

  public get position(): THREE.Vector3 {
    return this.player.mesh.position;
  }

  public get rotationY(): number {
    return this.player.mesh.rotation.y;
  }

  public setPositionAndRotation(pos: { x: number; y: number; z: number }, rotY: number): void {
    this.player.mesh.position.set(pos.x, pos.y, pos.z);
    this.player.mesh.rotation.y = rotY;
    this.targetRotation = rotY;
  }
}
