import * as THREE from 'three';

export class Player {
  public mesh: THREE.Group;
  private torso: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private backpack: THREE.Mesh;

  private currentSpeed: number = 0;
  private walkCycle: number = 0;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd99b75,
      roughness: 0.65
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a7b, // Slate blue adventurer shirt
      roughness: 0.8
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x3d4239, // Cargo green/khaki
      roughness: 0.85
    });

    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x261a0e,
      roughness: 0.9
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1a1410,
      roughness: 0.9
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // Leather canvas
      roughness: 0.75
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
    this.torso = new THREE.Mesh(torsoGeo, shirtMat);
    this.torso.position.y = 1.25;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.mesh.add(this.torso);

    // 2. Head & Hair
    const headGeo = new THREE.BoxGeometry(0.36, 0.4, 0.38);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.65;
    this.head.castShadow = true;
    this.torso.add(this.head);

    const hairGeo = new THREE.BoxGeometry(0.4, 0.18, 0.42);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.18, -0.02);
    this.head.add(hair);

    // 3. Backpack
    const packGeo = new THREE.BoxGeometry(0.5, 0.6, 0.28);
    this.backpack = new THREE.Mesh(packGeo, backpackMat);
    this.backpack.position.set(0, 0.05, -0.28);
    this.backpack.castShadow = true;
    this.torso.add(this.backpack);

    // 4. Arms with pivot at shoulder
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.42, 0.35, 0);
    const armGeo = new THREE.BoxGeometry(0.2, 0.75, 0.22);
    armGeo.translate(0, -0.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.torso.add(this.leftArmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.42, 0.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    this.torso.add(this.rightArmGroup);

    // 5. Legs with pivot at hips
    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.18, 0.85, 0);
    const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.26);
    legGeo.translate(0, -0.42, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);

    const bootGeo = new THREE.BoxGeometry(0.26, 0.25, 0.35);
    bootGeo.translate(0, -0.75, 0.04);
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.castShadow = true;
    this.leftLegGroup.add(leftBoot);
    this.mesh.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.18, 0.85, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.castShadow = true;
    this.rightLegGroup.add(rightBoot);
    this.mesh.add(this.rightLegGroup);

    scene.add(this.mesh);
  }

  public updateAnimation(deltaTime: number, speed: number, isSprinting: boolean): void {
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, speed, 0.15);

    if (this.currentSpeed > 0.1) {
      const cadence = isSprinting ? 14 : 9;
      this.walkCycle += deltaTime * cadence;

      const legAngle = Math.sin(this.walkCycle) * (isSprinting ? 0.85 : 0.55);
      const armAngle = -legAngle * (isSprinting ? 0.95 : 0.65);

      this.leftLegGroup.rotation.x = legAngle;
      this.rightLegGroup.rotation.x = -legAngle;

      this.leftArmGroup.rotation.x = armAngle;
      this.rightArmGroup.rotation.x = -armAngle;

      // Vertical body bob and forward tilt
      const bob = Math.abs(Math.cos(this.walkCycle)) * (isSprinting ? 0.08 : 0.04);
      this.torso.position.y = 1.25 + bob;
      this.torso.rotation.x = isSprinting ? 0.22 : 0.08;
    } else {
      // Idle breathing cycle
      this.walkCycle += deltaTime * 2.0;
      const breathe = Math.sin(this.walkCycle) * 0.02;
      this.torso.position.y = 1.25 + breathe;
      this.torso.rotation.x = 0;

      // Return limbs smoothly to resting position
      this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.15);
      this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.15);
      this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, 0.15);
      this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 0.15);
    }
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }
}

