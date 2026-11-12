import { Engine } from './core/Engine';
import { Atmosphere } from './world/Atmosphere';
import { Island } from './world/Island';
import { Ocean } from './world/Ocean';
import { Foliage } from './world/Foliage';
import { Rocks } from './world/Rocks';
import { Shipwreck } from './world/Shipwreck';
import { Player } from './entities/Player';
import { ThirdPersonCamera } from './entities/ThirdPersonCamera';
import { InputManager } from './core/InputManager';
import { CharacterController } from './entities/CharacterController';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { SaveSystem, GameSettings, SaveData } from './core/SaveSystem';
import { soundManager } from './core/SoundManager';
import * as THREE from 'three';

type GameState = 'MENU' | 'PLAYING' | 'PAUSED';

class GameApp {
  private engine: Engine;
  private atmosphere: Atmosphere;
  private island: Island;
  private ocean: Ocean;
  private foliage: Foliage;
  private rocks: Rocks;
  private shipwreck: Shipwreck;

  private player: Player;
  private thirdPersonCamera: ThirdPersonCamera;
  private input: InputManager;
  private controller: CharacterController;

  private hud: HUD;
  private mainMenu: MainMenu;

  private state: GameState = 'MENU';
  private gameTime: number = 0; // minutes
  private menuOrbitAngle: number = 0;

