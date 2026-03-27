import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import HUDScene from './scenes/HUDScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';
import MusicManager from './systems/MusicManager.js';

const isMobile = window.matchMedia('(pointer: coarse)').matches;

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#000000',
  scale: isMobile
    ? {
        mode: Phaser.Scale.RESIZE,
        parent: document.body,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.NO_CENTER
      }
    : {
        mode: Phaser.Scale.EXPAND,
        parent: document.body,
        width: 1280,
        height: 720,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
  scene: [MenuScene, GameScene, HUDScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);

// Create a single global music manager shared by all scenes
game.registry.set('musicManager', new MusicManager());
