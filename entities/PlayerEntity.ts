
import { Vector2D, Vec2, Rect, GAME_CONSTANTS } from '../utils/gameUtils';
import { InputSystem } from '../systems/InputSystem';
import { MouseState } from '../systems/MouseSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { WorldSystem } from '../systems/WorldSystem';
import { EquipmentSystem } from '../systems/EquipmentSystem';

export class PlayerEntity {
  pos: Vector2D;
  velocity: Vector2D;
  size: number = 32; 
  
  // Rotation
  rotation: number = 0;        
  targetRotation: number = 0;  
  rotationSpeed: number = 12.0; 

  // RPG Stats
  level: number = 1;
  currentHealth: number = GAME_CONSTANTS.PLAYER_BASE_HP;
  maxHealth: number = GAME_CONSTANTS.PLAYER_BASE_HP;
  baseAttack: number = GAME_CONSTANTS.PLAYER_BASE_ATK;
  baseDefense: number = GAME_CONSTANTS.PLAYER_BASE_DEF;
  
  // Movement Stats
  baseSpeed: number = 300;
  sprintMultiplier: number = 1.6;
  
  // Dash
  isDashing: boolean = false;
  dashSpeed: number = 900;
  dashDuration: number = 0.2; 
  dashTimer: number = 0;
  maxDashCharges: number = 2;
  dashCharges: number = 2;
  dashRechargeTime: number = 1.5;
  dashRechargeTimer: number = 0;
  dashDebounceTimer: number = 0;

  // Combat
  fireRate: number = 0.12; 
  fireTimer: number = 0;
  muzzleOffset: number = 28; 

  constructor(startX: number, startY: number) {
    this.pos = { x: startX, y: startY };
    this.velocity = { x: 0, y: 0 };
  }

  update(dt: number, input: InputSystem, mouse: MouseState, projectileSystem: ProjectileSystem, worldSystem: WorldSystem, equipment: EquipmentSystem) {
    // 0. Update derived stats from equipment
    const bonus = equipment.getTotalBonusStats();
    // (In a real game, you wouldn't recalc this every frame, but it's cheap enough for now)
    // We could store effective stats and update only when equipment changes.

    // 1. Rotation
    const dx = mouse.worldX - this.pos.x;
    const dy = mouse.worldY - this.pos.y;
    this.targetRotation = Math.atan2(dy, dx);
    let angleDiff = this.targetRotation - this.rotation;
    while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.rotation += angleDiff * this.rotationSpeed * dt;

    // 2. Combat
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (input.keys.mouseDown && this.fireTimer <= 0) {
      this.shoot(projectileSystem);
    }

    // 3. Dash Charging
    if (this.dashCharges < this.maxDashCharges) {
        this.dashRechargeTimer += dt;
        if (this.dashRechargeTimer >= this.dashRechargeTime) {
            this.dashCharges++;
            this.dashRechargeTimer = 0;
        }
    }
    if (this.dashDebounceTimer > 0) this.dashDebounceTimer -= dt;

    // 4. Movement Logic
    let desiredVelocity = Vec2.zero();

    if (this.isDashing) {
      this.dashTimer -= dt;
      desiredVelocity = this.velocity;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        desiredVelocity = Vec2.zero();
      }
    } else {
      if (input.keys.space && this.dashCharges > 0 && this.dashDebounceTimer <= 0) {
        const moveDir = input.getMovementVector();
        if (Vec2.mag(moveDir) > 0) {
          this.startDash(moveDir);
          return; 
        }
      }

      const moveDir = input.getMovementVector();
      let currentSpeed = this.baseSpeed + (bonus.speed || 0); // Apply equipment speed
      if (input.keys.shift) currentSpeed *= this.sprintMultiplier;
      desiredVelocity = Vec2.scale(moveDir, currentSpeed);
    }

    // 5. Sliding Collision
    let nextX = this.pos.x + desiredVelocity.x * dt;
    let nextY = this.pos.y; 
    
    // Check X
    if (worldSystem.checkCollision(this.getBounds(nextX, nextY))) {
        desiredVelocity.x = 0;
    } else {
        this.pos.x = nextX;
    }

    nextX = this.pos.x;
    nextY = this.pos.y + desiredVelocity.y * dt;

    // Check Y
    if (worldSystem.checkCollision(this.getBounds(nextX, nextY))) {
        desiredVelocity.y = 0;
    } else {
        this.pos.y = nextY;
    }

    this.velocity = desiredVelocity;
  }

  getBounds(x: number, y: number): Rect {
    return {
        x: x - this.size / 2,
        y: y - this.size / 2,
        width: this.size,
        height: this.size
    };
  }

  shoot(projectileSystem: ProjectileSystem) {
    const muzzleX = this.pos.x + Math.cos(this.rotation) * this.muzzleOffset;
    const muzzleY = this.pos.y + Math.sin(this.rotation) * this.muzzleOffset;
    projectileSystem.spawn(muzzleX, muzzleY, this.rotation);
    this.fireTimer = this.fireRate;
  }

  startDash(dir: Vector2D) {
    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCharges--;
    this.dashDebounceTimer = 0.2;
    this.velocity = Vec2.scale(dir, this.dashSpeed);
    if (this.dashCharges === this.maxDashCharges - 1) {
        this.dashRechargeTimer = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);

    ctx.shadowBlur = 15;
    ctx.shadowColor = this.isDashing ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.4)';
    
    // Body
    ctx.fillStyle = this.isDashing ? '#60a5fa' : '#3b82f6'; 
    ctx.fillRect(-16, -16, 32, 32);

    // Gun
    ctx.fillStyle = '#e5e5e5'; 
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(24, 0);
    ctx.lineTo(10, 8);
    ctx.fill();

    // Recoil
    if (this.fireTimer > this.fireRate * 0.5) {
      ctx.fillStyle = '#ef4444'; 
      ctx.fillRect(12, -4, 8, 8);
    } else {
       ctx.fillStyle = '#1e3a8a';
       ctx.fillRect(16, -4, 12, 8);
    }

    // Shoulders
    ctx.fillStyle = '#1e40af'; 
    ctx.fillRect(-12, -12, 8, 24);

    if (this.isDashing) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
       ctx.fillRect(-24, -12, 8, 24);
    }
    ctx.restore();
  }
}
