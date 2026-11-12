import { SaveSystem, GameSettings } from '../core/SaveSystem';
import { soundManager } from '../core/SoundManager';

export class MainMenu {
  private mainMenuEl: HTMLElement;
  private pauseMenuEl: HTMLElement;
  private controlsModalEl: HTMLElement;
  private settingsModalEl: HTMLElement;

  private btnStart: HTMLButtonElement;
  private btnContinue: HTMLButtonElement;
  private btnControls: HTMLButtonElement;
  private btnSettings: HTMLButtonElement;

  private btnResume: HTMLButtonElement;
  private btnSaveGame: HTMLButtonElement;
  private btnPauseSettings: HTMLButtonElement;
  private btnQuitMenu: HTMLButtonElement;
  private saveToast: HTMLElement;

  // Settings inputs
  private inputVolume: HTMLInputElement;
  private volumeVal: HTMLElement;
  private inputSensitivity: HTMLInputElement;
  private sensitivityVal: HTMLElement;
  private inputFov: HTMLInputElement;
  private fovVal: HTMLElement;
  private selectShadows: HTMLSelectElement;
  private btnSaveSettings: HTMLButtonElement;
  private btnResetSettings: HTMLButtonElement;

  // Callbacks
  private onStartCallback: (() => void) | null = null;
  private onContinueCallback: (() => void) | null = null;
  private onResumeCallback: (() => void) | null = null;
  private onSaveCallback: (() => void) | null = null;
  private onQuitCallback: (() => void) | null = null;
  private onSettingsChangedCallback: ((settings: GameSettings) => void) | null = null;

  constructor() {
    this.mainMenuEl = document.getElementById('main-menu')!;
    this.pauseMenuEl = document.getElementById('pause-menu')!;
    this.controlsModalEl = document.getElementById('modal-controls')!;
    this.settingsModalEl = document.getElementById('modal-settings')!;

    this.btnStart = document.getElementById('btn-start') as HTMLButtonElement;
    this.btnContinue = document.getElementById('btn-continue') as HTMLButtonElement;
    this.btnControls = document.getElementById('btn-controls') as HTMLButtonElement;
    this.btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;

    this.btnResume = document.getElementById('btn-resume') as HTMLButtonElement;
    this.btnSaveGame = document.getElementById('btn-save-game') as HTMLButtonElement;
    this.btnPauseSettings = document.getElementById('btn-pause-settings') as HTMLButtonElement;
    this.btnQuitMenu = document.getElementById('btn-quit-menu') as HTMLButtonElement;
    this.saveToast = document.getElementById('save-notification')!;

    this.inputVolume = document.getElementById('setting-volume') as HTMLInputElement;
    this.volumeVal = document.getElementById('volume-val')!;
    this.inputSensitivity = document.getElementById('setting-sensitivity') as HTMLInputElement;
    this.sensitivityVal = document.getElementById('sensitivity-val')!;
    this.inputFov = document.getElementById('setting-fov') as HTMLInputElement;
    this.fovVal = document.getElementById('fov-val')!;
    this.selectShadows = document.getElementById('setting-shadows') as HTMLSelectElement;
    this.btnSaveSettings = document.getElementById('btn-save-settings') as HTMLButtonElement;
    this.btnResetSettings = document.getElementById('btn-reset-settings') as HTMLButtonElement;

    this.initEvents();
    this.updateContinueButtonState();
    this.loadInitialSettings();
  }

  private initEvents(): void {
    // Start Game
    this.btnStart.addEventListener('click', () => {
      soundManager.playClick();
      this.hideMainMenu();
      if (this.onStartCallback) this.onStartCallback();
    });

    // Continue Game
    this.btnContinue.addEventListener('click', () => {
      if (SaveSystem.hasSave()) {
        soundManager.playClick();
        this.hideMainMenu();
        if (this.onContinueCallback) this.onContinueCallback();
      }
    });

    // Controls Modal
    this.btnControls.addEventListener('click', () => {
      soundManager.playClick();
      this.openControlsModal();
    });
    document.getElementById('btn-close-controls')!.addEventListener('click', () => {
      soundManager.playClick();
      this.closeControlsModal();
    });
    document.getElementById('btn-controls-ok')!.addEventListener('click', () => {
      soundManager.playClick();
      this.closeControlsModal();
    });

    // Settings Modal (From Main Menu)
    this.btnSettings.addEventListener('click', () => {
      soundManager.playClick();
      this.openSettingsModal();
    });

    // Settings Modal (From Pause Menu)
    this.btnPauseSettings.addEventListener('click', () => {
      soundManager.playClick();
      this.openSettingsModal();
    });

    document.getElementById('btn-close-settings')!.addEventListener('click', () => {
      soundManager.playClick();
      this.closeSettingsModal();
    });

    // Resume from Pause
    this.btnResume.addEventListener('click', () => {
      soundManager.playClick();
      this.hidePauseMenu();
      if (this.onResumeCallback) this.onResumeCallback();
    });

    // Save Game from Pause
    this.btnSaveGame.addEventListener('click', () => {
      soundManager.playClick();
      if (this.onSaveCallback) {
        this.onSaveCallback();
        this.showSaveSuccessToast();
        this.updateContinueButtonState();
      }
    });

    // Quit to Main Menu
    this.btnQuitMenu.addEventListener('click', () => {
      soundManager.playClick();
      this.hidePauseMenu();
      this.showMainMenu();
      if (this.onQuitCallback) this.onQuitCallback();
    });

    // Settings live sliders
    this.inputVolume.addEventListener('input', () => {
      this.volumeVal.innerText = `${this.inputVolume.value}%`;
      soundManager.setVolume(Number(this.inputVolume.value) / 100);
    });

    this.inputSensitivity.addEventListener('input', () => {
      this.sensitivityVal.innerText = this.inputSensitivity.value;
    });

    this.inputFov.addEventListener('input', () => {
      this.fovVal.innerText = `${this.inputFov.value}°`;
    });

    this.btnSaveSettings.addEventListener('click', () => {
      soundManager.playClick();
      this.saveCurrentSettings();
      this.closeSettingsModal();
    });

    this.btnResetSettings.addEventListener('click', () => {
      soundManager.playClick();
      this.resetSettingsToDefaults();
    });
  }

