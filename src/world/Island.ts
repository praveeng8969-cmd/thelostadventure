import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export class Island {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  private size: number = 380;
  private segments: number = 220;
  private islandRadius: number = 138;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );
    this.geometry.rotateX(-Math.PI / 2);

    const posAttr = this.geometry.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    // Realistic PBR tone palettes
    const wetSandColor = new THREE.Color(0xb59357);
    const goldenSandColor = new THREE.Color(0xdfbe7c);
    const coastalTransitionColor = new THREE.Color(0x90a852);
    const lushJungleColor = new THREE.Color(0x356e29);
    const deepJungleColor = new THREE.Color(0x224e1b);
    const cliffRockColor = new THREE.Color(0x48443f);
    const mountainPeakColor = new THREE.Color(0x32302d);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.calculateHeight(x, z);
      posAttr.setY(i, y);

      // Slope computation for cliff rock transitions
      const hX = this.calculateHeight(x + 0.5, z);
      const hZ = this.calculateHeight(x, z + 0.5);
      const slope = Math.hypot(hX - y, hZ - y) / 0.5;

      const c = new THREE.Color();

      if (y < 0.6) {
        c.copy(wetSandColor);
      } else if (y < 3.0) {
        const t = (y - 0.6) / 2.4;
        c.copy(wetSandColor).lerp(goldenSandColor, t);
      } else if (y < 6.0) {
        const t = (y - 3.0) / 3.0;
        c.copy(goldenSandColor).lerp(coastalTransitionColor, t);
      } else if (y < 16.0) {
        const t = (y - 6.0) / 10.0;
        c.copy(coastalTransitionColor).lerp(lushJungleColor, t);
      } else if (y < 22.0) {
        const t = (y - 16.0) / 6.0;
        c.copy(lushJungleColor).lerp(cliffRockColor, t);
      } else {
        const t = Math.min(1, (y - 22.0) / 6.0);
        c.copy(cliffRockColor).lerp(mountainPeakColor, t);
      }

      // Steep slopes expose rock
      if (slope > 0.65 && y > 3.5) {
        const rockBlend = Math.min(1, (slope - 0.65) * 2.0);
        c.lerp(cliffRockColor, rockBlend);
      }

      // Natural micro-variation tint
      const noiseVariation = (Math.sin(x * 0.45) * Math.cos(z * 0.45) + Math.sin(x * 0.15 + z * 0.15)) * 0.035;
      c.r = Math.min(1, Math.max(0, c.r + noiseVariation));
      c.g = Math.min(1, Math.max(0, c.g + noiseVariation));
      c.b = Math.min(1, Math.max(0, c.b + noiseVariation));

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    // PBR Textures for micro-detail normal mapping
    const sandPbr = TextureGenerator.createSandTexture();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: sandPbr.diffuse,
      normalMap: sandPbr.normal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.82,
      metalness: 0.04,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    scene.add(this.mesh);
  }

  /**
   * Deterministic mathematical height function producing organic island topography:
   * Beach dunes, interior hills, rocky ridges, and smooth radial falloff into ocean.
   */
  public calculateHeight(x: number, z: number): number {
    const dist = Math.sqrt(x * x + z * z);

    if (dist >= this.islandRadius) {
      const oceanDepth = Math.min(16, (dist - this.islandRadius) * 0.35);
      return -oceanDepth - 0.5;
    }

    // Radial bell profile
    const normalizedDist = dist / this.islandRadius;
    const radialProfile = Math.cos(normalizedDist * Math.PI * 0.5);
    const baseHeight = Math.pow(radialProfile, 1.8) * 26.0;

    // Multi-octave natural terrain harmonics
    const octave1 = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.04 - 0.8) * 6.0;
    const octave2 = Math.sin(x * 0.08 - 2.1) * Math.sin(z * 0.08 + 1.5) * 3.0;
    const octave3 = Math.cos(x * 0.16) * Math.sin(z * 0.16) * 1.2;
    const octave4 = Math.sin(x * 0.32 + z * 0.22) * 0.4;

    let totalHeight = baseHeight + octave1 + octave2 + octave3 + octave4;

    // Broaden beach shallows near sea level
    if (totalHeight > 0 && totalHeight < 3.2) {
      totalHeight = Math.pow(totalHeight / 3.2, 1.3) * 2.8;
    }

    // Mountain ridge distortion
    const ridgeNoise = Math.abs(Math.sin((x * 0.03 + z * 0.03) * 1.5)) * 4.5;
    if (totalHeight > 10.0) {
      totalHeight += ridgeNoise * (totalHeight / 26.0);
    }

    // Smooth falloff into ocean
    const edgeT = Math.max(0, (dist - (this.islandRadius - 20)) / 20);
    if (edgeT > 0) {
      totalHeight = THREE.MathUtils.lerp(totalHeight, -1.5, edgeT);
    }

    return totalHeight;
  }

  public getHeightAt(x: number, z: number): number {
    return this.calculateHeight(x, z);
  }
}
