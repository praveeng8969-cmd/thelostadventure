/**
 * Mobile web pages cannot reliably rotate the physical screen from a browser tab.
 * Never rotate the DOM: it produces sideways text, incorrect touch coordinates
 * and an unusable WebGL viewport. Ask the user to rotate the device instead.
 */
export class MobileLayout {
  private readonly coarse = window.matchMedia('(pointer: coarse)').matches;
  private readonly portrait = window.matchMedia('(orientation: portrait)');
  private readonly viewport = document.querySelector<HTMLElement>('#game-container')!;
  private overlay?: HTMLDivElement;

  constructor() {
    if (!this.coarse) return;
    document.body.classList.add('mobile-device');
    this.overlay = document.createElement('div');
    this.overlay.className = 'mobile-rotate-notice';
    this.overlay.setAttribute('role', 'status');
    this.overlay.innerHTML = `
      <div class="mobile-rotate-card">
        <div class="mobile-rotate-icon" aria-hidden="true">↻</div>
        <h2>Rotate your phone</h2>
        <p>The Lost Adventure is designed for landscape play. Turn your phone sideways to see the entire game and its controls.</p>
        <button type="button" class="mobile-rotate-fullscreen">Try fullscreen landscape</button>
        <p class="mobile-rotate-hint">If rotation is locked, enable Auto-rotate in your phone settings.</p>
      </div>`;
    document.body.append(this.overlay);
    this.overlay.querySelector('button')?.addEventListener('click', () => void this.requestLandscape());
    this.update = this.update.bind(this);
    window.addEventListener('resize', this.update);
    window.addEventListener('orientationchange', this.update);
    this.portrait.addEventListener('change', this.update);
    this.update();
  }

  public async requestLandscape(): Promise<void> {
    if (!this.coarse) return;
    // Fullscreen and orientation lock require a user gesture on many browsers.
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        await this.viewport.requestFullscreen();
      }
    } catch { /* Fullscreen may be blocked by in-app browsers. */ }
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (orientation?.lock) await orientation.lock('landscape');
    } catch { /* Show the rotate notice instead of rotating the DOM. */ }
    this.update();
  }

  private update(): void {
    if (!this.coarse) return;
    const isPortrait = this.portrait.matches;
    document.body.classList.toggle('mobile-portrait', isPortrait);
    if (this.overlay) this.overlay.hidden = !isPortrait;
    requestAnimationFrame(() => this.viewport.dispatchEvent(new Event('gameviewportresize')));
  }
}
