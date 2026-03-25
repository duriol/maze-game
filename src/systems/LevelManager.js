const SAVE_KEY = 'maze-game-save';
const LEVELS = [1, 2, 3, 4, 5];

export default class LevelManager {
  constructor() {
    this.currentLevel = 1;
  }

  /** Check if player reached the exit tile */
  checkLevelComplete(playerX, playerY, exitPos) {
    return playerX === exitPos.x && playerY === exitPos.y;
  }

  isLastLevel() {
    return this.currentLevel >= LEVELS[LEVELS.length - 1];
  }

  nextLevel() {
    this.currentLevel = Math.min(this.currentLevel + 1, 5);
    return this.currentLevel;
  }

  saveProgress(lives) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        currentLevel: this.currentLevel,
        lives
      }));
    } catch (e) { /* localStorage not available */ }
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  clearProgress() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  hasSave() {
    return this.loadProgress() !== null;
  }
}
