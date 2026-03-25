/**
 * Manages enemies that patrol predefined paths.
 */
export default class EnemyManager {
  constructor(enemyDefs) {
    this.enemies = enemyDefs.map(def => ({
      ...def,
      posX: def.patrolPath[0].x,
      posY: def.patrolPath[0].y,
      currentPathIndex: 0,
      direction: 1,
      // seconds per tile movement
      moveInterval: 1 / def.speed,
      timer: 0
    }));
  }

  /** Update enemy patrol movement. delta in ms. */
  update(delta) {
    const dt = delta / 1000;

    for (const enemy of this.enemies) {
      enemy.timer += dt;
      if (enemy.timer < enemy.moveInterval) continue;
      enemy.timer = 0;

      // Move to next path point
      const target = enemy.patrolPath[enemy.currentPathIndex];
      enemy.posX = target.x;
      enemy.posY = target.y;

      enemy.currentPathIndex += enemy.direction;
      if (enemy.currentPathIndex >= enemy.patrolPath.length) {
        enemy.direction = -1;
        enemy.currentPathIndex = enemy.patrolPath.length - 2;
      } else if (enemy.currentPathIndex < 0) {
        enemy.direction = 1;
        enemy.currentPathIndex = 1;
      }
    }
  }

  /**
   * Check if any enemy is on the same tile as the player.
   * @returns {boolean}
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
