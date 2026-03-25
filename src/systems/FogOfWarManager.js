import { euclidDist, tileToScreen, TILE_W, TILE_H, WALL_H } from '../utils/IsoUtils.js';

/**
 * Manages fog of war visibility.
 * States: 'dark' | 'visited' | 'visible'
 *
 * @param {Phaser.Graphics} fogGfx - pre-created graphics object owned by GameScene
 */
export default class FogOfWarManager {
  constructor(fogGfx, mapWidth, mapHeight, baseRadius = 3) {
    this.fogGraphics   = fogGfx;
    this.mapWidth      = mapWidth;
    this.mapHeight     = mapHeight;
    this.baseRadius    = baseRadius;
    this.currentRadius = baseRadius;
    this.torchTimer    = 0;
    this.lightningActive = false; // Relámpago que ilumina todo

    this.visibility = Array.from({ length: mapHeight }, () =>
      Array(mapWidth).fill('dark')
    );
  }

  activateTorch(durationMs = 30000) {
    this.currentRadius = 6;
    this.torchTimer    = durationMs;
  }

  update(delta) {
    if (this.torchTimer > 0) {
      this.torchTimer -= delta;
      if (this.torchTimer <= 0) {
        this.torchTimer    = 0;
        this.currentRadius = this.baseRadius;
      }
    }
  }

  recalculate(playerX, playerY) {
    for (let gy = 0; gy < this.mapHeight; gy++) {
      for (let gx = 0; gx < this.mapWidth; gx++) {
        const dist = euclidDist(playerX, playerY, gx, gy);
        if (dist <= this.currentRadius) {
          this.visibility[gy][gx] = 'visible';
        } else if (this.visibility[gy][gx] === 'visible') {
          this.visibility[gy][gx] = 'visited';
        }
      }
    }
  }

  getVisibility(gx, gy) {
    if (gy < 0 || gy >= this.mapHeight || gx < 0 || gx >= this.mapWidth) return 'dark';
    return this.visibility[gy][gx];
  }

  isVisible(gx, gy) {
    // Si el relámpago está activo, todo es visible
    if (this.lightningActive) return true;
    return this.getVisibility(gx, gy) === 'visible';
  }

  renderFog(offsetX, offsetY) {
    const g  = this.fogGraphics;
    g.clear();

    // Si hay relámpago activo, no renderizar fog
    if (this.lightningActive) return;

    const hw = TILE_W / 2;
    const hh = TILE_H / 2;

    for (let gy = 0; gy < this.mapHeight; gy++) {
      for (let gx = 0; gx < this.mapWidth; gx++) {
        const vis = this.visibility[gy][gx];
        if (vis === 'visible') continue;

        const s  = tileToScreen(gx, gy);
        const cx = s.x + offsetX + hw;
        const ty = s.y + offsetY;
        const alpha = vis === 'visited' ? 0.65 : 1.0;

        g.fillStyle(0x000000, alpha);
        // Cover the diamond top face
        g.fillPoints([
          { x: cx,      y: ty },
          { x: cx + hw, y: ty + hh },
          { x: cx,      y: ty + TILE_H },
          { x: cx - hw, y: ty + hh }
        ], true);
        // Cover the wall front face below (extends WALL_H pixels down)
        g.fillRect(cx - hw, ty + hh, TILE_W, WALL_H + hh);
      }
    }
  }
}
