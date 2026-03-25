// Level 2 — 20x20 — Medium
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
    { id: 't1', type: 'PENDULUM',    path: [{x:5,y:5},{x:5,y:9}],   speed: 1.5 },
    { id: 't2', type: 'PROJECTILE',  path: [{x:9,y:7},{x:15,y:7}],  speed: 3.0 },
    { id: 't3', type: 'MOVING_WALL', path: [{x:3,y:13},{x:7,y:13}], speed: 1.2 },
    { id: 't4', type: 'SPIKE',       path: [{x:13,y:11},{x:13,y:13}], speed: 1.0 }
  ],

  enemies: [
    { id: 'e1', patrolPath: [{x:3,y:7},{x:3,y:11},{x:7,y:11},{x:7,y:7}], speed: 1.0 },
    { id: 'e2', patrolPath: [{x:13,y:5},{x:17,y:5},{x:17,y:9},{x:13,y:9}], speed: 1.2 }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 9,  gridY: 3  },
    { id: 'i2', type: 'TORCH',         gridX: 15, gridY: 11 },
    { id: 'i3', type: 'KEY',           gridX: 7,  gridY: 15 },
    { id: 'i4', type: 'SWORD',         gridX: 11, gridY: 9  }
  ],

  puzzles: [
    {
      id: 'p1',
      switches: [
        { id: 's1', gridX: 5,  gridY: 3,  activationOrder: 0 },
        { id: 's2', gridX: 11, gridY: 7,  activationOrder: 1 },
        { id: 's3', gridX: 15, gridY: 13, activationOrder: 2 }
      ],
      correctSequence: ['s1', 's2', 's3'],
      doorId: { x: 18, y: 18 }
    }
  ],

  wallHints: [
    { x: 4,  y: 3,  text: 'Tres palancas guardan el paso. El orden importa.' },
    { x: 10, y: 7,  text: 'La segunda palanca está al centro del laberinto.' },
    { x: 14, y: 13, text: 'La última palanca abre el camino a la salida.' }
  ]
};
