import * as THREE from 'three';

export type GraphicsPreset = 'low' | 'medium' | 'high';

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export class Engine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public clock: THREE.Clock;
  public canvas: HTMLCanvasElement;

  private currentPreset: GraphicsPreset = 'high';
  private resizeObserver: ResizeObserver | null = null;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 60;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      Math.max(1, canvas.parentElement?.clientWidth ?? canvas.clientWidth) / Math.max(1, canvas.parentElement?.clientHeight ?? canvas.clientHeight),
      0.1,
      1200
    );
    this.camera.position.set(0, 10, 25);

    // Modern Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    // Do not write inline canvas dimensions: they freeze portrait width after rotation.
    this.renderer.setSize(Math.max(1, canvas.parentElement?.clientWidth ?? canvas.clientWidth), Math.max(1, canvas.parentElement?.clientHeight ?? canvas.clientHeight), false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', () => this.handleResize());
    canvas.parentElement?.addEventListener('gameviewportresize', () => this.handleResize());
    if (canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(canvas.parentElement);
    }
    this.handleResize();
  }

  public setGraphicsPreset(preset: GraphicsPreset): void {
    this.currentPreset = preset;

    if (preset === 'low') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
    } else if (preset === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    } else {
      // High
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.handleResize();
  }

  public setShadowQuality(quality: 'high' | 'low' | 'off'): void {
    if (quality === 'off') {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type =
        quality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    }
  }

  public setFOV(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  private handleResize(): void {
    const container = this.canvas.parentElement;
    const width = Math.max(1, container?.clientWidth ?? window.innerWidth);
    const height = Math.max(1, container?.clientHeight ?? window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public updatePerformanceStats(): PerformanceStats {
    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastFpsTime;

    if (elapsed >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    return {
      fps: this.currentFps,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures
    };
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
