import { ResourceType, ITEM_DEFINITIONS } from '../inventory/Item';
import { Inventory } from '../inventory/Inventory';

export interface CraftingIngredient {
  itemType: ResourceType;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultType: ResourceType;
  resultCount: number;
  ingredients: CraftingIngredient[];
  description: string;
  initiallyUnlocked: boolean;
  category: 'tools' | 'survival' | 'building';
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'stone_axe',
    name: 'Stone Axe',
    resultType: 'stone_axe',
    resultCount: 1,
    ingredients: [
      { itemType: 'wood', count: 3 },
      { itemType: 'stone', count: 2 }
    ],
    description: 'Equip to harvest bonus wood from coastal driftwood logs.',
    initiallyUnlocked: true,
    category: 'tools'
  },
  {
    id: 'campfire',
    name: 'Campfire',
    resultType: 'campfire',
    resultCount: 1,
    ingredients: [
      { itemType: 'wood', count: 5 },
      { itemType: 'stone', count: 4 }
    ],
    description: 'Provide warmth, lighting, and a fire to cook raw fish.',
    initiallyUnlocked: true,
    category: 'survival'
  },
  {
    id: 'wooden_floor',
    name: 'Wooden Floor',
    resultType: 'wooden_floor',
    resultCount: 1,
    ingredients: [{ itemType: 'wood', count: 4 }],
    description: '4m x 4m foundation platform. Required base for shelter building.',
    initiallyUnlocked: false,
    category: 'building'
  },
  {
    id: 'wooden_wall',
    name: 'Wooden Wall',
    resultType: 'wooden_wall',
    resultCount: 1,
    ingredients: [{ itemType: 'wood', count: 5 }],
    description: '4m x 3m timber wall that snaps along floor edges.',
    initiallyUnlocked: false,
    category: 'building'
  },
  {
    id: 'wooden_roof',
    name: 'Wooden Roof',
    resultType: 'wooden_roof',
    resultCount: 1,
    ingredients: [{ itemType: 'wood', count: 6 }],
    description: '4m x 4m weather-proof ceiling that snaps on top of supported walls.',
    initiallyUnlocked: false,
    category: 'building'
  },
  {
    id: 'cooking_station',
    name: 'Cooking Station',
    resultType: 'cooking_station',
    resultCount: 1,
    ingredients: [
      { itemType: 'wood', count: 6 },
      { itemType: 'stone', count: 5 }
    ],
    description: 'Advanced outdoor culinary station for island cooking.',
    initiallyUnlocked: false,
    category: 'survival'
  }
];

export class CraftingManager {
  private unlockedRecipes: Set<string> = new Set();
  private onCraftCallback: ((recipe: CraftingRecipe) => void) | null = null;

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults(): void {
    this.unlockedRecipes.clear();
    for (const r of CRAFTING_RECIPES) {
      if (r.initiallyUnlocked) {
        this.unlockedRecipes.add(r.id);
      }
    }
  }

  public setOnCraft(cb: (recipe: CraftingRecipe) => void): void {
    this.onCraftCallback = cb;
  }

  public isUnlocked(recipeId: string): boolean {
    return this.unlockedRecipes.has(recipeId);
  }

  public unlockRecipe(recipeId: string): boolean {
    if (!this.unlockedRecipes.has(recipeId)) {
      this.unlockedRecipes.add(recipeId);
      return true;
    }
    return false;
  }

  public unlockBuildingRecipes(): void {
    this.unlockRecipe('wooden_floor');
    this.unlockRecipe('wooden_wall');
    this.unlockRecipe('wooden_roof');
  }

  public unlockCookingStation(): void {
    this.unlockRecipe('cooking_station');
  }

  public getAvailableRecipes(): CraftingRecipe[] {
    return CRAFTING_RECIPES.map((r) => ({ ...r }));
  }

  public canCraft(
    recipeId: string,
    inventory: Inventory
  ): { canCraft: boolean; missingIngredients: string[] } {
    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return { canCraft: false, missingIngredients: ['Unknown recipe'] };

    if (!this.isUnlocked(recipe.id)) {
      return { canCraft: false, missingIngredients: ['Recipe locked. Complete missions to unlock.'] };
    }

    const missing: string[] = [];
    for (const ing of recipe.ingredients) {
      const have = inventory.getItemCount(ing.itemType);
      if (have < ing.count) {
        const itemDef = ITEM_DEFINITIONS[ing.itemType];
        const name = itemDef ? itemDef.name : ing.itemType;
        missing.push(`${ing.count - have} more ${name}`);
      }
    }

    if (!inventory.hasFreeSpace(recipe.resultType)) {
      return { canCraft: false, missingIngredients: ['Inventory full! Free up a slot.'] };
    }

    return { canCraft: missing.length === 0, missingIngredients: missing };
  }

  public craft(
    recipeId: string,
    inventory: Inventory
  ): { success: boolean; message: string; recipe?: CraftingRecipe } {
    const check = this.canCraft(recipeId, inventory);
    if (!check.canCraft) {
      return {
        success: false,
        message: check.missingIngredients.join(', ')
      };
    }

    const recipe = CRAFTING_RECIPES.find((r) => r.id === recipeId)!;

    // Deduct ingredients exactly once
    for (const ing of recipe.ingredients) {
      const removed = inventory.removeItem(ing.itemType, ing.count);
      if (!removed) {
        return { success: false, message: 'Error deducting ingredients.' };
      }
    }

    // Add result to inventory
    const addResult = inventory.addItem(recipe.resultType, recipe.resultCount);
    if (addResult.added <= 0) {
      // Revert if somehow failed
      for (const ing of recipe.ingredients) {
        inventory.addItem(ing.itemType, ing.count);
      }
      return { success: false, message: 'Could not fit crafted item in inventory.' };
    }

    if (this.onCraftCallback) {
      this.onCraftCallback(recipe);
    }

    return {
      success: true,
      message: `Crafted ${recipe.name}!`,
      recipe
    };
  }

  public serialize(): string[] {
    return Array.from(this.unlockedRecipes);
  }

  public deserialize(unlockedIds: string[] | null | undefined): void {
    this.resetToDefaults();
    if (Array.isArray(unlockedIds)) {
      for (const id of unlockedIds) {
        this.unlockedRecipes.add(id);
      }
    }
  }
}
