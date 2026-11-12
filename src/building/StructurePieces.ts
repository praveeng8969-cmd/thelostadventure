import * as THREE from 'three';
import { TextureGenerator } from '../world/TextureGenerator';

export type StructureType =
  | 'wooden_floor'
  | 'wooden_wall'
  | 'wooden_roof'
  | 'campfire'
  | 'cooking_station';

export const STRUCTURE_SIZE = {
  FLOOR_WIDTH: 4.0,
  FLOOR_THICKNESS: 0.2,
  WALL_HEIGHT: 3.0,
  WALL_THICKNESS: 0.2
};

export class StructurePieces {
  private static woodPbr = TextureGenerator.createWoodPlankTexture();
  private static rockPbr = TextureGenerator.createRockTexture();

  private static woodMat = new THREE.MeshStandardMaterial({
    map: StructurePieces.woodPbr.diffuse,
    normalMap: StructurePieces.woodPbr.normal,
    roughness: 0.78,
    metalness: 0.05
  });

  private static darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x482e18,
    roughness: 0.88
  });

  private static thatchMat = new THREE.MeshStandardMaterial({
    color: 0x9e7c3a,
    roughness: 0.92,
    side: THREE.DoubleSide
  });

  private static stoneMat = new THREE.MeshStandardMaterial({
    map: StructurePieces.rockPbr.diffuse,
    normalMap: StructurePieces.rockPbr.normal,
    roughness: 0.82,
    flatShading: true
  });

  public static createMesh(type: StructureType): THREE.Group {
    switch (type) {
      case 'wooden_floor':
        return this.createFloorMesh();
      case 'wooden_wall':
        return this.createWallMesh();
      case 'wooden_roof':
        return this.createRoofMesh();
      case 'campfire':
        return this.createCampfireMesh();
      case 'cooking_station':
        return this.createCookingStationMesh();
    }
  }

  private static createFloorMesh(): THREE.Group {
    const group = new THREE.Group();
    const size = STRUCTURE_SIZE.FLOOR_WIDTH;
    const thickness = STRUCTURE_SIZE.FLOOR_THICKNESS;

    // Cross-support timber beams
    for (let i = 0; i < 4; i++) {
      const beamGeo = new THREE.BoxGeometry(size, 0.25, 0.25);
      const beam = new THREE.Mesh(beamGeo, this.darkWoodMat);
      beam.position.set(0, -thickness / 2, -size / 2 + 0.3 + i * 1.15);
      beam.castShadow = true;
      beam.receiveShadow = true;
      group.add(beam);
    }

    // Individual wooden floor planks
    const plankCount = 8;
    const plankWidth = size / plankCount;
    for (let p = 0; p < plankCount; p++) {
      const plankGeo = new THREE.BoxGeometry(plankWidth - 0.04, thickness, size);
      const plank = new THREE.Mesh(plankGeo, this.woodMat);
      plank.position.set(-size / 2 + plankWidth / 2 + p * plankWidth, 0, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      group.add(plank);
    }

    return group;
  }

  private static createWallMesh(): THREE.Group {
    const group = new THREE.Group();
    const width = STRUCTURE_SIZE.FLOOR_WIDTH;
    const height = STRUCTURE_SIZE.WALL_HEIGHT;

    // Vertical structural posts
    const postGeo = new THREE.BoxGeometry(0.28, height, 0.28);
    const leftPost = new THREE.Mesh(postGeo, this.darkWoodMat);
    leftPost.position.set(-width / 2 + 0.14, height / 2, 0);
    leftPost.castShadow = true;
    group.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, this.darkWoodMat);
    rightPost.position.set(width / 2 - 0.14, height / 2, 0);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Horizontal timber logs
    const logCount = 6;
    const logHeight = height / logCount;
    for (let l = 0; l < logCount; l++) {
      const logGeo = new THREE.CylinderGeometry(0.18, 0.18, width - 0.3, 8);
      logGeo.rotateZ(Math.PI / 2);
      const logMesh = new THREE.Mesh(logGeo, this.woodMat);
      logMesh.position.set(0, logHeight / 2 + l * logHeight, 0);
      logMesh.castShadow = true;
      logMesh.receiveShadow = true;
      group.add(logMesh);
    }

    return group;
  }

  private static createRoofMesh(): THREE.Group {
    const group = new THREE.Group();
    const size = STRUCTURE_SIZE.FLOOR_WIDTH;

    // Support rafters
    const rafterGeo = new THREE.BoxGeometry(size, 0.18, 0.18);
    const frontRafter = new THREE.Mesh(rafterGeo, this.darkWoodMat);
    frontRafter.position.set(0, 0.1, -size / 2 + 0.1);
    group.add(frontRafter);

    const backRafter = new THREE.Mesh(rafterGeo, this.darkWoodMat);
    backRafter.position.set(0, 0.1, size / 2 - 0.1);
    group.add(backRafter);

    // Thatched protective ceiling
    const coverGeo = new THREE.BoxGeometry(size + 0.4, 0.18, size + 0.4);
    const cover = new THREE.Mesh(coverGeo, this.thatchMat);
    cover.position.set(0, 0.15, 0);
    cover.castShadow = true;
    cover.receiveShadow = true;
    group.add(cover);

    return group;
  }

  public static createCampfireMesh(): THREE.Group {
    const group = new THREE.Group();

    // Natural stone circle
    const stoneCount = 9;
    for (let i = 0; i < stoneCount; i++) {
      const ang = (i / stoneCount) * Math.PI * 2;
      const stoneGeo = new THREE.DodecahedronGeometry(0.25, 0);
      const stone = new THREE.Mesh(stoneGeo, this.stoneMat);
      stone.position.set(Math.cos(ang) * 0.76, 0.16, Math.sin(ang) * 0.76);
      stone.scale.set(1.1, 0.75, 1.1);
      stone.castShadow = true;
      stone.receiveShadow = true;
      group.add(stone);
    }

    // Crossed firewood logs
    const logGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.95, 7);
    for (let l = 0; l < 4; l++) {
      const ang = (l / 4) * Math.PI;
      const log = new THREE.Mesh(logGeo, this.darkWoodMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = ang;
      log.position.y = 0.12;
      log.castShadow = true;
      group.add(log);
    }

    // Burnt charcoal bed
    const ashMat = new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 0.96 });
    const ashGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 8);
    const ash = new THREE.Mesh(ashGeo, ashMat);
    ash.position.y = 0.04;
    group.add(ash);

    // Dynamic fire flame
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.88
    });
    const flameGeo = new THREE.ConeGeometry(0.35, 0.85, 6);
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.name = 'flameMesh';
    flame.position.y = 0.48;
    flame.visible = false;
    group.add(flame);

    // Warm fire light
    const fireLight = new THREE.PointLight(0xff7722, 0, 15, 2);
    fireLight.name = 'fireLight';
    fireLight.position.set(0, 0.75, 0);
    group.add(fireLight);

    return group;
  }

  private static createCookingStationMesh(): THREE.Group {
    const group = new THREE.Group();

    // Stone prep counter
    const topGeo = new THREE.BoxGeometry(2.0, 0.22, 1.2);
    const top = new THREE.Mesh(topGeo, this.stoneMat);
    top.position.y = 0.9;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Timber legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.9, 0.16);
    const offsets = [
      { x: -0.85, z: -0.45 },
      { x: 0.85, z: -0.45 },
      { x: -0.85, z: 0.45 },
      { x: 0.85, z: 0.45 }
    ];
    for (const off of offsets) {
      const leg = new THREE.Mesh(legGeo, this.darkWoodMat);
      leg.position.set(off.x, 0.45, off.z);
      leg.castShadow = true;
      group.add(leg);
    }

    return group;
  }

  public static setPreviewColor(previewGroup: THREE.Group, isValid: boolean): void {
    const color = isValid ? 0x22c55e : 0xef4444;
    previewGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mesh.material;
        }
        mesh.material = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.65,
          wireframe: false
        });
      }
    });
  }
}
