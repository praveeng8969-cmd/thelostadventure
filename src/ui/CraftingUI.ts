import { CraftingManager, CRAFTING_RECIPES, CraftingRecipe } from '../crafting/Crafting';
import { Inventory } from '../inventory/Inventory';
import { ITEM_DEFINITIONS } from '../inventory/Item';
import { soundManager } from '../core/SoundManager';

export class CraftingUI {
  private modalEl: HTMLElement;
  private recipesContainerEl: HTMLElement;
  private btnClose: HTMLButtonElement;
  private btnFooterClose: HTMLButtonElement;
  private craftingManager: CraftingManager;
  private inventory: Inventory;

  private onCraftCallback: ((recipe: CraftingRecipe) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  constructor(craftingManager: CraftingManager, inventory: Inventory) {
    this.craftingManager = craftingManager;
    this.inventory = inventory;
    this.modalEl = document.getElementById('modal-crafting')!;
    this.recipesContainerEl = document.getElementById('crafting-recipes-list')!;
    this.btnClose = document.getElementById('btn-close-crafting') as HTMLButtonElement;
    this.btnFooterClose = document.getElementById('btn-crafting-close') as HTMLButtonElement;

    this.setupListeners();

    // Re-render when inventory changes
    this.inventory.subscribe(() => {
      if (this.isOpen()) {
        this.render();
      }
    });
  }

  private setupListeners(): void {
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.close());
    }
    if (this.btnFooterClose) {
      this.btnFooterClose.addEventListener('click', () => this.close());
    }
  }

  public setOnCraft(cb: (recipe: CraftingRecipe) => void): void {
    this.onCraftCallback = cb;
  }

  public setOnClose(cb: () => void): void {
    this.onCloseCallback = cb;
  }

  public open(): void {
    soundManager.playClick();
    this.modalEl.classList.remove('hidden');
    this.render();
  }

  public close(): void {
    soundManager.playClick();
    this.modalEl.classList.add('hidden');
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  public isOpen(): boolean {
    return !this.modalEl.classList.contains('hidden');
  }

  public render(): void {
    this.recipesContainerEl.innerHTML = '';

    for (const recipe of CRAFTING_RECIPES) {
      const isUnlocked = this.craftingManager.isUnlocked(recipe.id);
      const resultDef = ITEM_DEFINITIONS[recipe.resultType];
      const check = this.craftingManager.canCraft(recipe.id, this.inventory);

      const card = document.createElement('div');
      card.className = `craft-card ${isUnlocked ? '' : 'locked'} ${check.canCraft ? 'craftable' : ''}`;

      // Ingredients display
      const ingredientsHtml = recipe.ingredients
        .map((ing) => {
          const def = ITEM_DEFINITIONS[ing.itemType];
          const have = this.inventory.getItemCount(ing.itemType);
          const satisfied = have >= ing.count;
          return `<span class="ing-badge ${satisfied ? 'met' : 'unmet'}">
            ${def ? def.icon : ''} ${have}/${ing.count} ${def ? def.name : ing.itemType}
          </span>`;
        })
        .join('');

      card.innerHTML = `
        <div class="craft-card-left">
          <div class="craft-icon">${resultDef ? resultDef.icon : '📦'}</div>
          <div class="craft-info">
            <div class="craft-title-row">
              <span class="craft-title">${recipe.name}</span>
              ${!isUnlocked ? '<span class="lock-tag">LOCKED</span>' : ''}
            </div>
            <p class="craft-desc">${recipe.description}</p>
            <div class="craft-ingredients">${ingredientsHtml}</div>
          </div>
        </div>
        <div class="craft-card-right">
          <button class="btn btn-primary btn-sm craft-btn" ${!isUnlocked || !check.canCraft ? 'disabled' : ''}>
            ${isUnlocked ? (check.canCraft ? 'CRAFT' : 'MISSING ITEMS') : 'LOCKED'}
          </button>
        </div>
      `;

      if (isUnlocked && check.canCraft) {
        const btn = card.querySelector('.craft-btn') as HTMLButtonElement;
        btn.addEventListener('click', () => {
          soundManager.playClick();
          const result = this.craftingManager.craft(recipe.id, this.inventory);
          if (result.success && result.recipe) {
            soundManager.playInteract();
            if (this.onCraftCallback) {
              this.onCraftCallback(result.recipe);
            }
          }
          this.render();
        });
      }

      this.recipesContainerEl.appendChild(card);
    }
  }
}
