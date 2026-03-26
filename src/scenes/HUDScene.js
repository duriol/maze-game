import Phaser from 'phaser';

const HEART_FULL  = '♥';
const HEART_EMPTY = '♡';

const PANEL_W  = 180;
const PANEL_BG = 0x0a0a14;
const PANEL_ALPHA = 0.82;
const TOP_BAR_H = 56;

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    const { width, height } = this.scale;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;

    const gfx = this.add.graphics().setDepth(1000);

    // ── Top bar ───────────────────────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.75);
    gfx.fillRect(0, 0, width, TOP_BAR_H);

    if (!isMobile) {
      // ── Left panel — Instructions ───────────────────────────────────────────
      gfx.fillStyle(PANEL_BG, PANEL_ALPHA);
      gfx.fillRoundedRect(8, TOP_BAR_H + 8, PANEL_W, height - TOP_BAR_H - 16, 8);
      gfx.lineStyle(1, 0x3a3a5c, 0.8);
      gfx.strokeRoundedRect(8, TOP_BAR_H + 8, PANEL_W, height - TOP_BAR_H - 16, 8);

      // ── Right panel — Legend ────────────────────────────────────────────────
      gfx.fillStyle(PANEL_BG, PANEL_ALPHA);
      gfx.fillRoundedRect(width - PANEL_W - 8, TOP_BAR_H + 8, PANEL_W, height - TOP_BAR_H - 16, 8);
      gfx.lineStyle(1, 0x3a3a5c, 0.8);
      gfx.strokeRoundedRect(width - PANEL_W - 8, TOP_BAR_H + 8, PANEL_W, height - TOP_BAR_H - 16, 8);
    }

    // ── Top bar content ───────────────────────────────────────────────────────
    this.livesText = this.add.text(20, 14, '', {
      fontSize: '26px', fontFamily: 'monospace', fill: '#e53935'
    }).setDepth(1001);

    this.levelText = this.add.text(width / 2, 14, '', {
      fontSize: '20px', fontFamily: 'monospace', fill: '#ffd54f'
    }).setOrigin(0.5, 0).setDepth(1001);

    // Leave room for the HTML info button on mobile (38px wide at right: 12px)
    const invX = isMobile ? width - 58 : width - 20;
    this.inventoryText = this.add.text(invX, 14, '', {
      fontSize: '18px', fontFamily: 'monospace', fill: '#80cbc4'
    }).setOrigin(1, 0).setDepth(1001);

    // Torch bar
    this.torchBarGfx = this.add.graphics().setDepth(1002);
    this.torchRatio  = 0;

    // Hint text
    this.hintText = this.add.text(width / 2, TOP_BAR_H + 16, '', {
      fontSize: '15px', fontFamily: 'monospace', fill: '#ffe082',
      stroke: '#000', strokeThickness: 3,
      backgroundColor: '#00000099',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 0).setDepth(1002).setAlpha(0);
    this.hintTimer = 0;

    if (!isMobile) {
      // ── Left panel text ─────────────────────────────────────────────────────
      this._buildInstructionsPanel(8, TOP_BAR_H + 8, PANEL_W, height);

      // ── Right panel text ────────────────────────────────────────────────────
      this._buildLegendPanel(width - PANEL_W - 8, TOP_BAR_H + 8, PANEL_W, height);
    }

    // ── Events ────────────────────────────────────────────────────────────────
    this.game.events.on('hud-update', this._onUpdate, this);
    this.game.events.on('hud-hint',   this._onHint,   this);
    this.game.events.on('hud-torch',  this._onTorch,  this);
  }

  // ── Instructions panel ─────────────────────────────────────────────────────
  _buildInstructionsPanel(px, py, pw, screenH) {
    const cx   = px + pw / 2;
    const base = py + 16;
    const lh   = 22; // line height
    const col  = '#c5cae9';
    const head = '#7c4dff';
    const key  = '#ffd54f';

    this.add.text(cx, base, '— CONTROLES —', {
      fontSize: '13px', fontFamily: 'monospace', fill: head, align: 'center'
    }).setOrigin(0.5, 0).setDepth(1001);

    const controls = [
      ['W / ↑',    'Mover arriba'],
      ['S / ↓',    'Mover abajo'],
      ['A / ←',    'Mover izquierda'],
      ['D / →',    'Mover derecha'],
      ['E',        'Usar espada'],
      ['F',        'Pantalla completa'],
    ];

    let y = base + lh * 1.8;
    for (const [k, desc] of controls) {
      this.add.text(px + 14, y, k, {
        fontSize: '12px', fontFamily: 'monospace', fill: key
      }).setDepth(1001);
      this.add.text(px + 60, y, desc, {
        fontSize: '11px', fontFamily: 'monospace', fill: col,
        wordWrap: { width: pw - 68 }
      }).setDepth(1001);
      y += lh;
    }

    y += lh * 0.5;
    this.add.text(cx, y, '— OBJETIVO —', {
      fontSize: '13px', fontFamily: 'monospace', fill: head, align: 'center'
    }).setOrigin(0.5, 0).setDepth(1001);
    y += lh * 1.4;

    const tips = [
      '🟢 Llega a la salida\n    roja para avanzar.',
      '🔦 Usa antorchas para\n    ampliar tu visión.',
      '🗝 Recoge llaves para\n    abrir puertas.',
      '🔵 Activa palancas en\n    el orden correcto.',
      '⚔ Con espada puedes\n    desactivar trampas.',
      '🛡 El escudo absorbe\n    un golpe.',
      '⚠ Nivel 2: visión\n    reducida, más rápido.',
      '💀 Nivel 3: casi a\n    oscuras. ¡Cuidado!',
    ];

    for (const tip of tips) {
      this.add.text(px + 12, y, tip, {
        fontSize: '11px', fontFamily: 'monospace', fill: col,
        wordWrap: { width: pw - 20 }, lineSpacing: 2
      }).setDepth(1001);
      y += lh * 2.2;
      if (y > screenH - 40) break;
    }
  }

  // ── Legend panel ───────────────────────────────────────────────────────────
  _buildLegendPanel(px, py, pw, screenH) {
    const cx   = px + pw / 2;
    const base = py + 16;
    const lh   = 21;
    const col  = '#c5cae9';
    const head = '#7c4dff';

    this.add.text(cx, base, '— LEYENDA —', {
      fontSize: '13px', fontFamily: 'monospace', fill: head, align: 'center'
    }).setOrigin(0.5, 0).setDepth(1001);

    const entries = [
      ['👻', '#ede7f6', 'Kiro (tú)'],
      ['🟧', '#e8651a', 'Lambda (nv.1)'],
      ['🟧', '#e8651a', 'API Gateway (nv.1)'],
      ['🟩', '#3f8624', 'S3 (nv.1)'],
      ['🟦', '#1a6faf', 'DynamoDB (nv.1)'],
      ['🟧', '#e8651a', 'Kinesis (nv.1)'],
      ['🟥', '#dd344c', 'IAM (nv.1)'],
      ['🟪', '#e7157b', 'CloudWatch (nv.1)'],
      ['🟪', '#e7157b', 'SNS (nv.1)'],
      ['🦇', '#9c27b0', 'Murciélago (nv.2)'],
      ['🔵', '#1e88e5', 'Kiro logo (nv.2)'],
      ['🕷', '#1b5e20', 'Araña (nv.2)'],
      ['🟢', '#2e7d32', 'Entrada'],
      ['🔴', '#b71c1c', 'Salida'],
      ['🟪', '#4a148c', 'Puerta cerrada'],
      ['⬛', '#1a0030', 'Puerta abierta'],
      ['🔥', '#ff6d00', 'Trampa péndulo'],
      ['💥', '#ffca28', 'Proyectil'],
      ['⚠',  '#ff5722', 'Pared/pinchos'],
      ['🧪', '#e91e63', 'Poción de vida'],
      ['🔦', '#ff9800', 'Antorcha'],
      ['🗝',  '#fdd835', 'Llave'],
      ['⚔',  '#90caf9', 'Espada'],
      ['🛡',  '#80cbc4', 'Escudo'],
      ['🔘', '#e65100', 'Palanca (off)'],
      ['🔆', '#ffee58', 'Palanca (on)'],
    ];

    let y = base + lh * 1.8;
    for (const [icon, color, label] of entries) {
      this.add.text(px + 12, y, icon, {
        fontSize: '13px', fontFamily: 'monospace', fill: color
      }).setDepth(1001);
      this.add.text(px + 32, y, label, {
        fontSize: '11px', fontFamily: 'monospace', fill: col
      }).setDepth(1001);
      y += lh;
      if (y > screenH - 20) break;
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────
  _onUpdate({ lives, level, inventory, swordUses, hasShield }) {
    if (!this.livesText?.active) return;
    let hearts = '';
    for (let i = 0; i < 3; i++) hearts += i < lives ? HEART_FULL : HEART_EMPTY;
    this.livesText.setText(hearts);
    this.levelText.setText(`NIVEL ${level}`);

    const items = [];
    if (inventory.includes('KEY'))  items.push('🗝');
    if (swordUses > 0)               items.push(`⚔×${swordUses}`);
    if (hasShield)                   items.push('🛡');
    if (inventory.includes('TORCH')) items.push('🔦');
    this.inventoryText.setText(items.join(' ') || '—');
  }

  _onHint(text) {
    this.hintText.setText(text).setAlpha(1);
    this.hintTimer = 3500;
  }

  _onTorch({ remaining, total }) {
    this.torchRatio = Math.max(0, remaining / total);
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this.hintTimer > 0) {
      this.hintTimer -= delta;
      if (this.hintTimer <= 0) this.hintText.setAlpha(0);
    }

    const { width } = this.scale;
    this.torchBarGfx.clear();
    if (this.torchRatio > 0) {
      this.torchBarGfx.fillStyle(0xff9800, 1);
      this.torchBarGfx.fillRect(width / 2 - 100, 48, 200 * this.torchRatio, 5);
    }
  }

  shutdown() {
    this.game.events.off('hud-update', this._onUpdate, this);
    this.game.events.off('hud-hint',   this._onHint,   this);
    this.game.events.off('hud-torch',  this._onTorch,  this);
  }
}
