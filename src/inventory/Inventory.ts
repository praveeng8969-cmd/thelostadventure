import { ResourceType, InventorySlot, ITEM_DEFINITIONS } from './Item';

export type InventoryChangeCallback = (slots: (InventorySlot | null)[]) => void;

export class Inventory {
  public static readonly CAPACITY = 16;
  private slots: (InventorySlot | null)[] = [];
  private listeners: InventoryChangeCallback[] = [];

  constructor() {
    this.slots = new Array(Inventory.CAPACITY).fill(null);
  }

  public subscribe(cb: InventoryChangeCallback): () => void {
    this.listeners.push(cb);
    cb(this.getSlots());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    const current = this.getSlots();
    for (const cb of this.listeners) {
      cb(current);
    }
  }

  public getSlots(): (InventorySlot | null)[] {
    return this.slots.map((s) => (s ? { ...s } : null));
  }

  public getSlotAt(index: number): InventorySlot | null {
    if (index < 0 || index >= Inventory.CAPACITY) return null;
    const s = this.slots[index];
    return s ? { ...s } : null;
  }

  /**
   * Adds an item to the inventory. Stacks if existing slot has space.
   * Returns true if entire quantity was added, false if inventory is full.
   */
  public addItem(type: ResourceType, count: number = 1): { added: number; remainder: number } {
    if (count <= 0) return { added: 0, remainder: 0 };
    const def = ITEM_DEFINITIONS[type];
    if (!def) return { added: 0, remainder: count };

    let toAdd = count;

    // 1. Try stacking into existing slots of the same item
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemType === type && slot.quantity < def.maxStack) {
        const space = def.maxStack - slot.quantity;
        const addAmount = Math.min(space, toAdd);
        slot.quantity += addAmount;
        toAdd -= addAmount;
        if (toAdd <= 0) break;
      }
    }

    // 2. Put remainder into first empty slot(s)
    if (toAdd > 0) {
      for (let i = 0; i < this.slots.length; i++) {
        if (!this.slots[i]) {
          const addAmount = Math.min(def.maxStack, toAdd);
          this.slots[i] = {
            itemType: type,
            quantity: addAmount
          };
          toAdd -= addAmount;
          if (toAdd <= 0) break;
        }
      }
    }

    const added = count - toAdd;
    if (added > 0) {
      this.notify();
    }

    return { added, remainder: toAdd };
  }

  /**
   * Removes a specific quantity of an item from the given slot.
   */
  public removeAtSlot(slotIndex: number, count: number = 1): boolean {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
    const slot = this.slots[slotIndex];
    if (!slot || slot.quantity < count) return false;

    slot.quantity -= count;
    if (slot.quantity <= 0) {
      this.slots[slotIndex] = null;
    }
    this.notify();
    return true;
  }

  /**
   * Removes quantity of an item across any slots.
   */
  public removeItem(type: ResourceType, count: number = 1): boolean {
    if (this.getItemCount(type) < count) return false;
    let needed = count;

    for (let i = this.slots.length - 1; i >= 0; i--) {
      const slot = this.slots[i];
      if (slot && slot.itemType === type) {
        if (slot.quantity <= needed) {
          needed -= slot.quantity;
          this.slots[i] = null;
        } else {
          slot.quantity -= needed;
          needed = 0;
        }
        if (needed === 0) break;
      }
    }

    this.notify();
    return true;
  }

  public getItemCount(type: ResourceType): number {
    return this.slots.reduce((total, slot) => {
      return slot && slot.itemType === type ? total + slot.quantity : total;
    }, 0);
  }

  public hasFreeSpace(type: ResourceType): boolean {
    const def = ITEM_DEFINITIONS[type];
    return this.slots.some((s) => !s || (s.itemType === type && s.quantity < def.maxStack));
  }

  public serialize(): (InventorySlot | null)[] {
    return this.slots.map((s) => (s ? { itemType: s.itemType, quantity: s.quantity } : null));
  }

  public deserialize(savedSlots: (InventorySlot | null)[]): void {
    this.slots = new Array(Inventory.CAPACITY).fill(null);
    if (Array.isArray(savedSlots)) {
      for (let i = 0; i < Math.min(Inventory.CAPACITY, savedSlots.length); i++) {
        const item = savedSlots[i];
        if (item && ITEM_DEFINITIONS[item.itemType] && item.quantity > 0) {
          this.slots[i] = {
            itemType: item.itemType,
            quantity: Math.min(item.quantity, ITEM_DEFINITIONS[item.itemType].maxStack)
          };
        }
      }
    }
    this.notify();
  }

  public clear(): void {
    this.slots = new Array(Inventory.CAPACITY).fill(null);
    this.notify();
  }
}
