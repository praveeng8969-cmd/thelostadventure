import { Inventory } from '../inventory/Inventory';
import { InventorySlot, ITEM_DEFINITIONS, ResourceType } from '../inventory/Item';
import { soundManager } from '../core/SoundManager';

export class InventoryUI {
  private modalEl: HTMLElement;
  private gridEl: HTMLElement;
  private detailsEl: HTMLElement;
  private btnClose: HTMLButtonElement;
  private btnFooterClose: HTMLButtonElement;
  private inventory: Inventory;

  private selectedSlotIndex: number | null = null;
  private currentlyEquippedTool: 'stone_axe' | null = null;

  private onUseItemCallback: ((type: ResourceType, slotIndex: number) => void) | null = null;
  private onEquipToolCallback: ((tool: 'stone_axe' | null) => void) | null = null;
  private onStartPlacementCallback: ((itemType: ResourceType) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    this.modalEl = document.getElementById('modal-inventory')!;
    this.gridEl = document.getElementById('inventory-grid')!;
    this.detailsEl = document.getElementById('inventory-details')!;
    this.btnClose = document.getElementById('btn-close-inventory') as HTMLButtonElement;
    this.btnFooterClose = document.getElementById('btn-inventory-close') as HTMLButtonElement;

    this.setupListeners();
    this.render();

    // Subscribe to inventory state changes
    this.inventory.subscribe(() => {
      this.render();
      if (this.selectedSlotIndex !== null) {
        this.renderDetails(this.selectedSlotIndex);
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

  public setEquippedTool(tool: 'stone_axe' | null): void {
    this.currentlyEquippedTool = tool;
    this.render();
    if (this.selectedSlotIndex !== null) {
      this.renderDetails(this.selectedSlotIndex);
    }
  }

  public setOnUseItem(cb: (type: ResourceType, slotIndex: number) => void): void {
    this.onUseItemCallback = cb;
  }

  public setOnEquipTool(cb: (tool: 'stone_axe' | null) => void): void {
    this.onEquipToolCallback = cb;
  }

  public setOnStartPlacement(cb: (itemType: ResourceType) => void): void {
    this.onStartPlacementCallback = cb;
  }

  public setOnClose(cb: () => void): void {
    this.onCloseCallback = cb;
  }

  public open(): void {
    soundManager.playClick();
    this.modalEl.classList.remove('hidden');
    this.render();
    if (this.selectedSlotIndex === null) {
      // Auto-select first non-empty slot if available
      const slots = this.inventory.getSlots();
      const firstIndex = slots.findIndex((s) => s !== null);
      if (firstIndex !== -1) {
        this.selectSlot(firstIndex);
      } else {
        this.renderDetails(null);
      }
    }
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

  private selectSlot(index: number): void {
    this.selectedSlotIndex = index;
    this.render();
    this.renderDetails(index);
  }

  private render(): void {
    this.gridEl.innerHTML = '';
    const slots = this.inventory.getSlots();

    for (let i = 0; i < Inventory.CAPACITY; i++) {
      const slot = slots[i];
      const slotEl = document.createElement('div');
      slotEl.className = 'inventory-slot';
      if (this.selectedSlotIndex === i) {
        slotEl.classList.add('selected');
      }

      if (slot) {
        const def = ITEM_DEFINITIONS[slot.itemType];
        const isEquipped = slot.itemType === this.currentlyEquippedTool;
        slotEl.innerHTML = `
          <div class="slot-icon">${def ? def.icon : '📦'}</div>
          <div class="slot-name">${def ? def.name : slot.itemType}</div>
          <div class="slot-qty">${isEquipped ? 'EQUIPPED' : 'x' + slot.quantity}</div>
        `;
        if (isEquipped) {
          slotEl.classList.add('equipped');
        }
      } else {
        slotEl.innerHTML = `<div class="slot-empty-num">${i + 1}</div>`;
      }

      slotEl.addEventListener('click', () => {
        soundManager.playClick();
        this.selectSlot(i);
      });

      this.gridEl.appendChild(slotEl);
    }
  }

  private renderDetails(index: number | null): void {
    if (index === null) {
      this.detailsEl.innerHTML = `<div class="empty-details">Select an item in your bag to inspect it.</div>`;
      return;
    }

    const slot = this.inventory.getSlotAt(index);
    if (!slot) {
      this.detailsEl.innerHTML = `<div class="empty-details">Empty Slot ${index + 1}</div>`;
      return;
    }

    const def = ITEM_DEFINITIONS[slot.itemType];
    if (!def) return;

    let actionBtnHtml = '';
    if (def.isConsumable) {
      actionBtnHtml = `<button id="btn-use-item" class="btn btn-primary btn-sm">USE (EAT / DRINK)</button>`;
    } else if (def.isEquipable) {
      const isEquipped = slot.itemType === this.currentlyEquippedTool;
      actionBtnHtml = `<button id="btn-equip-item" class="btn btn-primary btn-sm">${
        isEquipped ? 'UNEQUIP' : 'EQUIP TOOL'
      }</button>`;
    } else if (def.isPlaceable) {
      actionBtnHtml = `<button id="btn-place-item" class="btn btn-primary btn-sm">PLACE / BUILD</button>`;
    }

    this.detailsEl.innerHTML = `
      <div class="item-card">
        <div class="item-card-header">
          <span class="item-big-icon">${def.icon}</span>
          <div>
            <h4 class="item-title">${def.name}</h4>
            <span class="item-count-label">Carrying: ${slot.quantity} / ${def.maxStack}</span>
          </div>
        </div>
        <p class="item-desc">${def.description}</p>
        <div class="item-actions">
          ${actionBtnHtml}
          <button id="btn-drop-item" class="btn btn-tertiary btn-sm">DISCARD (1)</button>
        </div>
      </div>
    `;

    // Hook buttons
    const useBtn = document.getElementById('btn-use-item');
    if (useBtn) {
      useBtn.addEventListener('click', () => {
        if (this.onUseItemCallback) {
          this.onUseItemCallback(slot.itemType, index);
        }
      });
    }

    const equipBtn = document.getElementById('btn-equip-item');
    if (equipBtn) {
      equipBtn.addEventListener('click', () => {
        soundManager.playClick();
        const isEquipped = slot.itemType === this.currentlyEquippedTool;
        const newTool = isEquipped ? null : (slot.itemType as 'stone_axe');
        if (this.onEquipToolCallback) {
          this.onEquipToolCallback(newTool);
        }
      });
    }

    const placeBtn = document.getElementById('btn-place-item');
    if (placeBtn) {
      placeBtn.addEventListener('click', () => {
        soundManager.playClick();
        this.close();
        if (this.onStartPlacementCallback) {
          this.onStartPlacementCallback(slot.itemType);
        }
      });
    }

    const dropBtn = document.getElementById('btn-drop-item');
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        soundManager.playClick();
        // If dropping the currently equipped tool, unequip it
        if (slot.itemType === this.currentlyEquippedTool) {
          if (this.onEquipToolCallback) {
            this.onEquipToolCallback(null);
          }
        }
        this.inventory.removeAtSlot(index, 1);
        const updated = this.inventory.getSlotAt(index);
        if (!updated) {
          this.renderDetails(null);
        }
      });
    }
  }
}
