/**
 * Manages logic puzzles (switch sequences) and text hints on walls.
 */
export default class PuzzleManager {
  constructor(puzzleDefs, wallHints) {
    this.puzzles = puzzleDefs.map(def => ({
      ...def,
      activatedSequence: [],
      solved: false,
      switches: def.switches.map(s => ({ ...s, activated: false }))
    }));
    this.wallHints = wallHints || [];
    this.onDoorOpen = null; // callback(doorPos)
  }

  /**
   * Try to activate a switch at the given grid position.
   * Returns the switch object if found, null otherwise.
   */
  tryActivateSwitch(gx, gy) {
    for (const puzzle of this.puzzles) {
      if (puzzle.solved) continue;
      const sw = puzzle.switches.find(s => s.gridX === gx && s.gridY === gy && !s.activated);
      if (!sw) continue;

      puzzle.activatedSequence.push(sw.id);
      const idx = puzzle.activatedSequence.length - 1;

      // Check if partial sequence is still correct
      if (puzzle.activatedSequence[idx] !== puzzle.correctSequence[idx]) {
        // Wrong order — reset
        puzzle.activatedSequence = [];
        puzzle.switches.forEach(s => { s.activated = false; });
        return { sw, correct: false, reset: true };
      }

      sw.activated = true;

      // Check if puzzle is fully solved
      if (puzzle.activatedSequence.length === puzzle.correctSequence.length) {
        puzzle.solved = true;
        if (this.onDoorOpen) this.onDoorOpen(puzzle.doorId);
        return { sw, correct: true, solved: true };
      }

      return { sw, correct: true, solved: false };
    }
    return null;
  }

  /**
   * Get hint text for a wall adjacent to the player.
   * Returns string or null.
   */
  getHintAt(gx, gy) {
    const hint = this.wallHints.find(h => h.x === gx && h.y === gy);
    return hint ? hint.text : null;
  }

  /** Check all 4 adjacent tiles for hints */
  getAdjacentHint(playerX, playerY) {
    const neighbors = [
      { x: playerX - 1, y: playerY },
      { x: playerX + 1, y: playerY },
      { x: playerX,     y: playerY - 1 },
      { x: playerX,     y: playerY + 1 }
    ];
    for (const n of neighbors) {
      const text = this.getHintAt(n.x, n.y);
      if (text) return text;
    }
    return null;
  }

  getSwitches() {
    return this.puzzles.flatMap(p => p.switches);
  }
}
