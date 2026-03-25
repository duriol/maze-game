import Phaser from 'phaser';
import LevelManager from '../systems/LevelManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    const lm = new LevelManager();

    // Get the global music manager
    this._music = this.registry.get('musicManager');
    
    // Start music - if audio is already unlocked, start immediately
    // Otherwise wait for first interaction
    const startMusic = () => {
      if (this._music) {
        if (!this._music.ctx) {
          this._music.unlock();
        }
        // Stop any previous music and start menu music
        this._music.stop();
        this._music.play('menu');
      }
    };
    
    // If audio context exists (already unlocked), start music now
    if (this._music && this._music.ctx) {
      startMusic();
    } else {
      // First time - wait for user interaction
      this.input.keyboard.once('keydown', startMusic);
      this.input.once('pointerdown', startMusic);
    }

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a0f0a, 0x1a0f0a, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative iso tiles in background
    this._drawDecorativeTiles(width, height);

    // Floating particles (mystical dust)
    this._createFloatingParticles(width, height);

    // Animated 3D isometric cubes
    this._create3DCubes(width, height);

    // Fog effect
    this._createFogEffect(width, height);

    // Title with glow and pulse
    const title = this.add.text(width / 2, height * 0.18, 'LABERINTO', {
      fontSize: '72px',
      fontFamily: 'monospace',
      fill: '#ffd54f',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    // Title glow
    const titleGlow = this.add.text(width / 2, height * 0.18, 'LABERINTO', {
      fontSize: '72px',
      fontFamily: 'monospace',
      fill: '#ff6f00',
      stroke: '#ff9800',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    // Animate title entrance
    this.tweens.add({
      targets: [title, titleGlow],
      alpha: 1,
      y: '-=20',
      duration: 1000,
      ease: 'Back.out'
    });

    // Pulse animation
    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0.3, to: 0.6 },
      scale: { from: 1.02, to: 1.08 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });

    const subtitle = this.add.text(width / 2, height * 0.28, 'ISOMÉTRICO', {
      fontSize: '36px',
      fontFamily: 'monospace',
      fill: '#ff9800',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: '-=10',
      duration: 1000,
      delay: 300,
      ease: 'Back.out'
    });

    // Subtitle with fade in
    const tagline = this.add.text(width / 2, height * 0.38, '— Encuentra la salida. Sobrevive. —', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fill: '#aaaaaa'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: tagline,
      alpha: 1,
      duration: 1500,
      delay: 800
    });

    // Buttons
    const btnY = height * 0.55;
    const btnSpacing = 70;

    const btn1 = this._createButton(width / 2, btnY, 'NUEVO JUEGO', () => {
      lm.clearProgress();
      if (this._music) this._music.stop();
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { level: 1, lives: 3 });
      });
    });
    btn1.setAlpha(0);
    this.tweens.add({ targets: btn1, alpha: 1, duration: 500, delay: 1200 });

    if (lm.hasSave()) {
      const save = lm.loadProgress();
      const btn2 = this._createButton(width / 2, btnY + btnSpacing,
        `CONTINUAR (Nivel ${save.currentLevel})`, () => {
          if (this._music) this._music.stop();
          this.cameras.main.fadeOut(500);
          this.time.delayedCall(500, () => {
            this.scene.start('GameScene', { level: save.currentLevel, lives: save.lives });
          });
        });
      btn2.setAlpha(0);
      this.tweens.add({ targets: btn2, alpha: 1, duration: 500, delay: 1400 });
    }

    const btn3 = this._createButton(width / 2, btnY + btnSpacing * 2, 'SALIR', () => {
      // In browser context, just show a message
      this.add.text(width / 2, height * 0.9, 'Cierra la pestaña para salir.', {
        fontSize: '14px', fontFamily: 'monospace', fill: '#888'
      }).setOrigin(0.5);
    });
    btn3.setAlpha(0);
    this.tweens.add({ targets: btn3, alpha: 1, duration: 500, delay: 1600 });

    // Controls hint
    const controls = this.add.text(width / 2, height * 0.88,
      'Controles: WASD / Flechas para moverse  |  E para usar espada  |  F para pantalla completa', {
        fontSize: '13px', fontFamily: 'monospace', fill: '#666'
      }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({ targets: controls, alpha: 1, duration: 1000, delay: 2000 });

    // Fullscreen key
    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Fade in camera
    this.cameras.main.fadeIn(800);
  }

  _createButton(x, y, label, callback) {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '26px',
      fontFamily: 'monospace',
      fill: '#ffd54f',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#ffffff', fontSize: '28px' });
      this.tweens.add({
        targets: btn,
        scale: 1.1,
        duration: 150
      });
    });
    btn.on('pointerout',  () => {
      btn.setStyle({ fill: '#ffd54f', fontSize: '26px' });
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150
      });
    });
    btn.on('pointerdown', callback);

    return btn;
  }

  _createFloatingParticles(width, height) {
    // Create mystical floating particles
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const particle = this.add.circle(x, y, size, 0xffd54f, 0.3);
      
      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(100, 300),
        x: x + Phaser.Math.Between(-50, 50),
        alpha: { from: 0.3, to: 0 },
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _create3DCubes(width, height) {
    // Create animated isometric cubes floating in background
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 50);
      const size = Phaser.Math.Between(30, 60);
      
      const cube = this.add.graphics().setAlpha(0.15);
      this._drawIsoCube(cube, 0, 0, size);
      cube.setPosition(x, y);
      
      this.tweens.add({
        targets: cube,
        y: y + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.1, to: 0.25 },
        angle: 360,
        duration: Phaser.Math.Between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }

  _drawIsoCube(graphics, x, y, size) {
    const w = size;
    const h = size / 2;
    
    // Top face
    graphics.fillStyle(0x4a4a4a, 1);
    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(x + w, y + h);
    graphics.lineTo(x, y + h * 2);
    graphics.lineTo(x - w, y + h);
    graphics.closePath();
    graphics.fillPath();
    
    // Left face
    graphics.fillStyle(0x2d2d2d, 1);
    graphics.beginPath();
    graphics.moveTo(x - w, y + h);
    graphics.lineTo(x, y + h * 2);
    graphics.lineTo(x, y + h * 4);
    graphics.lineTo(x - w, y + h * 3);
    graphics.closePath();
    graphics.fillPath();
    
    // Right face
    graphics.fillStyle(0x3a3a3a, 1);
    graphics.beginPath();
    graphics.moveTo(x, y + h * 2);
    graphics.lineTo(x + w, y + h);
    graphics.lineTo(x + w, y + h * 3);
    graphics.lineTo(x, y + h * 4);
    graphics.closePath();
    graphics.fillPath();
  }

  _createFogEffect(width, height) {
    // Create fog layers
    for (let i = 0; i < 3; i++) {
      const fog = this.add.graphics().setAlpha(0.05);
      fog.fillStyle(0xffffff, 1);
      
      for (let j = 0; j < 5; j++) {
        const x = (width / 5) * j;
        const y = height * 0.6 + i * 50;
        fog.fillCircle(x, y, 150);
      }
      
      this.tweens.add({
        targets: fog,
        x: { from: -100, to: 100 },
        duration: 10000 + i * 2000,
        repeat: -1,
        ease: 'Sine.inOut'
      });
    }
  }

  _drawDecorativeTiles(width, height) {
    const g = this.add.graphics().setAlpha(0.08);
    const tw = 48;
    const cols = Math.ceil(width  / tw) + 1;
    const rows = Math.ceil(height / tw) + 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tw;
        const y = row * tw;
        const color = (col + row) % 2 === 0 ? 0x2d2d2d : 0x1a1a1a;
        g.fillStyle(color, 1);
        g.fillRect(x + 1, y + 1, tw - 2, tw - 2);
        
        // Add border for 3D effect
        g.lineStyle(1, 0x444444, 0.3);
        g.strokeRect(x + 1, y + 1, tw - 2, tw - 2);
      }
    }
    
    // Animate the grid
    this.tweens.add({
      targets: g,
      alpha: { from: 0.08, to: 0.12 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }
}
