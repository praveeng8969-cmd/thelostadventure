export interface SaveData {
  playerPosition: { x: number; y: number; z: number };
  playerRotation: number;
  stats: {
    health: number;
    hunger: number;
    thirst: number;
  };
  mission: string;
  gameTime: number;
  timestamp: number;
}

export interface GameSettings {
  volume: number;
  sensitivity: number;
  fov: number;
  shadows: 'high' | 'low' | 'off';
}

const SAVE_KEY = 'the_lost_adventure_save_v1';
const SETTINGS_KEY = 'the_lost_adventure_settings_v1';

export class SaveSystem {
  public static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  public static saveGame(data: SaveData): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save game data:', e);
      return false;
    }
  }

  public static loadGame(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return null;
    }
  }

  public static clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  public static loadSettings(): GameSettings {
    const defaults: GameSettings = {
      volume: 70,
      sensitivity: 5,
      fov: 65,
      shadows: 'high'
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
}

