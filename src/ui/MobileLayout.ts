/** Mobile browsers do not guarantee orientation lock for normal web pages.
 * Prefer native landscape lock; fall back to rotating the game viewport in portrait.
 */
export class MobileLayout {
  private coarse = window.matchMedia('(pointer: coarse)').matches;
  private portrait = window.matchMedia('(orientation: portrait)');
  private viewport = document.querySelector<HTMLElement>('#game-container')!;

  constructor() {
    if (!this.coarse) return;
    document.body.classList.add('mobile-device');
    this.update = this.update.bind(this);
    window.addEventListener('resize', this.update);
    window.addEventListener('orientationchange', this.update);
    this.portrait.addEventListener('change', this.update);
    this.update();
  }

  public async requestLandscape(): Promise<void> {
    if (!this.coarse) return;
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
      if (orientation?.lock) await orientation.lock('landscape');
    } catch {
      // Chrome Android browser tabs often reject this outside fullscreen.
      // CSS landscape fallback below remains active.
    }
    this.update();
  }

  private update(): void {
    if (!this.coarse) return;
    const rotate = this.portrait.matches;
    document.body.classList.toggle('mobile-landscape-fallback', rotate);
    // Resize renderer after the layout is applied.
    requestAnimationFrame(() => {
      this.viewport.dispatchEvent(new Event('gameviewportresize'));
    });
  }
}
