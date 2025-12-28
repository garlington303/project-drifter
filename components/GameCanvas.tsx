import React, { useEffect, useRef, useState } from 'react';
import { useInput } from '../hooks/useInput';
import { GAME_CONFIG } from '../constants';
import { Vec2 } from '../utils/vector';
import { PlayerState, CameraState, Particle, Vector2, Enemy, Projectile } from '../types';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useInput();
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  
  const playerRef = useRef<PlayerState>({
    position: Vec2.create(0, 0),
    velocity: Vec2.create(0, 0),
    radius: GAME_CONFIG.PLAYER.RADIUS,
    rotation: 0,
    health: GAME_CONFIG.PLAYER.MAX_HEALTH,
    maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
    shield: GAME_CONFIG.PLAYER.MAX_SHIELD,
    maxShield: GAME_CONFIG.PLAYER.MAX_SHIELD,
    shieldRegenTimer: 0,
    isDead: false,
  });
  
  const cameraRef = useRef<CameraState>({
    position: Vec2.create(0, 0),
    zoom: 1,
  });

  const shakeRef = useRef({ timer: 0, intensity: 0 });

  const mouseRef = useRef<Vector2>({ x: 0, y: 0 });
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const fireTimerRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  const resetGame = () => {
    playerRef.current = {
      position: Vec2.create(0, 0),
      velocity: Vec2.create(0, 0),
      radius: GAME_CONFIG.PLAYER.RADIUS,
      rotation: 0,
      health: GAME_CONFIG.PLAYER.MAX_HEALTH,
      maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
      shield: GAME_CONFIG.PLAYER.MAX_SHIELD,
      maxShield: GAME_CONFIG.PLAYER.MAX_SHIELD,
      shieldRegenTimer: 0,
      isDead: false,
    };
    
    cameraRef.current = {
      position: Vec2.create(0, 0),
      zoom: 1,
    };

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    
    spawnTimerRef.current = 0;
    fireTimerRef.current = 0;
    shakeRef.current = { timer: 0, intensity: 0 };
    lastTimeRef.current = performance.now();

    setGameOver(false);
    setPaused(false);
    pausedRef.current = false;
  };

  const spawnEnemy = () => {
    const player = playerRef.current;
    if (player.isDead) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = 900;
    const spawnPos = Vec2.add(player.position, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });

    const halfW = GAME_CONFIG.WORLD.WIDTH / 2 - 50;
    const halfH = GAME_CONFIG.WORLD.HEIGHT / 2 - 50;
    spawnPos.x = Math.max(-halfW, Math.min(halfW, spawnPos.x));
    spawnPos.y = Math.max(-halfH, Math.min(halfH, spawnPos.y));

    // Select Enemy Type
    const rand = Math.random();
    let type = GAME_CONFIG.ENEMY.TYPES.BASIC;
    
    if (rand > 0.85) {
      type = GAME_CONFIG.ENEMY.TYPES.HEAVY;
    } else if (rand > 0.60) {
      type = GAME_CONFIG.ENEMY.TYPES.FAST;
    }

    enemiesRef.current.push({
      id: Math.random(),
      position: spawnPos,
      radius: type.RADIUS,
      rotation: 0,
      speed: type.SPEED + Math.random() * 20, // Add slight variation
      health: type.HEALTH,
      maxHealth: type.HEALTH,
      color: type.COLOR,
      glowColor: type.GLOW_COLOR,
      damage: type.DAMAGE,
    });
  };

  const createExplosion = (pos: Vector2, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      particlesRef.current.push({
        id: Math.random(),
        position: { ...pos },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: color,
        size: 3 + Math.random() * 5,
      });
    }
  };

  const spawnTrail = (position: {x: number, y: number}, velocity: {x: number, y: number}, isSprinting: boolean) => {
    const speed = Vec2.mag(velocity);
    if (speed < 100) return;
    
    const multiplier = isSprinting ? 2.5 : 1.0;
    const chance = Math.min((speed / 1000) * multiplier, 0.9);
    if (Math.random() > chance) return;

    particlesRef.current.push({
      id: Math.random(),
      position: { ...position },
      velocity: Vec2.scale(Vec2.normalize(velocity), -70),
      life: isSprinting ? 1.0 : 0.8,
      maxLife: isSprinting ? 1.0 : 0.8,
      color: isSprinting ? '#fbbf24' : GAME_CONFIG.PLAYER.TRAIL_COLOR,
      size: GAME_CONFIG.PLAYER.RADIUS * (isSprinting ? 0.9 : 0.7),
    });
  };

  const update = (deltaTime: number, width: number, height: number) => {
    const input = inputRef.current;
    const player = playerRef.current;
    const camera = cameraRef.current;

    // --- Shake Update ---
    if (shakeRef.current.timer > 0) {
      shakeRef.current.timer = Math.max(0, shakeRef.current.timer - deltaTime);
    }

    if (player.isDead) {
      player.velocity = Vec2.scale(player.velocity, 0.9);
      player.position = Vec2.add(player.position, Vec2.scale(player.velocity, deltaTime));
      return;
    }

    // --- Shield Regeneration ---
    player.shieldRegenTimer += deltaTime;
    if (player.shieldRegenTimer >= GAME_CONFIG.PLAYER.SHIELD_REGEN_DELAY && player.shield < player.maxShield) {
      player.shield += GAME_CONFIG.PLAYER.SHIELD_REGEN_RATE * deltaTime;
      if (player.shield > player.maxShield) player.shield = player.maxShield;
    }

    // --- Spawning & Combat Timing ---
    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current >= GAME_CONFIG.ENEMY.SPAWN_INTERVAL) {
      spawnEnemy();
      spawnTimerRef.current = 0;
    }

    fireTimerRef.current += deltaTime;
    if (fireTimerRef.current >= GAME_CONFIG.WEAPON.FIRE_RATE) {
      const dirX = Math.cos(player.rotation);
      const dirY = Math.sin(player.rotation);
      projectilesRef.current.push({
        id: Math.random(),
        position: { 
          x: player.position.x + dirX * player.radius, 
          y: player.position.y + dirY * player.radius 
        },
        velocity: { 
          x: dirX * GAME_CONFIG.WEAPON.PROJECTILE_SPEED, 
          y: dirY * GAME_CONFIG.WEAPON.PROJECTILE_SPEED 
        },
        radius: GAME_CONFIG.WEAPON.PROJECTILE_RADIUS,
        life: 2.0,
      });
      fireTimerRef.current = 0;
    }

    // --- Input & Physics ---
    let moveDir = Vec2.create(0, 0);
    if (input.up) moveDir.y -= 1;
    if (input.down) moveDir.y += 1;
    if (input.left) moveDir.x -= 1;
    if (input.right) moveDir.x += 1;
    moveDir = Vec2.normalize(moveDir);

    const worldMouseX = mouseRef.current.x - width / 2 + camera.position.x;
    const worldMouseY = mouseRef.current.y - height / 2 + camera.position.y;
    const worldMouse = Vec2.create(worldMouseX, worldMouseY);
    const toMouse = Vec2.sub(worldMouse, player.position);
    const targetRotation = Math.atan2(toMouse.y, toMouse.x);
    let diff = targetRotation - player.rotation;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    player.rotation += diff * 0.25;

    const isSprinting = input.sprint;
    const acceleration = GAME_CONFIG.PLAYER.ACCELERATION * (isSprinting ? GAME_CONFIG.PLAYER.SPRINT_MULTIPLIER : 1);
    const maxSpeed = GAME_CONFIG.PLAYER.MAX_SPEED * (isSprinting ? GAME_CONFIG.PLAYER.SPRINT_MULTIPLIER : 1);
      
    player.velocity.x += moveDir.x * acceleration * deltaTime;
    player.velocity.y += moveDir.y * acceleration * deltaTime;
    const frictionFactor = Math.pow(GAME_CONFIG.PLAYER.FRICTION, deltaTime * 120); 
    player.velocity = Vec2.scale(player.velocity, frictionFactor);
    const currentSpeed = Vec2.mag(player.velocity);
    if (currentSpeed > maxSpeed) {
      player.velocity = Vec2.scale(Vec2.normalize(player.velocity), maxSpeed);
    }
    player.position = Vec2.add(player.position, Vec2.scale(player.velocity, deltaTime));

    // World Constraints
    const halfW = GAME_CONFIG.WORLD.WIDTH / 2;
    const halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    if (Math.abs(player.position.x) > halfW) {
      player.position.x = Math.sign(player.position.x) * halfW;
      player.velocity.x *= -0.5;
    }
    if (Math.abs(player.position.y) > halfH) {
      player.position.y = Math.sign(player.position.y) * halfH;
      player.velocity.y *= -0.5;
    }

    // --- Projectile Update ---
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const p = projectilesRef.current[i];
      p.life -= deltaTime;
      p.position.x += p.velocity.x * deltaTime;
      p.position.y += p.velocity.y * deltaTime;
      
      let removed = p.life <= 0;
      if (!removed) {
        // Collision with Enemies
        for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
          const e = enemiesRef.current[j];
          const dist = Vec2.dist(p.position, e.position);
          if (dist < p.radius + e.radius) {
            e.health -= GAME_CONFIG.WEAPON.DAMAGE;
            removed = true;
            createExplosion(p.position, GAME_CONFIG.WEAPON.PROJECTILE_COLOR, 3);
            if (e.health <= 0) {
              createExplosion(e.position, e.color, 15);
              enemiesRef.current.splice(j, 1);
            }
            break;
          }
        }
      }

      if (removed) {
        projectilesRef.current.splice(i, 1);
      }
    }

    // --- Enemies Update ---
    enemiesRef.current.forEach(enemy => {
      const toPlayer = Vec2.sub(player.position, enemy.position);
      const dist = Vec2.mag(toPlayer);
      const dir = Vec2.normalize(toPlayer);
      
      enemy.position.x += dir.x * enemy.speed * deltaTime;
      enemy.position.y += dir.y * enemy.speed * deltaTime;
      enemy.rotation = Math.atan2(dir.y, dir.x);

      // Player Collision / Damage
      if (dist < player.radius + enemy.radius) {
        const damage = enemy.damage * deltaTime;
        player.shieldRegenTimer = 0; // Reset regen on hit

        if (player.shield > 0) {
          player.shield -= damage;
          if (player.shield < 0) {
            player.health += player.shield; // shield is negative here, so subtraction happens
            player.shield = 0;
          }
        } else {
          player.health -= damage;
        }

        if (player.health <= 0 && !player.isDead) {
          player.health = 0;
          player.isDead = true;
          createExplosion(player.position, '#ffffff', 30);
          shakeRef.current = { timer: 0.5, intensity: 45 }; // Trigger death shake
          setGameOver(true);
        }
      }
    });

    spawnTrail(player.position, player.velocity, isSprinting);

    // Camera follow
    const cameraTarget = Vec2.add(player.position, Vec2.scale(player.velocity, 0.15));
    cameraRef.current.position = Vec2.lerp(
      cameraRef.current.position, 
      cameraTarget, 
      GAME_CONFIG.CAMERA.LERP_FACTOR
    );

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life -= deltaTime;
      p.position = Vec2.add(p.position, Vec2.scale(p.velocity, deltaTime));
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;
    const camera = cameraRef.current;
    const isSprinting = inputRef.current.sprint;

    ctx.fillStyle = GAME_CONFIG.WORLD.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Apply Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (shakeRef.current.timer > 0) {
      const t = shakeRef.current.timer;
      const currentIntensity = shakeRef.current.intensity * (t / 0.5); // Fade out
      shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
      shakeY = (Math.random() - 0.5) * 2 * currentIntensity;
    }
    ctx.translate(-(camera.position.x + shakeX), -(camera.position.y + shakeY));

    drawGrid(ctx, camera.position, width, height);

    // Arena Border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    const halfW = GAME_CONFIG.WORLD.WIDTH / 2;
    const halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    ctx.strokeRect(-halfW, -halfH, GAME_CONFIG.WORLD.WIDTH, GAME_CONFIG.WORLD.HEIGHT);

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Projectiles
    projectilesRef.current.forEach(p => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = GAME_CONFIG.WEAPON.PROJECTILE_COLOR;
      ctx.fillStyle = GAME_CONFIG.WEAPON.PROJECTILE_COLOR;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    let closestEnemyDist = Infinity;

    // Enemies
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(enemy.rotation);
      
      const distToPlayer = Vec2.dist(player.position, enemy.position);
      if (distToPlayer < closestEnemyDist) closestEnemyDist = distToPlayer;

      // High Intensity Warning (Pulsing outline when close)
      const warningDist = player.radius + enemy.radius + 60;
      if (distToPlayer < warningDist) {
        const pulse = (Math.sin(Date.now() / 80) + 1) / 2;
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.4})`; // Pulsing red
        ctx.lineWidth = 2 + pulse * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius + 6 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 10;
      ctx.shadowColor = enemy.glowColor;
      ctx.fillStyle = enemy.color;
      
      ctx.beginPath();
      ctx.moveTo(enemy.radius * 1.2, 0);
      ctx.lineTo(-enemy.radius, -enemy.radius * 0.8);
      ctx.lineTo(-enemy.radius, enemy.radius * 0.8);
      ctx.closePath();
      ctx.fill();
      
      // Health Bar for Enemy (if damaged)
      if (enemy.health < enemy.maxHealth) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(-enemy.radius, enemy.radius + 5, enemy.radius * 2, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-enemy.radius, enemy.radius + 5, (enemy.radius * 2) * (enemy.health / enemy.maxHealth), 4);
      }
      
      ctx.restore();
    });

    // Player
    if (!player.isDead || Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      ctx.rotate(player.rotation);

      if (!player.isDead && isSprinting && Vec2.mag(player.velocity) > 50) {
        ctx.save();
        const flicker = Math.random() * 0.5 + 0.5;
        ctx.shadowBlur = 15 * flicker;
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-player.radius * 0.4, 0);
        ctx.lineTo(-player.radius * (1.5 + flicker), -player.radius * 0.5);
        ctx.lineTo(-player.radius * (1.5 + flicker), player.radius * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Sprinting Hitbox Visual
        ctx.strokeStyle = `rgba(251, 191, 36, 0.4)`; // Amber
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 4, Date.now() / 100, (Math.PI * 2) + Date.now() / 100);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Danger Visual (if near enemy)
      if (!player.isDead && closestEnemyDist < 100) {
         const pulse = (Math.sin(Date.now() / 50) + 1) / 2;
         ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.5})`;
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(0, 0, player.radius + 8 + pulse * 2, 0, Math.PI * 2);
         ctx.stroke();
      }

      ctx.shadowBlur = isSprinting ? 35 : 20;
      ctx.shadowColor = player.isDead ? '#475569' : (isSprinting ? '#0ea5e9' : GAME_CONFIG.PLAYER.GLOW_COLOR);
      
      ctx.fillStyle = player.isDead ? '#64748b' : (isSprinting ? '#7dd3fc' : GAME_CONFIG.PLAYER.COLOR);
      ctx.beginPath();
      ctx.moveTo(player.radius * 1.4, 0); 
      ctx.lineTo(-player.radius, -player.radius); 
      ctx.lineTo(-player.radius * 0.4, 0); 
      ctx.lineTo(-player.radius, player.radius); 
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = player.isDead ? '#475569' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(player.radius * 0.6, 0);
      ctx.lineTo(-player.radius * 0.2, -player.radius * 0.3);
      ctx.lineTo(-player.radius * 0.2, player.radius * 0.3);
      ctx.closePath();
      ctx.fill();

      // Shield Visual
      if (player.shield > 1) {
        ctx.rotate(-player.rotation); 
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = GAME_CONFIG.PLAYER.SHIELD_GLOW;
        ctx.strokeStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + (player.shield / player.maxShield) * 0.4;
        
        ctx.beginPath();
        ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR;
        ctx.globalAlpha = 0.1;
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();
    }

    ctx.restore();

    // --- UI Layer ---
    drawHUD(ctx, width, height);
    // Draw mouse reticle only if playing and not paused
    if (!player.isDead && !pausedRef.current) drawMouseReticle(ctx);
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;
    
    // Status Bars
    const barWidth = 300;
    const barHeight = 16;
    const shieldHeight = 6;
    const gap = 4;
    const x = (width - barWidth) / 2;
    const y = 40;

    // Background Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(x - 4, y - shieldHeight - gap - 2, barWidth + 8, barHeight + shieldHeight + gap + 4);
    
    // Shield Bar (Top)
    const shieldPercent = player.shield / player.maxShield;
    const shieldFillWidth = barWidth * shieldPercent;
    
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)'; // Dim background for shield
    ctx.fillRect(x, y - shieldHeight - gap, barWidth, shieldHeight);
    
    ctx.fillStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR;
    ctx.shadowBlur = 5;
    ctx.shadowColor = GAME_CONFIG.PLAYER.SHIELD_GLOW;
    ctx.fillRect(x, y - shieldHeight - gap, shieldFillWidth, shieldHeight);
    ctx.shadowBlur = 0;

    // Health Bar (Bottom)
    const healthPercent = player.health / player.maxHealth;
    const fillWidth = barWidth * healthPercent;
    
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    gradient.addColorStop(0, '#ef4444');
    gradient.addColorStop(1, '#22c55e');
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Dim background for health
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, fillWidth, barHeight);

    if (player.isDead) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'red';
      ctx.fillText('GAME OVER', width / 2, height / 2);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, cameraPos: {x: number, y: number}, width: number, height: number) => {
    const size = GAME_CONFIG.WORLD.GRID_SIZE;
    const startX = Math.floor((cameraPos.x - width / 2) / size) * size;
    const endX = startX + width + size * 2;
    const startY = Math.floor((cameraPos.y - height / 2) / size) * size;
    const endY = startY + height + size * 2;

    ctx.strokeStyle = GAME_CONFIG.WORLD.GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += size) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += size) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
    ctx.moveTo(0, -30); ctx.lineTo(0, 30);
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawMouseReticle = (ctx: CanvasRenderingContext2D) => {
    const mouse = mouseRef.current;
    const isSprinting = inputRef.current.sprint;
    
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    
    ctx.strokeStyle = isSprinting ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowBlur = isSprinting ? 10 : 5;
    ctx.shadowColor = isSprinting ? '#fbbf24' : '#38bdf8';
    
    const s = isSprinting ? 16 : 12;
    const gap = 4;
    
    ctx.beginPath();
    ctx.moveTo(0, -gap); ctx.lineTo(0, -gap - s);
    ctx.moveTo(0, gap); ctx.lineTo(0, gap + s);
    ctx.moveTo(-gap, 0); ctx.lineTo(-gap - s, 0);
    ctx.moveTo(gap, 0); ctx.lineTo(gap + s, 0);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const loop = (time: number) => {
    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    const canvas = canvasRef.current;
    if (canvas) {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      
      if (!pausedRef.current) {
        update(deltaTime, canvas.width, canvas.height);
      }
      
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, canvas.height);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (!playerRef.current.isDead) {
          pausedRef.current = !pausedRef.current;
          setPaused(pausedRef.current);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    requestRef.current = requestAnimationFrame(loop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950">
      <canvas 
        ref={canvasRef} 
        onMouseMove={handleMouseMove}
        className={`block w-full h-full ${paused || gameOver ? 'cursor-default' : 'cursor-none'}`} 
      />
      {paused && !gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 pointer-events-none">
          <div className="text-white text-5xl font-bold tracking-widest border-4 border-white px-10 py-6 transform -skew-x-6 shadow-2xl">
            PAUSED
          </div>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="mt-24 pointer-events-auto">
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-sm shadow-lg hover:shadow-red-500/50 transition-all border border-red-400 cursor-pointer"
            >
              NEW GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
};