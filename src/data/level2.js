// Level 2 - Skeletons + Minotaur - Medium challenge
export default {
  id: 2,
  width: 20,
  height: 20,
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  ],
  entrance: { x: 1, y: 1 },
  exit: { x: 18, y: 19 },

  traps: [
    { id: 't1', type: 'PENDULUM',    path: [{x:5,y:5},{x:5,y:9}],   speed: 1.1 },
    { id: 't2', type: 'PROJECTILE',  path: [{x:9,y:7},{x:15,y:7}],  speed: 2.2 },
    { id: 't3', type: 'MOVING_WALL', path: [{x:3,y:13},{x:7,y:13}], speed: 0.9 },
    { id: 't4', type: 'SPIKE',       path: [{x:13,y:11},{x:13,y:13}], speed: 0.8 }
  ],

  mines: [
    { id: 'm1', gridX: 3,  gridY: 9,  radius: 1 },
    { id: 'm2', gridX: 17, gridY: 5,  radius: 1 }
  ],

  // 3 Skeletons + 1 Minotaur - Increased difficulty
  enemies: [
    {
      id: 'skeleton1',
      type: 'SKELETON',
      startX: 3,
      startY: 7,
      patrolPath: [{x:3,y:7},{x:3,y:11},{x:7,y:11},{x:7,y:7}],
      speed: 0.7,
      visionRange: 3
    },
    {
      id: 'skeleton2',
      type: 'SKELETON',
      startX: 13,
      startY: 5,
      patrolPath: [{x:13,y:5},{x:17,y:5},{x:17,y:9},{x:13,y:9}],
      speed: 0.75,
      visionRange: 3
    },
    {
      id: 'skeleton3',
      type: 'SKELETON',
      startX: 9,
      startY: 15,
      patrolPath: [{x:9,y:15},{x:13,y:15},{x:13,y:17},{x:9,y:17}],
      speed: 1.0,
      visionRange: 3
    },
    {
      id: 'minotaur1',
      type: 'MINOTAUR',
      startX: 9,
      startY: 9,
      patrolPath: [{x:9,y:9},{x:11,y:9},{x:11,y:11},{x:9,y:11}],
      speed: 0.5,
      huntRange: 5
    }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 9,  gridY: 3  },
    { id: 'i2', type: 'TORCH',         gridX: 15, gridY: 11 },
    { id: 'i3', type: 'KEY',           gridX: 7,  gridY: 15 },
    { id: 'i4', type: 'SWORD',         gridX: 11, gridY: 9  },
    { id: 'i5', type: 'SHIELD',        gridX: 5,  gridY: 3  }
  ],

  puzzles: [],
  wallHints: []
};
