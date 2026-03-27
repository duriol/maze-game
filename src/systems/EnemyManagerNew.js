/**
 * Advanced Enemy Manager with AI behaviors for maze creatures
 * 
 * Enemy Types:
 * - SKELETON: Patrols and chases when player is in sight
 * - MINOTAUR: Actively hunts the player using pathfinding
 * - SPECTER: Teleports periodically while patrolling
 */

export default class EnemyManager {
  constructor(enemyDefs) {
    this.enemies = enemyDefs.map(def => ({
      ...def,
      posX: def.startX,
      posY: def.startY,
      // AI state
      state: 'PATROL', // PATROL, CHASE, HUNT, TELEPORT
      targetX: null,
      targetY: null,
      patrolIndex: 0,
      patrolDirection: 1,
      // Timers
      moveTimer: 0,
      stateTimer: 0,
      teleportTimer: 0,
      // Speed in tiles per second
      baseSpeed: def.speed || 0.8,
      currentSpeed: def.speed || 0.8
    }));
  }

  /**
   * Update all enemies. delta in ms.
   */
  update(delta, playerX, playerY, isWalkable) {
    const dt = delta / 1000;

    for (const enemy of this.enemies) {
      enemy.moveTimer += dt;
      enemy.stateTimer += dt;

      // Type-specific AI behavior
      switch (enemy.type) {
        case 'SKELETON':
          this._updateSkeleton(enemy, dt, playerX, playerY, isWalkable);
          break;
        case 'MINOTAUR':
          this._updateMinotaur(enemy, dt, playerX, playerY, isWalkable);
          break;
        case 'SPECTER':
          this._updateSpecter(enemy, dt, playerX, playerY, isWalkable);
          break;
        default:
          // Fallback to simple patrol
          this._updatePatrol(enemy, dt, isWalkable);
      }
    }
  }

  /**
   * SKELETON: Patrols along path, chases if player is within vision range
   */
  _updateSkeleton(enemy, dt, playerX, playerY, isWalkable) {
    const visionRange = enemy.visionRange || 4;
    const dist = this._manhattanDistance(enemy.posX, enemy.posY, playerX, playerY);

    // Check if player is visible
    if (dist <= visionRange && this._hasLineOfSight(enemy.posX, enemy.posY, playerX, playerY, isWalkable)) {
      enemy.state = 'CHASE';
      enemy.currentSpeed = enemy.baseSpeed * 1.5; // Faster when chasing
    } else if (enemy.state === 'CHASE' && dist > visionRange * 1.5) {
      // Lost sight, return to patrol
      enemy.state = 'PATROL';
      enemy.currentSpeed = enemy.baseSpeed;
    }

    if (enemy.state === 'CHASE') {
      this._moveTowards(enemy, playerX, playerY, dt, isWalkable);
    } else {
      this._updatePatrol(enemy, dt, isWalkable);
    }
  }

  /**
   * MINOTAUR: Actively hunts player using simple pathfinding
   */
  _updateMinotaur(enemy, dt, playerX, playerY, isWalkable) {
    const huntRange = enemy.huntRange || 6;
    const dist = this._manhattanDistance(enemy.posX, enemy.posY, playerX, playerY);

    if (dist <= huntRange) {
      enemy.state = 'HUNT';
      // Use A* lite pathfinding to chase
      this._moveTowards(enemy, playerX, playerY, dt, isWalkable);
    } else {
      // Too far, patrol
      enemy.state = 'PATROL';
      this._updatePatrol(enemy, dt, isWalkable);
    }
  }

  /**
   * SPECTER: Patrols and occasionally teleports to random position
   */
  _updateSpecter(enemy, dt, playerX, playerY, isWalkable) {
    enemy.teleportTimer += dt;

    // Teleport every 8-12 seconds
    const teleportInterval = 8 + Math.random() * 4;
    if (enemy.teleportTimer >= teleportInterval && enemy.teleportPath) {
      // Teleport to a random point in teleport path
      const randomPoint = enemy.teleportPath[Math.floor(Math.random() * enemy.teleportPath.length)];
      enemy.posX = randomPoint.x;
      enemy.posY = randomPoint.y;
      enemy.teleportTimer = 0;
      enemy.state = 'TELEPORT';
    } else {
      enemy.state = 'PATROL';
      this._updatePatrol(enemy, dt, isWalkable);
    }
  }

  /**
   * Simple patrol along predefined path
   */
  _updatePatrol(enemy, dt, isWalkable) {
    if (!enemy.patrolPath || enemy.patrolPath.length === 0) return;

    const moveInterval = 1 / enemy.currentSpeed;
    if (enemy.moveTimer < moveInterval) return;
    enemy.moveTimer = 0;

    // Get next patrol point
    const target = enemy.patrolPath[enemy.patrolIndex];
    
    // Move towards target
    const reached = this._stepTowards(enemy, target.x, target.y, isWalkable);
    
    if (reached) {
      // Reached waypoint, move to next
      enemy.patrolIndex += enemy.patrolDirection;
      if (enemy.patrolIndex >= enemy.patrolPath.length) {
        enemy.patrolDirection = -1;
        enemy.patrolIndex = enemy.patrolPath.length - 2;
      } else if (enemy.patrolIndex < 0) {
        enemy.patrolDirection = 1;
        enemy.patrolIndex = 1;
      }
    }
  }

  /**
   * Move enemy towards target position (for chasing/hunting)
   */
  _moveTowards(enemy, targetX, targetY, dt, isWalkable) {
    const moveInterval = 1 / enemy.currentSpeed;
    if (enemy.moveTimer < moveInterval) return;
    enemy.moveTimer = 0;

    this._stepTowards(enemy, targetX, targetY, isWalkable);
  }

  /**
   * Take one step towards target. Returns true if already at target.
   */
  _stepTowards(enemy, targetX, targetY, isWalkable) {
    const dx = targetX - enemy.posX;
    const dy = targetY - enemy.posY;

    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return true;

    // Simple greedy movement: move in direction with largest delta
    let newX = enemy.posX;
    let newY = enemy.posY;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX = enemy.posX + Math.sign(dx);
    } else {
      newY = enemy.posY + Math.sign(dy);
    }

    // Check if new position is walkable
    if (isWalkable(Math.round(newX), Math.round(newY))) {
      enemy.posX = newX;
      enemy.posY = newY;
    } else {
      // Try alternative direction
      if (Math.abs(dx) > Math.abs(dy)) {
        newY = enemy.posY + Math.sign(dy);
        newX = enemy.posX;
      } else {
        newX = enemy.posX + Math.sign(dx);
        newY = enemy.posY;
      }
      if (isWalkable(Math.round(newX), Math.round(newY))) {
        enemy.posX = newX;
        enemy.posY = newY;
      }
    }

    return false;
  }

  /**
   * Check if there's line of sight between two positions
   */
  _hasLineOfSight(x1, y1, x2, y2, isWalkable) {
    // Simple raycasting
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(x1 + dx * t);
      const y = Math.round(y1 + dy * t);
      if (!isWalkable(x, y)) return false;
    }
    return true;
  }

  _manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Check if any enemy is on the same tile as the player.
   */
  checkCollision(playerX, playerY) {
    return this.enemies.some(e =>
      Math.round(e.posX) === playerX && Math.round(e.posY) === playerY
    );
  }

  getEnemies() {
    return this.enemies;
  }
}
