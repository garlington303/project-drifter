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
  
  // Feedback tracking
  const damageVignetteRef = useRef(0);
  
  // Game Mode State: 'idle' (automated instincts) or 'active' (direct hero control)
  const [gameMode, setGameMode] = useState<'idle' | 'active'>('idle');
  const gameModeRef = useRef<'idle' | 'active'>('idle');
  const isMouseDownRef = useRef(false);
  const prevDashInputRef = useRef(false);

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
    lastDamageTime: 0,
    xp: 0,
    maxXp: GAME_CONFIG.PROGRESSION.XP_BASE,
    level: 1,
    kills: 0,
    levelUpTimer: 0,
    targetId: null,
    retargetTimer: 0,
    aimError: 0,
    dashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
    maxDashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
    dashCooldownTimer: 0,
    isDashing: false,
    dashDurationTimer: 0,
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
  const globalTimeRef = useRef<number>(0);

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
      lastDamageTime: 0,
      xp: 0,
      maxXp: GAME_CONFIG.PROGRESSION.XP_BASE,
      level: 1,
      kills: 0,
      levelUpTimer: 0,
      targetId: null,
      retargetTimer: 0,
      aimError: 0,
      dashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
      maxDashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
      dashCooldownTimer: 0,
      isDashing: false,
      dashDurationTimer: 0,
    };
    
    cameraRef.current = {
      position: Vec2.create(0, 0),
      zoom: 1,
    };

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageVignetteRef.current = 0;
    
    spawnTimerRef.current = 0;
    fireTimerRef.current = 0;
    shakeRef.current = { timer: 0, intensity: 0 };
    lastTimeRef.current = performance.now();
    globalTimeRef.current = 0;
    
    setGameMode('idle');
    gameModeRef.current = 'idle';
    isMouseDownRef.current = false;
    prevDashInputRef.current = false;

    setGameOver(false);
    setPaused(false);
    pausedRef.current = false;
  };

  const spawnEnemy = () => {
    const player = playerRef.current;
    if (player.isDead) return;

    const minutesElapsed = globalTimeRef.current / 60;
    const speedMult = 1 + (globalTimeRef.current / 10) * GAME_CONFIG.SCALING.SPEED_INCREASE_RATE;

    const isCluster = Math.random() < 0.3 + (minutesElapsed * 0.1);
    const spawnCount = isCluster ? Math.floor(Math.random() * 2) + 2 : 1;

    const angle = Math.random() * Math.PI * 2;
    const distance = 900;
    const basePos = Vec2.add(player.position, {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    });

    const halfW = GAME_CONFIG.WORLD.WIDTH / 2 - 50;
    const halfH = GAME_CONFIG.WORLD.HEIGHT / 2 - 50;
    basePos.x = Math.max(-halfW, Math.min(halfW, basePos.x));
    basePos.y = Math.max(-halfH, Math.min(halfH, basePos.y));

    for (let i = 0; i < spawnCount; i++) {
        const offset = isCluster ? {
            x: (Math.random() - 0.5) * 100, 
            y: (Math.random() - 0.5) * 100
        } : { x: 0, y: 0 };
        
        let spawnPos = Vec2.add(basePos, offset);
        spawnPos.x = Math.max(-halfW, Math.min(halfW, spawnPos.x));
        spawnPos.y = Math.max(-halfH, Math.min(halfH, spawnPos.y));

        const rand = Math.random();
        let type = GAME_CONFIG.ENEMY.TYPES.BASIC;
        
        const heavyChance = 0.15 + (minutesElapsed * 0.05);
        const fastChance = 0.40 + (minutesElapsed * 0.05);

        if (rand > (1 - heavyChance)) {
            type = GAME_CONFIG.ENEMY.TYPES.HEAVY;
        } else if (rand > (1 - fastChance)) {
            type = GAME_CONFIG.ENEMY.TYPES.FAST;
        }

        enemiesRef.current.push({
            id: Math.random(),
            position: spawnPos,
            radius: type.RADIUS,
            rotation: 0,
            speed: (type.SPEED + Math.random() * 20) * speedMult,
            health: type.HEALTH,
            maxHealth: type.HEALTH,
            color: type.COLOR,
            glowColor: type.GLOW_COLOR,
            damage: type.DAMAGE,
            knockback: Vec2.create(0, 0),
            lastHitTime: 0,
            flashTimer: 0,
        });
    }
  };

  const createExplosion = (pos: Vector2, color: string, count: number = 8, spread: number = Math.PI * 2, direction: number = 0) => {
    for (let i = 0; i < count; i++) {
      const baseAngle = spread >= Math.PI * 2 ? 0 : direction - spread / 2;
      const angle = baseAngle + Math.random() * spread;
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

  const createSplatter = (pos: Vector2, direction: Vector2, color: string, count: number) => {
    const angleBase = Math.atan2(direction.y, direction.x);
    for (let i = 0; i < count; i++) {
      const angle = angleBase + (Math.random() - 0.5) * 0.8; 
      const speed = 300 + Math.random() * 500;
      particlesRef.current.push({
        id: Math.random(),
        position: { ...pos },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        color: color,
        size: 2 + Math.random() * 5,
        drag: 0.88,
      });
    }
  };

  const spawnTrail = (position: {x: number, y: number}, velocity: {x: number, y: number}, isDashing: boolean) => {
    const speed = Vec2.mag(velocity);
    if (speed < 100) return;
    const multiplier = isDashing ? 3.0 : 1.0;
    const chance = Math.min((speed / 1000) * multiplier, 0.9);
    if (Math.random() > chance) return;

    particlesRef.current.push({
      id: Math.random(),
      position: { ...position },
      velocity: Vec2.scale(Vec2.normalize(velocity), -70),
      life: isDashing ? 0.6 : 0.8,
      maxLife: isDashing ? 0.6 : 0.8,
      color: isDashing ? '#fbbf24' : GAME_CONFIG.PLAYER.TRAIL_COLOR,
      size: GAME_CONFIG.PLAYER.RADIUS * (isDashing ? 0.8 : 0.7),
    });
  };

  const handleLevelUp = () => {
    const player = playerRef.current;
    player.level++;
    player.xp -= player.maxXp;
    player.maxXp += GAME_CONFIG.PROGRESSION.XP_GROWTH;
    player.levelUpTimer = GAME_CONFIG.PLAYER.LEVEL_UP_FLASH_DURATION;
    
    player.health = Math.min(player.maxHealth, player.health + 20);
    player.shield = player.maxShield;
    
    createExplosion(player.position, '#fde047', 40);
    shakeRef.current = { timer: 0.3, intensity: 15 };
  };

  const handleEnemyDefeat = (enemy: Enemy) => {
    const player = playerRef.current;
    player.kills++;
    
    let xpGain = GAME_CONFIG.PROGRESSION.BASIC_XP;
    if (enemy.radius > 30) xpGain = GAME_CONFIG.PROGRESSION.HEAVY_XP;
    else if (enemy.speed > 300) xpGain = GAME_CONFIG.PROGRESSION.FAST_XP;
    
    player.xp += xpGain;
    if (player.xp >= player.maxXp) {
      handleLevelUp();
    }
    
    createExplosion(enemy.position, enemy.color, 15);
    if (playerRef.current.targetId === enemy.id) {
      playerRef.current.targetId = null;
      playerRef.current.retargetTimer = 0;
    }
  };

  const calculateAIMovement = (player: PlayerState, enemies: Enemy[]) => {
    const { AI_BEHAVIOR } = GAME_CONFIG;
    let moveDir = Vec2.create(0, 0);
    let wantsToDash = false;

    const nearby = enemies.filter(e => Vec2.dist(player.position, e.position) < AI_BEHAVIOR.DETECTION_RADIUS);

    if (nearby.length > 0) {
      let closestDist = Infinity;
      let closestEnemyPos = Vec2.create(0, 0);
      let centroid = Vec2.create(0, 0);

      nearby.forEach(e => {
        const d = Vec2.dist(player.position, e.position);
        if (d < closestDist) {
          closestDist = d;
          closestEnemyPos = e.position;
        }
        centroid = Vec2.add(centroid, e.position);
      });
      centroid = Vec2.scale(centroid, 1 / nearby.length);

      if (closestDist < AI_BEHAVIOR.CRITICAL_DISTANCE) {
        moveDir = Vec2.normalize(Vec2.sub(player.position, closestEnemyPos));
        wantsToDash = true;
      } else {
        const toPlayer = Vec2.sub(player.position, centroid);
        const distToCentroid = Vec2.mag(toPlayer);
        const awayFromCentroid = Vec2.normalize(toPlayer);
        const orbitDir = { x: -awayFromCentroid.y, y: awayFromCentroid.x };
        let radialWeight = 0;
        if (distToCentroid < AI_BEHAVIOR.PREFERRED_DISTANCE) {
          radialWeight = 0.6;
        } else if (distToCentroid > AI_BEHAVIOR.PREFERRED_DISTANCE * 1.5) {
          radialWeight = -0.3;
        }
        moveDir = Vec2.add(Vec2.scale(orbitDir, 1.0), Vec2.scale(awayFromCentroid, radialWeight));
        moveDir = Vec2.normalize(moveDir);
      }
    } else {
      const halfW = GAME_CONFIG.WORLD.WIDTH / 2;
      if (Vec2.mag(player.position) > halfW * 0.6) {
        moveDir = Vec2.normalize(Vec2.scale(player.position, -1));
      } else {
        const t = Date.now() / 1500;
        moveDir = { x: Math.cos(t) + Math.sin(t * 0.5) * 0.5, y: Math.sin(t) + Math.cos(t * 0.8) * 0.5 };
        moveDir = Vec2.normalize(moveDir);
      }
    }

    const halfW = GAME_CONFIG.WORLD.WIDTH / 2;
    const halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    const wallBuffer = AI_BEHAVIOR.WALL_BUFFER;
    let wallForce = Vec2.create(0, 0);
    if (player.position.x < -halfW + wallBuffer) wallForce.x += 1;
    if (player.position.x > halfW - wallBuffer) wallForce.x -= 1;
    if (player.position.y < -halfH + wallBuffer) wallForce.y += 1;
    if (player.position.y > halfH - wallBuffer) wallForce.y -= 1;
    if (Vec2.mag(wallForce) > 0) moveDir = Vec2.normalize(Vec2.add(moveDir, Vec2.scale(Vec2.normalize(wallForce), 2.0)));
    return { moveDir, wantsToDash };
  };

  const update = (deltaTime: number, width: number, height: number) => {
    const input = inputRef.current;
    const player = playerRef.current;
    const camera = cameraRef.current;
    globalTimeRef.current += deltaTime;

    damageVignetteRef.current = Math.max(0, damageVignetteRef.current - deltaTime * GAME_CONFIG.FEEDBACK.VIGNETTE_DECAY);
    if (player.lastDamageTime > 0) player.lastDamageTime = Math.max(0, player.lastDamageTime - deltaTime);
    if (player.levelUpTimer > 0) player.levelUpTimer = Math.max(0, player.levelUpTimer - deltaTime);

    if (shakeRef.current.timer > 0) shakeRef.current.timer = Math.max(0, shakeRef.current.timer - deltaTime);

    if (player.isDead) {
      player.velocity = Vec2.scale(player.velocity, 0.9);
      player.position = Vec2.add(player.position, Vec2.scale(player.velocity, deltaTime));
      return;
    }

    player.shieldRegenTimer += deltaTime;
    if (player.shieldRegenTimer >= GAME_CONFIG.PLAYER.SHIELD_REGEN_DELAY && player.shield < player.maxShield) {
      player.shield += GAME_CONFIG.PLAYER.SHIELD_REGEN_RATE * deltaTime;
      if (player.shield > player.maxShield) player.shield = player.maxShield;
    }

    if (player.dashCharges < player.maxDashCharges) {
      player.dashCooldownTimer -= deltaTime;
      if (player.dashCooldownTimer <= 0) {
        player.dashCharges++;
        player.dashCooldownTimer = player.dashCharges < player.maxDashCharges ? GAME_CONFIG.PLAYER.DASH_COOLDOWN : 0;
      }
    }

    const currentSpawnInterval = Math.max(
      GAME_CONFIG.SCALING.MIN_SPAWN_INTERVAL,
      GAME_CONFIG.ENEMY.SPAWN_INTERVAL - (globalTimeRef.current / 10) * GAME_CONFIG.SCALING.SPAWN_REDUCTION_RATE
    );

    spawnTimerRef.current += deltaTime;
    if (spawnTimerRef.current >= currentSpawnInterval) {
      spawnEnemy();
      spawnTimerRef.current = 0;
    }

    player.retargetTimer -= deltaTime;
    if (player.targetId !== null) {
      const target = enemiesRef.current.find(e => e.id === player.targetId);
      if (!target || Vec2.dist(player.position, target.position) > GAME_CONFIG.AUTO_AIM.SCAN_RADIUS * 1.2) player.targetId = null;
    }

    if (gameModeRef.current === 'idle') {
      if (player.retargetTimer <= 0 || player.targetId === null) {
        player.retargetTimer = GAME_CONFIG.AUTO_AIM.RETARGET_INTERVAL;
        const candidates = enemiesRef.current.filter(e => Vec2.dist(player.position, e.position) < GAME_CONFIG.AUTO_AIM.SCAN_RADIUS);
        if (candidates.length > 0) {
          let bestScore = -Infinity;
          let bestTargetId = null;
          candidates.forEach(c => {
            const dist = Vec2.dist(player.position, c.position);
            const neighbors = candidates.filter(n => n.id !== c.id && Vec2.dist(c.position, n.position) < 250).length;
            const distScore = 1 - Math.min(dist / GAME_CONFIG.AUTO_AIM.SCAN_RADIUS, 1);
            const score = distScore + (Math.min(neighbors, 4) / 4 * GAME_CONFIG.AUTO_AIM.CLUSTER_WEIGHT);
            if (score > bestScore) { bestScore = score; bestTargetId = c.id; }
          });
          player.targetId = bestTargetId;
        } else player.targetId = null;
      }

      if (player.targetId !== null) {
        const target = enemiesRef.current.find(e => e.id === player.targetId);
        if (target) {
          const toTarget = Vec2.sub(target.position, player.position);
          let targetAngle = Math.atan2(toTarget.y, toTarget.x);
          player.aimError = player.aimError * 0.9 + (Math.random() - 0.5) * 0.1; 
          const noisyAngle = targetAngle + (Math.sin(Date.now() / 1000) * 0.4 + player.aimError) * GAME_CONFIG.AUTO_AIM.AIM_INACCURACY;
          let diff = noisyAngle - player.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const turnAmount = GAME_CONFIG.AUTO_AIM.TURN_SPEED * deltaTime;
          player.rotation += Math.abs(diff) < turnAmount ? diff : Math.sign(diff) * turnAmount;
        }
      }
    }

    fireTimerRef.current += deltaTime;
    if (fireTimerRef.current >= GAME_CONFIG.WEAPON.FIRE_RATE) {
      if ((gameModeRef.current === 'idle' && player.targetId !== null) || (gameModeRef.current === 'active' && isMouseDownRef.current)) {
        const dirX = Math.cos(player.rotation), dirY = Math.sin(player.rotation);
        projectilesRef.current.push({
          id: Math.random(),
          position: { x: player.position.x + dirX * player.radius, y: player.position.y + dirY * player.radius },
          velocity: { x: dirX * GAME_CONFIG.WEAPON.PROJECTILE_SPEED, y: dirY * GAME_CONFIG.WEAPON.PROJECTILE_SPEED },
          radius: GAME_CONFIG.WEAPON.PROJECTILE_RADIUS,
          life: 2.0,
        });
        fireTimerRef.current = 0;
      }
    }

    let moveDir = Vec2.create(0, 0), attemptDash = false;
    if (gameModeRef.current === 'active') {
        if (input.up) moveDir.y -= 1; if (input.down) moveDir.y += 1;
        if (input.left) moveDir.x -= 1; if (input.right) moveDir.x += 1;
        moveDir = Vec2.normalize(moveDir);
        if (input.dash && !prevDashInputRef.current) attemptDash = true;
        const worldMouseX = mouseRef.current.x - width / 2 + camera.position.x;
        const worldMouseY = mouseRef.current.y - height / 2 + camera.position.y;
        const toMouse = Vec2.sub({ x: worldMouseX, y: worldMouseY }, player.position);
        let diff = Math.atan2(toMouse.y, toMouse.x) - player.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
        player.rotation += diff * 0.25;
    } else {
        const aiState = calculateAIMovement(player, enemiesRef.current);
        moveDir = aiState.moveDir; attemptDash = aiState.wantsToDash;
    }
    prevDashInputRef.current = input.dash;

    if (player.isDashing) {
      player.dashDurationTimer -= deltaTime;
      if (player.dashDurationTimer <= 0) { player.isDashing = false; player.velocity = Vec2.scale(player.velocity, 0.5); }
    } else if (attemptDash && player.dashCharges > 0) {
      player.dashCharges--; if (player.dashCooldownTimer <= 0) player.dashCooldownTimer = GAME_CONFIG.PLAYER.DASH_COOLDOWN;
      player.isDashing = true; player.dashDurationTimer = GAME_CONFIG.PLAYER.DASH_DURATION;
      const dashDir = Vec2.mag(moveDir) === 0 ? { x: Math.cos(player.rotation), y: Math.sin(player.rotation) } : moveDir;
      player.velocity = Vec2.scale(dashDir, GAME_CONFIG.PLAYER.DASH_SPEED);
      shakeRef.current = { timer: 0.1, intensity: 5 };
      spawnTrail(player.position, player.velocity, true);
    }

    if (!player.isDashing) {
      player.velocity.