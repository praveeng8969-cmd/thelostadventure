export interface MissionDefinition {
  id: string;
  title: string;
  description: string;
  targetCount: number;
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
}

export interface MissionSaveState {
  currentIndex: number;
  stats: MissionLifetimeStats;
  completedIds: string[];
}

export class MissionManager {
  private missions: MissionDefinition[] = [
    {
      id: 'explore_beach',
      title: 'Explore the beach',
      description: 'Survey the coastal shoreline where you washed ashore.',
      targetCount: 1,
      getEventCount: (s) => (s.beachExplored ? 1 : 0)
    },
    {
      id: 'collect_wood',
      title: 'Collect 5 wood',
      description: 'Gather driftwood along the beach.',
      targetCount: 5,
      getEventCount: (s) => s.woodCollected
    },
    {
      id: 'collect_stone',
      title: 'Collect 3 stones',
      description: 'Collect small stones scattered along the shore.',
      targetCount: 3,
      getEventCount: (s) => s.stonesCollected
    },
    {
      id: 'find_coconuts',
      title: 'Find 2 coconuts',
      description: 'Search underneath coastal palm trees for fallen coconuts.',
      targetCount: 2,
      getEventCount: (s) => s.coconutsCollected
    },
    {
      id: 'collect_water',
      title: 'Collect drinking water',
      description: 'Locate the natural freshwater spring in the rocky glade.',
      targetCount: 1,
      getEventCount: (s) => s.waterCollected
    },
    {
      id: 'inspect_ship',
      title: 'Inspect the damaged ship',
      description: 'Approach your shipwreck and search the emergency survival cache.',
      targetCount: 1,
      getEventCount: (s) => (s.shipwreckInspected ? 1 : 0)
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
    shipwreckInspected: false
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
      return 'All introductory objectives complete! Island survival secured.';
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

  public recordResourceCollected(type: 'wood' | 'stone' | 'coconut' | 'water'): void {
    if (type === 'wood') this.stats.woodCollected++;
    else if (type === 'stone') this.stats.stonesCollected++;
    else if (type === 'coconut') this.stats.coconutsCollected++;
    else if (type === 'water') this.stats.waterCollected++;

    this.checkCurrentMissionCompletion();
  }

  public recordShipwreckInspected(): void {
    this.stats.shipwreckInspected = true;
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
        // Automatically cascade completion
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
      shipwreckInspected: false
    };
    this.notifyProgress();
  }
}

