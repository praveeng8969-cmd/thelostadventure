import { InputManager } from '../core/InputManager';

/** Mobile overlay: analog movement, drag-to-look, touch actions. */
export class MobileControls {
  private root: HTMLDivElement;
  private stick: HTMLDivElement;
  private nub: HTMLDivElement;
  private look: HTMLDivElement;
  private movementPointer: number | null = null;
  private lookPointer: number | null = null;
  private lookX = 0;
  private lookY = 0;

  constructor(private input: InputManager) {
    this.root = document.createElement('div');
    this.root.id = 'mobile-controls';
    this.root.className = 'mobile-controls hidden';
    this.root.innerHTML = `
      <div class="mobile-look" aria-label="Drag to rotate camera"></div>
      <div class="mobile-stick" aria-label="Movement joystick"><div class="mobile-stick-nub"></div></div>
      <div class="mobile-actions">
        <button type="button" data-action="sprint" aria-label="Hold to sprint">RUN</button>
        <button type="button" data-action="interact" aria-label="Interact or collect">USE</button>
        <button type="button" data-action="place" aria-label="Place building">PLACE</button>
        <button type="button" data-action="rotate" aria-label="Rotate building">ROTATE</button>
      </div>
      <div class="mobile-top-actions">
        <button type="button" data-action="inventory">BAG</button>
        <button type="button" data-action="craft">CRAFT</button>
        <button type="button" data-action="pause">PAUSE</button>\n        <button type="button" data-action="help">HELP</button>
      </div>`;
    document.getElementById('game-container')!.append(this.root);
    this.stick = this.root.querySelector('.mobile-stick')!;
    this.nub = this.root.querySelector('.mobile-stick-nub')!;
    this.look = this.root.querySelector('.mobile-look')!;
    this.setup();
  }

  private setup(): void {
    const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
    const moveStick = (e: PointerEvent) => {
      const rect = this.stick.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const radius = rect.width * 0.34;
      const length = Math.hypot(dx, dy);
      const ratio = length > radius ? radius / length : 1;
      const x = dx * ratio / radius;
      const y = dy * ratio / radius;
      this.nub.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
      this.input.setTouchMove(-y, x);
    };
    this.stick.addEventListener('pointerdown', e => {
      stop(e);
      if (this.movementPointer !== null) return;
      this.movementPointer = e.pointerId;
      this.stick.setPointerCapture(e.pointerId);
      moveStick(e);
    });
    this.stick.addEventListener('pointermove', e => {
      if (this.movementPointer === e.pointerId) { stop(e); moveStick(e); }
    });
    const endStick = (e: PointerEvent) => {
      if (this.movementPointer !== e.pointerId) return;
      stop(e);
      this.movementPointer = null;
      this.input.setTouchMove(0, 0);
      this.nub.style.transform = 'translate(0, 0)';
    };
    this.stick.addEventListener('pointerup', endStick);
    this.stick.addEventListener('pointercancel', endStick);
    this.stick.addEventListener('lostpointercapture', () => {
      this.movementPointer = null; this.input.setTouchMove(0, 0);
      this.nub.style.transform = 'translate(0, 0)';
    });

    this.look.addEventListener('pointerdown', e => {
      stop(e);
      if (this.lookPointer !== null) return;
      this.lookPointer = e.pointerId;
      this.lookX = e.clientX; this.lookY = e.clientY;
      this.look.setPointerCapture(e.pointerId);
    });
    this.look.addEventListener('pointermove', e => {
      if (this.lookPointer !== e.pointerId) return;
      stop(e);
      this.input.addLookDelta((e.clientX - this.lookX) * 1.2, (e.clientY - this.lookY) * 1.2);
      this.lookX = e.clientX; this.lookY = e.clientY;
    });
    const endLook = (e: PointerEvent) => {
      if (this.lookPointer !== e.pointerId) return;
      stop(e); this.lookPointer = null;
    };
    this.look.addEventListener('pointerup', endLook);
    this.look.addEventListener('pointercancel', endLook);
    this.look.addEventListener('lostpointercapture', () => { this.lookPointer = null; });

    this.root.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach(button => {
      const action = button.dataset.action!;
      button.addEventListener('pointerdown', e => {
        stop(e);
        if (action === 'sprint') {
          button.setPointerCapture(e.pointerId);
          this.input.setTouchSprint(true);
        } else if (action === 'help') {
          document.body.classList.toggle('mobile-help-open');
        } else {
          this.input.triggerAction(action);
        }
      });
      const release = (e: PointerEvent) => {
        if (action === 'sprint') { stop(e); this.input.setTouchSprint(false); }
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', () => {
        if (action === 'sprint') this.input.setTouchSprint(false);
      });
    });
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
  }

  public setVisible(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
    if (!visible) this.reset();
  }

  public reset(): void {
    this.movementPointer = null; this.lookPointer = null;
    this.input.setTouchMove(0, 0);
    this.input.setTouchSprint(false);
    this.nub.style.transform = 'translate(0, 0)';
  }
}
