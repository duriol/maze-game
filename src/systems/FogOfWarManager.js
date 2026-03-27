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
    
    // Store player position for circular fog rendering
    this.playerX = 0;
    this.playerY = 0;
    
    // Create a circular gradient texture for fog effect
    this.createFogTexture();

    this.visibility = Array.from({ length: mapHeight }, () =>
      Array(mapWidth).fill('dark')
    );
  }
  
  createFogTexture() {
    const scene = this.fogGraphics.scene;
    const size = 2048; // Increased texture size to cover more screen area
    
    // Check if texture already exists, if so, remove it first
    if (scene.textures.exists('fogGradient')) {
      scene.textures.remove('fogGradient');
    }
    
    // Create a canvas to draw the gradient
    const canvas = scene.textures.createCanvas('fogGradient', size, size);
    const ctx = canvas.context;
    
    // Create radial gradient from center
    const centerX = size / 2;
    const centerY = size / 2;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    
    // Gradient stops: área visible más grande, degradado mucho más sutil
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Fully transparent at center
    gradient.addColorStop(0.25, 'rgba(0, 0, 0, 0)');   // Transparent until 25%
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.1)');  // Very light start
    gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0.3)'); // Gentle fade
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');  // Medium
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.85)'); // Getting dark
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.98)');   // Almost black at edge
    
    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Refresh the texture
    canvas.refresh();
    
    // Create an image object to display this texture
    this.fogSprite = scene.add.image(0, 0, 'fogGradient')
      .setDepth(500)
      .setOrigin(0.5, 0.5)
      .setAlpha(1);
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
    // Store player position for rendering
    this.playerX = playerX;
    this.playerY = playerY;
    
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
    // Si hay relámpago activo, ocultar el fog sprite
    if (this.lightningActive) {
      this.fogSprite.setVisible(false);
      return;
    }
    
    this.fogSprite.setVisible(true);

    // Convert player grid position to screen coordinates
    const playerScreen = tileToScreen(this.playerX, this.playerY);
    const playerScreenX = playerScreen.x + offsetX + TILE_W / 2;
    const playerScreenY = playerScreen.y + offsetY + TILE_H / 2;

    // Calculate visibility radius in pixels
    const tileSize = Math.sqrt(TILE_W * TILE_W + TILE_H * TILE_H) / 2;
    const visibleRadiusPx = this.currentRadius * tileSize * 1.5;
    
    // Position the fog sprite centered on player
    this.fogSprite.setPosition(playerScreenX, playerScreenY);
    
    // Get screen dimensions to ensure fog always covers entire screen
    const screenWidth = this.fogSprite.scene.scale.width;
    const screenHeight = this.fogSprite.scene.scale.height;
    
    // Calculate how large the sprite needs to be to cover the entire screen
    // from the player's position (worst case: player at corner)
    const maxDistToEdge = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
    
    // Scale: ensure the fog sprite is large enough to always cover the screen
    // The gradient goes transparent at 25% of texture radius
    // We need the sprite to extend to maxDistToEdge, which should be at the dark part
    const minScale = (maxDistToEdge * 2) / 2048; // Minimum scale to cover screen
    const visibleScale = (visibleRadiusPx * 2) / (2048 * 0.25); // Scale for desired visible area
    
    // Use the larger of the two scales to ensure coverage
    const finalScale = Math.max(minScale * 1.5, visibleScale); // 1.5x safety margin
    this.fogSprite.setScale(finalScale);
  }
}