  public updateContinueButtonState(): void {
    if (SaveSystem.hasSave()) {
      this.btnContinue.removeAttribute('disabled');
      this.btnContinue.classList.remove('disabled');
    } else {
      this.btnContinue.setAttribute('disabled', 'true');
      this.btnContinue.classList.add('disabled');
    }
  }

  private loadInitialSettings(): void {
    const settings = SaveSystem.loadSettings();
    this.inputVolume.value = settings.volume.toString();
    this.volumeVal.innerText = `${settings.volume}%`;
    soundManager.setVolume(settings.volume / 100);

    this.inputSensitivity.value = settings.sensitivity.toString();
    this.sensitivityVal.innerText = settings.sensitivity.toString();

    this.inputFov.value = settings.fov.toString();
    this.fovVal.innerText = `${settings.fov}°`;

    this.selectShadows.value = settings.shadows;
  }

  private saveCurrentSettings(): void {
    const settings: GameSettings = {
      volume: Number(this.inputVolume.value),
      sensitivity: Number(this.inputSensitivity.value),
      fov: Number(this.inputFov.value),
      shadows: this.selectShadows.value as 'high' | 'low' | 'off'
    };
    SaveSystem.saveSettings(settings);
    if (this.onSettingsChangedCallback) {
      this.onSettingsChangedCallback(settings);
    }
  }

  private resetSettingsToDefaults(): void {
    this.inputVolume.value = '70';
    this.volumeVal.innerText = '70%';
    this.inputSensitivity.value = '5';
    this.sensitivityVal.innerText = '5';
    this.inputFov.value = '65';
    this.fovVal.innerText = '65°';
    this.selectShadows.value = 'high';
    this.saveCurrentSettings();
  }

  public showSaveSuccessToast(): void {
    this.saveToast.classList.remove('hidden');
    setTimeout(() => {
      this.saveToast.classList.add('hidden');
    }, 2500);
  }

  public showMainMenu(): void {
    this.updateContinueButtonState();
    this.mainMenuEl.classList.remove('hidden');
  }

  public hideMainMenu(): void {
    this.mainMenuEl.classList.add('hidden');
  }

  public showPauseMenu(): void {
    this.pauseMenuEl.classList.remove('hidden');
  }

  public hidePauseMenu(): void {
    this.pauseMenuEl.classList.add('hidden');
  }

  public openControlsModal(): void {
    this.controlsModalEl.classList.remove('hidden');
  }

  public closeControlsModal(): void {
    this.controlsModalEl.classList.add('hidden');
  }

  public openSettingsModal(): void {
    this.settingsModalEl.classList.remove('hidden');
  }

  public closeSettingsModal(): void {
    this.settingsModalEl.classList.add('hidden');
  }

  public isMenuOpen(): boolean {
    return (
      !this.mainMenuEl.classList.contains('hidden') ||
      !this.pauseMenuEl.classList.contains('hidden') ||
      !this.controlsModalEl.classList.contains('hidden') ||
      !this.settingsModalEl.classList.contains('hidden')
    );
  }

  public setCallbacks(cbs: {
    onStart: () => void;
    onContinue: () => void;
    onResume: () => void;
    onSave: () => void;
    onQuit: () => void;
    onSettingsChanged: (settings: GameSettings) => void;
  }): void {
    this.onStartCallback = cbs.onStart;
    this.onContinueCallback = cbs.onContinue;
    this.onResumeCallback = cbs.onResume;
    this.onSaveCallback = cbs.onSave;
    this.onQuitCallback = cbs.onQuit;
    this.onSettingsChangedCallback = cbs.onSettingsChanged;
  }
}

