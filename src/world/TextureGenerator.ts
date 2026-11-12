import * as THREE from 'three';

export class TextureGenerator {
  private static cache: Map<string, THREE.Texture> = new Map();

  /**
   * Generates a high-quality seamless tropical sand PBR diffuse & normal texture.
   */
  public static createSandTexture(): { diffuse: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
    const size = 512;
    // Diffuse Canvas
    const dCanvas = document.createElement('canvas');
    dCanvas.width = size;
    dCanvas.height = size;
    const dCtx = dCanvas.getContext('2d')!;

    // Normal Canvas
    const nCanvas = document.createElement('canvas');
    nCanvas.width = size;
    nCanvas.height = size;
    const nCtx = nCanvas.getContext('2d')!;

    const dImg = dCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Sand ripples (wind-blown dunes)
        const ripple = Math.sin(x * 0.08 + Math.cos(y * 0.04) * 2.0) * 0.15;
        // Fine grain noise
        const grain = (Math.random() - 0.5) * 0.12;
        const n = ripple + grain;

        // Base sand color: #e6c88b
        const r = Math.min(255, Math.max(0, Math.floor((230 + n * 60))));
        const g = Math.min(255, Math.max(0, Math.floor((200 + n * 50))));
        const b = Math.min(255, Math.max(0, Math.floor((142 + n * 40))));

        dImg.data[idx] = r;
        dImg.data[idx + 1] = g;
        dImg.data[idx + 2] = b;
        dImg.data[idx + 3] = 255;

        // Normal map approximation (tangent space: 128, 128, 255)
        const nx = Math.floor(128 + ripple * 80);
        const ny = Math.floor(128 + grain * 60);
        nImg.data[idx] = nx;
        nImg.data[idx + 1] = ny;
        nImg.data[idx + 2] = 240;
        nImg.data[idx + 3] = 255;
      }
    }

    dCtx.putImageData(dImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);

    const diffuse = new THREE.CanvasTexture(dCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(16, 16);

    const normal = new THREE.CanvasTexture(nCanvas);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;
    normal.repeat.set(16, 16);

    return { diffuse, normal };
  }

  /**
   * Generates a lush tropical grass and moss PBR texture.
   */
  public static createGrassTexture(): { diffuse: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
    const size = 512;
    const dCanvas = document.createElement('canvas');
    dCanvas.width = size;
    dCanvas.height = size;
    const dCtx = dCanvas.getContext('2d')!;

    const nCanvas = document.createElement('canvas');
    nCanvas.width = size;
    nCanvas.height = size;
    const nCtx = nCanvas.getContext('2d')!;

    const dImg = dCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Organic blade and moss patterns
        const patch = (Math.sin(x * 0.05) * Math.cos(y * 0.05) + Math.sin(x * 0.12 + y * 0.08)) * 0.2;
        const blade = (Math.random() - 0.5) * 0.18;
        const val = patch + blade;

        // Tropical jungle grass: #38782a with warm highlights
        const r = Math.min(255, Math.max(0, Math.floor(52 + val * 45)));
        const g = Math.min(255, Math.max(0, Math.floor(125 + val * 70)));
        const b = Math.min(255, Math.max(0, Math.floor(38 + val * 35)));

        dImg.data[idx] = r;
        dImg.data[idx + 1] = g;
        dImg.data[idx + 2] = b;
        dImg.data[idx + 3] = 255;

        nImg.data[idx] = Math.floor(128 + (Math.random() - 0.5) * 40);
        nImg.data[idx + 1] = Math.floor(128 + (Math.random() - 0.5) * 40);
        nImg.data[idx + 2] = 230;
        nImg.data[idx + 3] = 255;
      }
    }

    dCtx.putImageData(dImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);

    const diffuse = new THREE.CanvasTexture(dCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(16, 16);

    const normal = new THREE.CanvasTexture(nCanvas);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;
    normal.repeat.set(16, 16);

    return { diffuse, normal };
  }

  /**
   * Generates a weathered volcanic cliff rock texture.
   */
  public static createRockTexture(): { diffuse: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
    const size = 512;
    const dCanvas = document.createElement('canvas');
    dCanvas.width = size;
    dCanvas.height = size;
    const dCtx = dCanvas.getContext('2d')!;

    const nCanvas = document.createElement('canvas');
    nCanvas.width = size;
    nCanvas.height = size;
    const nCtx = nCanvas.getContext('2d')!;

    const dImg = dCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Rock fractures and strata
        const crack = Math.abs(Math.sin(x * 0.04 + y * 0.03) * Math.cos(x * 0.06 - y * 0.04));
        const noise = (Math.random() - 0.5) * 0.15;
        const intensity = crack * 0.35 + noise;

        const base = Math.floor(85 + intensity * 60);
        dImg.data[idx] = base;
        dImg.data[idx + 1] = Math.floor(base * 0.96);
        dImg.data[idx + 2] = Math.floor(base * 0.92);
        dImg.data[idx + 3] = 255;

        nImg.data[idx] = Math.floor(128 + (crack - 0.5) * 80);
        nImg.data[idx + 1] = Math.floor(128 + noise * 60);
        nImg.data[idx + 2] = 220;
        nImg.data[idx + 3] = 255;
      }
    }

    dCtx.putImageData(dImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);

    const diffuse = new THREE.CanvasTexture(dCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(12, 12);

    const normal = new THREE.CanvasTexture(nCanvas);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;
    normal.repeat.set(12, 12);

    return { diffuse, normal };
  }

  /**
   * Generates a weathered timber plank wood grain texture.
   */
  public static createWoodPlankTexture(): { diffuse: THREE.CanvasTexture; normal: THREE.CanvasTexture } {
    const size = 512;
    const dCanvas = document.createElement('canvas');
    dCanvas.width = size;
    dCanvas.height = size;
    const dCtx = dCanvas.getContext('2d')!;

    const nCanvas = document.createElement('canvas');
    nCanvas.width = size;
    nCanvas.height = size;
    const nCtx = nCanvas.getContext('2d')!;

    const dImg = dCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Wood rings & streaks along Y
        const ring = Math.sin(x * 0.2 + Math.sin(y * 0.05) * 3.0) * 0.25;
        const grain = (Math.random() - 0.5) * 0.08;
        const v = ring + grain;

        // Warm timber tones: #784824
        const r = Math.min(255, Math.max(0, Math.floor(120 + v * 50)));
        const g = Math.min(255, Math.max(0, Math.floor(75 + v * 35)));
        const b = Math.min(255, Math.max(0, Math.floor(38 + v * 20)));

        dImg.data[idx] = r;
        dImg.data[idx + 1] = g;
        dImg.data[idx + 2] = b;
        dImg.data[idx + 3] = 255;

        nImg.data[idx] = Math.floor(128 + ring * 60);
        nImg.data[idx + 1] = 128;
        nImg.data[idx + 2] = 235;
        nImg.data[idx + 3] = 255;
      }
    }

    dCtx.putImageData(dImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);

    const diffuse = new THREE.CanvasTexture(dCanvas);
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;
    diffuse.repeat.set(4, 4);

    const normal = new THREE.CanvasTexture(nCanvas);
    normal.wrapS = THREE.RepeatWrapping;
    normal.wrapT = THREE.RepeatWrapping;
    normal.repeat.set(4, 4);

    return { diffuse, normal };
  }
}

