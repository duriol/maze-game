/**
 * Manages dynamic traps: PENDULUM, PROJECTILE, MOVING_WALL, SPIKE.
 * All traps move along a predefined path.
 */
export default class TrapManager {
  constructor(trapDefs) {
    // Deep-clone trap definitions and add runtime state
    this.traps = trapDefs.map(def => ({
      ...def,
      currentPathIndex: 0,
      direction: 1,
      // Current interpolated position (float)
      posX: def.path[0].x,
      posY: def.path[0].y,
      // Timer accumulator (seconds)
      timer: 0,
      active: true,
      // For projectiles: remove when reaching end
      finished: false
    }));
  }

  /** Update all traps. delta is ms. */
  update(delta) {
    const dt = delta / 1000; // convert to seconds

    for (const trap of this.traps) {
      if (!trap.active || trap.finished) continue;

      const target = trap.path[trap.currentPathIndex];
      const dx = target.x - trap.posX;
      const dy = target.y - trap.posY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = trap.speed * dt;

      if (dist <= step) {
        // Reached target
        trap.posX = target.x;
        trap.posY = target.y;

        if (trap.type === 'PROJECTILE') {
          trap.currentPathIndex++;
          if (trap.currentPathIndex >= trap.path.length) {
            trap.finished = true;
          }
        } else {
          // Bounce back and forth
          trap.currentPathIndex += trap.direction;
          if (trap.currentPathIndex >= trap.path.length) {
            trap.direction = -1;
            trap.currentPathIndex = trap.path.length - 2;
          } else if (trap.currentPathIndex < 0) {
            trap.direction = 1;
            trap.currentPathIndex = 1;
          }
        }
      } else {
        // Move toward target
        trap.posX += (dx / dist) * step;
        trap.posY += (dy / dist) * step;
      }
    }
  }

  /**
   * Check if any active trap overlaps the player's grid position.
   * Uses a tolerance of 0.6 tiles.
   * @returns {boolean}
   */
  checkCollision(playerX, playerY) {
    for (const trap of this.traps) {
      if (!trap.active || trap.finished) continue;
      const dx = Math.abs(trap.posX - playerX);
      const dy = Math.abs(trap.posY - playerY);
      if (dx < 0.6 && dy < 0.6) return true;
    }
    return false;
  }

  /** Disable a trap by id (player uses sword) */
  disableTrap(trapId) {
    const trap = this.traps.find(t => t.id === trapId);
    if (trap) trap.active = false;
  }

  /** Get trap adjacent to player (for sword use) */
  getAdjacentTrap(playerX, playerY) {
    return this.traps.find(t => {
      if (!t.active) return false;
      const dx = Math.abs(Math.round(t.posX) - playerX);
      const dy = Math.abs(Math.round(t.posY) - playerY);
      return dx <= 1 && dy <= 1 && (dx + dy) <= 1;
    }) || null;
  }

  getTraps() {
    return this.traps.filter(t => t.active && !t.finished);
  }
}
