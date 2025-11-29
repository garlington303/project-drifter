/**
 * Item System - Comprehensive item framework for RPG mechanics
 */

export enum ItemType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  CONSUMABLE = 'CONSUMABLE',
  MATERIAL = 'MATERIAL',
  QUEST = 'QUEST',
  CURRENCY = 'CURRENCY'
}

export enum ItemRarity {
  COMMON = 'COMMON',         // Gray
  UNCOMMON = 'UNCOMMON',     // Green
  RARE = 'RARE',             // Blue
  EPIC = 'EPIC',             // Purple
  LEGENDARY = 'LEGENDARY'    // Orange/Gold
}

export enum EquipmentSlotType {
  WEAPON = 'WEAPON',
  OFFHAND = 'OFFHAND',
  HELMET = 'HELMET',
  CHEST = 'CHEST',
  LEGS = 'LEGS',
  BOOTS = 'BOOTS',
  GLOVES = 'GLOVES',
  ACCESSORY = 'ACCESSORY'
}

export interface Item {
  id: string;                // Unique item ID (e.g., "iron_sword_01")
  name: string;              // Display name
  description: string;       // Flavor text / info
  type: ItemType;
  rarity: ItemRarity;

  // Visual
  icon: string;              // Emoji or color for now
  color: string;             // Hex color for icon background

  // Properties
  stackable: boolean;        // Can multiple exist in one slot?
  maxStack: number;          // Max stack size (if stackable)
  value: number;             // Sell/trade value
  weight: number;            // Optional: for weight limit system

  // Stats (for equipment)
  attackBonus?: number;      // Weapons
  defenseBonus?: number;     // Armor
  healthRestore?: number;    // Consumables
  speedBonus?: number;       // Speed buff

  // Equipment
  equipSlot?: EquipmentSlotType;

  // Metadata
  droppable: boolean;        // Can be dropped in world?
  tradeable: boolean;        // Can be traded?
  questItem: boolean;        // Important quest item?
}

// Rarity color mapping
export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: '#6b7280',      // gray
  [ItemRarity.UNCOMMON]: '#10b981',    // green
  [ItemRarity.RARE]: '#3b82f6',        // blue
  [ItemRarity.EPIC]: '#8b5cf6',        // purple
  [ItemRarity.LEGENDARY]: '#f59e0b'    // gold
};

