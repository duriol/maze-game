/**
 * Wraps Phaser's sound manager.
 * Falls back silently if audio is not available.
 */
export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMusic = null;
    this.enabled = true;
  }

  playSound(key) {
    if (!this.enabled) return;
    try {
      if (this.scene.sound.get(key)) {
        this.scene.sound.play(key, { volume: 0.6 });
      }
    } catch (e) { /* audio not loaded, ignore */ }
  }

  playMusic(levelId) {
    this.stopMusic();
    if (!this.enabled) return;
    const key = `music_level${levelId}`;
    try {
      if (this.scene.sound.get(key)) {
        this.currentMusic = this.scene.sound.add(key, { loop: true, volume: 0.3 });
        this.currentMusic.play();
      }
    } catch (e) { /* ignore */ }
  }

  stopMusic() {
    if (this.currentMusic) {
      try { this.currentMusic.stop(); } catch (e) { /* ignore */ }
      this.currentMusic = null;
    }
  }

  setVolume(vol) {
    this.scene.sound.setVolume(vol);
  }

  setEnabled(val) {
    this.enabled = val;
    if (!val) this.stopMusic();
  }
}
