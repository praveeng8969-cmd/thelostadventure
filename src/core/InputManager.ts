export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private touchForward = 0;
  private touchStrafe = 0;
  private touchSprint = false;
  public readonly touchDevice = window.matchMedia('(pointer: coarse)').matches;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;
  private sensitivityMultiplier: number = 1.0;
  private targetElement: HTMLElement;

  private onInteractCallback: (() => void) | null = null;
  private onPauseToggleCallback: (() => void) | null = null;
  private onInventoryToggleCallback: (() => void) | null = null;
  private onCraftingToggleCallback: (() => void) | null = null;
  private onRotatePlacementCallback: (() => void) | null = null;
  private onPrimaryActionCallback: (() => void) | null = null;
  private onDebugToggleCallback: (() => void) | null = null;
  private onWeatherToggleCallback: (() => void) | null = null;

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

      if (e.code === 'Tab') {
        e.preventDefault();
        if (this.onInventoryToggleCallback) {
          this.onInventoryToggleCallback();
        }
      }

      if (e.code === 'KeyC') {
        if (this.onCraftingToggleCallback) {
          this.onCraftingToggleCallback();
        }
      }

      if (e.code === 'KeyR') {
        if (this.onRotatePlacementCallback) {
          this.onRotatePlacementCallback();
        }
      }

      if (e.code === 'F3') {
        e.preventDefault();
        if (this.onDebugToggleCallback) {
          this.onDebugToggleCallback();
        }
      }

      if (e.code === 'F4') {
        e.preventDefault();
        if (this.onWeatherToggleCallback) {
          this.onWeatherToggleCallback();
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.set(e.code, false);
    });

    this.targetElement.addEventListener('mousedown', (e: MouseEvent) => {
      if (e.button === 0) {
        if (this.onPrimaryActionCallback) {
          this.onPrimaryActionCallback();
        }
      }
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
    if (this.touchDevice) return;
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
    this.sensitivityMultiplier = 0.5 + (settingVal / 10) * 1.5;
  }

  public setOnInteract(cb: () => void): void {
    this.onInteractCallback = cb;
  }

  public setOnPauseToggle(cb: () => void): void {
    this.onPauseToggleCallback = cb;
  }

  public setOnInventoryToggle(cb: () => void): void {
    this.onInventoryToggleCallback = cb;
  }

  public setOnCraftingToggle(cb: () => void): void {
    this.onCraftingToggleCallback = cb;
  }

  public setOnRotatePlacement(cb: () => void): void {
    this.onRotatePlacementCallback = cb;
  }

  public setOnPrimaryAction(cb: () => void): void {
    this.onPrimaryActionCallback = cb;
  }

  public setOnDebugToggle(cb: () => void): void {
    this.onDebugToggleCallback = cb;
  }

  public setOnWeatherToggle(cb: () => void): void {
    this.onWeatherToggleCallback = cb;
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

    if (Math.abs(this.touchForward) > 0.05 || Math.abs(this.touchStrafe) > 0.05) {
      return { forward: this.touchForward, strafe: this.touchStrafe };
    }
    return { forward, strafe };
  }

  public isSprinting(): boolean {
    return this.touchSprint || this.isKeyDown('ShiftLeft') || this.isKeyDown('ShiftRight');
  }

  public setTouchMove(forward: number, strafe: number): void {
    this.touchForward = Math.max(-1, Math.min(1, forward));
    this.touchStrafe = Math.max(-1, Math.min(1, strafe));
  }

  public setTouchSprint(value: boolean): void { this.touchSprint = value; }

  public addLookDelta(x: number, y: number): void {
    this.mouseDeltaX += x * this.sensitivityMultiplier;
    this.mouseDeltaY += y * this.sensitivityMultiplier;
  }

  public triggerAction(action: string): void {
    const callbacks: Record<string, (() => void) | null> = {
      interact: this.onInteractCallback,
      pause: this.onPauseToggleCallback,
      inventory: this.onInventoryToggleCallback,
      craft: this.onCraftingToggleCallback,
      place: this.onPrimaryActionCallback,
      rotate: this.onRotatePlacementCallback
    };
    callbacks[action]?.();
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
