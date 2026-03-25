# Assets

El juego funciona sin assets externos (usa gráficos geométricos generados por código).

Para agregar audio, coloca archivos .mp3 o .ogg en esta carpeta y cárgalos en GameScene:

## Efectos de sonido esperados (opcionales)
- `step.mp3` — pasos del jugador
- `damage.mp3` — recibir daño
- `pickup.mp3` — recoger ítem
- `door_open.mp3` — abrir puerta
- `switch_ok.mp3` — palanca correcta
- `switch_wrong.mp3` — palanca incorrecta
- `puzzle_solved.mp3` — acertijo resuelto
- `sword.mp3` — usar espada
- `level_complete.mp3` — completar nivel
- `game_over.mp3` — game over

## Música de fondo (opcional)
- `music_level1.mp3`
- `music_level2.mp3`
- `music_level3.mp3`

## Para cargar los assets, agrega en GameScene.preload():
```js
preload() {
  this.load.audio('step', 'assets/step.mp3');
  this.load.audio('damage', 'assets/damage.mp3');
  // ... etc
}
```
