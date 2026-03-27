// Isometric projection with 30-degree angle (2:1 ratio)
export const TILE_W = 80;   // full diamond width (increased for more dramatic perspective)
export const TILE_H = 40;   // full diamond height (half of width)
export const WALL_H = 32;   // visible wall face height in pixels (reduced so player is more visible)

/**
 * Convert grid coordinates to isometric screen coordinates.
 * Returns the TOP-CENTER point of the tile diamond.
 */
export function tileToScreen(gridX, gridY) {
  return {
    x: (gridX - gridY) * (TILE_W / 2),
    y: (gridX + gridY) * (TILE_H / 2)
  };
}

export function tileDepth(gridX, gridY) {
  return gridX + gridY;
}

export function manhattanDist(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function euclidDist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}
