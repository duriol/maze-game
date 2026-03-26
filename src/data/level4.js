// Level 4 — 30x30 — Very Hard
export default {
  id: 4,
  width: 30,
  height: 30,
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1,1,1,0,1,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  ],
  entrance: { x: 1, y: 1 },
  exit: { x: 28, y: 29 },

  traps: [
    { id: 't1', type: 'PENDULUM',    path: [{x:5,y:5},{x:5,y:15}],    speed: 2.0 },
    { id: 't2', type: 'PROJECTILE',  path: [{x:10,y:10},{x:25,y:10}], speed: 4.5 },
    { id: 't3', type: 'MOVING_WALL', path: [{x:3,y:20},{x:15,y:20}],  speed: 2.0 },
    { id: 't4', type: 'SPIKE',       path: [{x:15,y:5},{x:15,y:15}],  speed: 1.5 },
    { id: 't5', type: 'PENDULUM',    path: [{x:20,y:15},{x:27,y:15}], speed: 2.2 },
    { id: 't6', type: 'PROJECTILE',  path: [{x:8,y:25},{x:22,y:25}],  speed: 4.0 },
    { id: 't7', type: 'MOVING_WALL', path: [{x:12,y:7},{x:12,y:17}],  speed: 1.8 },
    { id: 't8', type: 'SPIKE',       path: [{x:18,y:20},{x:25,y:20}], speed: 1.6 }
  ],

  mines: [
    { id: 'm1', gridX: 7,  gridY: 11, radius: 2 },
    { id: 'm2', gridX: 21, gridY: 9,  radius: 2 },
    { id: 'm3', gridX: 9,  gridY: 19, radius: 2 },
    { id: 'm4', gridX: 23, gridY: 19, radius: 2 },
    { id: 'm5', gridX: 3,  gridY: 23, radius: 2 }
  ],

  enemies: [
    { id: 'e1', patrolPath: [{x:3,y:9},{x:3,y:17},{x:11,y:17},{x:11,y:9}],     speed: 1.6 },
    { id: 'e2', patrolPath: [{x:16,y:5},{x:24,y:5},{x:24,y:13},{x:16,y:13}],   speed: 1.8 },
    { id: 'e3', patrolPath: [{x:11,y:21},{x:19,y:21},{x:19,y:27},{x:11,y:27}], speed: 2.0 },
    { id: 'e4', patrolPath: [{x:5,y:13},{x:9,y:13},{x:9,y:21},{x:5,y:21}],   speed: 1.7 },
    { id: 'e5', patrolPath: [{x:17,y:9},{x:25,y:9},{x:25,y:17},{x:17,y:17}],   speed: 1.9 }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 3,  gridY: 3  },
    { id: 'i2', type: 'TORCH',         gridX: 21, gridY: 11 },
    { id: 'i3', type: 'KEY',           gridX: 9,  gridY: 23 },
    { id: 'i4', type: 'SWORD',         gridX: 17, gridY: 9  },
    { id: 'i5', type: 'SHIELD',        gridX: 13, gridY: 19 },
    { id: 'i6', type: 'HEALTH_POTION', gridX: 19, gridY: 23 },
    { id: 'i7', type: 'TORCH',         gridX: 5,  gridY: 13 }
  ],

  puzzles: [
    {
      id: 'p1',
      switches: [
        { id: 's1', gridX: 7,  gridY: 4,  activationOrder: 0 },
        { id: 's2', gridX: 17, gridY: 13, activationOrder: 1 },
        { id: 's3', gridX: 24, gridY: 21, activationOrder: 2 }
      ],
      correctSequence: ['s1', 's2', 's3'],
      doorId: { x: 28, y: 28 }
    },
    {
      id: 'p2',
      switches: [
        { id: 's4', gridX: 10, gridY: 15, activationOrder: 0 },
        { id: 's5', gridX: 19, gridY: 21, activationOrder: 1 }
      ],
      correctSequence: ['s4', 's5'],
      doorId: { x: 25, y: 25 }
    }
  ],

  wallHints: [
    { x: 6,  y: 4,  text: 'Primera palanca al noroeste. El orden es: noroeste → centro → sureste. Los enemigos aquí son más rápidos.' },
    { x: 15, y: 12, text: 'Segunda palanca encontrada. La espada está cerca al noreste. Úsala con cuidado: solo 3 usos.' },
    { x: 22, y: 20, text: 'Tercera palanca al sureste. Dos accesos secundarios requieren sus propias palancas para abrirse.' },
    { x: 8,  y: 15, text: 'Palanca secundaria aquí. Su par está al sureste. Las minas en este nivel explotan con radio mayor.' },
    { x: 19, y: 22, text: 'La salida está al sureste, pero el suelo está minado. Elige tu camino con cuidado.' }
  ]
};
