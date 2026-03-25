// Tile types: 0=FLOOR, 1=WALL, 2=ENTRANCE, 3=EXIT, 4=DOOR_CLOSED
// Level 1 — 15x15 — Easy

export default {
  id: 1,
  width: 15,
  height: 15,
  // Row 0 is top, row 14 is bottom
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
    // Pendulum trap — swings between two points
    { id: 't1', type: 'PENDULUM', path: [{x:5,y:5},{x:5,y:7}], speed: 1.2 },
    // Moving wall
    { id: 't2', type: 'MOVING_WALL', path: [{x:9,y:3},{x:11,y:3}], speed: 1.0 }
  ],

  enemies: [
    { id: 'e1', patrolPath: [{x:3,y:9},{x:3,y:11},{x:5,y:11},{x:5,y:9}], speed: 0.8 }
  ],

  items: [
    { id: 'i1', type: 'HEALTH_POTION', gridX: 7, gridY: 3 },
    { id: 'i2', type: 'TORCH',         gridX: 11, gridY: 7 },
    { id: 'i3', type: 'KEY',           gridX: 9, gridY: 11 }
  ],

  puzzles: [
    {
      id: 'p1',
      switches: [
        { id: 's1', gridX: 3, gridY: 3, activationOrder: 0 },
        { id: 's2', gridX: 7, gridY: 7, activationOrder: 1 }
      ],
      correctSequence: ['s1', 's2'],
      doorId: { x: 13, y: 12 }  // DOOR_CLOSED tile position
    }
  ],

  wallHints: [
    { x: 2, y: 5,  text: 'La secuencia correcta empieza por el norte...' },
    { x: 8, y: 9,  text: 'Sigue el camino de las antorchas hacia la salida.' }
  ]
};
