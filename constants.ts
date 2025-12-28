export const GAME_CONFIG = {
  PLAYER: {
    RADIUS: 14,
    ACCELERATION: 2800,
    FRICTION: 0.94,
    MAX_SPEED: 550,
    SPRINT_MULTIPLIER: 1.6,
    COLOR: '#38bdf8',
    GLOW_COLOR: '#0ea5e9',
    TRAIL_COLOR: 'rgba(56, 189, 248, 0.15)',
    MAX_HEALTH: 100,
    MAX_SHIELD: 50,
    SHIELD_REGEN_DELAY: 3.0, // Seconds without damage before regen
    SHIELD_REGEN_RATE: 20, // Shield points per second
    SHIELD_COLOR: '#7dd3fc', // Sky-300
    SHIELD_GLOW: '#0284c7', // Sky-600
  },
  WEAPON: {
    FIRE_RATE: 0.15, // seconds between shots
    PROJECTILE_SPEED: 900,
    PROJECTILE_RADIUS: 4,
    PROJECTILE_COLOR: '#fde047', // Yellow-300
    DAMAGE: 1,
  },
  ENEMY: {
    SPAWN_INTERVAL: 1.2,
    TYPES: {
      BASIC: {
        RADIUS: 18,
        SPEED: 180,
        HEALTH: 3,
        COLOR: '#f87171', // Red-400
        GLOW_COLOR: '#ef4444',
        DAMAGE: 35,
      },
      FAST: {
        RADIUS: 14,
        SPEED: 340,
        HEALTH: 1,
        COLOR: '#fbbf24', // Amber-400
        GLOW_COLOR: '#f59e0b',
        DAMAGE: 20,
      },
      HEAVY: {
        RADIUS: 32,
        SPEED: 90,
        HEALTH: 12,
        COLOR: '#c084fc', // Purple-400
        GLOW_COLOR: '#a855f7',
        DAMAGE: 50,
      }
    }
  },
  WORLD: {
    GRID_SIZE: 60,
    GRID_COLOR: '#1e293b',
    BACKGROUND_COLOR: '#020617',
    WIDTH: 2400,
    HEIGHT: 2400,
  },
  CAMERA: {
    LERP_FACTOR: 0.08,
  }
};