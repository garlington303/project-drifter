
import React, { useEffect, useRef, useState } from 'react';
import { useInput } from '../hooks/useInput';
import { GAME_CONFIG } from '../constants';
import { Vec2 } from '../utils/vector';
import { PlayerState, CameraState, Particle, Vector2, Enemy, Projectile } from '../types';
import { VirtualJoystick } from './VirtualJoystick';
import { SkillPanel } from './SkillPanel';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useInput();
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const pausedRef = useRef(false);
  
  // Joystick State refs
  const leftStickRef = useRef({ x: 0, y: 0, active: false });
  const rightStickRef = useRef({ x: 0, y: 0, active: false });
  const dashBtnRef = useRef(false);
  const abilityBtnRef = useRef(false);
  
  // Feedback tracking
  const damageVignetteRef = useRef(0);
  const hitStopTimerRef = useRef(0); // Tracks freeze frame duration in seconds
  
  // Game Mode State: 'idle' (automated instincts) or 'active' (direct hero control)
  const [gameMode, setGameMode] = useState<'idle' | 'active'>('idle');
  const gameModeRef = useRef<'idle' | 'active'>('idle');
  const isMouseDownRef = useRef(false);
  const isRightMouseDownRef = useRef(false);
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
    isLevelUpActive: false,
    damageMultiplier: 1,
    shieldRegenMultiplier: 1,
    targetId: null,
    retargetTimer: 0,
    aimError: 0,
    dashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
    maxDashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
    dashCooldownTimer: 0,
    isDashing: false,
    dashDurationTimer: 0,
    isScatterShotUnlocked: false,
    scatterShotTimer: 0,
    isChargingScatter: false,
    scatterChargeTimer: 0,
    skillLevels: {
      kinetic_overload: 0,
      shield_regen: 0,
      dash_boost: 0,
      scatter_shot: 0,
    },
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
      isLevelUpActive: false,
      damageMultiplier: 1,
      shieldRegenMultiplier: 1,
      targetId: null,
      retargetTimer: 0,
      aimError: 0,
      dashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
      maxDashCharges: GAME_CONFIG.PLAYER.MAX_DASH_CHARGES,
      dashCooldownTimer: 0,
      isDashing: false,
      dashDurationTimer: 0,
      isScatterShotUnlocked: false,
      scatterShotTimer: 0,
      isChargingScatter: false,
      scatterChargeTimer: 0,
      skillLevels: {
        kinetic_overload: 0,
        shield_regen: 0,
        dash_boost: 0,
        scatter_shot: 0,
      },
    };
    
    cameraRef.current = {
      position: Vec2.create(0, 0),
      zoom: 1,
    };

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    damageVignetteRef.current = 0;
    hitStopTimerRef.current = 0;
    
    spawnTimerRef.current = 0;
    fireTimerRef.current = 0;
    shakeRef.current = { timer: 0, intensity: 0 };
    lastTimeRef.current = performance.now();
    globalTimeRef.current = 0;
    
    setGameMode('idle');
    gameModeRef.current = 'idle';
    isMouseDownRef.current = false;
    isRightMouseDownRef.current = false;
    prevDashInputRef.current = false;

    setGameOver(false);
    setPaused(false);
    setIsLevelingUp(false);
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
        let typeConfig = GAME_CONFIG.ENEMY.TYPES.BASIC;
        let typeKey: 'basic' | 'fast' | 'heavy' = 'basic';
        
        const heavyChance = 0.15 + (minutesElapsed * 0.05);
        const fastChance = 0.40 + (minutesElapsed * 0.05);

        if (rand > (1 - heavyChance)) {
            typeConfig = GAME_CONFIG.ENEMY.TYPES.HEAVY;
            typeKey = 'heavy';
        } else if (rand > (1 - fastChance)) {
            typeConfig = GAME_CONFIG.ENEMY.TYPES.FAST;
            typeKey = 'fast';
        }

        enemiesRef.current.push({
            id: Math.random(),
            type: typeKey,
            position: spawnPos,
            radius: typeConfig.RADIUS,
            rotation: 0,
            speed: (typeConfig.SPEED + Math.random() * 20) * speedMult,
            health: typeConfig.HEALTH,
            maxHealth: typeConfig.HEALTH,
            color: typeConfig.COLOR,
            glowColor: typeConfig.GLOW_COLOR,
            damage: typeConfig.DAMAGE,
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

  const spawnGatheringParticle = (target: Vector2, color: string) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 30;
    const pos = {
      x: target.x + Math.cos(angle) * dist,
      y: target.y + Math.sin(angle) * dist
    };
    
    // Velocity towards center
    const speed = 150;
    const vel = {
        x: -Math.cos(angle) * speed,
        y: -Math.sin(angle) * speed
    };

    particlesRef.current.push({
        id: Math.random(),
        position: pos,
        velocity: vel,
        life: 0.3, // Short life to reach center roughly
        maxLife: 0.3,
        color: color,
        size: 2,
    });
  };

  const handleLevelUp = () => {
    const player = playerRef.current;
    player.level++;
    player.xp -= player.maxXp;
    player.maxXp += GAME_CONFIG.PROGRESSION.XP_GROWTH;
    player.levelUpTimer = GAME_CONFIG.PLAYER.LEVEL_UP_FLASH_DURATION;
    player.isLevelUpActive = true;
    
    player.health = Math.min(player.maxHealth, player.health + 20);
    player.shield = player.maxShield;
    
    createExplosion(player.position, '#fde047', 40);
    shakeRef.current = { timer: 0.3, intensity: 15 };
    
    // Trigger React State for UI
    setIsLevelingUp(true);
  };

  const handleSkillSelect = (skillId: string) => {
    const player = playerRef.current;
    const config = (GAME_CONFIG.SKILL_CONFIG as any)[skillId];
    const currentLevel = player.skillLevels[skillId] || 0;
    const maxLevel = config?.MAX || 5;

    if (currentLevel >= maxLevel) {
      player.isLevelUpActive = false;
      setIsLevelingUp(false);
      return;
    }

    // Increment Rank
    player.skillLevels[skillId] = currentLevel + 1;
    
    switch (skillId) {
      case 'kinetic_overload':
        player.damageMultiplier += config.BONUS;
        break;
      case 'shield_regen':
        player.shieldRegenMultiplier += config.BONUS;
        break;
      case 'dash_boost':
        player.maxDashCharges += config.BONUS;
        player.dashCharges += config.BONUS;
        break;
      case 'scatter_shot':
        player.isScatterShotUnlocked = true;
        break;
    }
    
    player.isLevelUpActive = false;
    setIsLevelingUp(false);
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

  const fireScatterShot = (chargeRatio: number) => {
      const player = playerRef.current;
      const { SCATTER_SHOT, SKILL_CONFIG } = GAME_CONFIG;
      
      const baseAngle = player.rotation;
      
      // Charge Modifiers
      // Count: Base + up to 6 more
      const totalCount = SCATTER_SHOT.COUNT + Math.floor(chargeRatio * SCATTER_SHOT.MAX_COUNT_ADDITION);
      // Damage: Base * Multiplier (1.0 to 2.5)
      const dmgMult = 1.0 + (chargeRatio * (SCATTER_SHOT.MAX_DAMAGE_MULTIPLIER - 1.0));
      // Size: 3 to 6
      const size = 3 * (1 + chargeRatio * (SCATTER_SHOT.MAX_SIZE_MULTIPLIER - 1.0));
      // Spread: Tightens slightly at max charge? No, let's keep it chaotic but wider
      const spread = SCATTER_SHOT.SPREAD * (1 + chargeRatio * 0.2); 

      const startAngle = baseAngle - spread / 2;
      const angleStep = spread / (totalCount - 1);

      for (let i = 0; i < totalCount; i++) {
          const angle = startAngle + (angleStep * i) + (Math.random() - 0.5) * 0.15;
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);
          
          const speedVar = 0.9 + Math.random() * 0.2; // 90-110% speed variance

          projectilesRef.current.push({
              id: Math.random(),
              position: { x: player.position.x + dirX * player.radius, y: player.position.y + dirY * player.radius },
              velocity: { x: dirX * SCATTER_SHOT.SPEED * speedVar, y: dirY * SCATTER_SHOT.SPEED * speedVar },
              radius: size, 
              life: SCATTER_SHOT.LIFE * (1 + chargeRatio * 0.5), // Lives longer if charged
              color: chargeRatio > 0.8 ? '#f0abfc' : SCATTER_SHOT.COLOR, // Lighter purple at max charge
              damage: SCATTER_SHOT.DAMAGE * dmgMult
          });
      }

      // Calculate effective cooldown: Base - (RankBonus if Rank 2)
      // Cooldown increases slightly if fully charged to balance? Let's keep it flat for now, feels better.
      const rankBonus = player.skillLevels['scatter_shot'] >= 2 ? SKILL_CONFIG.scatter_shot.BONUS : 0;
      player.scatterShotTimer = SCATTER_SHOT.COOLDOWN - rankBonus;
      
      const shakeAmt = 12 + (chargeRatio * 18); // 12 to 30 shake
      shakeRef.current = { timer: 0.2, intensity: shakeAmt };
      
      // Recoil
      const recoilForce = SCATTER_SHOT.RECOIL * (1 + chargeRatio);
      player.velocity = Vec2.sub(player.velocity, Vec2.scale({x: Math.cos(baseAngle), y: Math.sin(baseAngle)}, recoilForce));
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
    const player = playerRef.current;
    
    // Freeze logic for Level Up and Hit Stop
    if (player.isLevelUpActive) return;

    if (hitStopTimerRef.current > 0) {
      hitStopTimerRef.current -= deltaTime;
      if (hitStopTimerRef.current < 0) hitStopTimerRef.current = 0;
      return; 
    }

    const input = inputRef.current;
    const camera = cameraRef.current;
    globalTimeRef.current += deltaTime;

    // Decay visual timers
    damageVignetteRef.current = Math.max(0, damageVignetteRef.current - deltaTime * GAME_CONFIG.FEEDBACK.VIGNETTE_DECAY);
    if (player.lastDamageTime > 0) player.lastDamageTime = Math.max(0, player.lastDamageTime - deltaTime);
    if (player.levelUpTimer > 0) player.levelUpTimer = Math.max(0, player.levelUpTimer - deltaTime);

    if (shakeRef.current.timer > 0) shakeRef.current.timer = Math.max(0, shakeRef.current.timer - deltaTime);

    if (player.isDead) {
      player.velocity = Vec2.scale(player.velocity, 0.9);
      player.position = Vec2.add(player.position, Vec2.scale(player.velocity, deltaTime));
      return;
    }
    
    if (player.scatterShotTimer > 0) {
        player.scatterShotTimer = Math.max(0, player.scatterShotTimer - deltaTime);
    }

    // Shield Regen
    player.shieldRegenTimer += deltaTime;
    if (player.shieldRegenTimer >= GAME_CONFIG.PLAYER.SHIELD_REGEN_DELAY && player.shield < player.maxShield) {
      player.shield += GAME_CONFIG.PLAYER.SHIELD_REGEN_RATE * player.shieldRegenMultiplier * deltaTime;
      if (player.shield > player.maxShield) player.shield = player.maxShield;
    }

    // Dash Charge
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

    // Firing Logic (Primary)
    fireTimerRef.current += deltaTime;
    const isJoystickFiring = rightStickRef.current.active && (Math.pow(rightStickRef.current.x, 2) + Math.pow(rightStickRef.current.y, 2)) > 0.4;
    
    if (fireTimerRef.current >= GAME_CONFIG.WEAPON.FIRE_RATE) {
      if ((gameModeRef.current === 'idle' && player.targetId !== null) || 
          (gameModeRef.current === 'active' && (isMouseDownRef.current || isJoystickFiring))) {
        const dirX = Math.cos(player.rotation), dirY = Math.sin(player.rotation);
        projectilesRef.current.push({
          id: Math.random(),
          position: { x: player.position.x + dirX * player.radius, y: player.position.y + dirY * player.radius },
          velocity: { x: dirX * GAME_CONFIG.WEAPON.PROJECTILE_SPEED, y: dirY * GAME_CONFIG.WEAPON.PROJECTILE_SPEED },
          radius: GAME_CONFIG.WEAPON.PROJECTILE_RADIUS,
          life: 2.0,
          color: GAME_CONFIG.WEAPON.PROJECTILE_COLOR,
          damage: GAME_CONFIG.WEAPON.DAMAGE
        });
        fireTimerRef.current = 0;
      }
    }

    let moveDir = Vec2.create(0, 0), attemptDash = false;
    
    // Process Inputs
    const dashInput = input.dash || dashBtnRef.current;
    
    // CHARGED ABILITY LOGIC (SCATTER SHOT)
    const abilityHeld = abilityBtnRef.current || isRightMouseDownRef.current;

    // Check if we start charging
    if (abilityHeld && player.isScatterShotUnlocked && player.scatterShotTimer <= 0) {
        player.isChargingScatter = true;
        player.scatterChargeTimer += deltaTime;
        if (player.scatterChargeTimer > GAME_CONFIG.SCATTER_SHOT.MAX_CHARGE_TIME) {
            player.scatterChargeTimer = GAME_CONFIG.SCATTER_SHOT.MAX_CHARGE_TIME;
        }
        
        // Spawn "gathering" particles
        if (Math.random() < 0.3) {
            spawnGatheringParticle(player.position, GAME_CONFIG.SCATTER_SHOT.COLOR);
        }

    } else {
        // We are NOT holding the button
        if (player.isChargingScatter) {
            // RELEASED!
            const chargeRatio = player.scatterChargeTimer / GAME_CONFIG.SCATTER_SHOT.MAX_CHARGE_TIME;
            
            // Only fire if held long enough to be intentional
            if (chargeRatio > GAME_CONFIG.SCATTER_SHOT.MIN_CHARGE_THRESHOLD) {
                fireScatterShot(chargeRatio);
            } else {
                // Too short, just reset or treat as tap
                // Treat as min charge tap
                fireScatterShot(0);
            }
            
            // Reset State
            player.isChargingScatter = false;
            player.scatterChargeTimer = 0;
        }
    }

    // Joystick Move Logic
    if (leftStickRef.current.active) {
        moveDir.x = leftStickRef.current.x;
        moveDir.y = leftStickRef.current.y;
        if (gameModeRef.current === 'idle') {
           setGameMode('active');
           gameModeRef.current = 'active';
        }
    } else {
        // Keyboard Move Logic
        if (input.up) moveDir.y -= 1; if (input.down) moveDir.y += 1;
        if (input.left) moveDir.x -= 1; if (input.right) moveDir.x += 1;
    }
    
    if (gameModeRef.current === 'active') {
        moveDir = Vec2.normalize(moveDir);
        
        if (dashInput && !prevDashInputRef.current) attemptDash = true;

        // Rotation Logic (Mouse or Joystick)
        if (rightStickRef.current.active) {
            const { x, y } = rightStickRef.current;
            if (x*x + y*y > 0.04) { // Deadzone
               player.rotation = Math.atan2(y, x);
            }
        } else {
            // Mouse (Adjusted for Zoom)
            const worldMouseX = (mouseRef.current.x - width / 2) / camera.zoom + camera.position.x;
            const worldMouseY = (mouseRef.current.y - height / 2) / camera.zoom + camera.position.y;
            
            const toMouse = Vec2.sub({ x: worldMouseX, y: worldMouseY }, player.position);
            let diff = Math.atan2(toMouse.y, toMouse.x) - player.rotation;
            while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
            player.rotation += diff * 0.25;
        }

    } else {
        const aiState = calculateAIMovement(player, enemiesRef.current);
        moveDir = aiState.moveDir; attemptDash = aiState.wantsToDash;
    }
    prevDashInputRef.current = dashInput;

    if (player.isDashing) {
      player.dashDurationTimer -= deltaTime;
      if (player.dashDurationTimer <= 0) { player.isDashing = false; player.velocity = Vec2.scale(player.velocity, 0.5); }
    } else if (attemptDash && player.dashCharges > 0) {
      player.dashCharges--; if (player.dashCooldownTimer <= 0) player.dashCooldownTimer = GAME_CONFIG.PLAYER.DASH_COOLDOWN;
      player.isDashing = true; player.dashDurationTimer = GAME_CONFIG.PLAYER.DASH_DURATION;
      const dashDir = Vec2.mag(moveDir) === 0 ? { x: Math.cos(player.rotation), y: Math.sin(player.rotation) } : moveDir;
      player.velocity = Vec2.scale(dashDir, GAME_CONFIG.PLAYER.DASH_SPEED);
      // Cancel Charge if dashing
      player.isChargingScatter = false;
      player.scatterChargeTimer = 0;
      shakeRef.current = { timer: 0.1, intensity: 5 };
      spawnTrail(player.position, player.velocity, true);
    }

    if (!player.isDashing) {
      let speed = GAME_CONFIG.PLAYER.ACCELERATION;
      let maxSpeed = GAME_CONFIG.PLAYER.MAX_SPEED;
      
      // Charge penalty
      if (player.isChargingScatter) {
          speed *= GAME_CONFIG.SCATTER_SHOT.CHARGE_MOVE_SPEED_PENALTY;
          maxSpeed *= GAME_CONFIG.SCATTER_SHOT.CHARGE_MOVE_SPEED_PENALTY;
      }
      
      player.velocity.x += moveDir.x * speed * deltaTime;
      player.velocity.y += moveDir.y * speed * deltaTime;
      player.velocity = Vec2.scale(player.velocity, Math.pow(GAME_CONFIG.PLAYER.FRICTION, deltaTime * 120));
      if (Vec2.mag(player.velocity) > maxSpeed) player.velocity = Vec2.scale(Vec2.normalize(player.velocity), maxSpeed);
    } else player.velocity = Vec2.scale(player.velocity, Math.pow(0.98, deltaTime * 120));
    
    player.position = Vec2.add(player.position, Vec2.scale(player.velocity, deltaTime));

    const halfW = GAME_CONFIG.WORLD.WIDTH / 2, halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    if (Math.abs(player.position.x) > halfW) { player.position.x = Math.sign(player.position.x) * halfW; player.velocity.x *= -0.5; }
    if (Math.abs(player.position.y) > halfH) { player.position.y = Math.sign(player.position.y) * halfH; player.velocity.y *= -0.5; }

    // Projectile Update
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
      const p = projectilesRef.current[i];
      p.life -= deltaTime; p.position.x += p.velocity.x * deltaTime; p.position.y += p.velocity.y * deltaTime;
      let removed = p.life <= 0;
      if (!removed) {
        for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
          const e = enemiesRef.current[j];
          if (Vec2.dist(p.position, e.position) < p.radius + e.radius) {
            // Apply Damage Multiplier
            e.health -= p.damage * player.damageMultiplier;
            
            e.flashTimer = GAME_CONFIG.FEEDBACK.ENEMY_HIT_FLASH;
            removed = true;
            createExplosion(p.position, p.color, 3);
            
            // Hit Stop Trigger
            hitStopTimerRef.current = GAME_CONFIG.FEEDBACK.HIT_STOP_MS / 1000;

            if (e.health <= 0) {
              handleEnemyDefeat(e);
              enemiesRef.current.splice(j, 1);
            }
            break;
          }
        }
      }
      if (removed) projectilesRef.current.splice(i, 1);
    }

    // Enemies Update
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      if (enemy.flashTimer > 0) enemy.flashTimer -= deltaTime;

      const knockbackSpeed = Vec2.mag(enemy.knockback);
      if (knockbackSpeed > 50) {
        enemy.position = Vec2.add(enemy.position, Vec2.scale(enemy.knockback, deltaTime));
        enemy.knockback = Vec2.scale(enemy.knockback, Math.pow(GAME_CONFIG.DASH_ATTACK.KNOCKBACK_FRICTION, deltaTime * 60));
        enemy.rotation += knockbackSpeed * 0.05 * deltaTime; 
      } else {
        const dir = Vec2.normalize(Vec2.sub(player.position, enemy.position));
        enemy.position.x += dir.x * enemy.speed * deltaTime; enemy.position.y += dir.y * enemy.speed * deltaTime;
        enemy.rotation = Math.atan2(dir.y, dir.x);
      }

      // World Boundary Collision with Ricochet
      const halfW = GAME_CONFIG.WORLD.WIDTH / 2;
      const halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
      const wallRestitution = 0.6; // Bounciness factor
      const impactThreshold = GAME_CONFIG.DASH_ATTACK.WALL_IMPACT_THRESHOLD; 
      
      let hitWall = false;

      // X Boundaries
      if (enemy.position.x < -halfW + enemy.radius) {
        enemy.position.x = -halfW + enemy.radius;
        if (enemy.knockback.x < 0) {
          if (Math.abs(enemy.knockback.x) > impactThreshold) {
            hitWall = true;
            createExplosion({ x: -halfW, y: enemy.position.y }, '#94a3b8', 6, Math.PI, 0); // Spalls right
          }
          enemy.knockback.x *= -wallRestitution;
        }
      } else if (enemy.position.x > halfW - enemy.radius) {
        enemy.position.x = halfW - enemy.radius;
        if (enemy.knockback.x > 0) {
          if (Math.abs(enemy.knockback.x) > impactThreshold) {
             hitWall = true;
             createExplosion({ x: halfW, y: enemy.position.y }, '#94a3b8', 6, Math.PI, Math.PI); // Spalls left
          }
          enemy.knockback.x *= -wallRestitution;
        }
      }

      // Y Boundaries
      if (enemy.position.y < -halfH + enemy.radius) {
        enemy.position.y = -halfH + enemy.radius;
        if (enemy.knockback.y < 0) {
          if (Math.abs(enemy.knockback.y) > impactThreshold) {
            hitWall = true;
            createExplosion({ x: enemy.position.x, y: -halfH }, '#94a3b8', 6, Math.PI, Math.PI / 2); // Spalls down
          }
          enemy.knockback.y *= -wallRestitution;
        }
      } else if (enemy.position.y > halfH - enemy.radius) {
        enemy.position.y = halfH - enemy.radius;
        if (enemy.knockback.y > 0) {
          if (Math.abs(enemy.knockback.y) > impactThreshold) {
            hitWall = true;
            createExplosion({ x: enemy.position.x, y: halfH }, '#94a3b8', 6, Math.PI, -Math.PI / 2); // Spalls up
          }
          enemy.knockback.y *= -wallRestitution;
        }
      }

      if (hitWall) {
          enemy.health -= GAME_CONFIG.DASH_ATTACK.WALL_IMPACT_DAMAGE;
          enemy.flashTimer = GAME_CONFIG.FEEDBACK.ENEMY_HIT_FLASH;
          shakeRef.current = { timer: 0.1, intensity: 5 }; // Add a little shake for impact
          
          if (enemy.health <= 0) {
              handleEnemyDefeat(enemy);
              enemiesRef.current.splice(i, 1);
              continue;
          }
      }

      if (Vec2.dist(player.position, enemy.position) < player.radius + enemy.radius) {
        if (player.isDashing && globalTimeRef.current - enemy.lastHitTime > GAME_CONFIG.DASH_ATTACK.HIT_COOLDOWN) {
          enemy.health -= GAME_CONFIG.DASH_ATTACK.DAMAGE;
          enemy.lastHitTime = globalTimeRef.current;
          enemy.flashTimer = GAME_CONFIG.FEEDBACK.ENEMY_HIT_FLASH;
          const impulseDir = Vec2.normalize(Vec2.add(Vec2.scale(Vec2.normalize(player.velocity), 0.8), Vec2.scale(Vec2.normalize(Vec2.sub(enemy.position, player.position)), 0.4)));
          enemy.knockback = Vec2.scale(impulseDir, GAME_CONFIG.DASH_ATTACK.KNOCKBACK_FORCE);
          shakeRef.current = { timer: 0.15, intensity: GAME_CONFIG.DASH_ATTACK.IMPACT_SHAKE };
          createExplosion(enemy.position, '#ffffff', 5, Math.PI / 2, Math.atan2(impulseDir.y, impulseDir.x));
          createSplatter(enemy.position, impulseDir, enemy.color, 12);
          
          // Hit Stop Trigger
          hitStopTimerRef.current = GAME_CONFIG.FEEDBACK.HIT_STOP_MS / 1000;

          if (enemy.health <= 0) {
            handleEnemyDefeat(enemy);
            enemiesRef.current.splice(i, 1);
          }
        } else if (knockbackSpeed <= 50 && !player.isDashing) {
          const damage = enemy.damage * deltaTime;
          player.shieldRegenTimer = 0;
          player.lastDamageTime = GAME_CONFIG.PLAYER.HIT_FLASH_DURATION;
          damageVignetteRef.current = Math.min(1.0, damageVignetteRef.current + 0.15);
  
          if (player.shield > 0) {
            player.shield -= damage;
            if (player.shield < 0) { player.health += player.shield; player.shield = 0; }
          } else player.health -= damage;
  
          if (player.health <= 0 && !player.isDead) {
            player.health = 0; player.isDead = true;
            createExplosion(player.position, '#ffffff', 30);
            shakeRef.current = { timer: 0.5, intensity: 45 };
            setGameOver(true);
          }
        }
      }
    }

    spawnTrail(player.position, player.velocity, player.isDashing);
    cameraRef.current.position = Vec2.lerp(cameraRef.current.position, Vec2.add(player.position, Vec2.scale(player.velocity, 0.15)), GAME_CONFIG.CAMERA.LERP_FACTOR);

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life -= deltaTime;
      if (p.drag) p.velocity = Vec2.scale(p.velocity, Math.pow(p.drag, deltaTime * 60));
      p.position = Vec2.add(p.position, Vec2.scale(p.velocity, deltaTime));
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;
    const camera = cameraRef.current;

    ctx.fillStyle = GAME_CONFIG.WORLD.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    
    // Center logic + Zoom + Shake
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);

    let shakeX = 0, shakeY = 0;
    if (shakeRef.current.timer > 0) {
      const currentIntensity = shakeRef.current.intensity * (shakeRef.current.timer / 0.5);
      shakeX = (Math.random() - 0.5) * 2 * currentIntensity;
      shakeY = (Math.random() - 0.5) * 2 * currentIntensity;
    }
    
    ctx.translate(-(camera.position.x + shakeX), -(camera.position.y + shakeY));

    drawGrid(ctx, camera.position, width, height);

    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 10;
    const halfW = GAME_CONFIG.WORLD.WIDTH / 2, halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    ctx.strokeRect(-halfW, -halfH, GAME_CONFIG.WORLD.WIDTH, GAME_CONFIG.WORLD.HEIGHT);

    // Visual Tethers for 'fast' enemies (Yellow Triangles)
    if (!player.isDead) {
      enemiesRef.current.forEach(enemy => {
        if (enemy.type === 'fast') {
          const dist = Vec2.dist(player.position, enemy.position);
          const tetherRange = 600;
          
          if (dist < tetherRange) {
            ctx.save();
            const opacity = Math.max(0, 1 - (dist / tetherRange));
            
            // Pulsing effect
            const pulse = (Math.sin(globalTimeRef.current * 15) + 1) * 0.5; // 0 to 1
            
            // Tether Line
            ctx.beginPath();
            ctx.moveTo(player.position.x, player.position.y);
            ctx.lineTo(enemy.position.x, enemy.position.y);
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 1 + pulse;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -globalTimeRef.current * 150;
            ctx.globalAlpha = opacity * 0.4;
            ctx.stroke();

            // Player-side Warning Indicator (Chevron)
            const angle = Math.atan2(enemy.position.y - player.position.y, enemy.position.x - player.position.x);
            const indicatorDist = player.radius + 24 + (pulse * 4);
            
            ctx.translate(player.position.x + Math.cos(angle) * indicatorDist, player.position.y + Math.sin(angle) * indicatorDist);
            ctx.rotate(angle);
            
            ctx.fillStyle = enemy.color;
            ctx.shadowColor = enemy.glowColor;
            ctx.shadowBlur = 10;
            ctx.globalAlpha = opacity * 0.9;
            
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-6, -5);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-6, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          }
        }
      });
    }

    // Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath(); ctx.arc(p.position.x, p.position.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Projectiles
    projectilesRef.current.forEach(p => {
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = p.color;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.position.x, p.position.y, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });

    // Enemies
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(enemy.rotation);
      const isFlashing = enemy.flashTimer > 0;
      ctx.shadowBlur = isFlashing ? 15 : 10;
      ctx.shadowColor = isFlashing ? '#ffffff' : enemy.glowColor;
      ctx.fillStyle = isFlashing ? '#ffffff' : enemy.color;
      
      ctx.beginPath();
      if (enemy.type === 'heavy') {
          ctx.rect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2);
      } else if (enemy.type === 'fast') {
          ctx.moveTo(enemy.radius * 1.4, 0); 
          ctx.lineTo(-enemy.radius, -enemy.radius * 0.7); 
          ctx.lineTo(-enemy.radius, enemy.radius * 0.7);
      } else {
          ctx.moveTo(enemy.radius * 1.2, 0);
          ctx.lineTo(-enemy.radius * 0.8, -enemy.radius);
          ctx.lineTo(-enemy.radius * 0.8, enemy.radius);
      }
      ctx.closePath(); 
      ctx.fill();

      if (enemy.health < enemy.maxHealth) {
        const barY = enemy.radius + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-enemy.radius, barY, enemy.radius * 2, 4);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(-enemy.radius, barY, (enemy.radius * 2) * (enemy.health / enemy.maxHealth), 4);
      }
      ctx.restore();
    });

    // Player
    if (!player.isDead || Math.floor(Date.now() / 200) % 2 === 0) {
      ctx.save();
      ctx.translate(player.position.x, player.position.y);
      ctx.rotate(player.rotation);

      if (!player.isDead && player.isDashing) {
        ctx.save();
        const flicker = Math.random() * 0.5 + 0.5;
        ctx.shadowBlur = 15 * flicker; ctx.shadowColor = '#f59e0b'; ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.moveTo(-player.radius * 0.4, 0); ctx.lineTo(-player.radius * (1.5 + flicker), -player.radius * 0.5); ctx.lineTo(-player.radius * (1.5 + flicker), player.radius * 0.5);
        ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, player.radius + 4, Date.now() / 100, (Math.PI * 2) + Date.now() / 100); ctx.stroke();
      }
      
      const isPlayerFlashing = player.lastDamageTime > 0;
      const isLevelUpFlashing = player.levelUpTimer > 0;
      
      ctx.shadowBlur = player.isDashing ? 35 : 20;
      if (isLevelUpFlashing) {
        ctx.shadowColor = '#fde047';
      } else {
        ctx.shadowColor = player.isDead ? '#475569' : (isPlayerFlashing ? '#ffffff' : (player.isDashing ? '#0ea5e9' : GAME_CONFIG.PLAYER.GLOW_COLOR));
      }
      
      // Pure Vector Drawing (Psyche sprite removed)
      ctx.fillStyle = player.isDead ? '#64748b' : (isPlayerFlashing ? '#ffffff' : (player.isDashing ? '#7dd3fc' : GAME_CONFIG.PLAYER.COLOR));
      ctx.beginPath();
      ctx.moveTo(player.radius * 1.4, 0); ctx.lineTo(-player.radius, -player.radius); ctx.lineTo(-player.radius * 0.4, 0); ctx.lineTo(-player.radius, player.radius);
      ctx.closePath(); ctx.fill();
      
      ctx.shadowBlur = 0; ctx.fillStyle = (player.isDead || isPlayerFlashing || isLevelUpFlashing) ? '#475569' : '#ffffff';
      ctx.beginPath(); ctx.moveTo(player.radius * 0.6, 0); ctx.lineTo(-player.radius * 0.2, -player.radius * 0.3); ctx.lineTo(-player.radius * 0.2, player.radius * 0.3);
      ctx.closePath(); ctx.fill();

      // Shield Visual
      if (player.shield > 1) {
        ctx.rotate(-player.rotation); ctx.shadowBlur = 10; ctx.shadowColor = GAME_CONFIG.PLAYER.SHIELD_GLOW;
        ctx.strokeStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR; ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3 + (player.shield / player.maxShield) * 0.4;
        ctx.beginPath(); ctx.arc(0, 0, player.radius + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1.0;
        ctx.rotate(player.rotation); // Restore for charge visual
      }

      // Charge Visual (Ring)
      if (player.isChargingScatter) {
         const p = player.scatterChargeTimer / GAME_CONFIG.SCATTER_SHOT.MAX_CHARGE_TIME;
         ctx.rotate(-player.rotation); // Ensure ring doesn't spin with player
         
         // Outer ring shrinking
         const maxR = player.radius * 3.5;
         const minR = player.radius * 1.2;
         const currentR = maxR - (maxR - minR) * p;
         
         ctx.beginPath();
         ctx.arc(0, 0, currentR, 0, Math.PI * 2);
         ctx.strokeStyle = p > 0.95 ? '#f0abfc' : GAME_CONFIG.SCATTER_SHOT.COLOR;
         ctx.lineWidth = 2;
         ctx.stroke();

         // Fill progress
         ctx.beginPath();
         ctx.arc(0, 0, player.radius * 1.5, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * p));
         ctx.strokeStyle = GAME_CONFIG.SCATTER_SHOT.COLOR;
         ctx.lineWidth = 3;
         ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();

    // Damage Vignette (UI Layer)
    if (damageVignetteRef.current > 0) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.6);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
      grad.addColorStop(1, `rgba(239, 68, 68, ${damageVignetteRef.current * 0.5})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    drawHUD(ctx, width, height);
    if (!player.isDead && !pausedRef.current) drawMouseReticle(ctx);
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const player = playerRef.current;
    
    // Global XP Gauge
    const xpPercent = player.xp / player.maxXp;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, width, 6);
    ctx.fillStyle = '#fde047'; 
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(253, 224, 71, 0.5)';
    ctx.fillRect(0, 0, width * xpPercent, 6);
    ctx.shadowBlur = 0;

    // Survival Timer
    const elapsed = Math.floor(globalTimeRef.current);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.fillText(timerStr, width / 2, 50);
    ctx.shadowBlur = 0;

    // Kill Counter
    ctx.font = 'bold 16px Inter, system-ui';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`DEFEATED: ${player.kills}`, width / 2, 85);

    // Status Cluster
    const barWidth = 300, barHeight = 16, shieldHeight = 6, gap = 4, x = (width - barWidth) / 2, y = height - 80;
    ctx.font = 'bold 20px Inter, system-ui';
    ctx.fillStyle = '#fde047'; ctx.textAlign = 'center';
    ctx.fillText(`LVL ${player.level}`, width / 2, y - 32);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; ctx.fillRect(x - 4, y - shieldHeight - gap - 2, barWidth + 8, barHeight + shieldHeight + gap + 4 + 24); 
    
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; ctx.fillRect(x, y - shieldHeight - gap, barWidth, shieldHeight);
    ctx.fillStyle = GAME_CONFIG.PLAYER.SHIELD_COLOR; ctx.fillRect(x, y - shieldHeight - gap, barWidth * (player.shield / player.maxShield), shieldHeight);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; ctx.fillRect(x, y, barWidth, barHeight);
    const healthColor = player.health < 30 ? '#ef4444' : (player.health < 60 ? '#fbbf24' : '#10b981');
    ctx.fillStyle = healthColor; ctx.fillRect(x, y, barWidth * (player.health / player.maxHealth), barHeight);

    const chargeSize = 12, chargeGap = 6, chargesX = x, chargesY = y + barHeight + 12;
    for (let i = 0; i < player.maxDashCharges; i++) {
      ctx.beginPath(); ctx.arc(chargesX + i * (chargeSize + chargeGap) + chargeSize / 2, chargesY, chargeSize / 2, 0, Math.PI * 2);
      if (i < player.dashCharges) { ctx.fillStyle = '#fbbf24'; ctx.fill(); }
      else {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; ctx.lineWidth = 2; ctx.stroke();
        if (i === player.dashCharges) {
          ctx.beginPath(); const p = 1 - (player.dashCooldownTimer / GAME_CONFIG.PLAYER.DASH_COOLDOWN);
          ctx.arc(chargesX + i * (chargeSize + chargeGap) + chargeSize / 2, chargesY, (chargeSize / 2) * p, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.5)'; ctx.fill();
        }
      }
    }

    // Ability Icon
    if (player.isScatterShotUnlocked) {
      const abilitySize = 24;
      const abilityX = chargesX + (player.maxDashCharges * (chargeSize + chargeGap)) + 20;
      const abilityY = chargesY;
      
      ctx.beginPath();
      // Draw a diamond shape for the ability
      ctx.moveTo(abilityX, abilityY - abilitySize/2);
      ctx.lineTo(abilityX + abilitySize/2, abilityY);
      ctx.lineTo(abilityX, abilityY + abilitySize/2);
      ctx.lineTo(abilityX - abilitySize/2, abilityY);
      ctx.closePath();

      if (player.scatterShotTimer <= 0) {
        ctx.fillStyle = GAME_CONFIG.SCATTER_SHOT.COLOR;
        ctx.shadowBlur = 5; ctx.shadowColor = GAME_CONFIG.SCATTER_SHOT.COLOR;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
         ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)'; 
         ctx.lineWidth = 2; 
         ctx.stroke();
         
         // Cooldown fill
         // We use the effective cooldown for visual consistency
         const rankBonus = player.skillLevels['scatter_shot'] >= 2 ? GAME_CONFIG.SKILL_CONFIG.scatter_shot.BONUS : 0;
         const currentMaxCD = GAME_CONFIG.SCATTER_SHOT.COOLDOWN - rankBonus;
         const p = 1 - (player.scatterShotTimer / currentMaxCD);
         ctx.fillStyle = 'rgba(192, 132, 252, 0.3)';
         ctx.save();
         ctx.clip(); // Clip to the diamond shape already in path
         ctx.fillRect(abilityX - abilitySize/2, abilityY + abilitySize/2 - (abilitySize * p), abilitySize, abilitySize * p);
         ctx.restore();
      }
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, cameraPos: Vector2, width: number, height: number) => {
    const size = GAME_CONFIG.WORLD.GRID_SIZE;
    const halfW = GAME_CONFIG.WORLD.WIDTH / 2, halfH = GAME_CONFIG.WORLD.HEIGHT / 2;
    ctx.strokeStyle = GAME_CONFIG.WORLD.GRID_COLOR; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
    ctx.beginPath();
    for (let x = -halfW; x <= halfW; x += size) { ctx.moveTo(x, -halfH); ctx.lineTo(x, halfH); }
    for (let y = -halfH; y <= halfH; y += size) { ctx.moveTo(-halfW, y); ctx.lineTo(halfW, y); }
    ctx.stroke(); ctx.globalAlpha = 1.0;
  };

  const drawMouseReticle = (ctx: CanvasRenderingContext2D) => {
    const { x, y } = mouseRef.current;
    ctx.strokeStyle = gameMode === 'active' ? '#38bdf8' : 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 2;
    const s = 10, g = 4;
    ctx.beginPath();
    ctx.moveTo(x - s - g, y); ctx.lineTo(x - g, y); ctx.moveTo(x + s + g, y); ctx.lineTo(x + g, y);
    ctx.moveTo(x, y - s - g); ctx.lineTo(x, y - g); ctx.moveTo(x, y + s + g); ctx.lineTo(x, y + g);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left Click
        isMouseDownRef.current = true;
      } else if (e.button === 2) { // Right Click
        isRightMouseDownRef.current = true;
      }

      if (gameModeRef.current === 'idle') { 
        setGameMode('active'); 
        gameModeRef.current = 'active'; 
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = false;
      if (e.button === 2) isRightMouseDownRef.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
       e.preventDefault();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = 0.001;
      cameraRef.current.zoom = Math.min(Math.max(cameraRef.current.zoom - e.deltaY * s, 0.5), 2.0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        setPaused(p => { pausedRef.current = !p; return !p; });
      }
      if (e.code === 'Enter') {
        setGameMode(m => { const next = m === 'idle' ? 'active' : 'idle'; gameModeRef.current = next; return next; });
      }
      if (e.code === 'KeyR' && gameOver) resetGame();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const ctx = canvas.getContext('2d');
      if (ctx && !pausedRef.current) {
        update(deltaTime, canvas.width, canvas.height);
        draw(ctx, canvas.width, canvas.height);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    resize();
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resize);
    };
  }, [gameOver]); 

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="block cursor-none touch-none" />
      
      {/* Level Up Skill Selection UI */}
      {isLevelingUp && (
        <SkillPanel 
          level={playerRef.current.level} 
          currentSkillLevels={playerRef.current.skillLevels}
          onSelect={handleSkillSelect} 
        />
      )}

      {/* Mobile Controls Layer */}
      <VirtualJoystick side="left" onMove={(data) => { leftStickRef.current = data; }} />
      <VirtualJoystick side="right" onMove={(data) => { rightStickRef.current = data; }} />

      <button 
        className="absolute bottom-32 right-8 w-16 h-16 rounded-full bg-amber-400/80 border-2 border-white/50 active:bg-amber-300 shadow-lg backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto"
        onTouchStart={(e) => { e.preventDefault(); dashBtnRef.current = true; }}
        onTouchEnd={(e) => { e.preventDefault(); dashBtnRef.current = false; }}
        onMouseDown={() => dashBtnRef.current = true}
        onMouseUp={() => dashBtnRef.current = false}
      >
        <span className="font-bold text-black text-xs">DASH</span>
      </button>

      {/* Ability Button (Mobile/Tablet only really, but visible for testing) */}
      {playerRef.current.isScatterShotUnlocked && (
        <button 
          className="absolute bottom-32 right-28 w-14 h-14 rounded-full bg-purple-500/80 border-2 border-white/50 active:bg-purple-400 shadow-lg backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto"
          onTouchStart={(e) => { e.preventDefault(); abilityBtnRef.current = true; }}
          onTouchEnd={(e) => { e.preventDefault(); abilityBtnRef.current = false; }}
          onMouseDown={() => abilityBtnRef.current = true}
          onMouseUp={() => abilityBtnRef.current = false}
        >
          <span className="font-bold text-white text-[10px]">SHOT</span>
        </button>
      )}

      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white animate-in fade-in duration-700 z-[100]">
          <h1 className="text-6xl font-bold text-red-500 mb-4 tracking-tighter italic">HERO FALLEN</h1>
          <button onClick={resetGame} className="px-8 py-3 bg-white text-black font-bold hover:bg-slate-200 uppercase tracking-widest">RESPAWN [R]</button>
        </div>
      )}

      {!gameOver && paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm text-white z-[100]">
          <h2 className="text-4xl font-bold tracking-widest text-sky-400">GAME PAUSED</h2>
        </div>
      )}
    </div>
  );
};
