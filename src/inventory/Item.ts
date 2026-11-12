export type ResourceType = 'wood' | 'stone' | 'coconut' | 'water';

export interface ItemDefinition {
  id: ResourceType;
  name: string;
  icon: string;
  description: string;
  maxStack: number;
  isConsumable: boolean;
  nutrition?: {
    hunger?: number;
    thirst?: number;
    health?: number;
  };
}

export const ITEM_DEFINITIONS: Record<ResourceType, ItemDefinition> = {
  wood: {
    id: 'wood',
    name: 'Wood',
    icon: '🪵',
    description: 'Sturdy driftwood branches suitable for tools and repairs.',
    maxStack: 20,
    isConsumable: false
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    icon: '🪨',
    description: 'Smooth river stones and volcanic rock fragments.',
    maxStack: 20,
    isConsumable: false
  },
  coconut: {
    id: 'coconut',
    name: 'Coconut',
    icon: '🥥',
    description: 'Nutritious tropical fruit. Restores 20 Hunger.',
    maxStack: 10,
    isConsumable: true,
    nutrition: {
      hunger: 20
    }
  },
  water: {
    id: 'water',
    name: 'Fresh Water',
    icon: '💧',
    description: 'Clean drinking water from an inland spring. Restores 30 Thirst.',
    maxStack: 10,
    isConsumable: true,
    nutrition: {
      thirst: 30
    }
  }
};

export interface InventorySlot {
  itemType: ResourceType;
  quantity: number;
}

