// Tile types: 0=FLOOR, 1=WALL, 2=ENTRANCE, 3=EXIT, 4=DOOR_CLOSED
// Level 1 - Tutorial - Easy navigation with 2 SKELETONS

export default {
  id: 1,
  width: 15,
  height: 15,
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,0,1,0,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,4,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  ],
  entrance: { x: 1, y: 1 },
  exit: { x: 13, y: 14 },

  traps: [
    { id: 't1', type: 'PENDULUM', path: [{x:5,y:5},{x:5,y:7}], speed: 0.9 },
    { id: 't2', type: 'MOVING_WALL', path: [{x:9,y:3},{x:11,y:3}], speed: 0.8 }
  ],

  mines: [
    { id: 'm1', gridX: 5, gridY: 9,  radius: 1 }
  ],

  // New enemy system - Skeletons with basic patrol and chase AI
  enemies: [
    {
      id: 'skeleton1',
      type: 'SKELETON',
      startX: 3,
      startY: 9,
      patrolPath: [{x:3,y:9},{x:3,y:11},{x:5,y:11},{x:5,y:9}],
      speed: 0.6,
      visionRange: 3
    },
    {
      id: 'skeleton2',
      type: 'SKELETON',
      startX: 11,
      startY: 5,
      patrolPath: [{x:11,y:5},{x:13,y:5},{x:13,y:7},{x:11,y:7}],
      speed: 0.65,
      visionRange: 2
    }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 7, gridY: 3 },
    { id: 'i2', type: 'TORCH',         gridX: 11, gridY: 7 },
    { id: 'i3', type: 'KEY',           gridX: 9, gridY: 11 },
    { id: 'i4', type: 'SWORD',         gridX: 3, gridY: 3 }
  ],

  puzzles: [],
  wallHints: []
};
