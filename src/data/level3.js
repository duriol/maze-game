// Level 3 — 25x25 — Hard
export default {
  id: 3,
  width: 25,
  height: 25,
  tiles: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  ],
  entrance: { x: 1, y: 1 },
  exit: { x: 23, y: 24 },

  traps: [
    { id: 't1', type: 'PENDULUM',    path: [{x:5,y:5},{x:5,y:11}],   speed: 1.8 },
    { id: 't2', type: 'PROJECTILE',  path: [{x:9,y:7},{x:19,y:7}],   speed: 4.0 },
    { id: 't3', type: 'MOVING_WALL', path: [{x:3,y:15},{x:9,y:15}],  speed: 1.5 },
    { id: 't4', type: 'SPIKE',       path: [{x:13,y:11},{x:13,y:15}], speed: 1.2 },
    { id: 't5', type: 'PENDULUM',    path: [{x:17,y:13},{x:21,y:13}], speed: 2.0 },
    { id: 't6', type: 'PROJECTILE',  path: [{x:7,y:19},{x:19,y:19}],  speed: 3.5 }
  ],

  enemies: [
    { id: 'e1', patrolPath: [{x:3,y:7},{x:3,y:13},{x:9,y:13},{x:9,y:7}],   speed: 1.2 },
    { id: 'e2', patrolPath: [{x:13,y:5},{x:21,y:5},{x:21,y:11},{x:13,y:11}], speed: 1.4 },
    { id: 'e3', patrolPath: [{x:11,y:17},{x:19,y:17},{x:19,y:21},{x:11,y:21}], speed: 1.6 }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 9,  gridY: 3  },
    { id: 'i2', type: 'TORCH',         gridX: 19, gridY: 9  },
    { id: 'i3', type: 'KEY',           gridX: 7,  gridY: 19 },
    { id: 'i4', type: 'SWORD',         gridX: 15, gridY: 7  },
    { id: 'i5', type: 'SHIELD',        gridX: 11, gridY: 15 }
  ],

  puzzles: [
    {
      id: 'p1',
      switches: [
        { id: 's1', gridX: 5,  gridY: 3,  activationOrder: 0 },
        { id: 's2', gridX: 13, gridY: 9,  activationOrder: 1 },
        { id: 's3', gridX: 19, gridY: 15, activationOrder: 2 }
      ],
      correctSequence: ['s1', 's2', 's3'],
      doorId: { x: 23, y: 23 }
    },
    {
      id: 'p2',
      switches: [
        { id: 's4', gridX: 7,  gridY: 13, activationOrder: 0 },
        { id: 's5', gridX: 17, gridY: 19, activationOrder: 1 }
      ],
      correctSequence: ['s4', 's5'],
      doorId: { x: 21, y: 21 }
    }
  ],

  wallHints: [
    { x: 4,  y: 3,  text: 'El primer sello está en el norte. Búscalo.' },
    { x: 12, y: 9,  text: 'El segundo sello guarda el corazón del laberinto.' },
    { x: 18, y: 15, text: 'El tercer sello abre el camino final.' },
    { x: 6,  y: 13, text: 'Dos puertas secundarias bloquean atajos. Encuéntralos.' },
    { x: 16, y: 19, text: 'La oscuridad es tu mayor enemigo. Usa la antorcha con sabiduría.' }
  ]
};