  constructor() {
    const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
    this.engine = new Engine(canvas);

    // Initialize world modules
    this.atmosphere = new Atmosphere(this.engine.scene);
    this.island = new Island(this.engine.scene);
    this.ocean = new Ocean(this.engine.scene);
    this.foliage = new Foliage(this.engine.scene, this.island);
    this.rocks = new Rocks(this.engine.scene, this.island);
    this.shipwreck = new Shipwreck(this.engine.scene, this.island);

    // Initialize player & controls
    this.player = new Player(this.engine.scene);
    this.thirdPersonCamera = new ThirdPersonCamera(this.engine.camera, this.island);
    this.input = new InputManager(canvas);
    this.controller = new CharacterController(
      this.player,
      this.thirdPersonCamera,
      this.input,
      this.island
    );

    // Initialize UI
    this.hud = new HUD();
    this.mainMenu = new MainMenu();

    this.setupUIHandlers();
    this.applyLoadedSettings();

    // Re-lock pointer on canvas click if in playing state
    canvas.addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.input.requestPointerLock();
      }
    });

    // Start render loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  private setupUIHandlers(): void {
    // Menu Actions
    this.mainMenu.setCallbacks({
      onStart: () => this.startNewGame(),
      onContinue: () => this.continueGame(),
      onResume: () => this.resumeGame(),
      onSave: () => this.saveGame(),
      onQuit: () => this.quitToMainMenu(),
      onSettingsChanged: (settings: GameSettings) => this.applySettings(settings)
    });

    // Keyboard 'E' Interaction
    this.input.setOnInteract(() => {
      if (this.state === 'PLAYING') {
        this.handlePlayerInteraction();
      }
    });

    // Keyboard ESC Pause Handler
    this.input.setOnPauseToggle(() => {
      if (this.state === 'PLAYING') {
        this.pauseGame();
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    });
  }

  private applyLoadedSettings(): void {
    const settings = SaveSystem.loadSettings();
    this.applySettings(settings);
  }

  private applySettings(settings: GameSettings): void {
    this.engine.setFOV(settings.fov);
    this.engine.setShadowQuality(settings.shadows);
    this.input.setSensitivity(settings.sensitivity);
    soundManager.setVolume(settings.volume / 100);
  }

  private startNewGame(): void {
    soundManager.startOceanAmbience();
    this.controller.spawnOnBeach();
    this.controller.stats = {
      health: 100,
      hunger: 95,
      thirst: 90
    };
    this.hud.setMission('Search the shoreline for your wrecked expedition ship.');
    this.gameTime = 0;
    this.state = 'PLAYING';
    this.hud.show();
    this.input.requestPointerLock();
  }

  private continueGame(): void {
    const data = SaveSystem.loadGame();
    if (!data) {
      this.startNewGame();
      return;
    }

    soundManager.startOceanAmbience();
    this.controller.setPositionAndRotation(data.playerPosition, data.playerRotation);
    this.controller.stats = { ...data.stats };
    this.hud.setMission(data.mission || 'Search the shoreline for your wrecked expedition ship.');
    this.gameTime = data.gameTime || 0;
    this.thirdPersonCamera.yaw = data.playerRotation;

    this.state = 'PLAYING';
    this.hud.show();
    this.input.requestPointerLock();
  }

  private pauseGame(): void {
    this.state = 'PAUSED';
    this.input.exitPointerLock();
    this.mainMenu.showPauseMenu();
  }

  private resumeGame(): void {
    this.state = 'PLAYING';
    this.mainMenu.hidePauseMenu();
    this.input.requestPointerLock();
  }

  private saveGame(): void {
    const data: SaveData = {
      playerPosition: {
        x: this.controller.position.x,
        y: this.controller.position.y,
        z: this.controller.position.z
      },
      playerRotation: this.controller.rotationY,
      stats: { ...this.controller.stats },
      mission: this.hud.getMission(),
      gameTime: this.gameTime,
      timestamp: Date.now()
    };
    SaveSystem.saveGame(data);
  }

  private quitToMainMenu(): void {
    this.state = 'MENU';
    this.hud.hide();
    this.input.exitPointerLock();
  }

  private handlePlayerInteraction(): void {
    const distToShip = this.shipwreck.getInteractionDistance(this.controller.position);
    if (distToShip < 5.0) {
      soundManager.playInteract();
      const message = this.shipwreck.salvage();
      this.hud.setMission(message);
    }
  }

  private checkProximityInteractions(): void {
    const distToShip = this.shipwreck.getInteractionDistance(this.controller.position);
    if (distToShip < 5.0) {
      if (!this.shipwreck.isSalvaged) {
        this.hud.showInteractionPrompt('Search Shipwreck Cache');
      } else {
        this.hud.showInteractionPrompt('Examine Shipwreck (Searched)');
      }
    } else {
      this.hud.hideInteractionPrompt();
    }
  }

  private loop(): void {
    requestAnimationFrame(this.loop);

    const deltaTime = Math.min(this.engine.clock.getDelta(), 0.1);
    const elapsedTime = this.engine.clock.getElapsedTime();

    // Update global environmental elements
    this.ocean.update(elapsedTime);
    this.atmosphere.update(elapsedTime);

    if (this.state === 'MENU') {
      // Cinematic camera orbit around island and shipwreck
      this.menuOrbitAngle += deltaTime * 0.12;
      const orbitRadius = 75;
      const camX = 42 + Math.cos(this.menuOrbitAngle) * orbitRadius;
      const camZ = 25 + Math.sin(this.menuOrbitAngle) * orbitRadius;
      const camY = Math.max(16, this.island.getHeightAt(camX, camZ) + 12);

      this.engine.camera.position.set(camX, camY, camZ);
      this.engine.camera.lookAt(new THREE.Vector3(42, 4, 25)); // Focus on shipwreck
    } else if (this.state === 'PLAYING') {
      this.gameTime += deltaTime * 2.0; // Simulated time passage

      // Handle mouse camera rotation
      const mouseDeltas = this.input.consumeMouseDeltas();
      if (this.input.pointerLocked) {
        this.thirdPersonCamera.updateMouseLook(mouseDeltas.x, mouseDeltas.y);
      }

      // Update character movement & physics
      this.controller.update(deltaTime);

      // Follow camera
      this.thirdPersonCamera.update(this.controller.position, deltaTime);

      // HUD updates
      this.hud.update(this.controller.stats, this.controller.position, this.gameTime);
      this.checkProximityInteractions();
    }

    this.engine.render();
  }
}

// Boot game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});

