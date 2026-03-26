/**
 * MusicManager — procedural ambient music via Web Audio API.
 * Uses Web Audio scheduling (not setTimeout) for reliable timing.
 * Shared AudioContext passed in — created once on first user interaction.
 */
export default class MusicManager {
  constructor() {
    this.ctx         = null;
    this.masterGain  = null;
    this.nodes       = [];
    this.timeouts    = [];
    this.running     = false;
    this._pendingId  = null; // pending play call
    this.currentTrack = null; // track currently playing
  }

  /** Call once on first user gesture to unlock audio */
  unlock() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  }

  stop() {
    this.running = false;
    this.currentTrack = null;
    if (this._pendingId) { clearTimeout(this._pendingId); this._pendingId = null; }
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts = [];
    this.nodes.forEach(n => { try { n.stop(0); } catch (e) { /* ignore */ } });
    this.nodes = [];
    if (this.masterGain) {
      try { this.masterGain.disconnect(); } catch (e) { /* ignore */ }
      this.masterGain = null;
    }
  }

  play(trackId) {
    if (!this.ctx) return;
    
    // Prevenir reinicio del mismo track si ya está sonando
    if (this.running && this.currentTrack === trackId) {
      return;
    }
    
    this.stop();
    this.currentTrack = trackId;

    const doPlay = () => {
      if (!this.ctx) return;
      this.running = true;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      // Fade in - Volumen aumentado para que se escuche mejor (0.55)
      this.masterGain.gain.linearRampToValueAtTime(0.55, this.ctx.currentTime + 1.5);
      this.masterGain.connect(this.ctx.destination);

      switch (trackId) {
        case 'menu':    this._trackMenu();    break;
        case 'gameover':this._trackGameOver();break;
        case 'victory': this._trackVictory(); break;
        case 1:         this._track1();       break;
        case 2:         this._track2();       break;
        case 3:         this._track3();       break;
        case 4:         this._track4();       break;
        case 5:         this._track5();       break;
        default:        this._track1();
      }
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(doPlay).catch(() => {});
    } else {
      doPlay();
    }
  }

  // ── Low-level helpers ─────────────────────────────────────────────────────────

  _gain(val) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(val, this.ctx.currentTime);
    g.connect(this.masterGain);
    return g;
  }

  /** Continuous oscillator */
  _drone(freq, type, vol, detune = 0) {
    if (!this.masterGain) return null;
    const osc = this.ctx.createOscillator();
    const g   = this._gain(vol);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (detune) osc.detune.setValueAtTime(detune, this.ctx.currentTime);
    osc.connect(g);
    osc.start();
    this.nodes.push(osc);
    return { osc, gain: g };
  }

  /** LFO modulating a gain node */
  _lfo(targetGain, rate, depth) {
    const lfo = this.ctx.createOscillator();
    const lg  = this.ctx.createGain();
    lfo.frequency.setValueAtTime(rate, this.ctx.currentTime);
    lg.gain.setValueAtTime(depth, this.ctx.currentTime);
    lfo.connect(lg);
    lg.connect(targetGain.gain);
    lfo.start();
    this.nodes.push(lfo);
  }

  /** Schedule a single note at an absolute AudioContext time */
  _note(freq, type, vol, startTime, dur) {
    if (!this.masterGain || !this.running) return;
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + Math.min(0.04, dur * 0.2));
    g.gain.setValueAtTime(vol, startTime + dur * 0.7);
    g.gain.linearRampToValueAtTime(0, startTime + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
    this.nodes.push(osc);
  }

  /** Reverb impulse response */
  _reverb(wet = 0.3, decay = 2.5) {
    if (!this.masterGain) return null;
    const conv   = this.ctx.createConvolver();
    const len    = Math.floor(this.ctx.sampleRate * decay);
    const buf    = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    conv.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(wet, this.ctx.currentTime);
    conv.connect(g);
    g.connect(this.masterGain);
    return conv;
  }

  /**
   * Schedule a looping sequence of notes using Web Audio time.
   * notes: [[freq|null, durationSec], ...]
   * Loops indefinitely until stop() is called.
   */
  _loop(notes, vol, type, startDelay = 0) {
    if (!this.running) return;
    const now   = this.ctx.currentTime + startDelay;
    let   t     = now;
    let   idx   = 0;

    const schedule = () => {
      if (!this.running) return;
      // Schedule ~1 second ahead
      const lookahead = this.ctx.currentTime + 1.2;
      while (t < lookahead) {
        const [freq, dur] = notes[idx % notes.length];
        if (freq !== null) this._note(freq, type, vol, t, dur * 0.88);
        t += dur;
        idx++;
      }
      const id = setTimeout(schedule, 200);
      this.timeouts.push(id);
    };
    schedule();
  }

  // ── Hz from semitone above A1 (55 Hz) ────────────────────────────────────────
  _hz(semi) { return 55 * Math.pow(2, semi / 12); }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MENU — "Welcome Explorer"
  // Relajado, acogedor. Melodías suaves y tranquilas.
  // ═══════════════════════════════════════════════════════════════════════════════
  _trackMenu() {
    this._reverb(0.4, 3);

    // Bajo suave en C mayor (relajado)
    const bpm = 85, beat = 60 / bpm;
    const bass = [
      [this._hz(0), beat*2],  [null, beat],
      [this._hz(5), beat*2],  [null, beat],
      [this._hz(7), beat*2],  [null, beat],
      [this._hz(0), beat*3],  [null, beat]
    ];
    this._loop(bass, 0.18, 'sine', 0);

    // Melodía melódica - C mayor pentatónica
    const mel = [
      [this._hz(12), beat*2], [this._hz(14), beat*2],
      [this._hz(16), beat*3], [null, beat],
      [this._hz(14), beat*2], [this._hz(12), beat*2],
      [this._hz(9), beat*4],  [null, beat*2],
      [this._hz(12), beat*2], [this._hz(16), beat*2],
      [this._hz(19), beat*4], [null, beat*2]
    ];
    this._loop(mel, 0.16, 'sine', beat);

    // Armonía suave
    const harmony = [
      [this._hz(7), beat*4],  [this._hz(12), beat*4],
      [this._hz(14), beat*4], [this._hz(9), beat*4]
    ];
    this._loop(harmony, 0.12, 'triangle', beat * 2);

    // Campanitas suaves ocasionales
    const bell = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(24), 'sine', 0.13, t, 1.2);
      this._note(this._hz(28), 'sine', 0.10, t + 0.15, 1.0);
      const id = setTimeout(bell, beat * 8000);
      this.timeouts.push(id);
    };
    setTimeout(bell, beat * 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // GAME OVER — "Peaceful Reflection"
  // Tranquilo, contemplativo. Te invita a reflexionar y reintentar.
  // ═══════════════════════════════════════════════════════════════════════════════
  _trackGameOver() {
    this._reverb(0.5, 3.5);

    // Bajo muy suave en A menor
    const bpm = 75, beat = 60 / bpm;
    const bass = [
      [this._hz(0), beat*3],  [null, beat],
      [this._hz(5), beat*3],  [null, beat],
      [this._hz(3), beat*3],  [null, beat],
      [this._hz(0), beat*4],  [null, beat*2]
    ];
    this._loop(bass, 0.16, 'sine', 0);

    // Melodía contemplativa - A menor natural
    const mel = [
      [this._hz(12), beat*3], [this._hz(14), beat*2], [null, beat],
      [this._hz(16), beat*3], [this._hz(14), beat*2], [null, beat],
      [this._hz(12), beat*4], [null, beat*2],
      [this._hz(10), beat*3], [this._hz(12), beat*5], [null, beat*2]
    ];
    this._loop(mel, 0.15, 'sine', beat * 2);

    // Pad atmosférico suave
    this._drone(130.81, 'sine', 0.06);  // C3
    this._drone(164.81, 'sine', 0.05);  // E3
    
    // Campanillas suaves y ocasionales
    const bell = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(24), 'sine', 0.13, t, 1.5);
      this._note(this._hz(19), 'sine', 0.10, t + 0.2, 1.2);
      const id = setTimeout(bell, beat * 6000);
      this.timeouts.push(id);
    };
    setTimeout(bell, beat * 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEVEL 1 — "Forest Walk"
  // Ritmo tranquilo y amigable. Paseo relajado por el laberinto.
  // ═══════════════════════════════════════════════════════════════════════════════
  _track1() {
    this._reverb(0.4, 2.5);

    // Bajo suave en G mayor
    const bpm = 90, beat = 60 / bpm;
    const bass = [
      [this._hz(7), beat*2],  [null, beat],
      [this._hz(12), beat*2], [null, beat],
      [this._hz(14), beat*2], [null, beat],
      [this._hz(7), beat*3],  [null, beat]
    ];
    this._loop(bass, 0.20, 'sine', 0);

    // Melodía alegre - G mayor pentatónica
    const mel = [
      [this._hz(19), beat*2], [this._hz(21), beat*2],
      [this._hz(23), beat*3], [null, beat],
      [this._hz(21), beat*2], [this._hz(19), beat*2],
      [this._hz(16), beat*4], [null, beat*2],
      [this._hz(19), beat*2], [this._hz(23), beat*2],
      [this._hz(26), beat*4], [null, beat*2]
    ];
    this._loop(mel, 0.17, 'sine', beat);

    // Armonía cálida
    const harmony = [
      [this._hz(14), beat*4], [this._hz(19), beat*4],
      [this._hz(21), beat*4], [this._hz(16), beat*4]
    ];
    this._loop(harmony, 0.13, 'triangle', beat * 2);

    // Toque suave de marimba
    const marimba = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(31), 'sine', 0.11, t, 0.4);
      const id = setTimeout(marimba, beat * 2000);
      this.timeouts.push(id);
    };
    setTimeout(marimba, beat * 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEVEL 2 — "Gentle Journey"
  // Un poco más activo pero aún relajado. Melodías fluidas.
  // ═══════════════════════════════════════════════════════════════════════════════
  _track2() {
    this._reverb(0.35, 2.2);

    // Bajo melódico en D mayor
    const bpm = 100, beat = 60 / bpm;
    const bass = [
      [this._hz(2), beat*2],  [this._hz(2), beat],  [null, beat],
      [this._hz(7), beat*2],  [null, beat],
      [this._hz(5), beat*2],  [this._hz(7), beat*2],
      [this._hz(2), beat*3],  [null, beat]
    ];
    this._loop(bass, 0.21, 'sine', 0);

    // Melodía fluida - D mayor
    const mel = [
      [this._hz(14), beat*1.5], [this._hz(16), beat*1.5],
      [this._hz(18), beat*2],   [this._hz(16), beat],
      [null, beat],             [this._hz(14), beat*1.5],
      [this._hz(16), beat*1.5], [this._hz(21), beat*3],
      [null, beat],             [this._hz(18), beat*2],
      [this._hz(16), beat*2],   [this._hz(14), beat*3],
      [null, beat]
    ];
    this._loop(mel, 0.18, 'sine', beat * 0.5);

    // Contra-melodía suave
    const counter = [
      [this._hz(21), beat*3], [this._hz(23), beat*3],
      [this._hz(26), beat*4], [null, beat*2],
      [this._hz(23), beat*3], [this._hz(21), beat*5]
    ];
    this._loop(counter, 0.10, 'triangle', beat * 2);

    // Campanillas periódicas
    const chime = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(30), 'sine', 0.10, t, 0.6);
      this._note(this._hz(33), 'sine', 0.08, t + 0.1, 0.5);
      const id = setTimeout(chime, beat * 4000);
      this.timeouts.push(id);
    };
    setTimeout(chime, beat * 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEVEL 3 — "Flowing Adventure"
  // Más movimiento pero suave. Épico sin ser estresante.
  // ═══════════════════════════════════════════════════════════════════════════════
  _track3() {
    this._reverb(0.3, 2);

    // Bajo épico pero suave en E menor
    const bpm = 110, beat = 60 / bpm;
    const bass = [
      [this._hz(4), beat*1.5],  [this._hz(4), beat*0.5],
      [this._hz(7), beat*2],    [this._hz(9), beat*2],
      [this._hz(4), beat*2],    [null, beat],
      [this._hz(2), beat*2],    [this._hz(0), beat*2],
      [this._hz(4), beat*2],    [null, beat]
    ];
    this._loop(bass, 0.22, 'sine', 0);

    // Melodía épica pero melódica
    const mel = [
      [this._hz(16), beat],     [this._hz(19), beat],
      [this._hz(21), beat*1.5], [this._hz(19), beat*0.5],
      [this._hz(16), beat*2],   [null, beat],
      [this._hz(19), beat],     [this._hz(21), beat],
      [this._hz(23), beat*2],   [null, beat],
      [this._hz(21), beat],     [this._hz(23), beat],
      [this._hz(26), beat*3],   [null, beat]
    ];
    this._loop(mel, 0.19, 'sine', beat);

    // Armonía épica
    const harmony = [
      [this._hz(23), beat*3], [this._hz(26), beat*3],
      [this._hz(28), beat*3], [this._hz(23), beat*3],
      [this._hz(26), beat*4], [null, beat*2]
    ];
    this._loop(harmony, 0.15, 'triangle', beat * 2);

    // Segunda voz melódica
    const voice2 = [
      [this._hz(12), beat*2], [this._hz(14), beat*2],
      [this._hz(16), beat*3], [null, beat],
      [this._hz(14), beat*2], [this._hz(16), beat*2],
      [this._hz(19), beat*4], [null, beat*2]
    ];
    this._loop(voice2, 0.09, 'sine', beat * 4);

    // Toques de campana suaves
    const bell = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(31), 'sine', 0.13, t, 0.8);
      this._note(this._hz(35), 'sine', 0.10, t + 0.12, 0.7);
      const id = setTimeout(bell, beat * 3000);
      this.timeouts.push(id);
    };
    setTimeout(bell, beat * 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VICTORY — "Peaceful Triumph"
  // Celebratorio pero tranquilo. Alegría relajada.
  // ═══════════════════════════════════════════════════════════════════════════════
  _trackVictory() {
    this._reverb(0.45, 3);

    // Acordes suaves en C mayor
    this._drone(130.81, 'sine', 0.10);     // C3
    this._drone(164.81, 'sine', 0.08);     // E3 (major third)
    this._drone(196.00, 'sine', 0.07);     // G3 (perfect fifth)
    this._drone(65.41,  'sine', 0.11);     // C2 (bass)

    // Shimmer suave
    const shimmer = this._drone(523.25, 'sine', 0.05); // C5
    if (shimmer) this._lfo(shimmer.gain, 2, 0.03);

    const bpm = 95, beat = 60 / bpm; // Relajado: 95 BPM

    // Bajo suave y celebratorio
    const bass = [
      [this._hz(0), beat*2],  [null, beat],
      [this._hz(5), beat*2],  [null, beat],
      [this._hz(7), beat*2],  [null, beat],
      [this._hz(0), beat*3],  [null, beat]
    ];
    this._loop(bass, 0.20, 'sine', 0);

    // Melodía alegre pero tranquila - C mayor
    const mel = [
      [this._hz(12), beat*2], [this._hz(14), beat*2],
      [this._hz(16), beat*2], [this._hz(17), beat*2],
      [this._hz(19), beat*3], [null, beat],
      [this._hz(21), beat*2], [this._hz(19), beat*2],
      [this._hz(17), beat*3], [null, beat],
      [this._hz(16), beat*2], [this._hz(19), beat*2],
      [this._hz(21), beat*4], [null, beat*2]
    ];
    this._loop(mel, 0.18, 'sine', beat);

    // Armonía luminosa
    const harmony = [
      [this._hz(16), beat*4], [this._hz(19), beat*4],
      [this._hz(21), beat*4], [this._hz(24), beat*4]
    ];
    this._loop(harmony, 0.14, 'triangle', beat * 2);

    // Segunda voz melódica
    const voice2 = [
      [this._hz(24), beat*3], [this._hz(26), beat*3],
      [this._hz(28), beat*4], [null, beat*2],
      [this._hz(26), beat*3], [this._hz(24), beat*5]
    ];
    this._loop(voice2, 0.09, 'sine', beat * 4);

    // Campanillas de victoria suaves
    const bell = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      const notes = [this._hz(24), this._hz(28), this._hz(31)]; // C, E, G major triad
      notes.forEach((freq, i) => {
        this._note(freq, 'sine', 0.16, t + i * 0.08, 1.2);
        this._note(freq * 2, 'sine', 0.10, t + i * 0.08 + 0.05, 0.9);
      });
      const id = setTimeout(bell, beat * 4000 + Math.random() * 2000);
      this.timeouts.push(id);
    };
    setTimeout(bell, beat * 1000);

    // Toques de arpa simulados
    const harp = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      const arpeggio = [this._hz(12), this._hz(16), this._hz(19), this._hz(24)];
      arpeggio.forEach((freq, i) => {
        this._note(freq, 'sine', 0.13, t + i * 0.08, 0.8);
      });
      const id = setTimeout(harp, beat * 6000);
      this.timeouts.push(id);
    };
    setTimeout(harp, beat * 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEVEL 4 — "Rising Tension"
  // Más intenso, ritmo creciente, sensación de peligro inminente
  // F menor, 115 BPM
  // ═══════════════════════════════════════════════════════════════════════════════
  _track4() {
    this._reverb(0.55, 3.5);
    const bpm = 115, beat = 60 / bpm;

    // Bajo pulsante más prominente
    const bass = [
      [this._hz(5), beat*2],   [this._hz(8), beat*2],
      [this._hz(10), beat*2],  [this._hz(8), beat*2]
    ];
    this._loop(bass, 0.24, 'triangle', 0);

    // Melodía inquieta - F menor
    const mel = [
      [this._hz(17), beat*1.5], [this._hz(19), beat*1],
      [this._hz(20), beat*2],   [this._hz(19), beat*1.5],
      [null, beat*0.5],         [this._hz(17), beat*1.5],
      [this._hz(15), beat*2],   [this._hz(17), beat*2.5],
      [null, beat],             [this._hz(19), beat*1.5],
      [this._hz(20), beat*1],   [this._hz(22), beat*3],
      [null, beat]
    ];
    this._loop(mel, 0.20, 'sine', beat * 0.5);

    // Armonía oscura
    const harmony = [
      [this._hz(22), beat*3], [this._hz(24), beat*3],
      [this._hz(20), beat*3], [this._hz(22), beat*3],
      [this._hz(19), beat*4], [null, beat*2]
    ];
    this._loop(harmony, 0.16, 'triangle', beat * 3);

    // Contra-melodía inquietante
    const counter = [
      [this._hz(29), beat*2], [this._hz(27), beat*2],
      [this._hz(25), beat*3], [null, beat*1],
      [this._hz(27), beat*2], [this._hz(29), beat*4],
      [null, beat*2]
    ];
    this._loop(counter, 0.14, 'sine', beat * 6);

    // Campanadas metálicas periódicas
    const metalBell = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      this._note(this._hz(32), 'square', 0.11, t, 0.4);
      this._note(this._hz(36), 'square', 0.09, t + 0.15, 0.3);
      const id = setTimeout(metalBell, beat * 3000);
      this.timeouts.push(id);
    };
    setTimeout(metalBell, beat * 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LEVEL 5 — "Dark Abyss" (Boss Level)
  // Muy tenso, oscuro, atmósfera de peligro extremo
  // D menor, 125 BPM
  // ═══════════════════════════════════════════════════════════════════════════════
  _track5() {
    this._reverb(0.65, 4);
    const bpm = 125, beat = 60 / bpm;

    // Bajo profundo y amenazante
    const bass = [
      [this._hz(2), beat*1.5],  [this._hz(2), beat*1.5],
      [this._hz(5), beat*2],    [this._hz(3), beat*1],
      [this._hz(2), beat*2],    [null, beat]
    ];
    this._loop(bass, 0.26, 'sawtooth', 0);

    // Melodía tensa y urgente - D menor
    const mel = [
      [this._hz(14), beat*1],   [this._hz(17), beat*1],
      [this._hz(19), beat*1.5], [this._hz(21), beat*1],
      [this._hz(19), beat*1.5], [null, beat*0.5],
      [this._hz(17), beat*1],   [this._hz(14), beat*1.5],
      [this._hz(12), beat*2],   [null, beat],
      [this._hz(17), beat*1.5], [this._hz(19), beat*1],
      [this._hz(21), beat*2.5], [null, beat*0.5]
    ];
    this._loop(mel, 0.22, 'square', beat * 0.25);

    // Armonía disonante
    const harmony = [
      [this._hz(19), beat*2.5], [this._hz(21), beat*2.5],
      [this._hz(17), beat*2.5], [this._hz(19), beat*2.5],
      [this._hz(14), beat*3],   [null, beat]
    ];
    this._loop(harmony, 0.18, 'sawtooth', beat * 2);

    // Línea de peligro (alta frecuencia)
    const danger = [
      [this._hz(31), beat*1.5], [this._hz(29), beat*1.5],
      [this._hz(26), beat*2],   [null, beat],
      [this._hz(29), beat*1.5], [this._hz(31), beat*1.5],
      [this._hz(33), beat*3],   [null, beat]
    ];
    this._loop(danger, 0.15, 'square', beat * 4);

    // Pulso de tensión
    const pulse = () => {
      if (!this.running) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        this._note(this._hz(38 + i), 'sawtooth', 0.10, t + i * 0.1, 0.2);
      }
      const id = setTimeout(pulse, beat * 2500);
      this.timeouts.push(id);
    };
    setTimeout(pulse, beat * 500);
  }
}
