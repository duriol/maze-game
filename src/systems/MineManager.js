/**
 * Manages land mines: static hazards that activate when the player steps on them
 * and explode after a 3-second countdown, damaging anything in their blast radius.
 */
export default class MineManager {
  constructor(mineDefs) {
    this.mines = (mineDefs || []).map(def => ({
      ...def,
      activated: false,
      explodeTimer: 3000, // ms remaining once activated
      exploded: false,
      radius: def.radius || 1  // blast radius in tiles (Chebyshev distance)
    }));

    /** Called when a mine explodes: (mine) => void */
    this.onExplode = null;
    /** Called each countdown second: (mine, secondsLeft) => void */
    this.onTick = null;
  }

  /**
   * Advance mine timers. delta is in ms.
   */
  update(delta) {
    for (const mine of this.mines) {
      if (!mine.activated || mine.exploded) continue;

      const prevSecond = Math.ceil(mine.explodeTimer / 1000);
      mine.explodeTimer -= delta;
      const currSecond = Math.ceil(mine.explodeTimer / 1000);

      // Fire tick callback once per second
      if (currSecond < prevSecond && this.onTick) {
        this.onTick(mine, Math.max(0, currSecond));
      }

      if (mine.explodeTimer <= 0) {
        mine.exploded = true;
        if (this.onExplode) this.onExplode(mine);
      }
    }
  }

  /**
   * Check whether the player is standing on an inactive mine and activate it.
   * Returns the activated mine or null.
   */
  tryActivate(playerX, playerY) {
    for (const mine of this.mines) {
      if (mine.activated || mine.exploded) continue;
      if (mine.gridX === playerX && mine.gridY === playerY) {
        mine.activated = true;
        return mine;
      }
    }
    return null;
  }

  /**
   * Return true if the given grid position is within the blast radius of a mine
   * that just exploded (exploded === true AND explodeTimer <= 0 this frame).
   */
  isInExplosionRange(mine, px, py) {
    const dx = Math.abs(mine.gridX - px);
    const dy = Math.abs(mine.gridY - py);
    return Math.max(dx, dy) <= mine.radius;
  }

  /** All mines that haven't fully exploded yet (for rendering). */
  getMines() {
    return this.mines.filter(m => !m.exploded);
  }

  /** Activated mines that are counting down (for rendering explosion area). */
  getActivatedMines() {
    return this.mines.filter(m => m.activated && !m.exploded);
  }
}
