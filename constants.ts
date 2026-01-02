
export const GAME_CONFIG = {
  PLAYER: {
    RADIUS: 14,
    ACCELERATION: 2800,
    FRICTION: 0.94,
    MAX_SPEED: 550,
    // Dash Configuration
    DASH_SPEED: 1500,
    DASH_DURATION: 0.2, // Seconds the dash "active" state lasts
    DASH_COOLDOWN: 1.5, // Seconds to regenerate 1 charge
    MAX_DASH_CHARGES: 3,
    
    COLOR: '#38bdf8',
    GLOW_COLOR: '#0ea5e9',
    TRAIL_COLOR: 'rgba(56, 189, 248, 0.15)',
    MAX_HEALTH: 100,
    MAX_SHIELD: 50,
    SHIELD_REGEN_DELAY: 3.0, // Seconds without damage before regen
    SHIELD_REGEN_RATE: 20, // Shield points per second
    SHIELD_COLOR: '#7dd3fc', // Sky-300
    SHIELD_GLOW: '#0284c7', // Sky-600
    HIT_FLASH_DURATION: 0.15,
    LEVEL_UP_FLASH_DURATION: 0.5,
  },
  PROGRESSION: {
    XP_BASE: 100,
    XP_GROWTH: 50,
    BASIC_XP: 15,
    FAST_XP: 25,
    HEAVY_XP: 100,
  },
  SKILL_CONFIG: {
    kinetic_overload: { MAX: 5, BONUS: 0.20 },
    shield_regen: { MAX: 5, BONUS: 0.15 },
    dash_boost: { MAX: 3, BONUS: 1 },
    scatter_shot: { MAX: 2, BONUS: 1.0 }, // Rank 1: Unlock, Rank 2: 1.0s CD reduction
  },
  DASH_ATTACK: {
    DAMAGE: 25, 
    KNOCKBACK_FORCE: 1800, 
    KNOCKBACK_FRICTION: 0.96, 
    HIT_COOLDOWN: 0.2, 
    IMPACT_SHAKE: 8, 
    WALL_IMPACT_DAMAGE: 15,
    WALL_IMPACT_THRESHOLD: 400,
  },
  SCATTER_SHOT: {
    COOLDOWN: 2.5,
    COUNT: 6,
    SPREAD: 0.6, // Radians (~35 degrees)
    SPEED: 1100,
    LIFE: 0.35, // Short range
    DAMAGE: 8,
    COLOR: '#c084fc', // Purple
    RECOIL: 400,
    // Charge Mechanics
    MAX_CHARGE_TIME: 1.2, // Seconds to full charge
    MIN_CHARGE_THRESHOLD: 0.15, // Minimum hold to fire at all (prevents accidental taps)
    CHARGE_MOVE_SPEED_PENALTY: 0.5, // Player moves at 50% speed while charging
    MAX_DAMAGE_MULTIPLIER: 2.5, // 2.5x damage at full charge
    MAX_COUNT_ADDITION: 6, // +6 projectiles at full charge
    MAX_SIZE_MULTIPLIER: 2.0, // Projectiles are twice as big
  },
  FEEDBACK: {
    ENEMY_HIT_FLASH: 0.1, // Duration in seconds
    VIGNETTE_DECAY: 4.0,   // How fast the damage vignette fades
    HIT_STOP_MS: 30,       // Very brief pause on impact (optional logic)
  },
  AUTO_AIM: {
    SCAN_RADIUS: 800,
    RETARGET_INTERVAL: 2.5, 
    TURN_SPEED: 8.0, 
    CLUSTER_WEIGHT: 0.4, 
    AIM_INACCURACY: 0.35, 
    ERROR_CORRECTION_SPEED: 1.5, 
  },
  AI_BEHAVIOR: {
    DETECTION_RADIUS: 700,
    PREFERRED_DISTANCE: 400, 
    CRITICAL_DISTANCE: 200, 
    WALL_BUFFER: 300, 
  },
  SCALING: {
    MIN_SPAWN_INTERVAL: 0.4,
    SPAWN_REDUCTION_RATE: 0.05, // Reduction per 10 seconds
    SPEED_INCREASE_RATE: 0.02,   // Speed multiplier per 10 seconds
    PRESSURE_CYCLE_TIME: 60,     // Seconds for one full gauge cycle
  },
  WEAPON: {
    FIRE_RATE: 0.15, 
    PROJECTILE_SPEED: 900,
    PROJECTILE_RADIUS: 4,
    PROJECTILE_COLOR: '#fde047', 
    DAMAGE: 10, 
  },
  ENEMY: {
    SPAWN_INTERVAL: 1.2,
    TYPES: {
      BASIC: {
        RADIUS: 18,
        SPEED: 180,
        HEALTH: 30, 
        COLOR: '#f87171', 
        GLOW_COLOR: '#ef4444',
        DAMAGE: 35,
        XP: 15,
      },
      FAST: {
        RADIUS: 14,
        SPEED: 340,
        HEALTH: 15, 
        COLOR: '#fbbf24', 
        GLOW_COLOR: '#f59e0b',
        DAMAGE: 20,
        XP: 25,
      },
      HEAVY: {
        RADIUS: 32,
        SPEED: 90,
        HEALTH: 120, 
        COLOR: '#c084fc', 
        GLOW_COLOR: '#a855f7',
        DAMAGE: 50,
        XP: 100,
      }
    }
  },
  WORLD: {
    GRID_SIZE: 60,
    GRID_COLOR: '#3d512a', // Neutral grass shading grid
    BACKGROUND_COLOR: '#2e3d20', // Neutral moss/grass dark base
    WIDTH: 2400,
    HEIGHT: 2400,
  },
  CAMERA: {
    LERP_FACTOR: 0.08,
  }
};
