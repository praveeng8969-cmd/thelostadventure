import * as THREE from 'three';

/**
 * Lightweight civilian expedition survivor for mobile/WebGL.
 * Articulated shoulders and hips provide actual walk/run motion without a
 * futuristic military suit. All geometry is shared across instances.
 */
export class SurvivorVisual {
  public readonly group = new THREE.Group();
  public readonly rightHand = new THREE.Group();
  private leftArm = new THREE.Group();
  private rightArm = new THREE.Group();
  private leftLeg = new THREE.Group();
  private rightLeg = new THREE.Group();
  private torso = new THREE.Group();
  private clock = 0;

  constructor() {
    const skin = new THREE.MeshStandardMaterial({ color: 0xb87f5c, roughness: 0.91 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x668077, roughness: 0.94 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x655b43, roughness: 0.96 });
    const boot = new THREE.MeshStandardMaterial({ color: 0x292824, roughness: 0.85 });
    const canvas = new THREE.MeshStandardMaterial({ color: 0x9a7649, roughness: 0.96 });
    const straps = new THREE.MeshStandardMaterial({ color: 0x353e32, roughness: 0.95 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 1 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x777e75, roughness: 0.48, metalness: 0.45 });

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z, 2, 2, 2);
    const round = (x: number, y: number, z: number) => new THREE.SphereGeometry(1, 12, 8).scale(x, y, z);

    this.group.add(this.torso);
    add(this.torso, box(0.56, 0.67, 0.32), shirt, 0, 1.24, 0);
    add(this.torso, box(0.44, 0.15, 0.3), pants, 0, 0.86, 0);
    add(this.torso, box(0.58, 0.075, 0.34), straps, 0, 0.89, 0);
    add(this.torso, round(0.11, 0.15, 0.11), skin, 0, 1.66, 0);
    add(this.torso, round(0.18, 0.22, 0.17), skin, 0, 1.86, 0.015);
    add(this.torso, round(0.18, 0.075, 0.17), hair, 0, 2.025, -0.025);
    // Visor-free, non-military face, small nose and eyebrows.
    add(this.torso, round(0.055, 0.055, 0.065), skin, 0, 1.84, 0.17);
    add(this.torso, box(0.31, 0.065, 0.16), canvas, 0, 2.055, -0.025); // expedition cap
    add(this.torso, box(0.32, 0.025, 0.13), canvas, 0, 2.035, 0.11);

    // Worn hiking backpack with shoulder straps and rolled sleeping mat.
    add(this.torso, box(0.48, 0.63, 0.24), canvas, 0, 1.27, -0.29);
    add(this.torso, box(0.45, 0.23, 0.12), straps, 0, 1.02, -0.42);
    for (const side of [-1, 1]) {
      const strap = add(this.torso, box(0.075, 0.62, 0.065), straps, side * 0.22, 1.32, 0.18);
      strap.rotation.z = side * 0.08;
      add(this.torso, box(0.08, 0.08, 0.035), metal, side * 0.22, 1.22, 0.225);
    }
    const roll = add(this.torso, new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10), straps, 0, 1.68, -0.31);
    roll.rotation.z = Math.PI / 2;

    for (const side of [-1, 1]) {
      const arm = side < 0 ? this.leftArm : this.rightArm;
      arm.position.set(side * 0.34, 1.52, 0);
      this.torso.add(arm);
      add(arm, box(0.19, 0.38, 0.23), shirt, 0, -0.2, 0);
      add(arm, round(0.095, 0.19, 0.095), skin, 0, -0.48, 0);
      add(arm, round(0.105, 0.085, 0.11), skin, 0, -0.7, 0.02);
      if (side > 0) {
        this.rightHand.position.set(0, -0.7, 0.02);
        arm.add(this.rightHand);
      }
      const leg = side < 0 ? this.leftLeg : this.rightLeg;
      leg.position.set(side * 0.145, 0.86, 0);
      this.group.add(leg);
      add(leg, box(0.23, 0.69, 0.25), pants, 0, -0.36, 0);
      add(leg, box(0.24, 0.23, 0.29), boot, 0, -0.73, 0.04);
      add(leg, box(0.25, 0.095, 0.39), boot, 0, -0.82, 0.095);
      add(leg, box(0.235, 0.17, 0.265), canvas, 0, -0.48, 0.005); // knee reinforcement
    }
  }

  public update(dt: number, speed: number, sprinting: boolean): void {
    const intensity = Math.min(1, speed / 4.2);
    this.clock += dt * (sprinting ? 11 : 7.5) * (0.35 + intensity);
    const stride = Math.sin(this.clock) * intensity;
    const swing = sprinting ? 0.78 : 0.5;
    this.leftLeg.rotation.x = stride * swing;
    this.rightLeg.rotation.x = -stride * swing;
    this.leftArm.rotation.x = -stride * swing * 0.8;
    this.rightArm.rotation.x = stride * swing * 0.8;
    this.torso.position.y = Math.abs(Math.sin(this.clock)) * 0.035 * intensity;
    this.torso.rotation.z = Math.sin(this.clock * 0.5) * 0.018 * intensity;
  }
}
