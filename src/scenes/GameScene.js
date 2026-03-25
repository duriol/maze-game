import Phaser from 'phaser';
import Player from '../entities/Player.js';
import IsometricRenderer from '../systems/IsometricRenderer.js';
import FogOfWarManager from '../systems/FogOfWarManager.js';
import TrapManager from '../systems/TrapManager.js';
import EnemyManager from '../systems/EnemyManager.js';
import ItemManager from '../systems/ItemManager.js';
import PuzzleManager from '../systems/PuzzleManager.js';
import AudioManager from '../systems/AudioManager.js';
import LevelManager from '../systems/LevelManager.js';
import level1 from '../data/level1.js';
import level2 from '../data/level2.js';
import level3 from '../data/level3.js';
import level4 from '../data/level4.js';
import level5 from '../data/level5.js';

const LEVELS = { 1: level1, 2: level2, 3: level3, 4: level4, 5: level5 };

// Tile type constants
const T = { FLOOR: 0, WALL: 1, ENTRANCE: 2, EXIT: 3, DOOR_CLOSED: 4, DOOR_OPEN: 5 };

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.startLevel = data.level || 1;
    this.startLives = data.lives || 3;
  }

  create() {
    const { width, height } = this.scale;
    const PANEL_W = 188, TOP_BAR = 64;
    const playX = PANEL_W, playY = TOP_BAR;
    const playW = width - PANEL_W * 2, playH = height - TOP_BAR;

    // Graphics objects for the map — clipped to play area
    this._tileGfx   = this.add.graphics();
    this._entityGfx = this.add.graphics().setDepth(100);
    this._fogGfx    = this.add.graphics().setDepth(500);

    // Apply a rectangular mask so map never bleeds into side panels or top bar
    const maskShape = this.make.graphics({ add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(playX, playY, playW, playH);
    const mask = maskShape.createGeometryMask();
    this._tileGfx.setMask(mask);
    this._entityGfx.setMask(mask);
    this._fogGfx.setMask(mask);

    // Transition overlay (black rect, fades in/out)
    this._fadeRect = this.add.graphics().setDepth(900);
    this._fadeRect.fillStyle(0x000000, 1);
    this._fadeRect.fillRect(0, 0, width, height);
    this._fadeRect.setAlpha(0);

    this._loadLevel(this.startLevel, this.startLives);
    this._initSounds();

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      sword: Phaser.Input.Keyboard.KeyCodes.E,
      full:  Phaser.Input.Keyboard.KeyCodes.F
    });

    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // Unlock Web Audio on first keypress (browser policy) and start music
    this.input.keyboard.once('keydown', () => {
      if (this._music) {
        // Unlock audio context if not already done
        if (!this._music.ctx) {
          this._music.unlock();
        }
        // Stop any previous music and start level music
        this._music.stop();
        if (this._music.ctx && this._music.ctx.state === 'suspended') {
          this._music.ctx.resume().then(() => {
            this._music.play(this.levelId);
          });
        } else {
          this._music.play(this.levelId);
        }
      }
    });

    // Fade in on start
    this.tweens.add({ targets: this._fadeRect, alpha: 0, duration: 400, ease: 'Linear' });

    this.time.delayedCall(0, () => {
      if (!this.scene.isActive('HUDScene')) this.scene.launch('HUDScene');
      this._emitHUD();
    });
  }

  // ── Procedural sounds via Web Audio API ──────────────────────────────────────
  _initSounds() {
    try {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this._audioCtx = null;
    }
    // Get the global music manager instead of creating a new one
    this._music = this.registry.get('musicManager');
  }

  _beep(freq, type, duration, volume = 0.3, delay = 0) {
    if (!this._audioCtx) return;
    try {
      const ctx = this._audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (e) { /* ignore */ }
  }

  _playSound(name) {
    switch (name) {
      case 'step':
        this._beep(180, 'sine', 0.06, 0.08);
        break;
      case 'damage':
        this._beep(120, 'sawtooth', 0.15, 0.4);
        this._beep(80,  'sawtooth', 0.2,  0.3, 0.1);
        break;
      case 'pickup':
        this._beep(660, 'sine', 0.08, 0.2);
        this._beep(880, 'sine', 0.08, 0.2, 0.09);
        break;
      case 'door_open':
        this._beep(300, 'square', 0.1, 0.2);
        this._beep(450, 'square', 0.1, 0.2, 0.12);
        this._beep(600, 'square', 0.1, 0.2, 0.24);
        break;
      case 'switch_ok':
        this._beep(500, 'sine', 0.1, 0.2);
        break;
      case 'switch_wrong':
        this._beep(200, 'sawtooth', 0.15, 0.3);
        break;
      case 'puzzle_solved':
        [440, 550, 660, 880].forEach((f, i) => this._beep(f, 'sine', 0.12, 0.25, i * 0.1));
        break;
      case 'sword':
        this._beep(800, 'sawtooth', 0.05, 0.3);
        this._beep(400, 'sawtooth', 0.1,  0.2, 0.05);
        break;
      case 'level_complete':
        [523, 659, 784, 1047].forEach((f, i) => this._beep(f, 'sine', 0.18, 0.3, i * 0.15));
        break;
      case 'game_over':
        [400, 300, 200, 150].forEach((f, i) => this._beep(f, 'sawtooth', 0.2, 0.35, i * 0.18));
        break;
      case 'thunder':
        // Thunder sound: low rumble + crack
        this._beep(80, 'sawtooth', 0.3, 0.8);
        this._beep(120, 'sawtooth', 0.25, 0.6, 0.1);
        this._beep(200, 'square', 0.2, 0.4, 0.2);
        this._beep(150, 'sawtooth', 0.15, 0.5, 0.35);
        break;
    }
  }

  _loadLevel(levelId, lives) {
    if (this._tileGfx)   this._tileGfx.clear();
    if (this._entityGfx) this._entityGfx.clear();
    if (this._fogGfx)    this._fogGfx.clear();

    this.mapData = LEVELS[levelId];
    this.levelId = levelId;
    this.tiles   = this.mapData.tiles.map(row => [...row]);

    // Difficulty scaling per level
    const diff = { 1: { visionR: 4, trapMult: 1.0, enemyMult: 1.0 },
                   2: { visionR: 3, trapMult: 1.5, enemyMult: 1.4 },
                   3: { visionR: 3, trapMult: 2.2, enemyMult: 2.0 },
                   4: { visionR: 3, trapMult: 2.5, enemyMult: 2.2 },
                   5: { visionR: 2, trapMult: 3.0, enemyMult: 2.5 } }[levelId] || { visionR: 3, trapMult: 1, enemyMult: 1 };

    this.player = new Player(this.mapData.entrance.x, this.mapData.entrance.y);
    this.player.lives = lives;
    this.player.visionRadius = diff.visionR;

    // Scale trap and enemy speeds by difficulty
    const scaledTraps   = this.mapData.traps.map(t => ({ ...t, speed: t.speed * diff.trapMult }));
    const scaledEnemies = this.mapData.enemies.map(e => ({ ...e, speed: e.speed * diff.enemyMult }));

    this.fog      = new FogOfWarManager(this._fogGfx, this.mapData.width, this.mapData.height, diff.visionR);
    this.renderer = new IsometricRenderer(this._tileGfx, this._entityGfx, this.mapData, this.scale.width, this.scale.height);

    this.trapManager   = new TrapManager(scaledTraps);
    this.enemyManager  = new EnemyManager(scaledEnemies);
    this.itemManager   = new ItemManager(this.mapData.items);
    this.puzzleManager = new PuzzleManager(this.mapData.puzzles, this.mapData.wallHints);
    this.audioManager  = new AudioManager(this);
    this.levelManager  = new LevelManager();
    this.levelManager.currentLevel = levelId;

    this.puzzleManager.onDoorOpen = (doorPos) => {
      this.tiles[doorPos.y][doorPos.x] = T.DOOR_OPEN;
      this._playSound('door_open');
      this.game.events.emit('hud-hint', '¡Puerta abierta!');
    };

    this.fog.recalculate(this.player.gridX, this.player.gridY);
    this.damageThisFrame = false;
    this._transitioning  = false;
    
    // Lightning system for level 5 (boss level)
    if (levelId === 5) {
      this._scheduleLightning();
    }
    
    // Start level music (only if already unlocked from first interaction)
    if (this._music && this._music.ctx) {
      this._music.stop();
      this.time.delayedCall(300, () => { 
        if (this._music) this._music.play(levelId); 
      });
    }
  }

  update(time, delta) {
    if (this._transitioning) return;
    this.damageThisFrame = false;

    // --- Player input ---
    const dir = this._getInputDirection();
    if (dir) {
      const moved = this.player.tryMove(dir, (nx, ny) => this._isWalkable(nx, ny));
      if (moved) {
        // Track last direction for sword slash
        const dirMap = { UP: [0,-1], DOWN: [0,1], LEFT: [-1,0], RIGHT: [1,0] };
        [this._lastDirDx, this._lastDirDy] = dirMap[dir];
        this._playSound('step');
        this.fog.recalculate(this.player.gridX, this.player.gridY);
        this._onPlayerMoved();
      }
    }

    // Sword use
    if (Phaser.Input.Keyboard.JustDown(this.wasd.sword)) {
      if (this.player.swordUses > 0) {
        const trap = this.trapManager.getAdjacentTrap(this.player.gridX, this.player.gridY);
        // Determine slash direction from last movement
        const dx = this._lastDirDx || 1;
        const dy = this._lastDirDy || 0;
        this.renderer.triggerSwordFlash(dx, dy);
        
        // Decrementar usos de espada
        this.player.swordUses--;
        if (this.player.swordUses === 0) {
          // Remover espada del inventario cuando se acaban los usos
          const swordIdx = this.player.inventory.indexOf('SWORD');
          if (swordIdx !== -1) this.player.inventory.splice(swordIdx, 1);
        }
        this._emitHUD();
        
        if (trap) {
          this.trapManager.disableTrap(trap.id);
          this._playSound('sword');
        }
      }
    }

    this.player.update(delta);

    // --- Update systems ---
    this.fog.update(delta);
    this.trapManager.update(delta);
    this.enemyManager.update(delta);

    // --- Collision checks ---
    if (!this.damageThisFrame) {
      if (this.trapManager.checkCollision(this.player.gridX, this.player.gridY)) {
        this._damagePlayer();
      }
    }
    if (!this.damageThisFrame) {
      if (this.enemyManager.checkCollision(this.player.gridX, this.player.gridY)) {
        this._damagePlayer();
      }
    }

    // --- Torch HUD update ---
    if (this.fog.torchTimer > 0) {
      this.game.events.emit('hud-torch', {
        remaining: this.fog.torchTimer,
        total: 30000
      });
    }

    // --- Render ---
    this.renderer.followPlayer(this.player.visualX, this.player.visualY);
    this.renderer.drawMap(this.fog, this.tiles, delta);
    this.renderer.clearEntities();
    this._renderEntities();
    if (this.renderer.swordFlash > 0) {
      this.renderer.drawSwordSlash(
        this.player.visualX, this.player.visualY,
        this._lastDirDx || 1, this._lastDirDy || 0
      );
    }
    this.fog.renderFog(this.renderer.offsetX, this.renderer.offsetY);

    this._emitHUD();
  }

  _getInputDirection() {
    const { up, down, left, right } = this.cursors;
    const w = this.wasd;
    if (Phaser.Input.Keyboard.JustDown(up)    || Phaser.Input.Keyboard.JustDown(w.up))    return 'UP';
    if (Phaser.Input.Keyboard.JustDown(down)  || Phaser.Input.Keyboard.JustDown(w.down))  return 'DOWN';
    if (Phaser.Input.Keyboard.JustDown(left)  || Phaser.Input.Keyboard.JustDown(w.left))  return 'LEFT';
    if (Phaser.Input.Keyboard.JustDown(right) || Phaser.Input.Keyboard.JustDown(w.right)) return 'RIGHT';
    return null;
  }

  _isWalkable(nx, ny) {
    if (nx < 0 || ny < 0 || nx >= this.mapData.width || ny >= this.mapData.height) return false;
    const tile = this.tiles[ny][nx];
    if (tile === T.WALL) return false;
    if (tile === T.DOOR_CLOSED) {
      // Auto-use key if player has one
      if (this.player.hasKey()) {
        this.player.useKey();
        this.tiles[ny][nx] = T.DOOR_OPEN;
        this._playSound('door_open');
        return true;
      }
      return false;
    }
    return true;
  }

  _onPlayerMoved() {
    const { gridX: px, gridY: py } = this.player;

    // Item pickup
    const item = this.itemManager.checkPickup(px, py);
    if (item) {
      this.player.pickupItem(item);
      this._playSound('pickup');
      if (item.type === 'TORCH') {
        this.fog.activateTorch(30000);
      }
    }

    // Switch activation
    const result = this.puzzleManager.tryActivateSwitch(px, py);
    if (result) {
      if (result.reset) {
        this._playSound('switch_wrong');
        this.game.events.emit('hud-hint', 'Secuencia incorrecta. Inténtalo de nuevo.');
      } else if (result.solved) {
        this._playSound('puzzle_solved');
      } else {
        this._playSound('switch_ok');
      }
    }

    // Wall hints
    const hint = this.puzzleManager.getAdjacentHint(px, py);
    if (hint) {
      this.game.events.emit('hud-hint', hint);
    }

    // Level complete check
    if (this.levelManager.checkLevelComplete(px, py, this.mapData.exit)) {
      this._onLevelComplete();
    }
  }

  _damagePlayer() {
    if (this.damageThisFrame) return;
    this.damageThisFrame = true;
    const damaged = this.player.takeDamage();
    if (damaged) {
      this._playSound('damage');
      this.cameras.main.shake(200, 0.01);
    }
    if (!this.player.isAlive()) {
      this._onGameOver();
    }
  }

  _onLevelComplete() {
    this._transitioning = true;
    if (this._music) this._music.stop();
    this._playSound('level_complete');

    if (this.levelManager.isLastLevel()) {
      this.levelManager.clearProgress();
      if (this._music) this._music.stop();
      this._fadeOut(700, () => {
        this.scene.stop('HUDScene');
        this.scene.start('VictoryScene');
      });
    } else {
      const nextLevel = this.levelManager.nextLevel();
      this.levelManager.saveProgress(this.player.lives);
      // Fade out → show level card → fade in new level
      if (this._music) this._music.stop();
      this._fadeOut(500, () => {
        this._showLevelCard(nextLevel, () => {
          this.scene.stop('HUDScene');
          this.scene.start('GameScene', { level: nextLevel, lives: this.player.lives });
        });
      });
    }
  }

  _onGameOver() {
    this._transitioning = true;
    if (this._music) this._music.stop();
    this._playSound('game_over');
    this.cameras.main.shake(300, 0.015);
    this._fadeOut(600, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { level: this.levelId });
    });
  }

  _fadeOut(duration, onComplete) {
    this.tweens.add({
      targets: this._fadeRect,
      alpha: 1,
      duration,
      ease: 'Linear',
      onComplete
    });
  }

  _showLevelCard(levelId, onComplete) {
    const { width, height } = this.scale;
    // Black background already visible from fade
    const title = this.add.text(width / 2, height / 2 - 30,
      `NIVEL ${levelId}`, {
        fontSize: '72px', fontFamily: 'monospace',
        fill: '#ffd54f', stroke: '#000', strokeThickness: 6
      }).setOrigin(0.5).setDepth(950).setAlpha(0);

    const sub = this.add.text(width / 2, height / 2 + 40,
      levelId === 2 ? '— Las criaturas despiertan —' : '— La oscuridad te consume —', {
        fontSize: '22px', fontFamily: 'monospace',
        fill: '#aaaaaa'
      }).setOrigin(0.5).setDepth(950).setAlpha(0);

    // Fade in text, hold, then proceed
    this.tweens.add({
      targets: [title, sub], alpha: 1, duration: 400, ease: 'Linear',
      onComplete: () => {
        this.time.delayedCall(1200, () => {
          title.destroy(); sub.destroy();
          onComplete();
        });
      }
    });
  }

  _renderEntities() {
    // Use visual (interpolated) position for smooth movement
    this.renderer.drawEntity(this.player.visualX, this.player.visualY, 'PLAYER');
    
    // Draw equipped items and active inventory around player
    this.renderer.drawPlayerEquipment(
      this.player.visualX, 
      this.player.visualY, 
      this.player,
      this.time.now
    );

    // Traps (only if visible)
    for (const trap of this.trapManager.getTraps()) {
      const gx = Math.round(trap.posX);
      const gy = Math.round(trap.posY);
      if (this.fog.isVisible(gx, gy)) {
        const colorKey = `TRAP_${trap.type}`;
        this.renderer.drawEntity(trap.posX, trap.posY, colorKey);
      }
    }

    // Enemies (only if visible)
    for (const enemy of this.enemyManager.getEnemies()) {
      const gx = Math.round(enemy.posX);
      const gy = Math.round(enemy.posY);
      if (this.fog.isVisible(gx, gy)) {
        this.renderer.drawEntity(enemy.posX, enemy.posY, 'ENEMY', this.levelId, enemy.id);
      }
    }

    // Items (only if visible)
    for (const item of this.itemManager.getActiveItems()) {
      if (this.fog.isVisible(item.gridX, item.gridY)) {
        this.renderer.drawEntity(item.gridX, item.gridY, `ITEM_${item.type.split('_')[0]}`);
      }
    }

    // Switches (only if visible)
    for (const sw of this.puzzleManager.getSwitches()) {
      if (this.fog.isVisible(sw.gridX, sw.gridY)) {
        const colorKey = sw.activated ? 'SWITCH_ON' : 'SWITCH_OFF';
        this.renderer.drawEntity(sw.gridX, sw.gridY, colorKey);
      }
    }
  }

  _emitHUD() {
    this.game.events.emit('hud-update', {
      lives: this.player.lives,
      level: this.levelId,
      inventory: this.player.inventory,
      swordUses: this.player.swordUses,
      hasShield: this.player.hasShield
    });
  }

  // ── Lightning System (Level 5 only) ───────────────────────────────────────────
  _scheduleLightning() {
    if (this._transitioning) return;
    // Random delay between 8-15 seconds
    const delay = 8000 + Math.random() * 7000;
    this.time.delayedCall(delay, () => {
      this._triggerLightning();
      this._scheduleLightning(); // Schedule next lightning
    });
  }

  _triggerLightning() {
    if (this._transitioning || !this.fog) return;
    
    // Thunder sound effect
    this._playSound('thunder');
    
    // Activate lightning - make everything visible
    this.fog.lightningActive = true;
    
    // Flash effect - white overlay
    const flash = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0xffffff,
      0.8
    );
    flash.setDepth(1000);
    
    // Fade out flash quickly
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
    
    // Deactivate lightning after 1 second
    this.time.delayedCall(1000, () => {
      if (this.fog) this.fog.lightningActive = false;
    });
  }

  shutdown() {
    if (this._music) this._music.stop();
  }
}