// Item Database - 30 sample items
export const ITEM_DATABASE: Record<string, Item> = {
  // ===== WEAPONS (8 items) =====
  rusty_sword: {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    description: 'An old, weathered blade. Better than nothing.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    icon: '🗡️',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: false,
    maxStack: 1,
    value: 5,
    weight: 3,
    attackBonus: 2,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A reliable iron blade. Standard equipment for warriors.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    icon: '⚔️',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: false,
    maxStack: 1,
    value: 15,
    weight: 4,
    attackBonus: 5,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'Forged from quality steel. Sharp and well-balanced.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    icon: '⚔️',
    color: RARITY_COLORS[ItemRarity.UNCOMMON],
    stackable: false,
    maxStack: 1,
    value: 35,
    weight: 4,
    attackBonus: 8,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  knights_blade: {
    id: 'knights_blade',
    name: "Knight's Blade",
    description: 'A masterwork sword carried by elite knights.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    icon: '⚔️',
    color: RARITY_COLORS[ItemRarity.RARE],
    stackable: false,
    maxStack: 1,
    value: 80,
    weight: 5,
    attackBonus: 12,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  dragon_slayer: {
    id: 'dragon_slayer',
    name: 'Dragon Slayer',
    description: 'A legendary blade said to have slain dragons. Radiates power.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.EPIC,
    icon: '🗡️',
    color: RARITY_COLORS[ItemRarity.EPIC],
    stackable: false,
    maxStack: 1,
    value: 200,
    weight: 6,
    attackBonus: 18,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  wooden_bow: {
    id: 'wooden_bow',
    name: 'Wooden Bow',
    description: 'A simple hunting bow. Good for beginners.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.COMMON,
    icon: '🏹',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: false,
    maxStack: 1,
    value: 10,
    weight: 2,
    attackBonus: 3,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  hunting_bow: {
    id: 'hunting_bow',
    name: 'Hunting Bow',
    description: 'A well-crafted bow used by experienced hunters.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    icon: '🏹',
    color: RARITY_COLORS[ItemRarity.UNCOMMON],
    stackable: false,
    maxStack: 1,
    value: 30,
    weight: 2,
    attackBonus: 6,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  crossbow: {
    id: 'crossbow',
    name: 'Crossbow',
    description: 'A powerful mechanical bow. High damage, slow reload.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.RARE,
    icon: '🏹',
    color: RARITY_COLORS[ItemRarity.RARE],
    stackable: false,
    maxStack: 1,
    value: 75,
    weight: 5,
    attackBonus: 10,
    equipSlot: EquipmentSlotType.WEAPON,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  // ===== ARMOR (8 items) =====
  cloth_tunic: {
    id: 'cloth_tunic',
    name: 'Cloth Tunic',
    description: 'Basic cloth clothing. Provides minimal protection.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    icon: '👕',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: false,
    maxStack: 1,
    value: 5,
    weight: 1,
    defenseBonus: 1,
    equipSlot: EquipmentSlotType.CHEST,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  leather_armor: {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Flexible leather protection. Good for mobility.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    icon: '🦺',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: false,
    maxStack: 1,
    value: 20,
    weight: 3,
    defenseBonus: 3,
    equipSlot: EquipmentSlotType.CHEST,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  chainmail: {
    id: 'chainmail',
    name: 'Chainmail',
    description: 'Interlocking metal rings. Solid protection.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    icon: '🦺',
    color: RARITY_COLORS[ItemRarity.UNCOMMON],
    stackable: false,
    maxStack: 1,
    value: 50,
    weight: 8,
    defenseBonus: 6,
    equipSlot: EquipmentSlotType.CHEST,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  iron_plate: {
    id: 'iron_plate',
    name: 'Iron Plate Armor',
    description: 'Heavy iron plates. Excellent defense, reduced mobility.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    icon: '🛡️',
    color: RARITY_COLORS[ItemRarity.RARE],
    stackable: false,
    maxStack: 1,
    value: 100,
    weight: 15,
    defenseBonus: 10,
    equipSlot: EquipmentSlotType.CHEST,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  steel_helmet: {
    id: 'steel_helmet',
    name: 'Steel Helmet',
    description: 'A sturdy steel helmet. Protects your head.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    icon: '⛑️',
    color: RARITY_COLORS[ItemRarity.UNCOMMON],
    stackable: false,
    maxStack: 1,
    value: 40,
    weight: 4,
    defenseBonus: 4,
    equipSlot: EquipmentSlotType.HELMET,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  iron_shield: {
    id: 'iron_shield',
    name: 'Iron Shield',
    description: 'A solid iron shield. Blocks incoming attacks.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.UNCOMMON,
    icon: '🛡️',
    color: RARITY_COLORS[ItemRarity.UNCOMMON],
    stackable: false,
    maxStack: 1,
    value: 45,
    weight: 6,
    defenseBonus: 5,
    equipSlot: EquipmentSlotType.OFFHAND,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  knights_gauntlets: {
    id: 'knights_gauntlets',
    name: "Knight's Gauntlets",
    description: 'Armored gloves worn by knights. Reinforced knuckles.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.RARE,
    icon: '🧤',
    color: RARITY_COLORS[ItemRarity.RARE],
    stackable: false,
    maxStack: 1,
    value: 70,
    weight: 3,
    defenseBonus: 7,
    attackBonus: 2,
    equipSlot: EquipmentSlotType.GLOVES,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  dragon_scale_armor: {
    id: 'dragon_scale_armor',
    name: 'Dragon Scale Armor',
    description: 'Crafted from dragon scales. Light yet incredibly strong.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.EPIC,
    icon: '🛡️',
    color: RARITY_COLORS[ItemRarity.EPIC],
    stackable: false,
    maxStack: 1,
    value: 250,
    weight: 10,
    defenseBonus: 15,
    equipSlot: EquipmentSlotType.CHEST,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  // ===== CONSUMABLES (6 items) =====
  small_health_potion: {
    id: 'small_health_potion',
    name: 'Small Health Potion',
    description: 'Restores a small amount of health.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    icon: '🧪',
    color: '#dc2626',
    stackable: true,
    maxStack: 10,
    value: 10,
    weight: 0.5,
    healthRestore: 25,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores a moderate amount of health.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    icon: '🧪',
    color: '#dc2626',
    stackable: true,
    maxStack: 10,
    value: 25,
    weight: 0.5,
    healthRestore: 50,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  large_health_potion: {
    id: 'large_health_potion',
    name: 'Large Health Potion',
    description: 'Restores a large amount of health.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    icon: '🧪',
    color: '#dc2626',
    stackable: true,
    maxStack: 10,
    value: 60,
    weight: 0.5,
    healthRestore: 100,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  antidote: {
    id: 'antidote',
    name: 'Antidote',
    description: 'Cures poison and restores 15 health.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    icon: '💊',
    color: '#16a34a',
    stackable: true,
    maxStack: 5,
    value: 15,
    weight: 0.3,
    healthRestore: 15,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  stamina_elixir: {
    id: 'stamina_elixir',
    name: 'Stamina Elixir',
    description: 'Restores stamina and provides a speed boost.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.UNCOMMON,
    icon: '⚗️',
    color: '#eab308',
    stackable: true,
    maxStack: 5,
    value: 20,
    weight: 0.5,
    speedBonus: 50,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  elixir_of_strength: {
    id: 'elixir_of_strength',
    name: 'Elixir of Strength',
    description: 'Temporarily increases attack damage.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.RARE,
    icon: '⚗️',
    color: '#ef4444',
    stackable: true,
    maxStack: 3,
    value: 50,
    weight: 0.5,
    attackBonus: 10,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  // ===== MATERIALS (8 items) =====
  wood: {
    id: 'wood',
    name: 'Wood',
    description: 'Common lumber. Used for crafting and building.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '🪵',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: true,
    maxStack: 99,
    value: 1,
    weight: 2,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  stone: {
    id: 'stone',
    name: 'Stone',
    description: 'Rough stone. Used in construction.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '🪨',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: true,
    maxStack: 99,
    value: 1,
    weight: 3,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    description: 'Raw iron ore. Can be smelted into iron ingots.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '⛏️',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: true,
    maxStack: 50,
    value: 3,
    weight: 4,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  leather_scraps: {
    id: 'leather_scraps',
    name: 'Leather Scraps',
    description: 'Pieces of leather. Used in leatherworking.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '🦴',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: true,
    maxStack: 50,
    value: 2,
    weight: 0.5,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  cloth: {
    id: 'cloth',
    name: 'Cloth',
    description: 'Bolts of fabric. Used for tailoring.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    icon: '🧵',
    color: RARITY_COLORS[ItemRarity.COMMON],
    stackable: true,
    maxStack: 99,
    value: 1,
    weight: 0.5,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  ruby: {
    id: 'ruby',
    name: 'Ruby',
    description: 'A precious red gemstone. Valuable.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    icon: '💎',
    color: '#dc2626',
    stackable: true,
    maxStack: 20,
    value: 25,
    weight: 0.1,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  emerald: {
    id: 'emerald',
    name: 'Emerald',
    description: 'A precious green gemstone. Very valuable.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.RARE,
    icon: '💎',
    color: '#10b981',
    stackable: true,
    maxStack: 20,
    value: 30,
    weight: 0.1,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  diamond: {
    id: 'diamond',
    name: 'Diamond',
    description: 'The hardest gemstone. Extremely valuable.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.EPIC,
    icon: '💎',
    color: '#60a5fa',
    stackable: true,
    maxStack: 10,
    value: 100,
    weight: 0.1,
    droppable: true,
    tradeable: true,
    questItem: false
  },

  // ===== CURRENCY =====
  gold_coin: {
    id: 'gold_coin',
    name: 'Gold Coin',
    description: 'Standard currency. Accepted everywhere.',
    type: ItemType.CURRENCY,
    rarity: ItemRarity.COMMON,
    icon: '🪙',
    color: '#f59e0b',
    stackable: true,
    maxStack: 999,
    value: 1,
    weight: 0.01,
    droppable: true,
    tradeable: true,
    questItem: false
  }
};

// Helper function to get item by ID
export function getItem(itemId: string): Item | null {
  return ITEM_DATABASE[itemId] || null;
}

// Helper function to create a new item instance (for loot drops, etc.)
export function createItem(itemId: string): Item | null {
  const template = ITEM_DATABASE[itemId];
  if (!template) return null;

  // Return a copy to avoid mutating the database
  return { ...template };
}
