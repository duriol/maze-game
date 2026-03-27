// Level 3 - Multiple Skeletons + Minotaur + Specter - Hard challenge
export default {
  id: 3,
  width: 22,
  height: 22,
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,1],
    [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  ],
  entrance: { x: 1, y: 1 },
  exit: { x: 20, y: 21 },

  traps: [
    { id: 't1', type: 'PENDULUM',    path: [{x:7,y:7},{x:7,y:11}],    speed: 1.3 },
    { id: 't2', type: 'PROJECTILE',  path: [{x:5,y:13},{x:15,y:13}],  speed: 2.5 },
    { id: 't3', type: 'MOVING_WALL', path: [{x:11,y:5},{x:11,y:9}],   speed: 1.0 },
    { id: 't4', type: 'SPIKE',       path: [{x:17,y:7},{x:17,y:11}],  speed: 0.9 },
    { id: 't5', type: 'PENDULUM',    path: [{x:15,y:17},{x:19,y:17}], speed: 1.4 }
  ],

  mines: [
    { id: 'm1', gridX: 5,  gridY: 9,  radius: 1 },
    { id: 'm2', gridX: 15, gridY: 5,  radius: 1 },
    { id: 'm3', gridX: 11, gridY: 17, radius: 1 }
  ],

  // 4 Skeletons + 2 Minotaurs + 1 Specter (BALANCED: -30% speed, -25% ranges)
  enemies: [
    {
      id: 'skeleton1',
      type: 'SKELETON',
      startX: 5,
      startY: 5,
      patrolPath: [{x:5,y:5},{x:9,y:5},{x:9,y:9},{x:5,y:9}],
      speed: 0.75,
      visionRange: 3
    },
    {
      id: 'skeleton2',
      type: 'SKELETON',
      startX: 15,
      startY: 5,
      patrolPath: [{x:15,y:5},{x:19,y:5},{x:19,y:9},{x:15,y:9}],
      speed: 0.85,
      visionRange: 4
    },
    {
      id: 'skeleton3',
      type: 'SKELETON',
      startX: 5,
      startY: 15,
      patrolPath: [{x:5,y:15},{x:9,y:15},{x:9,y:19},{x:5,y:19}],
      speed: 0.7,
      visionRange: 3
    },
    {
      id: 'skeleton4',
      type: 'SKELETON',
      startX: 17,
      startY: 17,
      patrolPath: [{x:17,y:17},{x:19,y:17},{x:19,y:19},{x:17,y:19}],
      speed: 0.9,
      visionRange: 2
    },
    {
      id: 'minotaur1',
      type: 'MINOTAUR',
      startX: 11,
      startY: 7,
      patrolPath: [{x:11,y:7},{x:13,y:7},{x:13,y:9},{x:11,y:9}],
      speed: 0.55,
      huntRange: 5
    },
    {
      id: 'minotaur2',
      type: 'MINOTAUR',
      startX: 11,
      startY: 15,
      patrolPath: [{x:11,y:15},{x:13,y:15},{x:13,y:17},{x:11,y:17}],
      speed: 0.6,
      huntRange: 5
    },
    {
      id: 'specter1',
      type: 'SPECTER',
      startX: 11,
      startY: 11,
      patrolPath: [{x:11,y:11},{x:13,y:11}],
      teleportPath: [{x:5,y:5},{x:15,y:5},{x:5,y:15},{x:15,y:15},{x:11,y:11}],
      speed: 0.45
    }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 11, gridY: 3  },
    { id: 'i2', type: 'TORCH',         gridX: 19, gridY: 11 },
    { id: 'i3', type: 'KEY',           gridX: 7,  gridY: 19 },
    { id: 'i4', type: 'SWORD',         gridX: 3,  gridY: 11 },
    { id: 'i5', type: 'SHIELD',        gridX: 13, gridY: 13 },
    { id: 'i6', type: 'HEALTH_POTION', gridX: 17, gridY: 3  }
  ],

  puzzles: [],
  wallHints: []
};
