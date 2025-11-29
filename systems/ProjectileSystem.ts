
import { TILE_DEFS } from '../utils/gameUtils';
import { WorldSystem } from './WorldSystem';

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     
  maxLife: number;  
}

export class ProjectileSystem {
  projectiles: Projectile[] = [];
  defaultSpeed: number = 1500;
  defaultLife: number = 2.0; 

  spawn(x: number, y: number, angle: number, speedOverride?: number) {
    const speed = speedOverride || this.defaultSpeed;
    this.projectiles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: this.defaultLife,
      maxLife: this.defaultLife
    });
  }

  update(dt: number, worldSystem: WorldSystem) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Check collision
      const tile = worldSystem.getTileAt(p.x, p.y);
      const def = TILE_DEFS[tile];

      // Destroy if hitting a solid wall/obstacle
      if (!def.passable) {
          p.life = 0;
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fbbf24'; 
    ctx.fillStyle = '#fef3c7';   

    for (const p of this.projectiles) {
      ctx.beginPath();
      const trailLength = 20; 
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const nx = p.vx / speed;
      const ny = p.vy / speed;

      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - nx * trailLength, p.y - ny * trailLength);
      
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
