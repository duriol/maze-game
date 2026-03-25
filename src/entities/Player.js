const MAX_LIVES    = 3;
const MOVE_COOLDOWN = 160; // ms between grid moves
const MOVE_DURATION = 120; // ms to visually slide between tiles

export default class Player {
  constructor(startX, startY) {
    this.gridX = startX;
    this.gridY = startY;

    // Visual (interpolated) position in grid units — used by renderer
    this.visualX = startX;
    this.visualY = startY;

    // Interpolation state
    this._fromX = startX;
    this._fromY = startY;
    this._toX   = startX;
    this._toY   = startY;
    this._moveT = 1; // 0..1, 1 = arrived

    this.lives          = MAX_LIVES;
    this.inventory      = [];
    this.hasShield      = false;
    this.swordUses      = 0; // Espada tiene 3 usos
    this.visionRadius   = 3;
    this.moveCooldown   = 0;
    this.invincibleTimer = 0;
  }

  tryMove(direction, isWalkable) {
    if (this.moveCooldown > 0) return false;

    let nx = this.gridX;
    let ny = this.gridY;
    switch (direction) {
      case 'UP':    ny -= 1; break;
      case 'DOWN':  ny += 1; break;
      case 'LEFT':  nx -= 1; break;
      case 'RIGHT': nx += 1; break;
    }
    if (!isWalkable(nx, ny)) return false;

    // Start visual slide
    this._fromX = this.gridX;
    this._fromY = this.gridY;
    this._toX   = nx;
    this._toY   = ny;
    this._moveT = 0;

    this.gridX = nx;
    this.gridY = ny;
    this.moveCooldown = MOVE_COOLDOWN;
    return true;
  }

  update(delta) {
    if (this.moveCooldown   > 0) this.moveCooldown   -= delta;
    if (this.invincibleTimer > 0) this.invincibleTimer -= delta;

    // Smooth interpolation — ease-out cubic
    if (this._moveT < 1) {
      this._moveT = Math.min(1, this._moveT + delta / MOVE_DURATION);
      const t = 1 - Math.pow(1 - this._moveT, 3); // ease-out cubic
      this.visualX = this._fromX + (this._toX - this._fromX) * t;
      this.visualY = this._fromY + (this._toY - this._fromY) * t;
    } else {
      this.visualX = this.gridX;
      this.visualY = this.gridY;
    }
  }

  takeDamage() {
    if (this.invincibleTimer > 0) return false;
    if (this.hasShield) {
      this.hasShield = false;
      this.invincibleTimer = 1000;
      return false;
    }
    this.lives = Math.max(0, this.lives - 1);
    this.invincibleTimer = 1500;
    return true;
  }

  heal()    { this.lives = Math.min(MAX_LIVES, this.lives + 1); }
  isAlive() { return this.lives > 0; }

  pickupItem(item) {
    switch (item.type) {
      case 'HEALTH_POTION': this.heal(); break;
      case 'TORCH':  break; // handled by FogOfWarManager
      case 'KEY':    if (!this.inventory.includes('KEY'))   this.inventory.push('KEY');   break;
      case 'SWORD':  this.swordUses = 3; if (!this.inventory.includes('SWORD'))  this.inventory.push('SWORD');  break;
      case 'SHIELD': this.hasShield = true; if (!this.inventory.includes('SHIELD')) this.inventory.push('SHIELD'); break;
    }
  }

  useKey() {
    const idx = this.inventory.indexOf('KEY');
    if (idx !== -1) { this.inventory.splice(idx, 1); return true; }
    return false;
  }
  hasKey() { return this.inventory.includes('KEY'); }
}
