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
  constructor(tileGfx, entityGfx, mapData, sceneWidth, sceneHeight, panelW = 188) {
    this.tileGraphics = tileGfx;
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
      // Blink if time is low (less than 3 seconds remaining)
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

  drawMap(fogManager, tiles, delta = 0) {
    if (this.swordFlash > 0) this.swordFlash -= delta;
    this.tileGraphics.clear();
    const { width, height } = this.mapData;

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
          this._isoWall(cx, y, tile, alpha);
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
      case 2: // ENTRANCE
        topColor   = C.ENT_TOP;
        leftColor  = C.ENT_LEFT;
        rightColor = C.ENT_RIGHT;
        symbol = 'entrance';
        break;
      case 3: // EXIT
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

    // Symbols
    if (symbol === 'entrance') {
      g.fillStyle(0xffffff, alpha * 0.85);
      g.fillTriangle(cx, ty + TILE_H - 6, cx - 6, ty + 8, cx + 6, ty + 8);
      g.fillStyle(0x000000, alpha * 0.2);
      g.fillTriangle(cx + 1, ty + TILE_H - 5, cx - 5, ty + 9, cx + 7, ty + 9);
    } else if (symbol === 'exit') {
      g.fillStyle(0xffffff, alpha * 0.9);
      g.fillCircle(cx, ty + hh, 5);
      g.fillStyle(0xff1744, alpha);
      g.fillCircle(cx, ty + hh, 3);
      g.fillStyle(0xffffff, alpha * 0.9);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.fillRect(cx + Math.cos(a) * 6 - 1, ty + hh + Math.sin(a) * 4 - 1, 2, 2);
      }
    }
  }

  // ── Isometric wall block — top face + two visible side faces ─────────────────
  _isoWall(cx, ty, type, alpha) {
    const g   = this.tileGraphics;
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
      // Bars on left face
      g.fillStyle(0x9c27b0, alpha * 0.6);
      for (let i = 0; i < 2; i++) {
        const t2 = (i + 1) / 3;
        const bx = left.x  + (bot.x  - left.x)  * t2;
        const by = left.y  + (bot.y  - left.y)   * t2;
        g.fillRect(bx - 2, by, 4, wh);
        g.fillStyle(0xce93d8, alpha * 0.3);
        g.fillRect(bx - 2, by, 1, wh);
        g.fillStyle(0x9c27b0, alpha * 0.6);
      }
      // Lock on top face
      g.fillStyle(0xffd54f, alpha * 0.9);
      g.fillCircle(cx, ty + hh, 4);
      g.fillStyle(0x000000, alpha * 0.5);
      g.fillCircle(cx, ty + hh, 2);
    }
  }

  clearEntities() { this.entityGraphics.clear(); }

  _shadow(cx, cy, rx = 12, ry = 5) {
    const g = this.entityGraphics;
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(cx, cy + TILE_H * 0.6, rx * 2, ry * 2);
  }

  drawEntity(gx, gy, colorKey, levelId = 1, entityId = 'e0') {
    const s  = tileToScreen(gx, gy);
    const cx = s.x + this.offsetX + TILE_W / 2;
    const cy = s.y + this.offsetY + TILE_H / 2;
    this._shadow(cx, cy);
    if      (colorKey === 'PLAYER')       this._drawKiroGhost(cx, cy);
    else if (colorKey === 'ENEMY')        this._drawEnemy(cx, cy, gx, gy, levelId, entityId);
    else if (colorKey === 'ITEM_TORCH')   this._drawTorch(cx, cy);
    else if (colorKey === 'ITEM_HEALTH')  this._drawHealthPotion(cx, cy);
    else if (colorKey === 'ITEM_KEY')     this._drawKey(cx, cy);
    else if (colorKey === 'ITEM_SWORD')   this._drawSwordItem(cx, cy);
    else if (colorKey === 'ITEM_SHIELD')  this._drawShieldItem(cx, cy);
    else if (colorKey.startsWith('TRAP_')) this._drawTrap(cx, cy, colorKey);
    else if (colorKey === 'SWITCH_OFF' || colorKey === 'SWITCH_ON') this._drawSwitch(cx, cy, colorKey === 'SWITCH_ON');
    else this._drawFallback(cx, cy, 0xffffff);
  }

  _drawEnemy(cx, cy, gx, gy, levelId, entityId) {
    if (levelId === 1) {
      this._drawAWSEnemy(cx, cy, gx, gy);
    } else {
      const idNum = parseInt(entityId.replace(/\D/g, ''), 10) || 0;
      const variant = (idNum + gx + gy) % 3;
      const big = levelId >= 3;
      if (variant === 0)      this._drawBat(cx, cy, big);
      else if (variant === 1) this._drawWolf(cx, cy, big);
      else                    this._drawSpider(cx, cy, big);
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

  // ── Kiro Ghost ────────────────────────────────────────────────────────────────
  _drawKiroGhost(cx, cy) {
    const g = this.entityGraphics, r = 14;
    // outer glow
    g.fillStyle(0x7c4dff, 0.15); g.fillCircle(cx, cy-2, r+10);
    g.fillStyle(0xb39ddb, 0.25); g.fillCircle(cx, cy-2, r+6);
    // body base
    g.fillStyle(0xede7f6, 1); g.fillCircle(cx, cy-4, r); g.fillRect(cx-r, cy-4, r*2, r+2);
    // body shading — right side darker
    g.fillStyle(0xb39ddb, 0.35); g.fillRect(cx+2, cy-4, r-2, r+2);
    // wavy bottom
    const br = r/3;
    g.fillStyle(0x1a1a2e, 1);
    for (let i=0;i<3;i++) g.fillCircle(cx-r+br+i*br*2, cy+r-2, br);
    g.fillStyle(0xede7f6, 1);
    for (let i=0;i<2;i++) g.fillCircle(cx-r+br*2+i*br*2, cy+r-2, br*0.7);
    // eyes
    g.fillStyle(0x7c4dff, 1); g.fillCircle(cx-5, cy-6, 4); g.fillCircle(cx+5, cy-6, 4);
    g.fillStyle(0xffffff, 0.9); g.fillCircle(cx-4, cy-7, 1.5); g.fillCircle(cx+6, cy-7, 1.5);
    // highlight on top
    g.fillStyle(0xffffff, 0.3); g.fillEllipse(cx-3, cy-12, 10, 5);
  }

  // ── Creature enemies (level 2+) ───────────────────────────────────────────────

  _drawBat(cx, cy, big) {
    const g = this.entityGraphics, s = big ? 1.5 : 1.0, t = Date.now();
    const flap = Math.sin(t * 0.015) * 8 * s;
    // glow
    g.fillStyle(0x4a0080, 0.25); g.fillCircle(cx, cy, 20*s);
    // wings
    g.fillStyle(0x1a0030, 1);
    g.fillTriangle(cx-2*s, cy, cx-18*s, cy-10*s+flap, cx-12*s, cy+8*s);
    g.fillTriangle(cx+2*s, cy, cx+18*s, cy-10*s+flap, cx+12*s, cy+8*s);
    g.fillStyle(0x6a0080, 0.55);
    g.fillTriangle(cx-2*s, cy, cx-15*s, cy-7*s+flap*0.8, cx-9*s, cy+6*s);
    g.fillTriangle(cx+2*s, cy, cx+15*s, cy-7*s+flap*0.8, cx+9*s, cy+6*s);
    // wing veins
    g.lineStyle(1*s, 0x4a0072, 0.5);
    g.lineBetween(cx-2*s, cy, cx-14*s, cy-6*s+flap*0.7);
    g.lineBetween(cx-2*s, cy, cx-10*s, cy+5*s);
    g.lineBetween(cx+2*s, cy, cx+14*s, cy-6*s+flap*0.7);
    g.lineBetween(cx+2*s, cy, cx+10*s, cy+5*s);
    // body
    g.fillStyle(0x2d0050, 1); g.fillEllipse(cx, cy, 12*s, 14*s);
    g.fillStyle(0x6a0080, 0.4); g.fillEllipse(cx-2*s, cy-2*s, 5*s, 7*s);
    // head
    g.fillStyle(0x1a0030, 1); g.fillCircle(cx, cy-8*s, 6*s);
    g.fillStyle(0x2d0050, 1); g.fillCircle(cx, cy-8*s, 5*s);
    // ears
    g.fillStyle(0x1a0030, 1);
    g.fillTriangle(cx-4*s, cy-11*s, cx-7*s, cy-19*s, cx-1*s, cy-13*s);
    g.fillTriangle(cx+4*s, cy-11*s, cx+7*s, cy-19*s, cx+1*s, cy-13*s);
    g.fillStyle(0xce93d8, 0.5);
    g.fillTriangle(cx-4*s, cy-12*s, cx-6*s, cy-17*s, cx-2*s, cy-13*s);
    g.fillTriangle(cx+4*s, cy-12*s, cx+6*s, cy-17*s, cx+2*s, cy-13*s);
    // eyes
    g.fillStyle(0xff1744, 1); g.fillCircle(cx-2*s, cy-8*s, 2*s); g.fillCircle(cx+2*s, cy-8*s, 2*s);
    g.fillStyle(0xff8a80, 0.8); g.fillCircle(cx-2*s, cy-9*s, 0.7*s); g.fillCircle(cx+2*s, cy-9*s, 0.7*s);
    // fangs
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(cx-2*s, cy-4*s, cx-1*s, cy-4*s, cx-1.5*s, cy-1*s);
    g.fillTriangle(cx+1*s, cy-4*s, cx+2*s, cy-4*s, cx+1.5*s, cy-1*s);
    if (big) { g.fillStyle(0x9c27b0, 0.15+Math.sin(t*0.008)*0.1); g.fillCircle(cx, cy, 26); }
  }

  _drawWolf(cx, cy, big) {
    const g = this.entityGraphics, s = big ? 1.5 : 1.0, t = Date.now();
    const pulse = Math.sin(t * 0.006) * 0.08;

    // Outer glow
    g.fillStyle(0x1565c0, 0.15 + pulse);
    g.fillCircle(cx, cy, 22 * s);

    // The Kiro "A" shape — arch with two legs and curved inner arch
    // Drawn as layered filled polygons to simulate the blue→orange gradient

    // Shadow / depth
    g.fillStyle(0x0d47a1, 0.5);
    this._kiroArch(g, cx + 2*s, cy + 2*s, s, 0x0d47a1);

    // Base blue (bottom/legs)
    this._kiroArch(g, cx, cy, s, 0x1e88e5);

    // Mid blue-cyan layer (lower arch body)
    g.fillStyle(0x29b6f6, 0.7);
    this._kiroArchInner(g, cx, cy, s);

    // Green transition (mid arch)
    g.fillStyle(0x26a69a, 0.55);
    g.fillEllipse(cx, cy - 4*s, 18*s, 14*s);

    // Yellow-orange (upper arch)
    g.fillStyle(0xffa726, 0.6);
    g.fillEllipse(cx, cy - 9*s, 12*s, 10*s);

    // Red-orange peak (very top)
    g.fillStyle(0xef5350, 0.65);
    g.fillEllipse(cx, cy - 13*s, 8*s, 7*s);

    // Bright orange highlight at apex
    g.fillStyle(0xff7043, 0.8);
    g.fillCircle(cx, cy - 15*s, 3.5*s);

    // Inner arch cutout (the negative space between the legs)
    g.fillStyle(0x1a1a2e, 1);
    g.fillEllipse(cx, cy + 2*s, 10*s, 7*s);

    // Leg bottoms — rounded feet
    g.fillStyle(0x1565c0, 1);
    g.fillEllipse(cx - 10*s, cy + 8*s, 7*s, 5*s);
    g.fillEllipse(cx + 10*s, cy + 8*s, 7*s, 5*s);

    // Specular highlight on left side of arch
    g.fillStyle(0xffffff, 0.15);
    g.fillEllipse(cx - 5*s, cy - 8*s, 5*s, 12*s);

    if (big) {
      g.fillStyle(0x42a5f5, 0.12 + pulse);
      g.fillCircle(cx, cy, 28);
    }
  }

  // Helper: draw the outer Kiro arch shape (two legs + arch top)
  _kiroArch(g, cx, cy, s, color) {
    g.fillStyle(color, 1);
    // Left leg
    g.fillEllipse(cx - 10*s, cy + 4*s, 8*s, 20*s);
    // Right leg
    g.fillEllipse(cx + 10*s, cy + 4*s, 8*s, 20*s);
    // Arch body connecting them
    g.fillEllipse(cx, cy - 4*s, 28*s, 22*s);
  }

  // Helper: inner arch highlight layer
  _kiroArchInner(g, cx, cy, s) {
    g.fillStyle(0x42a5f5, 0.6);
    g.fillEllipse(cx - 8*s, cy, 6*s, 18*s);
    g.fillEllipse(cx + 8*s, cy, 6*s, 18*s);
    g.fillEllipse(cx, cy - 5*s, 22*s, 18*s);
  }

  _drawSpider(cx, cy, big) {
    const g = this.entityGraphics, s = big ? 1.5 : 1.0, t = Date.now();
    const lw = Math.sin(t * 0.01) * 3 * s;
    // glow
    g.fillStyle(0x1b5e20, 0.2); g.fillCircle(cx, cy, 20*s);
    // 8 legs with elbow bends
    g.lineStyle(2*s, 0x1a1a1a, 1);
    const legs = [
      [cx-6*s,cy-2*s, cx-14*s,cy-8*s+lw,  cx-20*s,cy-4*s+lw],
      [cx-6*s,cy,     cx-15*s,cy+lw,       cx-21*s,cy+4*s],
      [cx-6*s,cy+2*s, cx-14*s,cy+8*s-lw,  cx-18*s,cy+12*s],
      [cx-6*s,cy+4*s, cx-12*s,cy+10*s,    cx-14*s,cy+16*s],
      [cx+6*s,cy-2*s, cx+14*s,cy-8*s-lw,  cx+20*s,cy-4*s-lw],
      [cx+6*s,cy,     cx+15*s,cy-lw,       cx+21*s,cy+4*s],
      [cx+6*s,cy+2*s, cx+14*s,cy+8*s+lw,  cx+18*s,cy+12*s],
      [cx+6*s,cy+4*s, cx+12*s,cy+10*s,    cx+14*s,cy+16*s],
    ];
    for (const [x1,y1,mx,my,x2,y2] of legs) {
      g.lineBetween(x1,y1,mx,my); g.lineBetween(mx,my,x2,y2);
    }
    // abdomen
    g.fillStyle(0x1b5e20, 1); g.fillEllipse(cx+4*s, cy+4*s, 18*s, 16*s);
    g.fillStyle(0x2e7d32, 0.6); g.fillEllipse(cx+4*s, cy+2*s, 10*s, 8*s);
    g.fillStyle(0x000000, 0.35);
    for (let i=0;i<3;i++) g.fillEllipse(cx+4*s, cy+i*4*s, 4*s, 2*s);
    g.fillStyle(0x66bb6a, 0.25); g.fillEllipse(cx+2*s, cy+1*s, 6*s, 5*s);
    // hourglass marking (like black widow)
    g.fillStyle(0xff1744, 0.8); g.fillEllipse(cx+4*s, cy+5*s, 5*s, 3*s);
    // cephalothorax
    g.fillStyle(0x212121, 1); g.fillEllipse(cx-3*s, cy, 12*s, 10*s);
    g.fillStyle(0x424242, 0.4); g.fillEllipse(cx-4*s, cy-1*s, 7*s, 5*s);
    // 8 eyes
    g.fillStyle(0x00e676, 1);
    const eyes = [[-6,-4],[-4,-5],[-2,-5],[0,-4],[-5,-2],[-3,-3],[-1,-3],[1,-2]];
    for (const [ex,ey] of eyes) g.fillCircle(cx+ex*s, cy+ey*s, 1.2*s);
    // chelicerae/fangs
    g.fillStyle(0x4caf50, 1);
    g.fillTriangle(cx-8*s,cy+3*s, cx-6*s,cy+3*s, cx-7*s,cy+7*s);
    g.fillTriangle(cx-5*s,cy+3*s, cx-3*s,cy+3*s, cx-4*s,cy+7*s);
    g.fillStyle(0x1b5e20, 1);
    g.fillCircle(cx-7*s, cy+6*s, 1.5*s); g.fillCircle(cx-4*s, cy+6*s, 1.5*s);
    if (big) { g.fillStyle(0x00c853, 0.12+Math.sin(t*0.009)*0.1); g.fillCircle(cx, cy, 28); }
  }

  // ── AWS Enemies (level 1) ─────────────────────────────────────────────────────
  _drawAWSEnemy(cx, cy, gx, gy) {
    const variant = (gx * 3 + gy * 7) % 8;
    switch (variant) {
      case 0: this._iconLambda(cx, cy);     break;
      case 1: this._iconAPIGateway(cx, cy); break;
      case 2: this._iconS3(cx, cy);         break;
      case 3: this._iconDynamo(cx, cy);     break;
      case 4: this._iconKinesis(cx, cy);    break;
      case 5: this._iconIAM(cx, cy);        break;
      case 6: this._iconCloudWatch(cx, cy); break;
      case 7: this._iconSNS(cx, cy);        break;
    }
  }

  _badge(cx, cy, bg, shadow) {
    const g = this.entityGraphics, r = 15, d = 3;
    g.fillStyle(shadow, 0.9);
    g.fillRoundedRect(cx-r+d, cy-r+d, r*2, r*2, 6);
    g.fillStyle(bg, 1);
    g.fillRoundedRect(cx-r, cy-r, r*2, r*2, 6);
    g.fillStyle(0xffffff, 0.20);
    g.fillRoundedRect(cx-r, cy-r, r*2, 6, { tl:6, tr:6, bl:0, br:0 });
    g.fillStyle(0xffffff, 0.10);
    g.fillRoundedRect(cx-r, cy-r, 5, r*2, { tl:6, tr:0, bl:6, br:0 });
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(cx-r, cy+r-5, r*2, 5, { tl:0, tr:0, bl:6, br:6 });
  }

  // Lambda — orange, λ
  _iconLambda(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xe8651a, 0x7a2e00);
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(cx-7, cy-8, cx-1, cy+8);
    g.lineBetween(cx-1, cy+8, cx+7, cy-8);
    g.lineBetween(cx-7, cy-8, cx-3, cy-8);
    this._smile(cx, cy+11);
  }

  // API Gateway — orange, </>
  _iconAPIGateway(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xe8651a, 0x7a2e00);
    g.lineStyle(2.5, 0xffffff, 1);
    g.lineBetween(cx-4, cy-7, cx-9, cy); g.lineBetween(cx-9, cy, cx-4, cy+7);
    g.lineBetween(cx+4, cy-7, cx+9, cy); g.lineBetween(cx+9, cy, cx+4, cy+7);
    g.lineBetween(cx+3, cy-7, cx-3, cy+7);
    this._smile(cx, cy+11);
  }

  // S3 — green, open bucket
  _iconS3(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0x3f8624, 0x1a4a0a);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx-8, cy-5, 16, 13);
    g.fillEllipse(cx, cy+8, 16, 6);
    g.fillStyle(0x3f8624, 1);
    g.fillEllipse(cx, cy-5, 16, 6);
    g.lineStyle(2, 0xffffff, 1);
    g.strokeEllipse(cx, cy-5, 16, 6);
    g.fillStyle(0x3f8624, 0.5);
    g.fillRect(cx-8, cy-1, 16, 2);
    this._smile(cx, cy+11);
  }

  // DynamoDB — blue, stacked cylinders
  _iconDynamo(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0x1a6faf, 0x0a2e55);
    const cyl = (y, h) => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx-7, y, 14, h);
      g.fillEllipse(cx, y, 14, 5);
      g.fillStyle(0x1a6faf, 1);
      g.fillEllipse(cx, y+h, 14, 5);
      g.lineStyle(1.5, 0xffffff, 1);
      g.strokeEllipse(cx, y+h, 14, 5);
    };
    cyl(cy-11, 5); cyl(cy-3, 5); cyl(cy+5, 4);
    this._smile(cx, cy+12);
  }

  // Kinesis — orange, streaming waves + play arrow
  _iconKinesis(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xe8651a, 0x7a2e00);
    g.lineStyle(2.5, 0xffffff, 1);
    for (let i = 0; i < 3; i++) {
      const y = cy-6+i*5;
      g.beginPath(); g.arc(cx-4, y, 4, Math.PI*1.5, Math.PI*0.5, false); g.strokePath();
      g.beginPath(); g.arc(cx+4, y, 4, Math.PI*0.5, Math.PI*1.5, false); g.strokePath();
    }
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx+5, cy-5, cx+5, cy+5, cx+11, cy);
    this._smile(cx, cy+11);
  }

  // IAM — red, shield with lock
  _iconIAM(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xdd344c, 0x7a0010);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx, cy+10, cx-9, cy-4, cx+9, cy-4);
    g.fillRect(cx-9, cy-10, 18, 8);
    g.fillStyle(0xdd344c, 1);
    g.fillRoundedRect(cx-4, cy-3, 8, 7, 2);
    g.lineStyle(2, 0xdd344c, 1);
    g.beginPath(); g.arc(cx, cy-4, 3, Math.PI, 0, false); g.strokePath();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy, 1.5);
    g.fillRect(cx-1, cy, 2, 3);
    this._smile(cx, cy+11);
  }

  // CloudWatch — pink, magnifier with cloud
  _iconCloudWatch(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xe7157b, 0x7a0040);
    g.lineStyle(2.5, 0xffffff, 1);
    g.strokeCircle(cx-2, cy-3, 8);
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(cx+4, cy+3, cx+9, cy+9);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx-4, cy-2, 2.5); g.fillCircle(cx-1, cy-4, 3); g.fillCircle(cx+2, cy-2, 2.5);
    g.fillRect(cx-4, cy-2, 9, 3);
    this._smile(cx, cy+11);
  }

  // SNS — pink, funnel/filter
  _iconSNS(cx, cy) {
    const g = this.entityGraphics;
    this._badge(cx, cy, 0xe7157b, 0x7a0040);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx-9, cy-8, cx+9, cy-8, cx+3, cy);
    g.fillTriangle(cx-9, cy-8, cx-3, cy, cx+3, cy);
    g.fillRect(cx-2, cy, 4, 8);
    g.fillCircle(cx+7, cy-10, 3);
    g.fillStyle(0xe7157b, 1);
    g.fillCircle(cx+7, cy-10, 1.5);
    this._smile(cx, cy+11);
  }

  // AWS smile-arrow
  _smile(cx, cy) {
    const g = this.entityGraphics;
    g.lineStyle(1.8, 0xffffff, 0.85);
    g.beginPath();
    g.arc(cx, cy-1, 7, 0.3, Math.PI-0.3, false);
    g.strokePath();
    const ex = cx + Math.cos(Math.PI-0.3)*7;
    const ey = cy-1 + Math.sin(Math.PI-0.3)*7;
    g.fillStyle(0xffffff, 0.85);
    g.fillTriangle(ex-1, ey-3, ex+4, ey+1, ex-1, ey+3);
  }

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

    if (colorKey === 'TRAP_PROJECTILE') {
      // Glowing orb projectile
      g.fillStyle(0xff6f00, 0.2+pulse); g.fillCircle(cx, cy, 14);
      g.fillStyle(0xff3d00, 1); g.fillCircle(cx, cy, 9);
      g.fillStyle(0xff6d00, 1); g.fillCircle(cx, cy, 7);
      g.fillStyle(0xffca28, 1); g.fillCircle(cx, cy, 4);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(cx-2, cy-2, 2);
      // trail
      g.fillStyle(0xff6d00, 0.4); g.fillEllipse(cx-6, cy, 8, 5);
      g.fillStyle(0xffca28, 0.2); g.fillEllipse(cx-10, cy, 6, 3);
    } else if (colorKey === 'TRAP_PENDULUM') {
      // Spiked ball on chain
      g.fillStyle(0xb71c1c, 0.2+pulse); g.fillCircle(cx, cy, 14);
      // chain link
      g.lineStyle(2, 0x757575, 1); g.lineBetween(cx, cy-14, cx, cy-8);
      // ball shadow
      g.fillStyle(0x7f0000, 0.8); g.fillCircle(cx+2, cy+2, 10);
      // ball
      g.fillStyle(0xc62828, 1); g.fillCircle(cx, cy, 10);
      g.fillStyle(0xef5350, 0.6); g.fillCircle(cx, cy, 8);
      // spikes
      for (let i=0;i<6;i++) {
        const a = (i/6)*Math.PI*2;
        g.fillStyle(0x9e0000, 1);
        g.fillTriangle(cx+Math.cos(a)*8, cy+Math.sin(a)*8, cx+Math.cos(a+0.3)*12, cy+Math.sin(a+0.3)*12, cx+Math.cos(a-0.3)*12, cy+Math.sin(a-0.3)*12);
      }
      g.fillStyle(0xffffff, 0.3); g.fillCircle(cx-3, cy-3, 3);
    } else {
      // MOVING_WALL / SPIKE — glowing blade
      g.fillStyle(0xff5722, 0.2+pulse); g.fillCircle(cx, cy, 14);
      g.fillStyle(0xbf360c, 0.8); g.fillRect(cx-10+2, cy-10+2, 20, 20);
      g.fillStyle(0xff5722, 1); g.fillRect(cx-10, cy-10, 20, 20);
      g.fillStyle(0xff8a65, 0.5); g.fillRect(cx-10, cy-10, 8, 20);
      g.fillStyle(0xffffff, 0.2); g.fillRect(cx-10, cy-10, 20, 5);
      // spike tips
      g.fillStyle(0xffffff, 0.8);
      g.fillTriangle(cx, cy-10, cx-4, cy-6, cx+4, cy-6);
      g.fillTriangle(cx, cy+10, cx-4, cy+6, cx+4, cy+6);
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
