import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.levelId = data.level || 1;
  }

  create() {
    const { width, height } = this.scale;

    // Get the global music manager
    this._music = this.registry.get('musicManager');
    
    // Start music - if audio is already unlocked, start immediately
    // Otherwise wait for first interaction
    const startMusic = () => {
      if (this._music) {
        if (!this._music.ctx) {
          this._music.unlock();
        }
        // Stop any previous music and start game over music
        this._music.stop();
        this._music.play('gameover');
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

    // Background with gradient (dark red to black)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0000, 0x1a0000, 0x0a0000, 0x0a0000, 1);
    bg.fillRect(0, 0, width, height);

    // Vignette effect (dark edges)
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0);
    vignette.fillCircle(width / 2, height / 2, width * 0.8);
    vignette.fillStyle(0x000000, 0.5);
    for (let i = 0; i < 5; i++) {
      const radius = width * 0.8 + i * 100;
      vignette.fillCircle(width / 2, height / 2, radius);
    }

    // Falling ash/smoke particles
    this._createFallingAsh(width, height);

    // Blood drips effect
    this._createBloodDrips(width, height);

    // Cracks overlay
    this._createCracks(width, height);

    // Shake title effect
    const titleY = height * 0.3;
    const title = this.add.text(width / 2, titleY + 100, 'GAME OVER', {
      fontSize: '80px', fontFamily: 'monospace',
      fill: '#e53935', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    // Title shadow for depth
    const titleShadow = this.add.text(width / 2 + 5, titleY + 105, 'GAME OVER', {
      fontSize: '80px', fontFamily: 'monospace',
      fill: '#000000', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    // Glitch effect on title
    this.tweens.add({
      targets: [title, titleShadow],
      alpha: 1,
      y: `-=100`,
      duration: 800,
      ease: 'Power3.out',
      onComplete: () => {
        // Continuous glitch
        this._glitchTitle(title, titleShadow, width, titleY);
      }
    });

    // Shake camera
    this.cameras.main.shake(500, 0.02);

    // Red flash
    this.cameras.main.flash(1000, 100, 0, 0);

    const subtitle = this.add.text(width / 2, height * 0.45, 'El laberinto te ha vencido...', {
      fontSize: '22px', fontFamily: 'monospace', fill: '#aaaaaa'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1500,
      delay: 1000
    });

    // Skull/death icon
    this._drawSkull(width / 2, height * 0.52);

    const btn1 = this._createButton(width / 2, height * 0.65, 'REINTENTAR', () => {
      if (this._music) this._music.stop();
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { level: this.levelId, lives: 3 });
      });
    });
    btn1.setAlpha(0);
    this.tweens.add({ targets: btn1, alpha: 1, duration: 500, delay: 1500 });

    const btn2 = this._createButton(width / 2, height * 0.75, 'MENÚ PRINCIPAL', () => {
      if (this._music) this._music.stop();
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    });
    btn2.setAlpha(0);
    this.tweens.add({ targets: btn2, alpha: 1, duration: 500, delay: 1700 });

    // Fade in
    this.cameras.main.fadeIn(1000);
  }

  _createButton(x, y, label, callback) {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '28px', fontFamily: 'monospace',
      fill: '#ffd54f', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#ffffff', fontSize: '30px' });
      this.tweens.add({ targets: btn, scale: 1.1, duration: 150 });
    });
    btn.on('pointerout',  () => {
      btn.setStyle({ fill: '#ffd54f', fontSize: '28px' });
      this.tweens.add({ targets: btn, scale: 1, duration: 150 });
    });
    btn.on('pointerdown', callback);
    return btn;
  }

  _createFallingAsh(width, height) {
    // Falling particles (ash/smoke)
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-100, height);
      const size = Phaser.Math.Between(2, 5);
      const particle = this.add.circle(x, y, size, 0x666666, 0.4);
      
      this.tweens.add({
        targets: particle,
        y: height + 100,
        x: x + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.4, to: 0 },
        duration: Phaser.Math.Between(3000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000)
      });
    }
  }

  _createBloodDrips(width, height) {
    // Blood drips from top
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const drip = this.add.graphics();
      drip.fillStyle(0x8b0000, 0.6);
      drip.fillCircle(0, 0, 3);
      drip.fillRect(-1, 0, 2, 20);
      drip.setPosition(x, -20);
      
      this.tweens.add({
        targets: drip,
        y: height + 50,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        repeatDelay: Phaser.Math.Between(5000, 10000)
      });
    }
  }

  _createCracks(width, height) {
    // Cracks effect
    const cracks = this.add.graphics().setAlpha(0);
    cracks.lineStyle(2, 0x8b0000, 0.4);
    
    for (let i = 0; i < 15; i++) {
      const startX = Phaser.Math.Between(0, width);
      const startY = Phaser.Math.Between(0, height);
      let x = startX, y = startY;
      
      cracks.beginPath();
      cracks.moveTo(x, y);
      
      for (let j = 0; j < 5; j++) {
        x += Phaser.Math.Between(-40, 40);
        y += Phaser.Math.Between(-40, 40);
        cracks.lineTo(x, y);
      }
      cracks.strokePath();
    }
    
    this.tweens.add({
      targets: cracks,
      alpha: 0.5,
      duration: 2000,
      ease: 'Power2.in'
    });
  }

  _glitchTitle(title, shadow, width, titleY) {
    // Random glitch effect
    this.time.addEvent({
      delay: Phaser.Math.Between(2000, 5000),
      callback: () => {
        const offsetX = Phaser.Math.Between(-10, 10);
        const offsetY = Phaser.Math.Between(-5, 5);
        
        title.setPosition(width / 2 + offsetX, titleY + offsetY);
        shadow.setPosition(width / 2 + offsetX + 5, titleY + offsetY + 5);
        
        this.time.delayedCall(50, () => {
          title.setPosition(width / 2, titleY);
          shadow.setPosition(width / 2 + 5, titleY + 5);
        });
        
        this._glitchTitle(title, shadow, width, titleY);
      }
    });
  }

  _drawSkull(x, y) {
    const skull = this.add.graphics().setAlpha(0);
    skull.fillStyle(0x666666, 1);
    
    // Head
    skull.fillCircle(x, y, 25);
    skull.fillRect(x - 15, y, 30, 20);
    
    // Eyes
    skull.fillStyle(0x000000, 1);
    skull.fillCircle(x - 10, y - 5, 6);
    skull.fillCircle(x + 10, y - 5, 6);
    
    // Nose
    skull.fillTriangle(x, y + 5, x - 5, y + 12, x + 5, y + 12);
    
    // Jaw
    skull.lineStyle(3, 0x000000, 1);
    skull.beginPath();
    skull.arc(x, y + 10, 12, 0, Math.PI, false);
    skull.strokePath();
    
    this.tweens.add({
      targets: skull,
      alpha: 0.6,
      duration: 1500,
      delay: 1200,
      ease: 'Power2.out'
    });
  }
}
