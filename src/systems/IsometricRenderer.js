import { tileToScreen, TILE_W, TILE_H, WALL_H } from '../utils/IsoUtils.js';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  // Floor — warm stone, clearly different from walls
  FLOOR_TOP:    0x8d7b6a,  // sandy stone top face
  FLOOR_GROUT:  0x5a4a3a,  // dark grout between tiles

  // Wall — cold blue-grey stone, much darker than floor
  WALL_TOP:     0x2e4a6e,  // top face of wall block
  WALL_TOP_LIT: 0x3d6494,  // lighter area on top face
  WALL_LEFT:    0x1e3050,  // left face (lit side)
  WALL_RIGHT:   0x0f1e35,  // right face (shadow side)
  WALL_RIM:     0x5b8abf,  // bright rim on top edge

  // Entrance
  ENT_TOP:      0x2e7d32,
  ENT_LEFT:     0x1b5e20,
  ENT_RIGHT:    0x0a3d0f,

  // Exit
  EXIT_TOP:     0xb71c1c,
  EXIT_LEFT:    0x7f0000,
  EXIT_RIGHT:   0x4a0000,

  // Door closed
  DOOR_TOP:     0x4a148c,
  DOOR_LEFT:    0x2d0060,
  DOOR_RIGHT:   0x1a0040,
};

export default class IsometricRenderer {
  constructor(tileGfx, wallBackGfx, wallFrontGfx, entityGfx, mapData, sceneWidth, sceneHeight, panelW = 188) {
    this.tileGraphics = tileGfx;
    this.wallBackGraphics = wallBackGfx;
    this.wallFrontGraphics = wallFrontGfx;
    this.entityGraphics = entityGfx;
    this.mapData = mapData;
    this.sceneWidth = sceneWidth;
    this.sceneHeight = sceneHeight;
    this.PANEL_W = panelW;
    this.TOP_BAR = 64;
    this.playW = sceneWidth - this.PANEL_W * 2;
    this.playH = sceneHeight - this.TOP_BAR;
    this.offsetX = this.PANEL_W + Math.floor(this.playW / 2);
    this.offsetY = this.TOP_BAR + Math.floor(this.playH / 2);
    this.swordFlash = 0;
    this.swordFlashDir = null;
  }

  followPlayer(pgx, pgy) {
    // Convert float grid pos to iso screen pos (top-center of tile)
    const isoX = (pgx - pgy) * (TILE_W / 2);
    const isoY = (pgx + pgy) * (TILE_H / 2);

    // We want the player tile centered in the play area
    const playCX = this.PANEL_W + Math.floor(this.playW / 2);
    const playCY = this.TOP_BAR + Math.floor(this.playH / 2);

    const targetX = playCX - isoX - TILE_W / 2;
    const targetY = playCY - isoY - TILE_H / 2;

    // Map bounds in iso space
    const { width, height } = this.mapData;
    // Leftmost point: tile (0, height-1), rightmost: tile (width-1, 0)
    const mapLeft   = (0 - (height - 1)) * (TILE_W / 2);
    const mapRight  = ((width - 1) - 0)  * (TILE_W / 2) + TILE_W;
    const mapTop    = 0;
    const mapBottom = (width - 1 + height - 1) * (TILE_H / 2) + TILE_H + WALL_H;

    const mapPixW = mapRight - mapLeft;
    const mapPixH = mapBottom - mapTop;

    // Clamp so map never scrolls outside play area
    const minOffX = this.PANEL_W + this.playW - (mapRight  + 0);
    const maxOffX = this.PANEL_W             - (mapLeft);
    const minOffY = this.TOP_BAR + this.playH - mapBottom;
    const maxOffY = this.TOP_BAR;

    if (mapPixW <= this.playW) {
      this.offsetX = this.PANEL_W + Math.floor((this.playW - mapPixW) / 2) - mapLeft;
    } else {
      this.offsetX = Math.min(maxOffX, Math.max(minOffX, targetX));
    }

    if (mapPixH <= this.playH) {
      this.offsetY = this.TOP_BAR + Math.floor((this.playH - mapPixH) / 2);
    } else {
      this.offsetY = Math.min(maxOffY, Math.max(minOffY, targetY));
    }
  }

  resize(newWidth, newHeight) {
    this.sceneWidth  = newWidth;
    this.sceneHeight = newHeight;
    this.playW = newWidth  - this.PANEL_W * 2;
    this.playH = newHeight - this.TOP_BAR;
    this.offsetX = this.PANEL_W + Math.floor(this.playW / 2);
    this.offsetY = this.TOP_BAR + Math.floor(this.playH / 2);
  }

  triggerSwordFlash(dx, dy) { this.swordFlash = 220; this.swordFlashDir = { dx, dy }; }

  // ── Draw equipped items around player ─────────────────────────────────────────
  drawPlayerEquipment(pgx, pgy, player, currentTime) {
    const s  = tileToScreen(pgx, pgy);
    const cx = s.x + this.offsetX + TILE_W / 2;
    const cy = s.y + this.offsetY + TILE_H / 2;
    const g  = this.entityGraphics;

    // Sword equipped at player's side (right)
    if (player.swordUses > 0) {
      const swordX = cx + 18;
      const swordY = cy - 5;
      // Sword blade (small vertical line)
      g.fillStyle(0xb0bec5, 1);
      g.fillRect(swordX - 1, swordY - 10, 2, 16);
      // Sword edge (highlight)
      g.fillStyle(0xe0f7fa, 0.8);
      g.fillRect(swordX, swordY - 10, 1, 16);
      // Handle
      g.fillStyle(0x8d6e63, 1);
      g.fillRect(swordX - 2, swordY + 6, 4, 6);
      // Guard
      g.fillStyle(0xfdd835, 1);
      g.fillRect(swordX - 4, swordY + 5, 8, 2);
    }

    // Shield equipped at player's side (left)
    if (player.hasShield) {
      const shieldX = cx - 18;
      const shieldY = cy - 2;
      g.fillStyle(0x8d6e63, 1);
      g.fillCircle(shieldX, shieldY, 8);
      g.fillStyle(0xb0bec5, 0.8);
      g.fillCircle(shieldX, shieldY, 6);
      g.fillStyle(0x1976d2, 0.7);
      g.fillCircle(shieldX, shieldY, 4);
    }

    // Active items floating above player
    const inventory = player.inventory || [];
    let yOffset = -30;
    for (const item of inventory) {
      // Blink if time is low (less than 2 seconds remaining)
      const timeLeft = item.expiresAt ? item.expiresAt - currentTime : Infinity;
      const isLowTime = timeLeft < 3000;
      const shouldShow = !isLowTime || Math.floor(currentTime / 300) % 2 === 0;
      
      if (shouldShow) {
        const itemX = cx;
        const itemY = cy + yOffset;
        
        // Draw item icon based on type
        if (item.type === 'TORCH') {
          // Torch flame
          g.fillStyle(0xff6f00, 0.8); g.fillCircle(itemX, itemY - 2, 4);
          g.fillStyle(0xffd54f, 0.9); g.fillCircle(itemX, itemY - 1, 3);
          g.fillStyle(0xffffff, 0.7); g.fillCircle(itemX, itemY, 2);
          // Torch handle
          g.fillStyle(0x5d4037, 1); g.fillRect(itemX - 1, itemY + 2, 2, 6);
        } else if (item.type === 'HEALTH_POTION') {
          // Potion bottle
          g.fillStyle(0x4a148c, 0.7); g.fillRect(itemX - 3, itemY, 6, 8);
          g.fillStyle(0xe91e63, 0.9); g.fillRect(itemX - 2, itemY + 2, 4, 5);
          g.fillStyle(0x8d6e63, 1); g.fillRect(itemX - 2, itemY - 2, 4, 3);
          g.fillStyle(0xffffff, 0.5); g.fillCircle(itemX - 1, itemY + 3, 1);
        }
        
        // Glow/highlight for active items
        if (isLowTime) {
          g.fillStyle(0xff5252, 0.3);
          g.fillCircle(itemX, itemY + 3, 10);
        } else {
          g.fillStyle(0xffffff, 0.2);
          g.fillCircle(itemX, itemY + 3, 8);
        }
      }
      
      yOffset -= 15; // Stack items vertically
    }
  }

  gridToScreen(gx, gy) {
    const s = tileToScreen(gx, gy);
    return { x: s.x + this.offsetX, y: s.y + this.offsetY };
  }

  // Center of a tile in screen space (for entity placement)
  gridToCenter(gx, gy) {
    const { x, y } = this.gridToScreen(gx, gy);
    return { x: x + TILE_W / 2, y: y + TILE_H / 2 };
  }

