/**
 * InventorySystem - Full inventory management with slots, stacking, and operations
 */

import { Item, ItemType } from '../types/ItemTypes';

export interface InventorySlot {
  item: Item | null;
  quantity: number;
  locked: boolean;          // Quest items can't be dropped
}

export type SortCriteria = 'type' | 'rarity' | 'name' | 'value';

export class InventorySystemNew {
  slots: InventorySlot[];
  maxSlots: number;
  gold: number;

  constructor(maxSlots: number = 20) {
    this.maxSlots = maxSlots;
    this.gold = 100; // Starting gold
    this.slots = [];

    // Initialize empty slots
    for (let i = 0; i < maxSlots; i++) {
      this.slots.push({
        item: null,
        quantity: 0,
        locked: false
      });
    }

    // Load from localStorage if available
    this.loadFromStorage();
  }

  /**
   * Add item to inventory
   * Returns true if successful, false if inventory full
   */
  addItem(item: Item, quantity: number = 1): boolean {
    // Handle currency separately
    if (item.type === ItemType.CURRENCY) {
      this.gold += quantity;
      return true;
    }

    // If stackable, try to add to existing stacks first
    if (item.stackable) {
      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        if (slot.item && slot.item.id === item.id) {
          // Found existing stack
          const spaceLeft = slot.item.maxStack - slot.quantity;
          if (spaceLeft > 0) {
            const amountToAdd = Math.min(quantity, spaceLeft);
            slot.quantity += amountToAdd;
            quantity -= amountToAdd;

            if (quantity === 0) {
              this.saveToStorage();
              return true; // All added
            }
          }
        }
      }
    }

