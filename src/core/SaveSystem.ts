import { InventorySlot } from '../inventory/Item';
import { MissionSaveState } from '../missions/MissionManager';
import { PlacedStructureSaveData } from '../building/BuildingManager';
import { CampfireData } from '../world/Campfire';

export interface SaveDataV3 {
  version: 3;
  playerPosition: { x: number; y: number; z: number };
  playerRotation: number;
  stats: {
    health: number;
    hunger: number;
    thirst: number;
  };
  inventory: (InventorySlot | null)[];
  equippedTool: 'stone_axe' | null;
  unlockedRecipes: string[];
  placedStructures: PlacedStructureSaveData[];
  campfires: CampfireData[];
  shelterComplete: boolean;
  mission: MissionSaveState;
  collectedIds: string[];
  isShipwreckSalvaged: boolean;
  gameTime: number;
  timestamp: number;
}

export interface GameSettings {
  volume: number;
  sensitivity: number;
  fov: number;
  shadows: 'high' | 'low' | 'off';
}

const CURRENT_SAVE_VERSION = 3;
const SAVE_KEY_V3 = 'the_lost_adventure_save_v3';
const SAVE_KEY_V2 = 'the_lost_adventure_save_v2';
const SAVE_KEY_V1 = 'the_lost_adventure_save_v1';
const SETTINGS_KEY = 'the_lost_adventure_settings_v1';

export class SaveSystem {
  public static hasSave(): boolean {
    return (
      localStorage.getItem(SAVE_KEY_V3) !== null ||
      localStorage.getItem(SAVE_KEY_V2) !== null ||
      localStorage.getItem(SAVE_KEY_V1) !== null
    );
  }

  public static saveGame(data: Omit<SaveDataV3, 'version'>): boolean {
    try {
      const fullSave: SaveDataV3 = {
        version: CURRENT_SAVE_VERSION,
        ...data
      };
      localStorage.setItem(SAVE_KEY_V3, JSON.stringify(fullSave));
      return true;
    } catch (e) {
      console.error('Failed to save game data:', e);
      return false;
    }
  }

  public static loadGame(): SaveDataV3 | null {
    try {
      // 1. Try Loading Version 3
      const rawV3 = localStorage.getItem(SAVE_KEY_V3);
      if (rawV3) {
        const parsed = JSON.parse(rawV3);
        if (parsed && (parsed.version === 3 || parsed.version === 2) && parsed.playerPosition && parsed.stats) {
          return {
            version: 3,
            playerPosition: parsed.playerPosition,
            playerRotation: typeof parsed.playerRotation === 'number' ? parsed.playerRotation : 0,
            stats: {
              health: Math.max(0, Math.min(100, parsed.stats.health ?? 100)),
              hunger: Math.max(0, Math.min(100, parsed.stats.hunger ?? 100)),
              thirst: Math.max(0, Math.min(100, parsed.stats.thirst ?? 100))
            },
            inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
            equippedTool: parsed.equippedTool || null,
            unlockedRecipes: Array.isArray(parsed.unlockedRecipes)
              ? parsed.unlockedRecipes
              : ['stone_axe', 'campfire'],
            placedStructures: Array.isArray(parsed.placedStructures) ? parsed.placedStructures : [],
            campfires: Array.isArray(parsed.campfires) ? parsed.campfires : [],
            shelterComplete: !!parsed.shelterComplete,
            mission: parsed.mission || {
              currentIndex: 0,
              stats: {
                beachExplored: false,
                distanceExplored: 0,
                woodCollected: 0,
                stonesCollected: 0,
                coconutsCollected: 0,
                waterCollected: 0,
                shipwreckInspected: false,
                stoneAxeCrafted: 0,
                campfireCrafted: 0,
                campfireLit: false,
                fishCooked: 0,
                shelterBuilt: false,
                shipwreckReturned: false
              },
              completedIds: []
            },
            collectedIds: Array.isArray(parsed.collectedIds) ? parsed.collectedIds : [],
            isShipwreckSalvaged: !!parsed.isShipwreckSalvaged,
            gameTime: typeof parsed.gameTime === 'number' ? parsed.gameTime : 0,
            timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now()
          };
        }
      }

      // 2. Migration from Version 2
      const rawV2 = localStorage.getItem(SAVE_KEY_V2);
      if (rawV2) {
        const parsedV2 = JSON.parse(rawV2);
        if (parsedV2 && parsedV2.playerPosition && parsedV2.stats) {
          return {
            version: 3,
            playerPosition: parsedV2.playerPosition,
            playerRotation: parsedV2.playerRotation || 0,
            stats: {
              health: parsedV2.stats.health ?? 100,
              hunger: parsedV2.stats.hunger ?? 100,
              thirst: parsedV2.stats.thirst ?? 100
            },
            inventory: Array.isArray(parsedV2.inventory) ? parsedV2.inventory : [],
            equippedTool: null,
            unlockedRecipes: ['stone_axe', 'campfire'],
            placedStructures: [],
            campfires: [],
            shelterComplete: false,
            mission: parsedV2.mission || {
              currentIndex: 0,
              stats: {
                beachExplored: false,
                distanceExplored: 0,
                woodCollected: 0,
                stonesCollected: 0,
                coconutsCollected: 0,
                waterCollected: 0,
                shipwreckInspected: false,
                stoneAxeCrafted: 0,
                campfireCrafted: 0,
                campfireLit: false,
                fishCooked: 0,
                shelterBuilt: false,
                shipwreckReturned: false
              },
              completedIds: []
            },
            collectedIds: Array.isArray(parsedV2.collectedIds) ? parsedV2.collectedIds : [],
            isShipwreckSalvaged: !!parsedV2.isShipwreckSalvaged,
            gameTime: parsedV2.gameTime || 0,
            timestamp: parsedV2.timestamp || Date.now()
          };
        }
      }

      // 3. Migration from Version 1
      const rawV1 = localStorage.getItem(SAVE_KEY_V1);
      if (rawV1) {
        const parsedV1 = JSON.parse(rawV1);
        if (parsedV1 && parsedV1.playerPosition && parsedV1.stats) {
          return {
            version: 3,
            playerPosition: parsedV1.playerPosition,
            playerRotation: parsedV1.playerRotation || 0,
            stats: {
              health: parsedV1.stats.health ?? 100,
              hunger: parsedV1.stats.hunger ?? 100,
              thirst: parsedV1.stats.thirst ?? 100
            },
            inventory: [],
            equippedTool: null,
            unlockedRecipes: ['stone_axe', 'campfire'],
            placedStructures: [],
            campfires: [],
            shelterComplete: false,
            mission: {
              currentIndex: 0,
              stats: {
                beachExplored: false,
                distanceExplored: 0,
                woodCollected: 0,
                stonesCollected: 0,
                coconutsCollected: 0,
                waterCollected: 0,
                shipwreckInspected: false,
                stoneAxeCrafted: 0,
                campfireCrafted: 0,
                campfireLit: false,
                fishCooked: 0,
                shelterBuilt: false,
                shipwreckReturned: false
              },
              completedIds: []
            },
            collectedIds: [],
            isShipwreckSalvaged: false,
            gameTime: parsedV1.gameTime || 0,
            timestamp: parsedV1.timestamp || Date.now()
          };
        }
      }

      return null;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return null;
    }
  }

  public static clearSave(): void {
    localStorage.removeItem(SAVE_KEY_V3);
    localStorage.removeItem(SAVE_KEY_V2);
    localStorage.removeItem(SAVE_KEY_V1);
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