  drawMap(fogManager, tiles, playerGx, playerGy, delta = 0) {
    if (this.swordFlash > 0) this.swordFlash -= delta;
    this.tileGraphics.clear();
    this.wallBackGraphics.clear();
    this.wallFrontGraphics.clear();
    const { width, height } = this.mapData;
    
    // Player's isometric position (for depth comparison)
    const playerSum = Math.floor(playerGx) + Math.floor(playerGy);

    // Isometric painter's order: back-to-front (low gx+gy first)
    for (let sum = 0; sum < width + height - 1; sum++) {
      for (let gx = 0; gx < width; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= height) continue;

        const vis = fogManager ? fogManager.getVisibility(gx, gy) : 'visible';
        if (vis === 'dark') continue;

        const alpha = vis === 'visited' ? 0.28 : 1.0;
        const tile  = tiles[gy][gx];
        const { x, y } = this.gridToScreen(gx, gy);
        // x,y is top-left of the bounding box; iso center is x + TILE_W/2, y
        const cx = x + TILE_W / 2;

        if (tile === 1 || tile === 4) {
          // Walls: draw in front layer if they're in front of player, otherwise in back layer
          const wallSum = gx + gy;
          const isFront = wallSum > playerSum;
          this._isoWall(cx, y, tile, alpha, isFront);
        } else {
          this._isoFloor(cx, y, tile, alpha);
        }
      }
    }
  }

  // ── Isometric floor diamond ───────────────────────────────────────────────────
  _isoFloor(cx, ty, type, alpha) {
    const g  = this.tileGraphics;
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;

    // Diamond points: top, right, bottom, left
    const top   = { x: cx,      y: ty };
    const right = { x: cx + hw, y: ty + hh };
    const bot   = { x: cx,      y: ty + TILE_H };
    const left  = { x: cx - hw, y: ty + hh };

    let topColor, leftColor, rightColor, symbol = null;

    switch (type) {
      case 2: // ENTRANCE - vibrant green with glow
        topColor   = C.ENT_TOP;
        leftColor  = C.ENT_LEFT;
        rightColor = C.ENT_RIGHT;
        symbol = 'entrance';
        break;
      case 3: // EXIT - bright red with pulsing glow
        topColor   = C.EXIT_TOP;
        leftColor  = C.EXIT_LEFT;
        rightColor = C.EXIT_RIGHT;
        symbol = 'exit';
        break;
      case 5: // DOOR OPEN
        topColor   = 0x0a0010;
        leftColor  = 0x050008;
        rightColor = 0x020005;
        break;
      default: // FLOOR
        topColor   = C.FLOOR_TOP;
        leftColor  = 0x7a6858;
        rightColor = 0x6b5a4a;
    }

    // Left half of diamond (slightly darker — shadow from right light source)
    g.fillStyle(leftColor, alpha);
    g.fillTriangle(top.x, top.y, left.x, left.y, bot.x, bot.y);

    // Right half of diamond (slightly lighter)
    g.fillStyle(rightColor, alpha);
    g.fillTriangle(top.x, top.y, right.x, right.y, bot.x, bot.y);

    // Top face unified color with subtle highlight
    g.fillStyle(topColor, alpha);
    g.fillPoints([top, right, bot, left], true);

    // Grout lines (diamond outline)
    g.lineStyle(1, C.FLOOR_GROUT, alpha * 0.8);
    g.strokePoints([top, right, bot, left], true);

    // Subtle center highlight
    g.fillStyle(0xffffff, alpha * 0.06);
    g.fillPoints([
      { x: cx,      y: ty + hh * 0.4 },
      { x: cx + hw * 0.5, y: ty + hh * 0.7 },
      { x: cx,      y: ty + hh * 1.0 },
      { x: cx - hw * 0.5, y: ty + hh * 0.7 }
    ], true);

    // Enhanced 3D symbols
    if (symbol === 'entrance') {
      const t = Date.now();
      const pulse = Math.sin(t * 0.003) * 0.2;
      const centerY = ty + hh; // Center of diamond
      
      // Glowing aura around entrance
      g.fillStyle(0x66bb6a, alpha * (0.15 + pulse));
      g.fillCircle(cx, centerY, 18);
      g.fillStyle(0x81c784, alpha * (0.25 + pulse));
      g.fillCircle(cx, centerY, 12);
      
      // Arrow symbol pointing up (entrance direction)
      g.fillStyle(0xffffff, alpha * 0.95);
      g.fillTriangle(cx, centerY - 8, cx - 10, centerY + 6, cx + 10, centerY + 6);
      
      // Arrow highlight/3D effect
      g.fillStyle(0xc8e6c9, alpha * 0.6);
      g.fillTriangle(cx, centerY - 6, cx - 8, centerY + 4, cx + 8, centerY + 4);
      
      // Shadow underneath
      g.fillStyle(0x000000, alpha * 0.25);
      g.fillTriangle(cx + 1, centerY - 6, cx - 7, centerY + 5, cx + 9, centerY + 5);
      
      // Sparkles around entrance
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + t * 0.002;
        const dist = 14;
        const sx = cx + Math.cos(angle) * dist;
        const sy = centerY + Math.sin(angle) * dist * 0.5;
        g.fillStyle(0xffffff, alpha * (0.7 + pulse));
        g.fillCircle(sx, sy, 2);
      }
    } else if (symbol === 'exit') {
      const t = Date.now();
      const pulse = Math.sin(t * 0.004) * 0.25;
      const centerY = ty + hh; // Center of diamond
      
      // Intense glowing aura around exit
      g.fillStyle(0xff1744, alpha * (0.12 + pulse));
      g.fillCircle(cx, centerY, 22);
      g.fillStyle(0xff5252, alpha * (0.22 + pulse));
      g.fillCircle(cx, centerY, 16);
      g.fillStyle(0xff6e6e, alpha * (0.32 + pulse));
      g.fillCircle(cx, centerY, 10);
      
      // Center portal effect (larger)
      g.fillStyle(0xffffff, alpha * 0.95);
      g.fillCircle(cx, centerY, 7);
      g.fillStyle(0xff1744, alpha * (0.9 + pulse));
      g.fillCircle(cx, centerY, 5);
      g.fillStyle(0xff5252, alpha * 0.7);
      g.fillCircle(cx, centerY, 3);
      
      // Rotating energy rays
      g.fillStyle(0xffffff, alpha * 0.9);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.002 + Math.PI / 4;
        const dist = 10;
        const rayX = cx + Math.cos(a) * dist;
        const rayY = centerY + Math.sin(a) * dist * 0.5;
        g.fillRect(rayX - 1, rayY - 1, 3, 3);
      }
      
      // Outer energy particles (orbiting)
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.003;
        const dist = 15;
        const px = cx + Math.cos(a) * dist;
        const py = centerY + Math.sin(a) * dist * 0.5;
        g.fillStyle(0xff8a80, alpha * (0.8 + pulse * 0.8));
        g.fillCircle(px, py, 2.5);
      }
    }
  }

  // ── Isometric wall block — top face + two visible side faces ─────────────────
  _isoWall(cx, ty, type, alpha, isFront = false) {
    const g   = isFront ? this.wallFrontGraphics : this.wallBackGraphics;
    const hw  = TILE_W / 2;
    const hh  = TILE_H / 2;
    const wh  = WALL_H;
    const isDoor = type === 4;

    const topC  = isDoor ? C.DOOR_TOP  : C.WALL_TOP;
    const topL  = isDoor ? 0x7b1fa2    : C.WALL_TOP_LIT;
    const leftC = isDoor ? C.DOOR_LEFT : C.WALL_LEFT;
    const rightC= isDoor ? C.DOOR_RIGHT: C.WALL_RIGHT;
    const rimC  = isDoor ? 0xce93d8    : C.WALL_RIM;

    // ── Top face (diamond) ────────────────────────────────────────────────────
    const top   = { x: cx,      y: ty };
    const right = { x: cx + hw, y: ty + hh };
    const bot   = { x: cx,      y: ty + TILE_H };
    const left  = { x: cx - hw, y: ty + hh };

    // Base top color
    g.fillStyle(topC, alpha);
    g.fillPoints([top, right, bot, left], true);

    // Top face lighting: left half brighter
    g.fillStyle(topL, alpha * 0.45);
    g.fillTriangle(top.x, top.y, left.x, left.y, bot.x, bot.y);

    // Top face: right half darker
    g.fillStyle(0x000000, alpha * 0.25);
    g.fillTriangle(top.x, top.y, right.x, right.y, bot.x, bot.y);

    // Rim highlight on top-left edge
    g.lineStyle(2, rimC, alpha * 0.7);
    g.lineBetween(top.x, top.y, left.x, left.y);
    g.lineBetween(top.x, top.y, right.x, right.y);

    // ── Left face (front-left, lit) ───────────────────────────────────────────
    // Points: left-top, bot-top, bot-bottom, left-bottom
    g.fillStyle(leftC, alpha);
    g.fillPoints([
      { x: left.x,  y: left.y },
      { x: bot.x,   y: bot.y },
      { x: bot.x,   y: bot.y  + wh },
      { x: left.x,  y: left.y + wh }
    ], true);

    // Left face: top highlight strip
    g.fillStyle(0xffffff, alpha * 0.12);
    g.fillPoints([
      { x: left.x,  y: left.y },
      { x: bot.x,   y: bot.y },
      { x: bot.x,   y: bot.y  + 5 },
      { x: left.x,  y: left.y + 5 }
    ], true);

    // Left face: stone horizontal lines
    g.lineStyle(1, 0x000000, alpha * 0.2);
    for (let i = 1; i < 3; i++) {
      const fy = i / 3;
      g.lineBetween(
        left.x,  left.y  + wh * fy,
        bot.x,   bot.y   + wh * fy
      );
    }
    // Left face: vertical crack
    g.lineBetween(
      (left.x + bot.x) / 2, (left.y + bot.y) / 2,
      (left.x + bot.x) / 2, (left.y + bot.y) / 2 + wh
    );

    // ── Right face (front-right, shadow) ─────────────────────────────────────
    g.fillStyle(rightC, alpha);
    g.fillPoints([
      { x: bot.x,   y: bot.y },
      { x: right.x, y: right.y },
      { x: right.x, y: right.y + wh },
      { x: bot.x,   y: bot.y  + wh }
    ], true);

    // Right face: faint top highlight
    g.fillStyle(0xffffff, alpha * 0.05);
    g.fillPoints([
      { x: bot.x,   y: bot.y },
      { x: right.x, y: right.y },
      { x: right.x, y: right.y + 5 },
      { x: bot.x,   y: bot.y  + 5 }
    ], true);

    // Right face: stone lines
    g.lineStyle(1, 0x000000, alpha * 0.3);
    for (let i = 1; i < 3; i++) {
      const fy = i / 3;
      g.lineBetween(
        bot.x,   bot.y   + wh * fy,
        right.x, right.y + wh * fy
      );
    }

    // ── Door details ──────────────────────────────────────────────────────────
    if (isDoor) {
      const t = Date.now();
      const pulse = Math.sin(t * 0.005) * 0.15;
      
      // Magical glow around door (purple aura)
      g.fillStyle(0xba68c8, alpha * (0.20 + pulse));
      g.fillEllipse(cx, ty + hh, hw * 1.4, hh * 1.4);
      
      // Vertical bars on left face (prison-style door)
      g.fillStyle(0x9c27b0, alpha * 0.7);
      for (let i = 0; i < 3; i++) {
        const t2 = (i + 1) / 4;
        const bx = left.x  + (bot.x  - left.x)  * t2;
        const by = left.y  + (bot.y  - left.y)   * t2;
        g.fillRect(bx - 2.5, by, 5, wh);
        // Bar highlight
        g.fillStyle(0xce93d8, alpha * 0.4);
        g.fillRect(bx - 2.5, by, 1.5, wh);
        g.fillStyle(0x9c27b0, alpha * 0.7);
      }
      
      // Horizontal crossbars
      g.fillStyle(0x8e24aa, alpha * 0.8);
      for (let i = 1; i < 3; i++) {
        const fy = i / 3;
        const y1 = left.y + wh * fy;
        const y2 = bot.y + wh * fy;
        // Draw crossbar across all vertical bars
        g.fillPoints([
          { x: left.x,  y: y1 },
          { x: bot.x,   y: y2 },
          { x: bot.x,   y: y2 + 3 },
          { x: left.x,  y: y1 + 3 }
        ], true);
      }
      
      // Large ornate lock on top face
      const lockX = cx;
      const lockY = ty + hh;
      
      // Lock base (metallic gold)
      g.fillStyle(0xffa726, alpha * 0.95);
      g.fillRect(lockX - 6, lockY - 5, 12, 10);
      g.fillStyle(0xffb74d, alpha * 0.7);
      g.fillRect(lockX - 5, lockY - 4, 10, 8);
      
      // Lock shackle (U-shaped top)
      g.lineStyle(4, 0xffa726, alpha * 0.9);
      g.beginPath();
      g.arc(lockX, lockY - 5, 6, Math.PI, 0, true);
      g.strokePath();
      
      // Keyhole (glowing)
      g.fillStyle(0x000000, alpha);
      g.fillCircle(lockX, lockY, 3);
      g.fillStyle(0x7c4dff, alpha * (0.8 + pulse));
      g.fillCircle(lockX, lockY, 2);
      
      // Lock shine
      g.fillStyle(0xffffff, alpha * 0.6);
      g.fillCircle(lockX - 2, lockY - 2, 1.5);
      
      // Magical sparkles around lock
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + t * 0.003;
        const dist = 12;
        const sx = lockX + Math.cos(angle) * dist;
        const sy = lockY + Math.sin(angle) * dist * 0.5;
        g.fillStyle(0xce93d8, alpha * (0.6 + pulse));
        g.fillCircle(sx, sy, 1.5);
      }
    }
  }

  clearEntities() { this.entityGraphics.clear(); }

  _getTileAt(gx, gy) {
    if (!this.tiles) return 1; // Default to wall if no tiles
    const { width, height } = this.mapData;
    // Round to nearest tile since positions are now floating point
    const tileX = Math.round(gx);
    const tileY = Math.round(gy);
    if (tileX < 0 || tileY < 0 || tileX >= width || tileY >= height) return 1;
    return this.tiles[tileY][tileX];
  }

  _shadow(cx, cy, gx, gy, rx = 14, ry = 6) {
    const g = this.entityGraphics;
    
    // For continuous movement, we need to check the actual tile the entity is on
    // Use floor to get the current tile (entities are considered "on" the tile they're in)
    const currentTileX = Math.floor(gx);
    const currentTileY = Math.floor(gy);
    const tileType = this._getTileAt(currentTileX, currentTileY);
    
    // Only draw shadow on walkable tiles
    if (tileType !== 0 && tileType !== 2 && tileType !== 3 && tileType !== 5) {
      return; // Not a floor tile, skip shadow
    }
    
    // Shadow position - make it more visible and properly offset
    const shadowOffsetX = 3;
    const shadowOffsetY = TILE_H * 0.30;  // Slightly separated from sprite
    const shadowCenterX = cx + shadowOffsetX;
    const shadowCenterY = cy + shadowOffsetY;
    
    // More visible 3-layer shadow that stays within tile bounds
    // Outer soft shadow
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(shadowCenterX, shadowCenterY, rx * 1.6, ry * 1.6);
    
    // Middle shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(shadowCenterX, shadowCenterY, rx * 1.1, ry * 1.1);
    
    // Inner core shadow (most visible)
    g.fillStyle(0x000000, 0.55);
    g.fillEllipse(shadowCenterX, shadowCenterY, rx * 0.75, ry * 0.75);
  }

  drawEntity(gx, gy, colorKey, facingOrLevelId = 1, entityId = 'e0') {
    const s  = tileToScreen(gx, gy);
    const cx = s.x + this.offsetX + TILE_W / 2;
    const cy = s.y + this.offsetY + TILE_H / 2;
    
    // Draw shadow with clipping
    this._shadow(cx, cy, gx, gy);
    if      (colorKey === 'PLAYER')       this._drawKiroGhost(cx, cy, facingOrLevelId);
    else if (colorKey === 'ENEMY')        this._drawEnemy(cx, cy, gx, gy, facingOrLevelId, entityId);
    else if (colorKey === 'ITEM_TORCH')   this._drawTorch(cx, cy);
    else if (colorKey === 'ITEM_HEALTH')  this._drawHealthPotion(cx, cy);
    else if (colorKey === 'ITEM_KEY')     this._drawKey(cx, cy);
    else if (colorKey === 'ITEM_SWORD')   this._drawSwordItem(cx, cy);
    else if (colorKey === 'ITEM_SHIELD')  this._drawShieldItem(cx, cy);
    else if (colorKey.startsWith('TRAP_')) this._drawTrap(cx, cy, colorKey);
    else if (colorKey === 'SWITCH_OFF' || colorKey === 'SWITCH_ON') this._drawSwitch(cx, cy, colorKey === 'SWITCH_ON');
    else this._drawFallback(cx, cy, 0xffffff);
  }

  _drawEnemy(cx, cy, gx, gy, enemyType, entityId) {
    // New intelligent maze enemies
    if (enemyType === 'SKELETON') {
      this._drawSkeleton(cx, cy);
    } else if (enemyType === 'MINOTAUR') {
      this._drawMinotaur(cx, cy);
    } else if (enemyType === 'SPECTER') {
      this._drawSpecter(cx, cy);
    } else {
      // Fallback for old enemy types (shouldn't happen)
      this._drawFallback(cx, cy, 0xff0000);
    }
  }

  drawSwordSlash(pgx, pgy, dx, dy) {
    const s  = tileToScreen(pgx, pgy);
    const cx = s.x + this.offsetX + TILE_W / 2;
    const cy = s.y + this.offsetY + TILE_H / 2;
    const g  = this.entityGraphics;
    const a  = Math.max(0, this.swordFlash / 220);
    
    // Calculate rotation angle based on direction
    const baseAngle = Math.atan2(dy, dx);
    
    // Progress of slash animation (0 to 1)
    const progress = 1 - (a); // 0 at start, 1 at end
    
    // Sword rotates 240 degrees from -120 to +120 relative to target direction
    const startAngle = baseAngle - Math.PI * 0.66; // -120 degrees
    const endAngle = baseAngle + Math.PI * 0.66;   // +120 degrees
    const currentAngle = startAngle + (endAngle - startAngle) * progress;
    
    // Sword distance from player
    const swordDist = 20;
    const swordX = cx + Math.cos(currentAngle) * swordDist;
    const swordY = cy + Math.sin(currentAngle) * swordDist;
    
    // Draw rotating sword
    const swordLength = 18;
    const bladeEndX = swordX + Math.cos(currentAngle) * swordLength;
    const bladeEndY = swordY + Math.sin(currentAngle) * swordLength;
    
    // Sword blade
    g.lineStyle(3, 0xb0bec5, a);
    g.lineBetween(swordX, swordY, bladeEndX, bladeEndY);
    
    // Sword edge highlight
    g.lineStyle(2, 0xe0f7fa, a * 0.9);
    g.lineBetween(
      swordX + Math.cos(currentAngle + Math.PI/2) * 1,
      swordY + Math.sin(currentAngle + Math.PI/2) * 1,
      bladeEndX + Math.cos(currentAngle + Math.PI/2) * 1,
      bladeEndY + Math.sin(currentAngle + Math.PI/2) * 1
    );
    
    // Sword guard
    g.lineStyle(3, 0xfdd835, a);
    const guardX = swordX - Math.cos(currentAngle) * 2;
    const guardY = swordY - Math.sin(currentAngle) * 2;
    g.lineBetween(
      guardX + Math.cos(currentAngle + Math.PI/2) * 5,
      guardY + Math.sin(currentAngle + Math.PI/2) * 5,
      guardX - Math.cos(currentAngle + Math.PI/2) * 5,
      guardY - Math.sin(currentAngle + Math.PI/2) * 5
    );
    
    // Slash trail effect (arc following the rotation)
    g.lineStyle(6, 0x00e5ff, a * 0.3);
    g.beginPath();
    const trailRadius = swordDist + swordLength * 0.5;
    g.arc(cx, cy, trailRadius, startAngle, currentAngle, false);
    g.strokePath();
    
    // Impact sparkles at sword tip
    if (progress > 0.3 && progress < 0.7) {
      g.fillStyle(0xffffff, a * 0.9);
      g.fillCircle(bladeEndX, bladeEndY, 8);
      g.fillStyle(0x00e5ff, a * 0.7);
      g.fillCircle(bladeEndX, bladeEndY, 5);
      
      // Spark lines radiating from impact point
      for (let i = 0; i < 6; i++) {
        const sparkAngle = (i / 6) * Math.PI * 2 + progress * Math.PI;
        const sparkLen = 8 + Math.random() * 8;
        g.lineStyle(2, 0xffffff, a * 0.8);
        g.lineBetween(
          bladeEndX,
          bladeEndY,
          bladeEndX + Math.cos(sparkAngle) * sparkLen,
          bladeEndY + Math.sin(sparkAngle) * sparkLen
        );
      }
    }
  }

  // ── Kiro Ghost (超kawaii♡ style) ─────────────────────────────────────────────
  _drawKiroGhost(cx, cy, facing = 'DOWN') {
    const g = this.entityGraphics;
    const r = 16;
    const t = Date.now();
    const floatOffset = Math.sin(t * 0.003) * 3; // Gentle floating
    const bounce = Math.abs(Math.sin(t * 0.004)) * 0.5; // Cute bounce
    
    // Base position (floating above ground)
    const baseY = cy - 10 + floatOffset;
    
    // ── Soft pastel aura (kawaii glow) ────────────────────────────────────────
    const aurapulse = Math.sin(t * 0.005) * 0.1;
    g.fillStyle(0xe1bee7, 0.12 + aurapulse);
    g.fillCircle(cx, baseY, r + 14);
    g.fillStyle(0xf3e5f5, 0.18 + aurapulse);
    g.fillCircle(cx, baseY, r + 8);
    
    // ── Cute round body ───────────────────────────────────────────────────────
    // Main body (soft white with slight purple tint)
    g.fillStyle(0xf8f8ff, 1);
    g.fillCircle(cx, baseY - 2, r);
    
    // Pastel purple shading (3D roundness)
    g.fillStyle(0xede7f6, 0.6);
    g.fillCircle(cx - 2, baseY + 2, r - 2);
    
    // Top highlight (makes it look round and shiny)
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(cx - 4, baseY - 7, r * 0.5);
    
    // ── Adorable wavy tail (kawaii style) ─────────────────────────────────────
    const tailY = baseY + r - 4;
    const numTails = 3;
    for (let i = 0; i < numTails; i++) {
      const wavePhase = (t * 0.005) + (i * 1.2);
      const waveX = cx + Math.sin(wavePhase) * 2;
      const tailSize = (r / 2.2) * (1 - i / numTails);
      
      // Tail shadow
      g.fillStyle(0xd1c4e9, 0.4);
      g.fillCircle(waveX + 1, tailY + i * 4 + 1, tailSize);
      
      // Main tail
      g.fillStyle(0xf8f8ff, 0.95);
      g.fillCircle(waveX, tailY + i * 4, tailSize);
      
      // Tail highlight
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(waveX - 1, tailY + i * 4 - 1, tailSize * 0.5);
    }
    
    // ── HUGE kawaii eyes (◕‿◕) ────────────────────────────────────────────────
    let eye1X, eye1Y, eye2X, eye2Y;
    const eyeSize = 6; // Much bigger!
    const eyeOffsetY = baseY - 6;
    const blink = Math.sin(t * 0.002); // Slow blink
    const isBlinking = blink > 0.97; // Occasional blink
    
    // Eye position based on direction
    if (facing === 'LEFT') {
      eye1X = cx - 6; eye1Y = eyeOffsetY;
      eye2X = cx + 3; eye2Y = eyeOffsetY;
    } else if (facing === 'RIGHT') {
      eye1X = cx - 3; eye1Y = eyeOffsetY;
      eye2X = cx + 6; eye2Y = eyeOffsetY;
    } else {
      eye1X = cx - 5; eye1Y = eyeOffsetY;
      eye2X = cx + 5; eye2Y = eyeOffsetY;
    }
    
    if (!isBlinking) {
      // Eye whites (large circles)
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(eye1X, eye1Y, eyeSize);
      g.fillCircle(eye2X, eye2Y, eyeSize);
      
      // Eye outer ring (purple)
      g.lineStyle(1, 0xb39ddb, 0.5);
      g.strokeCircle(eye1X, eye1Y, eyeSize);
      g.strokeCircle(eye2X, eye2Y, eyeSize);
      
      // Pupils (big and shiny - classic anime style)
      g.fillStyle(0x7c4dff, 1);
      g.fillCircle(eye1X, eye1Y + 1, eyeSize * 0.65);
      g.fillCircle(eye2X, eye2Y + 1, eyeSize * 0.65);
      
      // Inner pupil
      g.fillStyle(0x5e35b1, 1);
      g.fillCircle(eye1X, eye1Y + 1, eyeSize * 0.45);
      g.fillCircle(eye2X, eye2Y + 1, eyeSize * 0.45);
      
      // Sparkle highlights (キラキラ)
      g.fillStyle(0xffffff, 1);
      g.fillCircle(eye1X - 2, eye1Y - 1, 2.5);
      g.fillCircle(eye2X - 2, eye2Y - 1, 2.5);
      g.fillCircle(eye1X + 1.5, eye1Y + 2, 1.2);
      g.fillCircle(eye2X + 1.5, eye2Y + 2, 1.2);
      
      // Tiny star sparkle
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(eye1X + 3, eye1Y - 2, 0.8);
      g.fillCircle(eye2X + 3, eye2Y - 2, 0.8);
    } else {
      // Blinking (cute horizontal lines)
      g.lineStyle(2, 0x7c4dff, 0.9);
      g.lineBetween(eye1X - 4, eye1Y, eye1X + 4, eye1Y);
      g.lineBetween(eye2X - 4, eye2Y, eye2X + 4, eye2Y);
    }
    
    // ── Kawaii blush (✿◠‿◠) ───────────────────────────────────────────────────
    g.fillStyle(0xf8bbd0, 0.6);
    g.fillCircle(cx - 11, baseY + 2, 3);
    g.fillCircle(cx + 11, baseY + 2, 3);
    
    // Extra blush shine
    g.fillStyle(0xffebee, 0.5);
    g.fillCircle(cx - 11, baseY + 1, 2);
    g.fillCircle(cx + 11, baseY + 1, 2);
    
    // ── Cute smile (◕‿◕) ──────────────────────────────────────────────────────
    const smileY = baseY + 4;
    
    // Draw curved smile using arc (simple kawaii smile)
    g.lineStyle(1.5, 0x9575cd, 0.9);
    g.beginPath();
    g.arc(cx, smileY - 1, 4, 0.3, Math.PI - 0.3, false);
    g.strokePath();
    
    // ── Sparkle particles (キラキラ) ──────────────────────────────────────────
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + (t * 0.002);
      const dist = r + 10 + Math.sin(t * 0.004 + i) * 3;
      const px = cx + Math.cos(angle) * dist;
      const py = baseY + Math.sin(angle) * dist * 0.5;
      const sparklePhase = Math.sin(t * 0.006 + i * 1.5);
      const sparkleAlpha = 0.5 + sparklePhase * 0.4;
      
      // Star sparkle shape
      if (sparklePhase > 0) {
        g.fillStyle(0xf3e5f5, sparkleAlpha);
        g.fillCircle(px, py, 2.5);
        g.fillStyle(0xffffff, sparkleAlpha * 0.8);
        g.fillCircle(px, py, 1.5);
        
        // Star points
        g.fillStyle(0xffffff, sparkleAlpha * 0.6);
        g.fillCircle(px - 2, py, 0.8);
        g.fillCircle(px + 2, py, 0.8);
        g.fillCircle(px, py - 2, 0.8);
        g.fillCircle(px, py + 2, 0.8);
      }
    }
  }

  // ── NEW MAZE ENEMIES ──────────────────────────────────────────────────────────
  // SKELETON: Bone white, glowing red eyes, patrols and chases
  _drawSkeleton(cx, cy) {
    const g = this.entityGraphics;
    const t = Date.now();
    const bob = Math.sin(t * 0.005) * 3; // floating animation
    const pulse = Math.sin(t * 0.008);
    const baseY = cy - 10 + bob;

    // Massive glowing aura - VERY VISIBLE
    g.fillStyle(0xff0000, 0.12 + pulse * 0.08);
    g.fillCircle(cx, baseY, 60);
    g.fillStyle(0xff3030, 0.20 + pulse * 0.10);
    g.fillCircle(cx, baseY, 45);
    g.fillStyle(0xff6060, 0.25 + pulse * 0.12);
    g.fillCircle(cx, baseY, 30);

    // Ribcage (3D isometric)
    g.fillStyle(0xf5f5f5, 1);
    g.fillEllipse(cx, baseY, 28, 22);
    g.fillStyle(0xe0e0e0, 1);
    g.fillEllipse(cx + 3, baseY, 12, 22);

    // Ribs (horizontal lines with gaps)
    g.lineStyle(3, 0xbdbdbd, 1);
    for (let i = -8; i <= 8; i += 5) {
      g.lineBetween(cx - 10, baseY + i, cx - 2, baseY + i);
      g.lineBetween(cx + 2, baseY + i, cx + 10, baseY + i);
    }

    // Spine highlight
    g.lineStyle(2, 0xdcdcdc, 0.8);
    g.lineBetween(cx, baseY - 10, cx, baseY + 10);

    // Skull (elevated above ribcage)
    const skullY = baseY - 18;
    
    // Skull base
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(cx, skullY, 22, 20);
    g.fillStyle(0xf5f5f5, 1);
    g.fillEllipse(cx + 2, skullY, 18, 18);
    
    // Jaw
    g.fillStyle(0xeeeeee, 1);
    g.fillEllipse(cx, skullY + 10, 14, 8);
    g.lineStyle(1.5, 0xbdbdbd, 1);
    g.lineBetween(cx - 6, skullY + 8, cx - 6, skullY + 12);
    g.lineBetween(cx, skullY + 8, cx, skullY + 12);
    g.lineBetween(cx + 6, skullY + 8, cx + 6, skullY + 12);

    // Eye sockets - GLOWING RED (VERY VISIBLE!)
    g.fillStyle(0x000000, 1);
    g.fillEllipse(cx - 7, skullY - 2, 8, 10);
    g.fillEllipse(cx + 7, skullY - 2, 8, 10);
    
    // INTENSE RED GLOW in eyes
    g.fillStyle(0xff0000, 1);
    g.fillCircle(cx - 7, skullY - 2, 5);
    g.fillCircle(cx + 7, skullY - 2, 5);
    g.fillStyle(0xff5252, 1);
    g.fillCircle(cx - 7, skullY - 2, 3.5);
    g.fillCircle(cx + 7, skullY - 2, 3.5);
    g.fillStyle(0xff8a80, 1);
    g.fillCircle(cx - 7, skullY - 3, 2);
    g.fillCircle(cx + 7, skullY - 3, 2);

    // Nose cavity
    g.fillStyle(0x000000, 1);
    g.fillTriangle(cx - 2, skullY + 2, cx + 2, skullY + 2, cx, skullY + 6);

    // Arms (bone segments)
    g.fillStyle(0xeeeeee, 1);
    // Left arm
    g.fillEllipse(cx - 14, baseY - 5, 5, 16);
    g.fillEllipse(cx - 18, baseY + 4, 4, 10);
    // Right arm
    g.fillEllipse(cx + 14, baseY - 5, 5, 16);
    g.fillEllipse(cx + 18, baseY + 4, 4, 10);

    // Shoulder joints
    g.fillStyle(0xf5f5f5, 1);
    g.fillCircle(cx - 12, baseY - 8, 4);
    g.fillCircle(cx + 12, baseY - 8, 4);

    // Bright outline for maximum visibility
    g.lineStyle(2, 0xffffff, 0.7);
    g.strokeCircle(cx, baseY, 15);
  }

  // MINOTAUR: Massive bull-headed warrior, orange-brown, very intimidating
  _drawMinotaur(cx, cy) {
    const g = this.entityGraphics;
    const t = Date.now();
    const breathe = Math.sin(t * 0.004) * 2;
    const pulse = Math.sin(t * 0.006);
    const baseY = cy - 12;

    // Massive presence aura - VERY VISIBLE
    g.fillStyle(0xff6f00, 0.15 + pulse * 0.10);
    g.fillCircle(cx, baseY, 70);
    g.fillStyle(0xff8f00, 0.22 + pulse * 0.12);
    g.fillCircle(cx, baseY, 50);
    g.fillStyle(0xffab00, 0.28 + pulse * 0.14);
    g.fillCircle(cx, baseY, 35);

    // Body (massive muscular torso)
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(cx, baseY + 8, 32, 28);
    g.fillStyle(0xa1887f, 0.6);
    g.fillEllipse(cx - 5, baseY + 5, 14, 25);

    // Chest muscles definition
    g.lineStyle(3, 0x6d4c41, 0.8);
    g.lineBetween(cx, baseY - 2, cx, baseY + 18);
    g.lineStyle(2, 0x6d4c41, 0.6);
    g.lineBetween(cx - 10, baseY + 5, cx + 10, baseY + 5);

    // Arms (powerful)
    g.fillStyle(0x795548, 1);
    // Left arm
    g.fillEllipse(cx - 20, baseY + 8, 10, 26);
    g.fillStyle(0x8d6e63, 0.7);
    g.fillCircle(cx - 20, baseY, 7);
    // Right arm
    g.fillStyle(0x795548, 1);
    g.fillEllipse(cx + 20, baseY + 8, 10, 26);
    g.fillStyle(0x8d6e63, 0.7);
    g.fillCircle(cx + 20, baseY, 7);

    // Hands/fists
    g.fillStyle(0x5d4037, 1);
    g.fillCircle(cx - 20, baseY + 20, 6);
    g.fillCircle(cx + 20, baseY + 20, 6);

    // Bull head (large and menacing)
    const headY = baseY - 15;
    
    // Neck (thick)
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(cx, baseY - 5, 18, 12);

    // Head base
    g.fillStyle(0x6d4c41, 1);
    g.fillEllipse(cx, headY, 28, 24);
    g.fillStyle(0x795548, 0.8);
    g.fillEllipse(cx - 3, headY, 22, 22);

    // Snout/muzzle (protruding)
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(cx, headY + 8, 22, 14);
    g.fillStyle(0x9e9e9e, 1);
    g.fillEllipse(cx, headY + 12, 12, 8);

    // Nostrils (flaring, with steam effect)
    g.fillStyle(0x424242, 1);
    g.fillEllipse(cx - 4, headY + 12, 3, 4);
    g.fillEllipse(cx + 4, headY + 12, 3, 4);
    
    // Steam/breath from nostrils
    g.fillStyle(0xffffff, 0.3 + pulse * 0.2);
    g.fillCircle(cx - 5, headY + 15 + breathe, 4);
    g.fillCircle(cx + 5, headY + 15 + breathe, 4);

    // Eyes - GLOWING ORANGE (VERY VISIBLE!)
    g.fillStyle(0xff6f00, 1);
    g.fillCircle(cx - 8, headY - 3, 6);
    g.fillCircle(cx + 8, headY - 3, 6);
    g.fillStyle(0xffab00, 1);
    g.fillCircle(cx - 8, headY - 3, 4);
    g.fillCircle(cx + 8, headY - 3, 4);
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(cx - 8, headY - 4, 2);
    g.fillCircle(cx + 8, headY - 4, 2);

    // Horns (large, curved, intimidating)
    g.lineStyle(6, 0x424242, 1);
    // Left horn
    g.beginPath();
    g.moveTo(cx - 14, headY - 8);
    g.lineTo(cx - 22, headY - 18);
    g.lineTo(cx - 18, headY - 20);
    g.strokePath();
    // Right horn
    g.beginPath();
    g.moveTo(cx + 14, headY - 8);
    g.lineTo(cx + 22, headY - 18);
    g.lineTo(cx + 18, headY - 20);
    g.strokePath();

    // Horn highlights
    g.lineStyle(2, 0x9e9e9e, 0.9);
    g.lineBetween(cx - 14, headY - 8, cx - 20, headY - 18);
    g.lineBetween(cx + 14, headY - 8, cx + 20, headY - 18);

    // Ear tags
    g.fillStyle(0x8d6e63, 1);
    g.fillTriangle(cx - 18, headY - 5, cx - 16, headY - 10, cx - 14, headY - 5);
    g.fillTriangle(cx + 14, headY - 5, cx + 16, headY - 10, cx + 18, headY - 5);

    // Bright outline for maximum visibility
    g.lineStyle(2, 0xffd54f, 0.6);
    g.strokeCircle(cx, baseY, 20);
  }

  // SPECTER: Ghostly apparition, cyan-purple, ethereal and eerie
  _drawSpecter(cx, cy) {
    const g = this.entityGraphics;
    const t = Date.now();
    const float = Math.sin(t * 0.003) * 6;
    const pulse1 = Math.sin(t * 0.007);
    const pulse2 = Math.sin(t * 0.011);
    const shimmer = Math.sin(t * 0.013) * 0.2;
    const baseY = cy - 15 + float;

    // Ethereal aura layers - VERY VISIBLE with pulsing effect
    g.fillStyle(0x00bcd4, 0.10 + pulse1 * 0.08);
    g.fillCircle(cx, baseY, 80);
    g.fillStyle(0x26c6da, 0.18 + pulse1 * 0.10);
    g.fillCircle(cx, baseY, 60);
    g.fillStyle(0x4dd0e1, 0.25 + pulse2 * 0.12);
    g.fillCircle(cx, baseY, 45);
    g.fillStyle(0x80deea, 0.30 + pulse1 * 0.15);
    g.fillCircle(cx, baseY, 30);

    // Main ghostly form (ethereal, semi-transparent)
    g.fillStyle(0xe1f5fe, 0.85 + shimmer);
    g.fillEllipse(cx, baseY, 30, 40);
    
    // Gradient-like layers for depth
    g.fillStyle(0xb3e5fc, 0.7 + shimmer);
    g.fillEllipse(cx - 3, baseY, 24, 36);
    g.fillStyle(0x81d4fa, 0.6 + shimmer);
    g.fillEllipse(cx - 5, baseY, 18, 32);
    g.fillStyle(0x4fc3f7, 0.5 + shimmer);
    g.fillEllipse(cx - 6, baseY + 2, 14, 28);

    // Wispy trails (flowing fabric-like)
    g.fillStyle(0xb3e5fc, 0.4 + pulse2 * 0.2);
    const wispY = baseY + 20;
    g.fillEllipse(cx - 12, wispY + pulse1 * 3, 8, 20);
    g.fillEllipse(cx, wispY + pulse2 * 4, 10, 24);
    g.fillEllipse(cx + 12, wispY + pulse1 * 3, 8, 20);
    
    // Flowing ends (tattered)
    g.fillStyle(0x81d4fa, 0.3 + shimmer);
    for (let i = -1; i <= 1; i++) {
      const offsetX = cx + i * 12;
      const offsetY = wispY + 18 + Math.sin(t * 0.008 + i) * 4;
      g.fillEllipse(offsetX, offsetY, 6, 10);
    }

    // Hood/Head area
    const headY = baseY - 12;
    g.fillStyle(0xe1f5fe, 0.9);
    g.fillEllipse(cx, headY, 24, 20);
    g.fillStyle(0xb3e5fc, 0.8);
    g.fillEllipse(cx - 2, headY, 20, 18);

    // Face - dark void within hood
    g.fillStyle(0x01579b, 0.6);
    g.fillEllipse(cx, headY + 2, 16, 14);

    // Eyes - GLOWING CYAN (VERY VISIBLE AND EERIE!)
    g.fillStyle(0x00bcd4, 1);
    g.fillCircle(cx - 6, headY, 7);
    g.fillCircle(cx + 6, headY, 7);
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(cx - 6, headY, 5);
    g.fillCircle(cx + 6, headY, 5);
    g.fillStyle(0x80deea, 1);
    g.fillCircle(cx - 6, headY, 3);
    g.fillCircle(cx + 6, headY, 3);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx - 6, headY - 1, 1.5);
    g.fillCircle(cx + 6, headY - 1, 1.5);

    // Eye glow rays (radiating outward)
    g.lineStyle(2, 0x00e5ff, 0.5 + pulse1 * 0.3);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + t * 0.001;
      const rayLen = 12 + pulse2 * 3;
      g.lineBetween(
        cx - 6, headY,
        cx - 6 + Math.cos(angle) * rayLen,
        headY + Math.sin(angle) * rayLen
      );
      g.lineBetween(
        cx + 6, headY,
        cx + 6 + Math.cos(angle) * rayLen,
        headY + Math.sin(angle) * rayLen
      );
    }

    // Ethereal particles floating around
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 0.002;
      const dist = 25 + Math.sin(t * 0.004 + i) * 8;
      const px = cx + Math.cos(angle) * dist;
      const py = baseY + Math.sin(angle) * dist * 0.6;
      g.fillStyle(0x80deea, 0.6 + pulse2 * 0.3);
      g.fillCircle(px, py, 3);
    }

    // Bright outline for maximum visibility
    g.lineStyle(2, 0x00e5ff, 0.8 + pulse1 * 0.2);
    g.strokeCircle(cx, baseY, 18);
    
    // Second outer glow ring
    g.lineStyle(1, 0x80deea, 0.5 + pulse2 * 0.3);
    g.strokeCircle(cx, baseY, 25);
  }

  // ── OLD ENEMY FUNCTIONS REMOVED ──────────────────────────────────────────────
  // All old enemy rendering code (bats, wolves, spiders, AWS logos) has been
  // removed and replaced with the new intelligent maze enemies:
  // - _drawSkeleton() - Red glowing eyes, patrol and chase
  // - _drawMinotaur() - Orange glowing eyes, hunter with pathfinding
  // - _drawSpecter() - Cyan glowing eyes, teleporting ghost

  // ── Torch ─────────────────────────────────────────────────────────────────────
  _drawTorch(cx, cy) {
    const g = this.entityGraphics, t = Date.now(), flicker = Math.sin(t*0.012)*0.15;
    g.fillStyle(0xff6f00, 0.10+flicker); g.fillCircle(cx, cy, 22);
    g.fillStyle(0xffa000, 0.18+flicker); g.fillCircle(cx, cy, 16);
    // stick — 3D cylinder look
    g.fillStyle(0x3e2723, 1); g.fillRect(cx-3, cy+2, 6, 13);
    g.fillStyle(0x6d4c41, 1); g.fillRect(cx-3, cy+2, 2, 13); // highlight
    g.fillStyle(0x1a0a00, 0.5); g.fillRect(cx+2, cy+2, 1, 13); // shadow
    // flame layers
    g.fillStyle(0xff3d00, 0.9); g.fillEllipse(cx, cy+2, 14, 16);
    g.fillStyle(0xff6d00, 1);   g.fillEllipse(cx, cy-1, 11, 13);
    g.fillStyle(0xffa000, 1);   g.fillEllipse(cx, cy-4, 8, 10);
    g.fillStyle(0xffee58, 1);   g.fillEllipse(cx, cy-7, 5, 7);
    g.fillStyle(0xffffff, 0.8+flicker); g.fillCircle(cx, cy-7, 2);
    // sparks
    for (let i=0;i<3;i++) {
      const ang = (t*0.003+i*2.1)%(Math.PI*2), d = 6+Math.sin(t*0.008+i)*3;
      g.fillStyle(0xffca28, 0.9); g.fillCircle(cx+Math.cos(ang)*d, cy-8+Math.sin(ang)*d*0.5, 1.5);
    }
  }

  // ── Health Potion — 3D glass bottle ──────────────────────────────────────────
  _drawHealthPotion(cx, cy) {
    const g = this.entityGraphics;
    // glow
    g.fillStyle(0xe91e63, 0.2); g.fillCircle(cx, cy, 16);
    // bottle body — dark glass
    g.fillStyle(0xad1457, 1); g.fillEllipse(cx, cy+2, 18, 20);
    // liquid fill
    g.fillStyle(0xf06292, 1); g.fillEllipse(cx, cy+4, 14, 14);
    // bottle neck
    g.fillStyle(0xad1457, 1); g.fillRect(cx-4, cy-10, 8, 8);
    // cork
    g.fillStyle(0x8d6e63, 1); g.fillRect(cx-3, cy-13, 6, 4);
    // glass highlight
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(cx-3, cy-1, 5, 9);
    // heart symbol
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(cx-3, cy+3, 3); g.fillCircle(cx+3, cy+3, 3);
    g.fillTriangle(cx-6, cy+4, cx+6, cy+4, cx, cy+10);
  }

  // ── Key — 3D golden key ───────────────────────────────────────────────────────
  _drawKey(cx, cy) {
    const g = this.entityGraphics;
    g.fillStyle(0xf9a825, 0.2); g.fillCircle(cx-3, cy, 14);
    // key ring — 3D torus look
    g.fillStyle(0xf57f17, 1); g.fillCircle(cx-4, cy-1, 8);
    g.fillStyle(0xffd54f, 1); g.fillCircle(cx-4, cy-1, 6);
    g.fillStyle(0x1a1a2e, 1); g.fillCircle(cx-4, cy-1, 3);
    // highlight on ring
    g.fillStyle(0xffffff, 0.4); g.fillCircle(cx-7, cy-4, 2.5);
    // key shaft
    g.fillStyle(0xf57f17, 1); g.fillRect(cx+1, cy-2, 11, 4);
    g.fillStyle(0xffd54f, 0.6); g.fillRect(cx+1, cy-2, 11, 2); // top highlight
    // teeth
    g.fillStyle(0xf57f17, 1);
    g.fillRect(cx+6, cy+2, 3, 4);
    g.fillRect(cx+10, cy+2, 3, 3);
  }

  // ── Sword item — 3D blade ─────────────────────────────────────────────────────
  _drawSwordItem(cx, cy) {
    const g = this.entityGraphics;
    g.fillStyle(0x90caf9, 0.2); g.fillCircle(cx, cy, 14);
    // blade — gradient effect with two rects
    g.fillStyle(0xb0bec5, 1); g.fillRect(cx-2, cy-12, 5, 20);
    g.fillStyle(0xe0e0e0, 1); g.fillRect(cx-2, cy-12, 2, 20); // highlight
    g.fillStyle(0x607d8b, 1); g.fillRect(cx+2, cy-12, 1, 20); // shadow
    // tip
    g.fillStyle(0xe0e0e0, 1); g.fillTriangle(cx-2, cy-12, cx+3, cy-12, cx, cy-18);
    // crossguard — 3D bar
    g.fillStyle(0xffd54f, 1); g.fillRect(cx-9, cy+6, 18, 5);
    g.fillStyle(0xffffff, 0.4); g.fillRect(cx-9, cy+6, 18, 2);
    g.fillStyle(0xf57f17, 0.6); g.fillRect(cx-9, cy+9, 18, 2);
    // pommel
    g.fillStyle(0xffd54f, 1); g.fillCircle(cx, cy+14, 4);
    g.fillStyle(0xffffff, 0.4); g.fillCircle(cx-1, cy+13, 1.5);
  }

  // ── Shield item — 3D heraldic shield ─────────────────────────────────────────
  _drawShieldItem(cx, cy) {
    const g = this.entityGraphics;
    g.fillStyle(0x80cbc4, 0.2); g.fillCircle(cx, cy, 14);
    // shadow/depth
    g.fillStyle(0x00695c, 0.7);
    g.fillTriangle(cx+2, cy+12, cx-9, cy-7, cx+11, cy-7);
    g.fillRect(cx-9+2, cy-11, 20, 10);
    // main shield face
    g.fillStyle(0x00897b, 1);
    g.fillTriangle(cx, cy+12, cx-10, cy-6, cx+10, cy-6);
    g.fillRect(cx-10, cy-10, 20, 10);
    // emblem stripe
    g.fillStyle(0x4db6ac, 1); g.fillRect(cx-10, cy-4, 20, 5);
    // highlight
    g.fillStyle(0xffffff, 0.25); g.fillRect(cx-10, cy-10, 8, 16);
    // border
    g.lineStyle(1.5, 0x004d40, 0.8);
    g.strokeTriangle(cx, cy+12, cx-10, cy-6, cx+10, cy-6);
  }

  // ── Traps — 3D volumetric hazards ────────────────────────────────────────────
  _drawTrap(cx, cy, colorKey) {
    const g = this.entityGraphics, t = Date.now();
    const pulse = Math.sin(t * 0.006) * 0.15;
    const fastPulse = Math.sin(t * 0.012) * 0.2;

    if (colorKey === 'TRAP_PROJECTILE') {
      // Enhanced blazing projectile with beautiful trail
      const trailLen = 8;
      const rotation = t * 0.004;
      
      // Extended glowing trail
      for (let i = trailLen; i >= 0; i--) {
        const alpha = (1 - i / trailLen) * 0.5;
        const offset = i * 3.5;
        const size = 15 - i * 1.3;
        g.fillStyle(0xff6f00, alpha * 0.4);
        g.fillCircle(cx - offset, cy, size + 4);
        g.fillStyle(0xff9d00, alpha);
        g.fillCircle(cx - offset, cy, size);
      }
      
      // Outer energy field
      g.fillStyle(0xff6f00, 0.15 + pulse);
      g.fillCircle(cx, cy, 26);
      g.fillStyle(0xff8f00, 0.25 + pulse);
      g.fillCircle(cx, cy, 20);
      
      // Main projectile core (layered for depth)
      g.fillStyle(0xbf360c, 1); g.fillCircle(cx, cy, 12);
      g.fillStyle(0xff3d00, 1); g.fillCircle(cx, cy, 10);
      g.fillStyle(0xff6d00, 1); g.fillCircle(cx, cy, 8);
      g.fillStyle(0xff9800, 1); g.fillCircle(cx, cy, 6);
      g.fillStyle(0xffca28, 1); g.fillCircle(cx, cy, 4.5);
      g.fillStyle(0xffffff, 1); g.fillCircle(cx, cy, 2.5);
      
      // Dynamic highlight
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(cx - 3, cy - 3, 3);
      
      // Rotating energy sparks (more dramatic)
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + rotation;
        const dist = 12 + Math.sin(t * 0.008 + i) * 3;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + Math.sin(angle) * dist * 0.6;
        const sparkPulse = Math.sin(t * 0.01 + i * 0.5);
        
        g.fillStyle(0xffca28, 0.7 + sparkPulse * 0.3);
        g.fillCircle(sx, sy, 3);
        g.fillStyle(0xffffff, 0.8 + sparkPulse * 0.2);
        g.fillCircle(sx, sy, 1.5);
      }
      
      // Energy wisps
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + rotation * 1.5;
        const wispDist = 16 + Math.sin(t * 0.006 + i) * 4;
        const wx = cx + Math.cos(angle) * wispDist;
        const wy = cy + Math.sin(angle) * wispDist * 0.5;
        g.fillStyle(0xff9800, 0.5);
        g.fillCircle(wx, wy, 2.5);
      }
      
    } else if (colorKey === 'TRAP_PENDULUM') {
      // Beautiful deadly pendulum with dramatic swing
      const swing = Math.sin(t * 0.0035) * 8;
      const swingSpeed = Math.abs(Math.cos(t * 0.0035)) * 0.3;
      
      // Danger warning aura (pulsing)
      g.fillStyle(0xb71c1c, 0.12 + pulse + swingSpeed);
      g.fillCircle(cx, cy, 28);
      g.fillStyle(0xd32f2f, 0.20 + pulse);
      g.fillCircle(cx, cy, 22);
      g.fillStyle(0xef5350, 0.28 + pulse);
      g.fillCircle(cx, cy, 17);
      
      // Enhanced chain with metallic segments
      const chainSegments = 5;
      for (let i = 0; i < chainSegments; i++) {
        const segY = cy - 18 + (i / chainSegments) * 8;
        const segX = cx + (swing * (chainSegments - i) / chainSegments);
        
        g.lineStyle(3, 0x424242, 1);
        g.lineBetween(
          segX,
          segY,
          cx + (swing * (chainSegments - i - 1) / chainSegments),
          segY + 8 / chainSegments
        );
        
        // Chain links
        g.fillStyle(0x616161, 1);
        g.fillCircle(segX, segY, 2.5);
        g.fillStyle(0x9e9e9e, 0.8);
        g.fillCircle(segX, segY, 1.5);
      }
      
      // Chain attachment point
      g.fillStyle(0x212121, 1);
      g.fillCircle(cx + swing, cy - 18, 5);
      g.fillStyle(0x616161, 1);
      g.fillCircle(cx + swing, cy - 18, 4);
      g.fillStyle(0x9e9e9e, 0.7);
      g.fillCircle(cx + swing, cy - 18, 2.5);
      
      // Ball shadow (dynamic with swing)
      g.fillStyle(0x7f0000, 0.6);
      g.fillEllipse(cx + swing * 0.3 + 3, cy + 4, 26, 12);
      
      // Main ball with metallic shading
      g.fillStyle(0x7f0000, 1); g.fillCircle(cx, cy, 14);
      g.fillStyle(0xc62828, 1); g.fillCircle(cx, cy, 12);
      g.fillStyle(0xef5350, 0.85); g.fillCircle(cx - 1, cy - 1, 11);
      g.fillStyle(0xd32f2f, 1); g.fillCircle(cx, cy, 10);
      
      // Metallic highlights
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(cx - 4, cy - 4, 5);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(cx - 3, cy - 3, 3);
      
      // Enhanced deadly spikes (10 directions for more menacing look)
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + t * 0.001;
        
        // Spike shadow
        g.fillStyle(0x7f0000, 0.6);
        g.fillTriangle(
          cx + Math.cos(a) * 10.5 + 1, cy + Math.sin(a) * 10.5 + 1,
          cx + Math.cos(a + 0.18) * 16 + 1, cy + Math.sin(a + 0.18) * 16 + 1,
          cx + Math.cos(a - 0.18) * 16 + 1, cy + Math.sin(a - 0.18) * 16 + 1
        );
        
        // Main spike
        g.fillStyle(0x9e0000, 1);
        g.fillTriangle(
          cx + Math.cos(a) * 10, cy + Math.sin(a) * 10,
          cx + Math.cos(a + 0.18) * 15, cy + Math.sin(a + 0.18) * 15,
          cx + Math.cos(a - 0.18) * 15, cy + Math.sin(a - 0.18) * 15
        );
        
        // Spike edge highlight
        g.fillStyle(0xd32f2f, 0.8);
        g.fillTriangle(
          cx + Math.cos(a) * 10, cy + Math.sin(a) * 10,
          cx + Math.cos(a + 0.12) * 13, cy + Math.sin(a + 0.12) * 13,
          cx + Math.cos(a - 0.12) * 13, cy + Math.sin(a - 0.12) * 13
        );
        
        // Sharp tip highlight
        g.fillStyle(0xff5252, 0.8);
        g.fillCircle(
          cx + Math.cos(a) * 15,
          cy + Math.sin(a) * 15,
          1.5
        );
      }
      
    } else {
      // MOVING_WALL / SPIKE — beautiful deadly blade with effects
      const vibrate = Math.sin(t * 0.015) * 2;
      const rotation = Math.sin(t * 0.008) * 0.1;
      
      // Danger warning aura (larger, more visible)
      g.fillStyle(0xff5722, 0.15 + pulse);
      g.fillCircle(cx, cy, 32);
      g.fillStyle(0xff7043, 0.25 + pulse);
      g.fillCircle(cx, cy, 24);
      g.fillStyle(0xff8a65, 0.35 + pulse);
      g.fillCircle(cx, cy, 18);
      
      // Motion blur/afterimage (trailing effect)
      for (let i = 3; i >= 0; i--) {
        const blurOffset = vibrate * (i / 3);
        const blurAlpha = 0.15 * (1 - i / 3);
        g.fillStyle(0xff5722, blurAlpha);
        g.fillRect(cx - 13 + blurOffset, cy - 13, 26, 26);
      }
      
      // Blade shadow (3D depth)
      g.fillStyle(0xbf360c, 0.75);
      g.fillRect(cx - 11 + vibrate + 2, cy - 11 + 2, 22, 22);
      
      // Main blade body (layered for depth)
      g.fillStyle(0xd84315, 1);
      g.fillRect(cx - 12 + vibrate, cy - 12, 24, 24);
      g.fillStyle(0xff5722, 1);
      g.fillRect(cx - 11 + vibrate, cy - 11, 22, 22);
      
      // Metallic gradient shading
      g.fillStyle(0xff8a65, 0.7);
      g.fillRect(cx - 11 + vibrate, cy - 11, 11, 22);
      g.fillStyle(0xbf360c, 0.3);
      g.fillRect(cx + vibrate, cy - 11, 11, 22);
      
      // Top shine
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(cx - 11 + vibrate, cy - 11, 22, 8);
      g.fillStyle(0xffccbc, 0.2);
      g.fillRect(cx - 11 + vibrate, cy - 11, 22, 4);
      
      // Enhanced sharp spike tips (4 sides)
      // Top spike
      g.fillStyle(0xe64a19, 1);
      g.fillTriangle(cx + vibrate, cy - 14, cx - 6 + vibrate, cy - 9, cx + 6 + vibrate, cy - 9);
      g.fillStyle(0xff8a65, 0.8);
      g.fillTriangle(cx + vibrate, cy - 14, cx - 4 + vibrate, cy - 10, cx + 4 + vibrate, cy - 10);
      g.fillStyle(0xffffff, 0.9);
      g.fillTriangle(cx + vibrate, cy - 14, cx - 2 + vibrate, cy - 11, cx + 2 + vibrate, cy - 11);
      
      // Bottom spike
      g.fillStyle(0xe64a19, 1);
      g.fillTriangle(cx + vibrate, cy + 14, cx - 6 + vibrate, cy + 9, cx + 6 + vibrate, cy + 9);
      g.fillStyle(0xff8a65, 0.8);
      g.fillTriangle(cx + vibrate, cy + 14, cx - 4 + vibrate, cy + 10, cx + 4 + vibrate, cy + 10);
      g.fillStyle(0xffffff, 0.9);
      g.fillTriangle(cx + vibrate, cy + 14, cx - 2 + vibrate, cy + 11, cx + 2 + vibrate, cy + 11);
      
      // Left spike
      g.fillStyle(0xe64a19, 1);
      g.fillTriangle(cx - 14 + vibrate, cy, cx - 9 + vibrate, cy - 6, cx - 9 + vibrate, cy + 6);
      g.fillStyle(0xff8a65, 0.8);
      g.fillTriangle(cx - 14 + vibrate, cy, cx - 10 + vibrate, cy - 4, cx - 10 + vibrate, cy + 4);
      
      // Right spike
      g.fillStyle(0xe64a19, 1);
      g.fillTriangle(cx + 14 + vibrate, cy, cx + 9 + vibrate, cy - 6, cx + 9 + vibrate, cy + 6);
      g.fillStyle(0xff8a65, 0.8);
      g.fillTriangle(cx + 14 + vibrate, cy, cx + 10 + vibrate, cy - 4, cx + 10 + vibrate, cy + 4);
      
      // Energy sparks at corners
      const corners = [
        {x: cx - 12 + vibrate, y: cy - 12},
        {x: cx + 12 + vibrate, y: cy - 12},
        {x: cx - 12 + vibrate, y: cy + 12},
        {x: cx + 12 + vibrate, y: cy + 12}
      ];
      corners.forEach((corner, i) => {
        const sparkPulse = Math.sin(t * 0.01 + i) * 0.3;
        g.fillStyle(0xffca28, 0.6 + sparkPulse);
        g.fillCircle(corner.x, corner.y, 3);
        g.fillStyle(0xffffff, 0.8 + sparkPulse);
        g.fillCircle(corner.x, corner.y, 1.5);
      });
    }
  }

  // ── Mine — dormant bomb that explodes after a 2-second countdown ─────────────
  drawMine(gx, gy, activated, timerMs) {
    const s  = tileToScreen(gx, gy);
    const cx = s.x + this.offsetX + TILE_W / 2;
    const cy = s.y + this.offsetY + TILE_H / 2;
    const g  = this.entityGraphics;
    const t  = Date.now();

    if (!activated) {
      // Dormant mine — dark metallic sphere with warning stripe
      g.fillStyle(0x212121, 0.5);
      g.fillCircle(cx + 2, cy + 2, 9);
      g.fillStyle(0x37474f, 1);
      g.fillCircle(cx, cy, 9);
      g.fillStyle(0x546e7a, 0.7);
      g.fillCircle(cx - 2, cy - 2, 4);
      // Warning stripe
      g.fillStyle(0xffb300, 0.85);
      g.fillRect(cx - 9, cy - 2, 18, 4);
      g.fillStyle(0x37474f, 1);
      g.fillRect(cx - 9, cy - 2, 4, 4);
      g.fillRect(cx + 1, cy - 2, 4, 4);
      // Fuse
      g.lineStyle(2, 0x8d6e63, 1);
      g.lineBetween(cx, cy - 9, cx + 3, cy - 14);
      g.fillStyle(0xff6f00, 0.6);
      g.fillCircle(cx + 3, cy - 14, 2);
    } else {
      // Activated — blink with increasing speed, glow red/orange
      const secsLeft  = Math.max(0, timerMs / 1000);
      const blinkHz   = Math.min(12, 1 + (3 - secsLeft) * 4); // 1→12 Hz
      const blinkMs   = 1000 / blinkHz;
      const blink     = (t % blinkMs) < blinkMs * 0.5;
      const intensity = 1 - secsLeft / 3; // 0 → 1 as it approaches explosion

      // Outer danger glow
      if (blink) {
        g.fillStyle(0xff1744, 0.15 + intensity * 0.35);
        g.fillCircle(cx, cy, 18 + intensity * 6);
      }

      // Mine body
      g.fillStyle(0x212121, 0.5);
      g.fillCircle(cx + 2, cy + 2, 9);
      g.fillStyle(blink ? 0xb71c1c : 0x37474f, 1);
      g.fillCircle(cx, cy, 9);
      g.fillStyle(blink ? 0xef5350 : 0x546e7a, 0.7);
      g.fillCircle(cx - 2, cy - 2, 4);

      // Pulsing warning stripe
      g.fillStyle(blink ? 0xff1744 : 0xffb300, 0.9);
      g.fillRect(cx - 9, cy - 2, 18, 4);

      // Fuse spark
      g.lineStyle(2, 0x8d6e63, 1);
      g.lineBetween(cx, cy - 9, cx + 3, cy - 14);
      if (blink) {
        g.fillStyle(0xffd54f, 1);
        g.fillCircle(cx + 3, cy - 14, 3);
        g.fillStyle(0xff6f00, 0.8);
        for (let i = 0; i < 4; i++) {
          const a = (t * 0.01 + i * 1.57) % (Math.PI * 2);
          g.fillCircle(cx + 3 + Math.cos(a) * 5, cy - 14 + Math.sin(a) * 5, 1.5);
        }
      }
    }
  }

  /**
   * Draw the blinking explosion-area tiles around an activated mine.
   * Called once per activated mine before the fog overlay is drawn.
   */
  drawMineExplosionArea(gx, gy, radius, timerMs, fogManager) {
    const secsLeft = Math.max(0, timerMs / 1000);
    const blinkHz  = Math.min(12, 1 + (3 - secsLeft) * 4);
    const blinkMs  = 1000 / blinkHz;
    const blink    = (Date.now() % blinkMs) < blinkMs * 0.5;
    if (!blink) return;

    const intensity = 1 - secsLeft / 3;
    const alpha = 0.25 + intensity * 0.35;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue; // mine tile itself
        const tx = gx + dx;
        const ty = gy + dy;
        if (fogManager && fogManager.getVisibility(tx, ty) === 'dark') continue;

        const s  = tileToScreen(tx, ty);
        const cx = s.x + this.offsetX + TILE_W / 2;
        const cy = s.y + this.offsetY;
        const hw = TILE_W / 2;
        const hh = TILE_H / 2;

        this.entityGraphics.fillStyle(0xff1744, alpha);
        this.entityGraphics.fillPoints([
          { x: cx,      y: cy },
          { x: cx + hw, y: cy + hh },
          { x: cx,      y: cy + TILE_H },
          { x: cx - hw, y: cy + hh }
        ], true);

        this.entityGraphics.lineStyle(2, 0xff6f00, alpha + 0.1);
        this.entityGraphics.strokePoints([
          { x: cx,      y: cy },
          { x: cx + hw, y: cy + hh },
          { x: cx,      y: cy + TILE_H },
          { x: cx - hw, y: cy + hh }
        ], true);
      }
    }
  }

  // ── Switch / Lever — 3D button ────────────────────────────────────────────────
  _drawSwitch(cx, cy, isOn) {
    const g = this.entityGraphics;
    const base = isOn ? 0xf9a825 : 0x4e342e;
    const top  = isOn ? 0xffee58 : 0x6d4c41;
    const glow = isOn ? 0xffee58 : 0xff6f00;
    if (isOn) { g.fillStyle(glow, 0.3); g.fillCircle(cx, cy, 16); }
    // base plate shadow
    g.fillStyle(0x000000, 0.4); g.fillRoundedRect(cx-10+2, cy-10+2, 20, 20, 3);
    // base plate
    g.fillStyle(base, 1); g.fillRoundedRect(cx-10, cy-10, 20, 20, 3);
    // top highlight
    g.fillStyle(0xffffff, 0.15); g.fillRoundedRect(cx-10, cy-10, 20, 6, {tl:3,tr:3,bl:0,br:0});
    // button
    g.fillStyle(isOn ? 0x000000 : 0x3e2723, 0.4); g.fillCircle(cx+1, cy+1, 6);
    g.fillStyle(top, 1); g.fillCircle(cx, cy, 6);
    g.fillStyle(0xffffff, isOn ? 0.5 : 0.2); g.fillCircle(cx-2, cy-2, 2.5);
    // indicator LED
    g.fillStyle(isOn ? 0x00e676 : 0xf44336, 1); g.fillCircle(cx+6, cy-6, 2);
  }

  _drawFallback(cx, cy, color) {
    const g = this.entityGraphics;
    g.fillStyle(color, 0.3); g.fillCircle(cx, cy, 13);
    g.fillStyle(color, 1); g.fillCircle(cx, cy, 10);
    g.fillStyle(0xffffff, 0.3); g.fillCircle(cx-3, cy-3, 3);
  }
}
