import { ResourceType } from '../inventory/Item';

export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  rewardText?: string;
  getEventCount: (stats: MissionLifetimeStats) => number;
}

export interface MissionLifetimeStats {
  beachExplored: boolean;
  distanceExplored: number;
  woodCollected: number;
  stonesCollected: number;
  coconutsCollected: number;
  waterCollected: number;
  shipwreckInspected: boolean;
  stoneAxeCrafted: number;
  campfireCrafted: number;
  campfireLit: boolean;
  fishCooked: number;
  shelterBuilt: boolean;
  shipwreckReturned: boolean;
}

export interface MissionSaveState {
  currentIndex: number;
  stats: MissionLifetimeStats;
  completedIds: string[];
}

export class MissionManager {
  private missions: MissionDefinition[] = [
    // Phase 2 Introductory Missions (Preserved)
    {
      id: 'explore_beach',
      title: 'Explore the beach',
      description: 'Survey the coastal shoreline where you washed ashore.',
      targetCount: 1,
      rewardText: 'Discovered driftwood & beach materials',
      getEventCount: (s) => (s.beachExplored ? 1 : 0)
    },
    {
      id: 'collect_wood',
      title: 'Collect 5 wood',
      description: 'Gather driftwood branches along the beach.',
      targetCount: 5,
      rewardText: 'Wood stock gathered',
      getEventCount: (s) => s.woodCollected
    },
    {
      id: 'collect_stone',
      title: 'Collect 3 stones',
      description: 'Collect small stones scattered along the shore.',
      targetCount: 3,
      rewardText: 'Stone stock gathered',
      getEventCount: (s) => s.stonesCollected
    },
    {
      id: 'find_coconuts',
      title: 'Find 2 coconuts',
      description: 'Search underneath coastal palm trees for fallen coconuts.',
      targetCount: 2,
      rewardText: 'Emergency food secured',
      getEventCount: (s) => s.coconutsCollected
    },
    {
      id: 'collect_water',
      title: 'Collect drinking water',
      description: 'Locate the natural freshwater spring in the rocky glade.',
      targetCount: 1,
      rewardText: 'Fresh water source discovered',
      getEventCount: (s) => s.waterCollected
    },
    {
      id: 'inspect_ship',
      title: 'Inspect the damaged ship',
      description: 'Approach your shipwreck and search the emergency survival cache.',
      targetCount: 1,
      rewardText: 'Retrieved emergency supplies & blueprints',
      getEventCount: (s) => (s.shipwreckInspected ? 1 : 0)
    },

    // Phase 3 Missions
    {
      id: 'craft_stone_axe',
      title: 'Craft a stone axe',
      description: 'Press C to open crafting. Combine 3 Wood + 2 Stone to craft a Stone Axe.',
      targetCount: 1,
      rewardText: 'Unlocked efficient wood harvesting',
      getEventCount: (s) => s.stoneAxeCrafted
    },
    {
      id: 'craft_campfire',
      title: 'Craft a campfire',
      description: 'Craft a Campfire using 5 Wood + 4 Stone in the crafting menu (C).',
      targetCount: 1,
      rewardText: 'Campfire ready to place',
      getEventCount: (s) => s.campfireCrafted
    },
    {
      id: 'light_campfire',
      title: 'Place and light the campfire',
      description: 'Open inventory (Tab), select Campfire and Place it on dry ground, then press E to light it.',
      targetCount: 1,
      rewardText: 'Warmth secured! Cooking unlocked',
      getEventCount: (s) => (s.campfireLit ? 1 : 0)
    },
    {
      id: 'cook_fish',
      title: 'Cook one fish',
      description: 'Catch raw fish at the shoreline fishing spot (LOC 45, 45) and cook it at your lit campfire.',
      targetCount: 1,
      rewardText: 'Delicious meal! Building recipes unlocked',
      getEventCount: (s) => s.fishCooked
    },
    {
      id: 'build_shelter',
      title: 'Build a basic shelter',
      description: 'Craft and place a wooden floor, walls around it, and a roof on top to form an enclosed shelter.',
      targetCount: 1,
      rewardText: 'Shelter Complete! Weather protection active',
      getEventCount: (s) => (s.shelterBuilt ? 1 : 0)
    },
    {
      id: 'return_shipwreck',
      title: 'Return to the shipwreck',
      description: 'Head back to the expedition vessel to prepare for deeper island exploration.',
      targetCount: 1,
      rewardText: 'Phase 3 Survival Mastered!',
      getEventCount: (s) => (s.shipwreckReturned ? 1 : 0)
    }
  ];

