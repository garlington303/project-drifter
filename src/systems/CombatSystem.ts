import type { System } from './System';
import type { GameState, SystemContext } from './GameState';
import { Vec2 } from '@/utils/vector';
import { GAME_CONFIG } from '@/config/constants';

/**
 * Handles melee combat, auto-aim targeting, and attack resolution
 */
export const CombatSystem: System = {
  update(state: GameState, deltaTime: number, ctx: SystemContext): void {
    const { player, enemies } = state;

    if (player.isDead) return;

    // Auto-aim targeting
    player.retargetTimer -= deltaTime;
    
    if (player.targetId !== null) {
      const target = enemies.find(e => e.id === player.targetId);
      if (!target || Vec2.dist(player.position, target.position) > GAME_CONFIG.AUTO_AIM.SCAN_RADIUS * 1.2) {
        player.targetId = null;
      }
    }

    if (state.gameMode === 'idle') {
      if (player.retargetTimer <= 0 || player.targetId === null) {
        player.retargetTimer = GAME_CONFIG.AUTO_AIM.RETARGET_INTERVAL;
        
        const candidates = enemies.filter(e => 
          Vec2.dist(player.position, e.position) < GAME_CONFIG.AUTO_AIM.SCAN_RADIUS
        );
        
        if (candidates.length > 0) {
          let bestScore = -Infinity;
          let bestTargetId: number | null = null;
          
          candidates.forEach(c => {
            const dist = Vec2.dist(player.position, c.position);
            const neighbors = candidates.filter(n => 
              n.id !== c.id && Vec2.dist(c.position, n.position) < 250
            ).length;
            
            const distScore = 1 - Math.min(dist / GAME_CONFIG.AUTO_AIM.SCAN_RADIUS, 1);
            const score = distScore + (Math.min(neighbors, 4) / 4 * GAME_CONFIG.AUTO_AIM.CLUSTER_WEIGHT);
            
            if (score > bestScore) {
              bestScore = score;
              bestTargetId = c.id;
            }
          });
          
          player.targetId = bestTargetId;
        } else {
          player.targetId = null;
        }
      }

      if (player.targetId !== null) {
        const target = enemies.find(e => e.id === player.targetId);
        if (target) {
          const toTarget = Vec2.sub(target.position, player.position);
          let targetAngle = Math.atan2(toTarget.y, toTarget.x);
          
          player.aimError = player.aimError * 0.9 + (Math.random() - 0.5) * 0.1;
          const noisyAngle = targetAngle + 
            (Math.sin(Date.now() / 1000) * 0.4 + player.aimError) * GAME_CONFIG.AUTO_AIM.AIM_INACCURACY;
          
          let diff = noisyAngle - player.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          
          const turnAmount = GAME_CONFIG.AUTO_AIM.TURN_SPEED * deltaTime;
          player.rotation += Math.abs(diff) < turnAmount ? diff : Math.sign(diff) * turnAmount;
        }
      }
    }

    // Primary attack - Melee swing
    const isLatched = state.latchedEnemyId !== null;
    state.fireTimer += deltaTime;

    if (state.fireTimer >= GAME_CONFIG.MELEE.ATTACK_RATE && !isLatched && !player.isAttacking) {
      const shouldAttack =
        (state.gameMode === 'idle' && player.targetId !== null) ||
        (state.gameMode === 'active' && state.isMouseDown);

      if (shouldAttack) {
        // Trigger attack animation
        player.isAttacking = true;
        player.attackAnimFrame = 0;
        player.attackAnimTimer = 0;
        state.fireTimer = 0;
        
        // Perform melee hit detection
        performMeleeAttack(state);
      }
    }
  }
};

/**
 * Performs melee attack hit detection in an arc in front of the player
 */
function performMeleeAttack(state: GameState): void {
  const { player, enemies } = state;
  const { MELEE } = GAME_CONFIG;
  
  const hitEnemies: number[] = [];
  
  for (const enemy of enemies) {
    // Check if enemy is within melee range
    const toEnemy = Vec2.sub(enemy.position, player.position);
    const dist = Vec2.mag(toEnemy);
    
    if (dist > MELEE.RANGE + enemy.radius) continue;
    
    // Check if enemy is within the attack arc
    const angleToEnemy = Math.atan2(toEnemy.y, toEnemy.x);
    let angleDiff = angleToEnemy - player.rotation;
    
    // Normalize angle difference to -PI to PI
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    
    // Check if within half the arc angle on either side
    if (Math.abs(angleDiff) <= MELEE.ARC_ANGLE / 2) {
      hitEnemies.push(enemy.id);
      
      // Apply damage
      enemy.health -= MELEE.DAMAGE + player.damageBonus;
      enemy.flashTimer = 0.15;
      
      // Apply knockback
      const knockbackDir = Vec2.normalize(toEnemy);
      enemy.velocity = Vec2.add(
        enemy.velocity,
        Vec2.scale(knockbackDir, MELEE.KNOCKBACK)
      );
      
      // Spawn damage number
      state.damageNumbers.push({
        id: Math.random(),
        position: { x: enemy.position.x, y: enemy.position.y - 20 },
        value: MELEE.DAMAGE + player.damageBonus,
        life: 1.0,
        velocity: { x: (Math.random() - 0.5) * 50, y: -80 },
        isCritical: false,
      });
    }
  }
  
  // Screen shake on hit
  if (hitEnemies.length > 0) {
    state.shake = { 
      timer: 0.1 + hitEnemies.length * 0.02, 
      intensity: 3 + hitEnemies.length * 2 
    };
  }
}

export function handleLevelUp(state: GameState): void {
  const { player } = state;

  player.level++;
  player.xp -= player.maxXp;
  player.maxXp += GAME_CONFIG.PROGRESSION.XP_GROWTH;
  player.levelUpTimer = GAME_CONFIG.PLAYER.LEVEL_UP_FLASH_DURATION;

  // Queue level-up panel instead of auto-giving stats
  state.pendingLevelUps++;
  state.showLevelUpPanel = true;

  (state as any)._levelUpExplosion = true;
  state.shake = { timer: 0.3, intensity: 15 };
}
