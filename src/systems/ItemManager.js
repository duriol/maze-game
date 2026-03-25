/**
 * Manages items on the map and player inventory.
 */
export default class ItemManager {
  constructor(itemDefs) {
    this.items = itemDefs.map(def => ({ ...def, collected: false }));
  }

  /**
   * Check if player stepped on an item. Returns the item or null.
   * @param {number} playerX
   * @param {number} playerY
   * @returns {object|null}
   */
  checkPickup(playerX, playerY) {
    const item = this.items.find(i =>
      !i.collected && i.gridX === playerX && i.gridY === playerY
    );
    if (item) {
      item.collected = true;
      return item;
    }
    return null;
  }

  /** Returns items still on the map */
  getActiveItems() {
    return this.items.filter(i => !i.collected);
  }
}