  public currentIndex: number = 0;
  public stats: MissionLifetimeStats = {
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
  };
  private completedIds: string[] = [];

  private onCompleteCallback: ((mission: MissionDefinition, nextMission: MissionDefinition | null) => void) | null = null;
  private onProgressCallback: ((text: string) => void) | null = null;

  constructor() {}

  public setCallbacks(cbs: {
    onComplete?: (mission: MissionDefinition, nextMission: MissionDefinition | null) => void;
    onProgress?: (text: string) => void;
  }): void {
    if (cbs.onComplete) this.onCompleteCallback = cbs.onComplete;
    if (cbs.onProgress) this.onProgressCallback = cbs.onProgress;
  }

  public getCurrentMission(): MissionDefinition | null {
    if (this.currentIndex >= this.missions.length) return null;
    return this.missions[this.currentIndex];
  }

  public getCurrentMissionText(): string {
    const current = this.getCurrentMission();
    if (!current) {
      return 'All island objectives complete! You are ready to explore the mystery inland.';
    }

    if (current.targetCount > 1) {
      const count = Math.min(current.targetCount, current.getEventCount(this.stats));
      return `${current.title} (${count}/${current.targetCount})`;
    }

    return current.title;
  }

  public notifyProgress(): void {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.getCurrentMissionText());
    }
  }

  public recordDistanceTraveled(deltaDist: number): void {
    this.stats.distanceExplored += deltaDist;
    if (!this.stats.beachExplored && this.stats.distanceExplored >= 35) {
      this.stats.beachExplored = true;
      this.checkCurrentMissionCompletion();
    }
  }

  public recordResourceCollected(type: ResourceType | string): void {
    if (type === 'wood') this.stats.woodCollected++;
    else if (type === 'stone') this.stats.stonesCollected++;
    else if (type === 'coconut') this.stats.coconutsCollected++;
    else if (type === 'water') this.stats.waterCollected++;

    this.checkCurrentMissionCompletion();
  }

  public recordShipwreckInspected(): void {
    this.stats.shipwreckInspected = true;
    this.checkCurrentMissionCompletion();

    // If on mission 'return_shipwreck', complete that too
    if (this.currentIndex >= 11) {
      this.stats.shipwreckReturned = true;
      this.checkCurrentMissionCompletion();
    }
  }

  public recordCraftItem(resultType: string): void {
    if (resultType === 'stone_axe') {
      this.stats.stoneAxeCrafted++;
    } else if (resultType === 'campfire') {
      this.stats.campfireCrafted++;
    }
    this.checkCurrentMissionCompletion();
  }

  public recordCampfireLit(): void {
    this.stats.campfireLit = true;
    this.checkCurrentMissionCompletion();
  }

  public recordFishCooked(): void {
    this.stats.fishCooked++;
    this.checkCurrentMissionCompletion();
  }

  public recordShelterBuilt(): void {
    this.stats.shelterBuilt = true;
    this.checkCurrentMissionCompletion();
  }

  public recordShipwreckReturned(): void {
    this.stats.shipwreckReturned = true;
    this.checkCurrentMissionCompletion();
  }

  private checkCurrentMissionCompletion(): void {
    const current = this.getCurrentMission();
    if (!current) {
      this.notifyProgress();
      return;
    }

    const currentCount = current.getEventCount(this.stats);
    this.notifyProgress();

    if (currentCount >= current.targetCount) {
      // Completed current mission!
      this.completedIds.push(current.id);
      const finishedMission = current;
      this.currentIndex++;
      const nextMission = this.getCurrentMission();

      if (this.onCompleteCallback) {
        this.onCompleteCallback(finishedMission, nextMission);
      }

      this.notifyProgress();

      // Check if the next mission was already satisfied by prior gameplay events
      if (nextMission && nextMission.getEventCount(this.stats) >= nextMission.targetCount) {
        setTimeout(() => {
          this.checkCurrentMissionCompletion();
        }, 800);
      }
    }
  }

  public serialize(): MissionSaveState {
    return {
      currentIndex: this.currentIndex,
      stats: { ...this.stats },
      completedIds: [...this.completedIds]
    };
  }

  public deserialize(data: MissionSaveState | null): void {
    if (!data) return;
    this.currentIndex = typeof data.currentIndex === 'number' ? data.currentIndex : 0;
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
    if (Array.isArray(data.completedIds)) {
      this.completedIds = [...data.completedIds];
    }
    this.notifyProgress();
  }

  public reset(): void {
    this.currentIndex = 0;
    this.completedIds = [];
    this.stats = {
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
    };
    this.notifyProgress();
  }
}
