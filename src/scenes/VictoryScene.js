import Phaser from 'phaser';

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
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
        // Stop any previous music and start victory music
        this._music.stop();
        this._music.play('victory');
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

    // Background gradient (dark green to golden)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1a0a, 0x0a1a0a, 0x1a0f00, 0x1a0f00, 1);
    bg.fillRect(0, 0, width, height);

    // Golden light rays from center
    this._createLightRays(width, height);

    // Sparkling particles
    this._createSparkles(width, height);

    // Confetti
    this._createConfetti(width, height);

    // Animated stars (improved)
    this._spawnStars(width, height);

    // Fireworks
    this._createFireworks(width, height);

    // Trophy/Crown icon
    this._drawTrophy(width / 2, height * 0.15);

    // Title with glow and animation
    const titleY = height * 0.25;
    const title = this.add.text(width / 2, titleY + 80, '¡VICTORIA!', {
      fontSize: '80px', fontFamily: 'monospace',
      fill: '#ffd54f', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    // Title glow
    const titleGlow = this.add.text(width / 2, titleY + 80, '¡VICTORIA!', {
      fontSize: '80px', fontFamily: 'monospace',
      fill: '#ffee58', stroke: '#ffa000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    // Animate title entrance
    this.tweens.add({
      targets: [title, titleGlow],
      alpha: 1,
      y: `-=80`,
      scale: { from: 0.5, to: 1 },
      duration: 1000,
      ease: 'Elastic.out',
      onComplete: () => {
        // Continuous pulse
        this.tweens.add({
          targets: title,
          scale: { from: 1, to: 1.08 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });

        this.tweens.add({
          targets: titleGlow,
          alpha: { from: 0.5, to: 0.8 },
          scale: { from: 1.02, to: 1.12 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.inOut'
        });
      }
    });

    // Flash effect
    this.cameras.main.flash(800, 255, 215, 0, false, (camera, progress) => {
      if (progress === 1) {
        // Secondary flash
        this.cameras.main.flash(400, 255, 255, 200);
      }
    });

    const subtitle1 = this.add.text(width / 2, height * 0.40, 'Has conquistado el laberinto.', {
      fontSize: '26px', fontFamily: 'monospace', fill: '#a5d6a7'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle1,
      alpha: 1,
      y: '-=10',
      duration: 800,
      delay: 800
    });

    const subtitle2 = this.add.text(width / 2, height * 0.48,
      'La oscuridad no pudo contigo.\nTu leyenda quedará grabada en las paredes.', {
        fontSize: '18px', fontFamily: 'monospace', fill: '#888888',
        align: 'center'
      }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subtitle2,
      alpha: 1,
      duration: 1000,
      delay: 1200
    });

    // Victory stats box
    this._createStatsBox(width, height);

    const btn = this._createButton(width / 2, height * 0.75, 'JUGAR DE NUEVO', () => {
      if (this._music) this._music.stop();
      this.cameras.main.fadeOut(500);
      this.time.delayedCall(500, () => {
        this.scene.start('MenuScene');
      });
    });
    btn.setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, scale: { from: 0.8, to: 1 }, duration: 600, delay: 1800, ease: 'Back.out' });

    // Credits
    const credits = this.add.text(width / 2, height * 0.88,
      'Laberinto Isométrico — Hecho con Phaser 3', {
        fontSize: '13px', fontFamily: 'monospace', fill: '#444'
      }).setOrigin(0.5).setAlpha(0);
    
    this.tweens.add({ targets: credits, alpha: 1, duration: 1000, delay: 2000 });

    // Fade in
    this.cameras.main.fadeIn(800);
  }

  _createButton(x, y, label, callback) {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '30px', fontFamily: 'monospace',
      fill: '#ffd54f', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setStyle({ fill: '#ffffff', fontSize: '32px' });
      this.tweens.add({ targets: btn, scale: 1.15, duration: 150 });
    });
    btn.on('pointerout',  () => {
      btn.setStyle({ fill: '#ffd54f', fontSize: '30px' });
      this.tweens.add({ targets: btn, scale: 1, duration: 150 });
    });
    btn.on('pointerdown', callback);
    return btn;
  }

  _createLightRays(width, height) {
    // Radial light rays from center
    const rays = this.add.graphics().setAlpha(0.1).setBlendMode(Phaser.BlendModes.ADD);
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const rayLength = Math.max(width, height);
      
      rays.fillStyle(0xffd54f, 1);
      rays.beginPath();
      rays.moveTo(width / 2, height / 2);
      rays.lineTo(
        width / 2 + Math.cos(angle) * rayLength,
        height / 2 + Math.sin(angle) * rayLength
      );
      rays.lineTo(
        width / 2 + Math.cos(angle + 0.1) * rayLength,
        height / 2 + Math.sin(angle + 0.1) * rayLength
      );
      rays.closePath();
      rays.fillPath();
    }
    
    this.tweens.add({
      targets: rays,
      angle: 360,
      duration: 30000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  _createSparkles(width, height) {
    // Rising golden sparkles
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(height / 2, height);
      const size = Phaser.Math.Between(2, 6);
      const sparkle = this.add.circle(x, y, size, 0xffd54f, 1);
      sparkle.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: sparkle,
        y: y - Phaser.Math.Between(200, 400),
        x: x + Phaser.Math.Between(-50, 50),
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _createConfetti(width, height) {
    // Colored confetti falling
    const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
    
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-100, 0);
      const color = Phaser.Utils.Array.GetRandom(colors);
      const confetti = this.add.rectangle(x, y, 8, 12, color);
      
      this.tweens.add({
        targets: confetti,
        y: height + 100,
        x: x + Phaser.Math.Between(-100, 100),
        angle: Phaser.Math.Between(360, 720),
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000)
      });
    }
  }

  _spawnStars(width, height) {
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 6);
      
      // Draw a star shape
      const star = this.add.graphics();
      star.fillStyle(0xffd54f, 1);
      this._drawStar(star, 0, 0, 5, size, size / 2);
      star.setPosition(x, y);
      star.setAlpha(0);
      star.setBlendMode(Phaser.BlendModes.ADD);
      
      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.5, to: 1.2 },
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  _drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }
    
    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  _createFireworks(width, height) {
    // Launch fireworks periodically
    this.time.addEvent({
      delay: 1500,
      callback: () => {
        const x = Phaser.Math.Between(width * 0.2, width * 0.8);
        const y = Phaser.Math.Between(height * 0.2, height * 0.5);
        const color = Phaser.Display.Color.RandomRGB();
        
        // Create burst
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const speed = Phaser.Math.Between(50, 150);
          const particle = this.add.circle(x, y, 3, color.color);
          particle.setBlendMode(Phaser.BlendModes.ADD);
          
          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed + 50,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            onComplete: () => particle.destroy()
          });
        }
      },
      repeat: 8,
      startAt: 1000
    });
  }

  _drawTrophy(x, y) {
    const trophy = this.add.graphics().setAlpha(0);
    
    // Cup
    trophy.fillStyle(0xffd54f, 1);
    trophy.fillRect(x - 20, y, 40, 30);
    trophy.fillTriangle(x - 20, y, x - 30, y + 20, x - 20, y + 20);
    trophy.fillTriangle(x + 20, y, x + 30, y + 20, x + 20, y + 20);
    
    // Top rim
    trophy.fillRect(x - 25, y - 5, 50, 5);
    
    // Base
    trophy.fillStyle(0xffb300, 1);
    trophy.fillRect(x - 15, y + 30, 30, 5);
    trophy.fillRect(x - 20, y + 35, 40, 8);
    
    // Handles glow
    trophy.lineStyle(3, 0xffe082, 0.6);
    trophy.strokeCircle(x - 25, y + 10, 8);
    trophy.strokeCircle(x + 25, y + 10, 8);
    
    this.tweens.add({
      targets: trophy,
      alpha: 1,
      y: '-=30',
      scale: { from: 0, to: 1.2 },
      duration: 1200,
      ease: 'Bounce.out'
    });

    // Continuous shine
    this.tweens.add({
      targets: trophy,
      angle: { from: -5, to: 5 },
      duration: 2000,
      delay: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut'
    });
  }

  _createStatsBox(width, height) {
    // Victory stats display
    const boxY = height * 0.60;
    const box = this.add.graphics().setAlpha(0);
    box.fillStyle(0x000000, 0.5);
    box.fillRoundedRect(width / 2 - 150, boxY - 20, 300, 60, 10);
    box.lineStyle(2, 0xffd54f, 1);
    box.strokeRoundedRect(width / 2 - 150, boxY - 20, 300, 60, 10);

    const statsText = this.add.text(width / 2, boxY, '★ LABERINTO CONQUISTADO ★', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fill: '#ffd54f',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [box, statsText],
      alpha: 1,
      duration: 800,
      delay: 1400
    });
  }
}
