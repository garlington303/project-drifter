
import { EquipmentSlot, Item, ItemStats } from '../utils/gameUtils';

export class EquipmentSystem {
  slots: Record<EquipmentSlot, Item | null> = {
    [EquipmentSlot.MainHand]: null,
    [EquipmentSlot.OffHand]: null,
    [EquipmentSlot.Head]: null,
    [EquipmentSlot.Chest]: null,
    [EquipmentSlot.Legs]: null,
    [EquipmentSlot.Boots]: null,
    [EquipmentSlot.Gloves]: null,
    [EquipmentSlot.Accessory]: null,
  };

  equip(item: Item, slot: EquipmentSlot): Item | null {
    const unequipped = this.slots[slot];
    this.slots[slot] = item;
    return unequipped;
  }

  unequip(slot: EquipmentSlot): Item | null {
    const item = this.slots[slot];
    this.slots[slot] = null;
    return item;
  }

  getTotalBonusStats(): ItemStats {
    const total: ItemStats = { attack: 0, defense: 0, speed: 0, health: 0 };
    Object.values(this.slots).forEach(item => {
      if (item && item.stats) {
        if (item.stats.attack) total.attack = (total.attack || 0) + item.stats.attack;
        if (item.stats.defense) total.defense = (total.defense || 0) + item.stats.defense;
        if (item.stats.speed) total.speed = (total.speed || 0) + item.stats.speed;
        if (item.stats.health) total.health = (total.health || 0) + item.stats.health;
      }
    });
    return total;
  }
}
