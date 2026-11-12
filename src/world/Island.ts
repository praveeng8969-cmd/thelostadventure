import * as THREE from 'three';

export class Island {
  public mesh: THREE.Mesh;
  public geometry: THREE.PlaneGeometry;
  private size: number = 360;
  private segments: number = 180;
  private islandRadius: number = 135;

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

    const sandColor = new THREE.Color(0xe1c17e);
    const wetSandColor = new THREE.Color(0xbfa068);
    const lowGrassColor = new THREE.Color(0x7da34b);
    const jungleGrassColor = new THREE.Color(0x3e7a33);
    const rockColor = new THREE.Color(0x5a5752);
    const peakRockColor = new THREE.Color(0x42403d);

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.calculateHeight(x, z);
      posAttr.setY(i, y);

      // Vertex color according to height
      const c = new THREE.Color();
      if (y < 0.6) {
        c.copy(wetSandColor);
      } else if (y < 2.5) {
        const t = (y - 0.6) / 1.9;
        c.copy(wetSandColor).lerp(sandColor, t);
      } else if (y < 5.0) {
        const t = (y - 2.5) / 2.5;
        c.copy(sandColor).lerp(lowGrassColor, t);
      } else if (y < 16.0) {
        const t = (y - 5.0) / 11.0;
        c.copy(lowGrassColor).lerp(jungleGrassColor, t);
      } else if (y < 22.0) {
        const t = (y - 16.0) / 6.0;
        c.copy(jungleGrassColor).lerp(rockColor, t);
      } else {
        const t = Math.min(1, (y - 22.0) / 6.0);
        c.copy(rockColor).lerp(peakRockColor, t);
      }

      // Add subtle noise tint variation
      const tint = (Math.sin(x * 0.25) * Math.cos(z * 0.25)) * 0.04;
      c.r = Math.min(1, Math.max(0, c.r + tint));
      c.g = Math.min(1, Math.max(0, c.g + tint));
      c.b = Math.min(1, Math.max(0, c.b + tint));

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05,
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
    
    // Falloff mask towards island perimeter
    if (dist >= this.islandRadius) {
      // Shallows and ocean floor
      const oceanDepth = Math.min(15, (dist - this.islandRadius) * 0.35);
      return -oceanDepth - 0.5;
    }

    // Radial bell curve profile
    const normalizedDist = dist / this.islandRadius;
    const radialProfile = Math.cos(normalizedDist * Math.PI * 0.5);
    const baseHeight = Math.pow(radialProfile, 1.8) * 26.0;

    // Harmonic noise octaves for natural terrain
    const octave1 = Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.04 - 0.8) * 6.0;
    const octave2 = Math.sin(x * 0.08 - 2.1) * Math.sin(z * 0.08 + 1.5) * 3.0;
    const octave3 = Math.cos(x * 0.16) * Math.sin(z * 0.16) * 1.2;
    const octave4 = (Math.sin(x * 0.32 + z * 0.22)) * 0.4;

    // Beach flattening near sea level (y ~ 0.5 to 2.5)
    let totalHeight = baseHeight + octave1 + octave2 + octave3 + octave4;

    if (totalHeight > 0 && totalHeight < 3.2) {
      // Broaden beaches
      totalHeight = Math.pow(totalHeight / 3.2, 1.3) * 2.8;
    }

    // Ridge distortion
    const ridgeNoise = Math.abs(Math.sin((x * 0.03 + z * 0.03) * 1.5)) * 4.5;
    if (totalHeight > 10.0) {
      totalHeight += ridgeNoise * (totalHeight / 26.0);
    }

    // Fade smoothly at edges to enter sea
    const edgeT = Math.max(0, (dist - (this.islandRadius - 20)) / 20);
    if (edgeT > 0) {
      totalHeight = THREE.MathUtils.lerp(totalHeight, -1.5, edgeT);
    }

    return totalHeight;
  }

  /**
   * Fast world height lookup for player collision and object positioning.
   */
  public getHeightAt(x: number, z: number): number {
    return this.calculateHeight(x, z);
  }
}