    // Create new stacks or single items for remaining quantity
    while (quantity > 0) {
      const emptySlotIndex = this.findEmptySlot();
      if (emptySlotIndex === -1) {
        return false; // Inventory full
      }

      const amountToAdd = item.stackable ? Math.min(quantity, item.maxStack) : 1;
      this.slots[emptySlotIndex] = {
        item: { ...item }, // Copy item to avoid reference issues
        quantity: amountToAdd,
        locked: item.questItem
      };

      quantity -= amountToAdd;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Remove item from inventory
   * Returns true if successful, false if not found or insufficient quantity
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    let remaining = quantity;

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.item && slot.item.id === itemId) {
        const amountToRemove = Math.min(remaining, slot.quantity);
        slot.quantity -= amountToRemove;
        remaining -= amountToRemove;

        if (slot.quantity <= 0) {
          slot.item = null;
          slot.quantity = 0;
          slot.locked = false;
        }

        if (remaining === 0) {
          this.saveToStorage();
          return true; // All removed
        }
      }
    }

    this.saveToStorage();
    return remaining === 0;
  }

  /**
   * Check if inventory has at least quantity of item
   */
  hasItem(itemId: string, quantity: number = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }

  /**
   * Get total count of item across all slots
   */
  getItemCount(itemId: string): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === itemId) {
        total += slot.quantity;
      }
    }
    return total;
  }

  /**
   * Move or swap items between slots
   */
  moveItem(fromSlot: number, toSlot: number): void {
    if (fromSlot < 0 || fromSlot >= this.slots.length ||
        toSlot < 0 || toSlot >= this.slots.length) {
      return; // Invalid slot indices
    }

    const from = this.slots[fromSlot];
    const to = this.slots[toSlot];

    // Can't move locked items
    if (from.locked) return;

    // If destination is empty, just move
    if (!to.item) {
      this.slots[toSlot] = from;
      this.slots[fromSlot] = {
        item: null,
        quantity: 0,
        locked: false
      };
    }
    // If both have same stackable item, try to merge
    else if (from.item && to.item &&
             from.item.id === to.item.id &&
             from.item.stackable) {
      const spaceLeft = to.item.maxStack - to.quantity;
      const amountToTransfer = Math.min(from.quantity, spaceLeft);

      to.quantity += amountToTransfer;
      from.quantity -= amountToTransfer;

      if (from.quantity <= 0) {
        this.slots[fromSlot] = {
          item: null,
          quantity: 0,
          locked: false
        };
      }
    }
    // Otherwise, swap
    else {
      this.slots[toSlot] = from;
      this.slots[fromSlot] = to;
    }

    this.saveToStorage();
  }

  /**
   * Drop item from slot (returns the item and quantity)
   * Returns null if slot is empty or locked
   */
  dropItem(slotIndex: number): { item: Item; quantity: number } | null {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return null;
    }

    const slot = this.slots[slotIndex];
    if (!slot.item || slot.locked) {
      return null;
    }

    const dropped = {
      item: slot.item,
      quantity: slot.quantity
    };

    this.slots[slotIndex] = {
      item: null,
      quantity: 0,
      locked: false
    };

    this.saveToStorage();
    return dropped;
  }

  /**
   * Use consumable item
   * Returns the item effect if successful, null otherwise
   */
  useItem(slotIndex: number): Item | null {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return null;
    }

    const slot = this.slots[slotIndex];
    if (!slot.item) {
      return null;
    }

    // Only consumables can be used from inventory
    if (slot.item.type !== ItemType.CONSUMABLE) {
      return null;
    }

    const item = slot.item;

    // Remove one from stack
    slot.quantity--;
    if (slot.quantity <= 0) {
      slot.item = null;
      slot.quantity = 0;
      slot.locked = false;
    }

    this.saveToStorage();
    return item;
  }

  /**
   * Sort inventory by criteria
   */
  sortInventory(sortBy: SortCriteria): void {
    // Collect all items
    const items: InventorySlot[] = [];
    for (const slot of this.slots) {
      if (slot.item) {
        items.push({ ...slot });
      }
    }

    // Sort items
    items.sort((a, b) => {
      if (!a.item || !b.item) return 0;

      switch (sortBy) {
        case 'type':
          return a.item.type.localeCompare(b.item.type);
        case 'rarity':
          return a.item.rarity.localeCompare(b.item.rarity);
        case 'name':
          return a.item.name.localeCompare(b.item.name);
        case 'value':
          return b.item.value - a.item.value; // Descending
        default:
          return 0;
      }
    });

    // Clear all slots
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i] = {
        item: null,
        quantity: 0,
        locked: false
      };
    }

    // Place sorted items back
    for (let i = 0; i < items.length && i < this.slots.length; i++) {
      this.slots[i] = items[i];
    }

    this.saveToStorage();
  }

  /**
   * Check if inventory is full
   */
  isFull(): boolean {
    return this.findEmptySlot() === -1;
  }

  /**
   * Get count of empty slots
   */
  getEmptySlotCount(): number {
    let count = 0;
    for (const slot of this.slots) {
      if (!slot.item) count++;
    }
    return count;
  }

  /**
   * Get total weight of all items
   */
  getTotalWeight(): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item) {
        total += slot.item.weight * slot.quantity;
      }
    }
    return total;
  }

  /**
   * Get total value of all items
   */
  getInventoryValue(): number {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.item) {
        total += slot.item.value * slot.quantity;
      }
    }
    return total + this.gold;
  }

  /**
   * Find first empty slot index
   * Returns -1 if no empty slots
   */
  private findEmptySlot(): number {
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].item) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Save inventory to localStorage
   */
  saveToStorage(): void {
    try {
      const data = {
        slots: this.slots,
        gold: this.gold
      };
      localStorage.setItem('game_inventory', JSON.stringify(data));
    } catch (e) {
      console.warn('[InventorySystem] Failed to save to localStorage:', e);
    }
  }

  /**
   * Load inventory from localStorage
   */
  loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('game_inventory');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.slots && Array.isArray(data.slots)) {
          // Validate and restore slots
          for (let i = 0; i < Math.min(data.slots.length, this.maxSlots); i++) {
            if (data.slots[i]) {
              this.slots[i] = data.slots[i];
            }
          }
        }
        if (typeof data.gold === 'number') {
          this.gold = data.gold;
        }
      }
    } catch (e) {
      console.warn('[InventorySystem] Failed to load from localStorage:', e);
    }
  }

  /**
   * Clear entire inventory (for testing/reset)
   */
  clearInventory(): void {
    for (let i = 0; i < this.slots.length; i++) {
      this.slots[i] = {
        item: null,
        quantity: 0,
        locked: false
      };
    }
    this.gold = 0;
    this.saveToStorage();
  }
}
