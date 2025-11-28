
import { GAME_CONSTANTS, Item, ItemType, Rarity } from '../utils/gameUtils';

export class InventorySystem {
  items: (Item | null)[];
  gold: number = 0;

  constructor() {
    this.items = new Array(GAME_CONSTANTS.INVENTORY_SIZE).fill(null);
    
    // Add some debug items
    this.addItem({
      id: 'sword_1', name: 'Rusty Blade', description: 'Old but sharp.', 
      type: ItemType.Weapon, rarity: Rarity.Common, icon: '🗡️', 
      quantity: 1, maxStack: 1, 
      stats: { attack: 5 } 
    });
    this.addItem({
      id: 'potion_1', name: 'Health Potion', description: 'Restores 50 HP.', 
      type: ItemType.Consumable, rarity: Rarity.Uncommon, icon: '🧪', 
      quantity: 3, maxStack: 10 
    });
    this.addItem({
      id: 'shield_1', name: 'Wooden Shield', description: 'Blocks weak attacks.', 
      type: ItemType.Armor, rarity: Rarity.Common, icon: '🛡️', 
      quantity: 1, maxStack: 1,
      stats: { defense: 3 }
    });
  }

  addItem(item: Item): boolean {
    // 1. Try to stack
    if (item.maxStack > 1) {
      for (let i = 0; i < this.items.length; i++) {
        const slot = this.items[i];
        if (slot && slot.id === item.id && slot.quantity < slot.maxStack) {
          const space = slot.maxStack - slot.quantity;
          const toAdd = Math.min(space, item.quantity);
          slot.quantity += toAdd;
          item.quantity -= toAdd;
          if (item.quantity <= 0) return true;
        }
      }
    }

    // 2. Find empty slot
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i] === null) {
        this.items[i] = { ...item }; // Clone to avoid ref issues
        return true;
      }
    }

    return false; // Inventory full
  }

  moveItem(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= this.items.length) return;
    if (toIndex < 0 || toIndex >= this.items.length) return;
    if (fromIndex === toIndex) return;

    const fromItem = this.items[fromIndex];
    const toItem = this.items[toIndex];

    this.items[toIndex] = fromItem;
    this.items[fromIndex] = toItem;
  }

  removeItem(index: number): Item | null {
    if (index < 0 || index >= this.items.length) return null;
    const item = this.items[index];
    this.items[index] = null;
    return item;
  }
}
