
export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum TileType {
  Grass = 0,
  Wall = 1,      // Generic obstacle (Rock/Tree)
  Water = 2,     // Lake/River
  Bedrock = 3,   // Void/Outer Darkness
  Road = 4,      // Dirt path
  Forest = 5,    // Dense vegetation (Passable)
  DeepForest = 6,// Impassable dense vegetation
  Cliff = 7,     // Rock Containment Wall
  DeepWater = 8, // Ocean/Boundary water
  Sand = 9       // Shore/Beach
}

export interface TileDef {
  id: TileType;
  passable: boolean;
  color: string; // Base hex color (fallback)
  label: string;
  speedCost: number; // 1.0 = normal, >1.0 = slow
  texture?: string; // Key corresponding to AssetLoader keys
}

export const TILE_DEFS: Record<TileType, TileDef> = {
  [TileType.Grass]: { id: TileType.Grass, passable: true, color: '#15803d', label: 'Grass', speedCost: 1.0, texture: 'grass' },
  [TileType.Wall]: { id: TileType.Wall, passable: false, color: '#4b5563', label: 'Rock', speedCost: 0, texture: 'stone' },
  [TileType.Water]: { id: TileType.Water, passable: false, color: '#3b82f6', label: 'Water', speedCost: 0, texture: 'water' },
  [TileType.Bedrock]: { id: TileType.Bedrock, passable: false, color: '#09090b', label: 'Void', speedCost: 0, texture: 'stone' }, // Tinted dark in renderer
  [TileType.Road]: { id: TileType.Road, passable: true, color: '#b45309', label: 'Road', speedCost: 0.8, texture: 'dirt' },
  [TileType.Forest]: { id: TileType.Forest, passable: true, color: '#166534', label: 'Forest', speedCost: 1.2, texture: 'grass' }, // Grass base + overlay
  [TileType.DeepForest]: { id: TileType.DeepForest, passable: false, color: '#052e16', label: 'Thicket', speedCost: 0, texture: 'grass' }, // Grass base + overlay
  [TileType.Cliff]: { id: TileType.Cliff, passable: false, color: '#374151', label: 'Cliff', speedCost: 0, texture: 'stone' },
  [TileType.DeepWater]: { id: TileType.DeepWater, passable: false, color: '#1e3a8a', label: 'Deep Water', speedCost: 0, texture: 'water' },
  [TileType.Sand]: { id: TileType.Sand, passable: true, color: '#fde047', label: 'Sand', speedCost: 1.1, texture: 'sand' },
};

// --- RPG DATA STRUCTURES ---

export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary'
}

export enum ItemType {
  Weapon = 'weapon',
  Armor = 'armor',
  Consumable = 'consumable',
  Material = 'material'
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  speed?: number;
  health?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  icon: string; // Emoji or asset path
  quantity: number;
  maxStack: number;
  stats?: ItemStats;
  slot?: EquipmentSlot; // If wearable
}

export enum EquipmentSlot {
  MainHand = 'mainHand',
  OffHand = 'offHand',
  Head = 'head',
  Chest = 'chest',
  Legs = 'legs',
  Boots = 'boots',
  Gloves = 'gloves',
  Accessory = 'accessory'
}

export const GAME_CONSTANTS = {
  INVENTORY_SIZE: 20,
  PLAYER_BASE_HP: 100,
  PLAYER_BASE_ATK: 10,
  PLAYER_BASE_DEF: 5
};

// --- VECTOR UTILS ---

export const Vec2 = {
  zero: (): Vector2D => ({ x: 0, y: 0 }),
  add: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  scale: (v: Vector2D, s: number): Vector2D => ({ x: v.x * s, y: v.y * s }),
  mag: (v: Vector2D): number => Math.sqrt(v.x * v.x + v.y * v.y),
  normalize: (v: Vector2D): Vector2D => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },
  lerp: (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
  },
  lerpVec: (v1: Vector2D, v2: Vector2D, t: number): Vector2D => ({
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
  }),
  dist: (v1: Vector2D, v2: Vector2D): number => {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

export const checkAABB = (r1: Rect, r2: Rect): boolean => {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
};

export const GAME_CONFIG = {
  tileSize: 64,
  chunkSize: 16,
  worldRadiusChunks: 6, 
};
