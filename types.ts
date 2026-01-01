export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  rotation: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  shieldRegenTimer: number;
  isDead: boolean;
  lastDamageTime: number; // For hit feedback
  // Progression
  xp: number;
  maxXp: number;
  level: number;
  kills: number;
  levelUpTimer: number; // For level up feedback
  // Auto-aim state
  targetId: number | null;
  retargetTimer: number;
  aimError: number;
  // Dash state
  dashCharges: number;
  maxDashCharges: number;
  dashCooldownTimer: number; // Time until next charge
  isDashing: boolean;
  dashDurationTimer: number; // Duration of the active dash move
}

export interface Enemy {
  id: number;
  position: Vector2;
  radius: number;
  rotation: number;
  speed: number;
  health: number;
  maxHealth: number;
  color: string;
  glowColor: string;
  damage: number;
  // Physics & State
  knockback: Vector2;
  lastHitTime: number;
  flashTimer: number; // For hit feedback
}

export interface Projectile {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  life: number;
}

export interface CameraState {
  position: Vector2;
  zoom: number;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dash: boolean;
}

export interface Particle {
  id: number;
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  drag?: number;
}