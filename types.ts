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
  sprint: boolean;
}

export interface Particle {
  id: number;
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}