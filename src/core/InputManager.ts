export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;
  private sensitivityMultiplier: number = 1.0;
  private targetElement: HTMLElement;
  private onInteractCallback: (() => void) | null = null;
  private onPauseToggleCallback: (() => void) | null = null;

  constructor(targetElement: HTMLElement) {
    this.targetElement = targetElement;
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys.set(e.code, true);

      if (e.code === 'KeyE') {
        if (this.onInteractCallback) {
          this.onInteractCallback();
        }
      }

      if (e.code === 'Escape') {
        if (this.onPauseToggleCallback) {
          this.onPauseToggleCallback();
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.set(e.code, false);
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.targetElement;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX * this.sensitivityMultiplier;
        this.mouseDeltaY += e.movementY * this.sensitivityMultiplier;
      }
    });
  }

  public requestPointerLock(): void {
    if (!this.isPointerLocked) {
      try {
        this.targetElement.requestPointerLock();
      } catch (e) {
        console.warn('Pointer lock request error:', e);
      }
    }
  }

  public exitPointerLock(): void {
    if (this.isPointerLocked && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  public setSensitivity(settingVal: number): void {
    // settingVal between 1 and 10 -> map to sensitivity
    this.sensitivityMultiplier = 0.5 + (settingVal / 10) * 1.5;
  }

  public setOnInteract(cb: () => void): void {
    this.onInteractCallback = cb;
  }

  public setOnPauseToggle(cb: () => void): void {
    this.onPauseToggleCallback = cb;
  }

  public isKeyDown(code: string): boolean {
    return !!this.keys.get(code);
  }

  public getMoveVector(): { forward: number; strafe: number } {
    let forward = 0;
    let strafe = 0;

    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) forward += 1;
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) forward -= 1;
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) strafe += 1;
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) strafe -= 1;

    return { forward, strafe };
  }

  public isSprinting(): boolean {
    return this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  public consumeMouseDeltas(): { x: number; y: number } {
    const x = this.mouseDeltaX;
    const y = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { x, y };
  }

  public get pointerLocked(): boolean {
    return this.isPointerLocked;
  }
}

