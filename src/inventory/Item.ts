export type ResourceType =
  | 'wood'
  | 'stone'
  | 'coconut'
  | 'water'
  | 'stone_axe'
  | 'campfire'
  | 'wooden_floor'
  | 'wooden_wall'
  | 'wooden_roof'
  | 'cooking_station'
  | 'raw_fish'
  | 'cooked_fish';

export interface ItemDefinition {
  id: ResourceType;
  name: string;
  icon: string;
  description: string;
  maxStack: number;
  isConsumable: boolean;
  isEquipable?: boolean;
  isPlaceable?: boolean;
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
    description: 'Sturdy driftwood branches suitable for tools, fires, and building.',
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
  },
  stone_axe: {
    id: 'stone_axe',
    name: 'Stone Axe',
    icon: '🪓',
    description: 'A primitive hand axe made of stone and wood. Equip to harvest extra wood from driftwood.',
    maxStack: 1,
    isConsumable: false,
    isEquipable: true
  },
  campfire: {
    id: 'campfire',
    name: 'Campfire',
    icon: '🔥',
    description: 'Stone ring and logs for warmth, light, and cooking fish. Place on the ground.',
    maxStack: 5,
    isConsumable: false,
    isPlaceable: true
  },
  wooden_floor: {
    id: 'wooden_floor',
    name: 'Wooden Floor',
    icon: '🪵',
    description: 'A 4m x 4m sturdy timber foundation platform. Snaps to other floors and supports walls.',
    maxStack: 10,
    isConsumable: false,
    isPlaceable: true
  },
  wooden_wall: {
    id: 'wooden_wall',
    name: 'Wooden Wall',
    icon: '🧱',
    description: 'A 4m x 3m timber log wall. Snaps to floor perimeter edges and supports roofs.',
    maxStack: 10,
    isConsumable: false,
    isPlaceable: true
  },
  wooden_roof: {
    id: 'wooden_roof',
    name: 'Wooden Roof',
    icon: '🛖',
    description: 'A 4m x 4m thatch and timber ceiling. Snaps directly on top of supported walls.',
    maxStack: 10,
    isConsumable: false,
    isPlaceable: true
  },
  cooking_station: {
    id: 'cooking_station',
    name: 'Cooking Station',
    icon: '🍳',
    description: 'A stone prep grill for preparing shoreline fish over a campfire.',
    maxStack: 5,
    isConsumable: false,
    isPlaceable: true
  },
  raw_fish: {
    id: 'raw_fish',
    name: 'Raw Fish',
    icon: '🐟',
    description: 'Freshly caught reef fish. Cook at a campfire before eating.',
    maxStack: 10,
    isConsumable: false
  },
  cooked_fish: {
    id: 'cooked_fish',
    name: 'Cooked Fish',
    icon: '🍱',
    description: 'Savory grilled island fish. Restores 35 Hunger.',
    maxStack: 10,
    isConsumable: true,
    nutrition: {
      hunger: 35
    }
  }
};

export interface InventorySlot {
  itemType: ResourceType;
  quantity: number;
}
