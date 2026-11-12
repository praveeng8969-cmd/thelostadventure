import * as THREE from 'three';
import { Island } from '../world/Island';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3 = new THREE.Vector3();
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private island: Island;

  public yaw: number = 0;
  public pitch: number = 0.25; // Slight downward tilt by default
  public distance: number = 4.8;
  public minDistance: number = 2.0;
  public maxDistance: number = 8.0;

  constructor(camera: THREE.PerspectiveCamera, island: Island) {
    this.camera = camera;
    this.island = island;
  }

  public updateMouseLook(deltaX: number, deltaY: number): void {
    const sensitivity = 0.0022;
    this.yaw -= deltaX * sensitivity;
    this.pitch += deltaY * sensitivity;

    // Clamp vertical pitch (-20 deg to +75 deg)
    const minPitch = -0.35;
    const maxPitch = 1.3;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
  }

  public update(playerPos: THREE.Vector3, deltaTime: number): void {
    // Look at player chest/head
    const targetOffset = new THREE.Vector3(0, 1.45, 0);
    this.target.copy(playerPos).add(targetOffset);

    // Compute ideal spherical camera offset based on yaw and pitch
    const horizontalDist = this.distance * Math.cos(this.pitch);
    const verticalDist = this.distance * Math.sin(this.pitch);

    const idealOffsetX = Math.sin(this.yaw) * horizontalDist;
    const idealOffsetZ = Math.cos(this.yaw) * horizontalDist;
    const idealOffsetY = verticalDist;

    const desiredCameraPos = new THREE.Vector3(
      this.target.x + idealOffsetX,
      this.target.y + idealOffsetY,
      this.target.z + idealOffsetZ
    );

    // Prevent camera clipping through terrain
    const terrainHeight = this.island.getHeightAt(desiredCameraPos.x, desiredCameraPos.z);
    const minGroundClearance = 0.6;
    if (desiredCameraPos.y < terrainHeight + minGroundClearance) {
      desiredCameraPos.y = terrainHeight + minGroundClearance;
    }
    // Also keep above ocean surface
    if (desiredCameraPos.y < 0.6) {
      desiredCameraPos.y = 0.6;
    }

    // Smooth camera damping
    const lerpFactor = 1.0 - Math.exp(-12.0 * deltaTime);
    this.currentCameraPos.lerp(desiredCameraPos, lerpFactor);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.target);
  }

  public getForwardVector(): THREE.Vector3 {
    // Horizontal forward vector for player movement
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): THREE.Vector3 {
    // Horizontal right vector for player movement
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }
}

