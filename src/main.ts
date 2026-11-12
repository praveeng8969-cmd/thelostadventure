import { Engine } from './core/Engine';
import { Atmosphere } from './world/Atmosphere';
import { Island } from './world/Island';
import { Ocean } from './world/Ocean';
import { Foliage } from './world/Foliage';
import { Rocks } from './world/Rocks';
import { Shipwreck } from './world/Shipwreck';
import { CollectiblesManager } from './world/Collectibles';
import { Player } from './entities/Player';
import { ThirdPersonCamera } from './entities/ThirdPersonCamera';
import { InputManager } from './core/InputManager';
import { CharacterController } from './entities/CharacterController';
import { Inventory } from './inventory/Inventory';
import { InventoryUI } from './ui/InventoryUI';
import { MissionManager } from './missions/MissionManager';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { SaveSystem, GameSettings, SaveDataV2 } from './core/SaveSystem';
import { soundManager } from './core/SoundManager';
import { ResourceType } from './inventory/Item';
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
  private collectiblesManager: CollectiblesManager;

  private player: Player;
  private thirdPersonCamera: ThirdPersonCamera;
  private input: InputManager;
  private controller: CharacterController;

  private inventory: Inventory;
  private inventoryUI: InventoryUI;
  private missionManager: MissionManager;

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
    this.collectiblesManager = new CollectiblesManager(this.engine.scene, this.island);

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

    // Initialize systems: Inventory, Missions, UI
    this.inventory = new Inventory();
    this.inventoryUI = new InventoryUI(this.inventory);
    this.missionManager = new MissionManager();
    this.hud = new HUD();
    this.mainMenu = new MainMenu();

    this.setupUIHandlers();
    this.setupMissions();
    this.applyLoadedSettings();

    // Re-lock pointer on canvas click if playing and inventory is not open
    canvas.addEventListener('click', () => {
      if (this.state === 'PLAYING' && !this.inventoryUI.isOpen()) {
        this.input.requestPointerLock();
      }
    });

    // Start render loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  private setupMissions(): void {
    this.missionManager.setCallbacks({
      onProgress: (missionText) => {
        this.hud.setMission(missionText);
      },
      onComplete: (completed, nextMission) => {
        soundManager.playInteract();
        this.hud.showMissionComplete(completed.title);
        if (nextMission) {
          this.hud.showToast(`New Objective: ${nextMission.title}`);
        }
      }
    });

    // Track distance explored for beach mission
    this.controller.setOnMoveDistance((dist) => {
      this.missionManager.recordDistanceTraveled(dist);
    });
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
      if (this.state === 'PLAYING' && !this.inventoryUI.isOpen()) {
        this.handlePlayerInteraction();
      }
    });

    // Keyboard TAB Inventory Toggle
    this.input.setOnInventoryToggle(() => {
      if (this.state === 'PLAYING') {
        if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
        } else {
          this.inventoryUI.open();
          this.input.exitPointerLock();
        }
      }
    });

    // When inventory closes by UI button
    this.inventoryUI.setOnClose(() => {
      if (this.state === 'PLAYING') {
        this.input.requestPointerLock();
      }
    });

    // Inventory Item Consumption (Eat Coconut / Drink Water)
    this.inventoryUI.setOnUseItem((type: ResourceType, slotIndex: number) => {
      const result = this.controller.consume(type);
      if (result.success) {
        this.inventory.removeAtSlot(slotIndex, 1);
        this.hud.showToast(result.message);
      } else {
        this.hud.showToast(result.message);
      }
    });

    // Keyboard ESC Pause Handler
    this.input.setOnPauseToggle(() => {
      if (this.state === 'PLAYING') {
        if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
        } else {
          this.pauseGame();
        }
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
      hunger: 100,
      thirst: 100
    };
    this.inventory.clear();
    this.collectiblesManager.resetAll();
    this.shipwreck.setSalvaged(false);
    this.missionManager.reset();
    this.hud.setMission(this.missionManager.getCurrentMissionText());
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
    this.inventory.deserialize(data.inventory);
    this.collectiblesManager.restoreCollectedIds(data.collectedIds);
    this.shipwreck.setSalvaged(data.isShipwreckSalvaged);
    this.missionManager.deserialize(data.mission);
    this.hud.setMission(this.missionManager.getCurrentMissionText());
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
    const data: Omit<SaveDataV2, 'version'> = {
      playerPosition: {
        x: this.controller.position.x,
        y: this.controller.position.y,
        z: this.controller.position.z
      },
      playerRotation: this.controller.rotationY,
      stats: { ...this.controller.stats },
      inventory: this.inventory.serialize(),
      mission: this.missionManager.serialize(),
      collectedIds: this.collectiblesManager.getCollectedIds(),
      isShipwreckSalvaged: this.shipwreck.isSalvaged,
      gameTime: this.gameTime,
      timestamp: Date.now()
    };
    SaveSystem.saveGame(data);
  }

  private quitToMainMenu(): void {
    this.state = 'MENU';
    if (this.inventoryUI.isOpen()) {
      this.inventoryUI.close();
    }
    this.hud.hide();
    this.input.exitPointerLock();
  }

  private handlePlayerInteraction(): void {
    // 1. Check for nearby world collectible resource
    const nearestItem = this.collectiblesManager.getNearestCollectible(this.controller.position, 2.8);
    if (nearestItem) {
      if (!this.inventory.hasFreeSpace(nearestItem.type)) {
        this.hud.showToast('Inventory full! Cannot collect item.');
        return;
      }

      const res = this.inventory.addItem(nearestItem.type, 1);
      if (res.added > 0) {
        this.collectiblesManager.collectItem(nearestItem);
        this.missionManager.recordResourceCollected(nearestItem.type);
        const resourceName = nearestItem.promptText.replace('Collect ', '');
        this.hud.showToast(`Collected ${resourceName} (+1)`);
      }
      return;
    }

    // 2. Check for Shipwreck interaction
    const distToShip = this.shipwreck.getInteractionDistance(this.controller.position);
    if (distToShip < 5.0) {
      soundManager.playInteract();
      const message = this.shipwreck.salvage();
      this.missionManager.recordShipwreckInspected();
      this.hud.showToast(message);
    }
  }

  private checkProximityInteractions(): void {
    // 1. Check for nearby collectible
    const nearestItem = this.collectiblesManager.getNearestCollectible(this.controller.position, 2.8);
    if (nearestItem) {
      this.hud.showInteractionPrompt(nearestItem.promptText);
      return;
    }

    // 2. Check for Shipwreck
    const distToShip = this.shipwreck.getInteractionDistance(this.controller.position);
    if (distToShip < 5.0) {
      if (!this.shipwreck.isSalvaged) {
        this.hud.showInteractionPrompt('Inspect Damaged Ship');
      } else {
        this.hud.showInteractionPrompt('Examine Shipwreck (Searched)');
      }
      return;
    }

    this.hud.hideInteractionPrompt();
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
      // In-game time passage
      this.gameTime += deltaTime * 2.0;

      // When inventory modal is open, prevent mouse look and character movement
      if (!this.inventoryUI.isOpen()) {
        const mouseDeltas = this.input.consumeMouseDeltas();
        if (this.input.pointerLocked) {
          this.thirdPersonCamera.updateMouseLook(mouseDeltas.x, mouseDeltas.y);
        }

        // Update character movement, animation & survival decay
        this.controller.update(deltaTime);
      } else {
        // Discard mouse delta so camera doesn't jump after closing inventory
        this.input.consumeMouseDeltas();
      }

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
