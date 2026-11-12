import * as THREE from 'three';
import { Player } from './Player';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { InputManager } from '../core/InputManager';
import { Island } from '../world/Island';
import { soundManager } from '../core/SoundManager';

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
  private targetRotation: number = 0;
  private stepTimer: number = 0;

  public stats: PlayerStats = {
    health: 100,
    hunger: 95,
    thirst: 90
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
    const isMoving = moveInput.forward !== 0 || moveInput.strafe !== 0;
    const isSprinting = isMoving && this.input.isSprinting() && this.stats.thirst > 5;

    // Determine target speed
    let speed = 0;
    if (isMoving) {
      speed = isSprinting ? this.sprintSpeed : this.walkSpeed;
    }

    // Water resistance if wading in shallows
    const currentGroundY = this.island.getHeightAt(
      this.player.mesh.position.x,
      this.player.mesh.position.z
    );
    if (currentGroundY < 0.2) {
      speed *= 0.65; // Sluggish movement in deep water
    }

    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, speed, 0.2);

    if (isMoving) {
      // Camera-relative movement
      const forwardVec = this.camera.getForwardVector();
      const rightVec = this.camera.getRightVector();

      const moveDir = new THREE.Vector3()
        .addScaledVector(forwardVec, moveInput.forward)
        .addScaledVector(rightVec, moveInput.strafe)
        .normalize();

      // Position update
      const newX = this.player.mesh.position.x + moveDir.x * this.currentSpeed * deltaTime;
      const newZ = this.player.mesh.position.z + moveDir.z * this.currentSpeed * deltaTime;

      // Keep within island bounds
      const distFromCenter = Math.hypot(newX, newZ);
      if (distFromCenter < 145) {
        this.player.mesh.position.x = newX;
        this.player.mesh.position.z = newZ;
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
    this.updateStats(deltaTime, isMoving, isSprinting);
  }

  private updateStats(deltaTime: number, isMoving: boolean, isSprinting: boolean): void {
    // Hunger & thirst consumption rates per second
    const hungerDrain = isSprinting ? 0.08 : (isMoving ? 0.03 : 0.015);
    const thirstDrain = isSprinting ? 0.12 : (isMoving ? 0.045 : 0.02);

    this.stats.hunger = Math.max(0, this.stats.hunger - hungerDrain * deltaTime);
    this.stats.thirst = Math.max(0, this.stats.thirst - thirstDrain * deltaTime);

    // Starvation / dehydration hurts health
    if (this.stats.hunger <= 0 || this.stats.thirst <= 0) {
      this.stats.health = Math.max(0, this.stats.health - 0.25 * deltaTime);
    }
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

