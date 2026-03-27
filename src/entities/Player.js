const MAX_LIVES = 3;
const MOVE_SPEED = 150; // pixels per second in screen space
const SPRINT_SPEED = 240; // sprint speed (60% faster)
const SPRINT_DURATION = 1.5; // seconds
const SPRINT_COOLDOWN = 4.0; // seconds
const TILE_SIZE = 80; // tile diagonal for speed calculation (matches TILE_W)

export default class Player {
  constructor(startX, startY) {
    // Grid position (for collision detection and triggers)
    this.gridX = startX;
    this.gridY = startY;

    // Exact floating-point position in grid units
    this.visualX = startX;
    this.visualY = startY;

    // Movement
    this.velocityX = 0;
    this.velocityY = 0;
    this.facing = 'DOWN'; // UP, DOWN, LEFT, RIGHT
    this.isMoving = false;

    // Stats
    this.lives = MAX_LIVES;
    this.inventory = [];
    this.hasShield = false;
    this.swordUses = 0;
    this.visionRadius = 3;
    this.invincibleTimer = 0;
    
    // Sprint system
    this.sprintTimer = 0;
    this.sprintCooldown = 0;
    this.isSprinting = false;

    // Last grid cell we were in (for triggers)
    this._lastGridX = startX;
    this._lastGridY = startY;
  }

  // Activate sprint (call from input handler)
  activateSprint() {
    if (this.sprintCooldown <= 0 && !this.isSprinting) {
      this.isSprinting = true;
      this.sprintTimer = SPRINT_DURATION;
      this.sprintCooldown = SPRINT_COOLDOWN;
      return true;
    }
    return false;
  }

  // Set movement direction based on input
  setMovement(direction, isWalkable) {
    let dx = 0, dy = 0;
    
    switch (direction) {
      case 'UP':    dy = -1; break;
      case 'DOWN':  dy = 1; break;
      case 'LEFT':  dx = -1; break;
      case 'RIGHT': dx = 1; break;
      case null:    break; // Stop
    }

    // Update facing direction if moving
    if (direction && direction !== null) {
      this.facing = direction;
    }

    // Calculate velocity (convert pixels/sec to grid units/sec)
    const speed = MOVE_SPEED / TILE_SIZE; // ~1.67 tiles/second
    this.velocityX = dx * speed;
    this.velocityY = dy * speed;
    this.isMoving = (dx !== 0 || dy !== 0);
  }

  update(delta, isWalkable) {
    if (this.invincibleTimer > 0) this.invincibleTimer -= delta;
    
    // Sprint system timers
    const dt = delta / 1000;
    if (this.isSprinting) {
      this.sprintTimer -= dt;
      if (this.sprintTimer <= 0) {
        this.isSprinting = false;
        this.sprintTimer = 0;
      }
    }
    if (this.sprintCooldown > 0) {
      this.sprintCooldown -= dt;
      if (this.sprintCooldown < 0) this.sprintCooldown = 0;
    }

    // Apply velocity with sprint modifier (delta is in ms, convert to seconds)
    const currentSpeed = this.isSprinting ? SPRINT_SPEED : MOVE_SPEED;
    const speedMultiplier = currentSpeed / MOVE_SPEED;
    const newX = this.visualX + this.velocityX * dt * speedMultiplier;
    const newY = this.visualY + this.velocityY * dt * speedMultiplier;

    // Simple collision check - verify the tile at new position is walkable
    // Round to nearest tile for collision detection
    const targetGridX = Math.round(newX);
    const targetGridY = Math.round(newY);
    
    if (isWalkable(targetGridX, targetGridY)) {
      this.visualX = newX;
      this.visualY = newY;
      
      // Update grid position to nearest cell
      this.gridX = targetGridX;
      this.gridY = targetGridY;

      // Track if we entered a new grid cell
      if (this.gridX !== this._lastGridX || this.gridY !== this._lastGridY) {
        this._lastGridX = this.gridX;
        this._lastGridY = this.gridY;
        return { enteredNewCell: true };
      }
    }

    return { enteredNewCell: false };
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
  
  // Sprint getters for UI
  getSprintCooldownPercent() { return Math.max(0, (this.sprintCooldown / SPRINT_COOLDOWN) * 100); }
  getSprintDurationPercent() { return this.isSprinting ? (this.sprintTimer / SPRINT_DURATION) * 100 : 0; }
  canSprint() { return this.sprintCooldown <= 0 && !this.isSprinting; }
}
