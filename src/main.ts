import { Engine } from './core/Engine';
import { Atmosphere } from './world/Atmosphere';
import { Island } from './world/Island';
import { Ocean } from './world/Ocean';
import { Foliage } from './world/Foliage';
import { Rocks } from './world/Rocks';
import { WorldDetails } from './world/WorldDetails';
import { Shipwreck } from './world/Shipwreck';
import { SignalRelay } from './world/SignalRelay';
import { CollectiblesManager } from './world/Collectibles';
import { CampfireManager, CampfireInstance } from './world/Campfire';
import { FishingSpot } from './fishing/FishingSpot';
import { Player } from './entities/Player';
import { ThirdPersonCamera } from './entities/ThirdPersonCamera';
import { InputManager } from './core/InputManager';
import { MobileControls } from './ui/MobileControls';
import { MobileLayout } from './ui/MobileLayout';
import { CharacterController } from './entities/CharacterController';
import { Inventory } from './inventory/Inventory';
import { InventoryUI } from './ui/InventoryUI';
import { CraftingManager } from './crafting/Crafting';
import { CraftingUI } from './ui/CraftingUI';
import { BuildingManager } from './building/BuildingManager';
import { StructureType } from './building/StructurePieces';
import { MissionManager } from './missions/MissionManager';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { SaveSystem, GameSettings, SaveDataV3 } from './core/SaveSystem';
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
  private signalRelay: SignalRelay;
  private collectiblesManager: CollectiblesManager;
  private campfireManager: CampfireManager;
  private fishingSpot: FishingSpot;

  private player: Player;
  private thirdPersonCamera: ThirdPersonCamera;
  private input: InputManager;
  private mobileControls: MobileControls;
  private mobileLayout: MobileLayout;
  private controller: CharacterController;

  private inventory: Inventory;
  private inventoryUI: InventoryUI;
  private craftingManager: CraftingManager;
  private craftingUI: CraftingUI;
  private buildingManager: BuildingManager;
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
    new WorldDetails(this.engine.scene, this.island);
    this.shipwreck = new Shipwreck(this.engine.scene, this.island);
    this.signalRelay = new SignalRelay(this.engine.scene, this.island);
    this.collectiblesManager = new CollectiblesManager(this.engine.scene, this.island);
    this.campfireManager = new CampfireManager(this.engine.scene);
    this.fishingSpot = new FishingSpot(this.engine.scene, this.island);

    // Initialize building manager
    this.buildingManager = new BuildingManager(this.engine.scene, this.island, this.campfireManager);

    // Initialize player & controls
    this.player = new Player(this.engine.scene);
    this.thirdPersonCamera = new ThirdPersonCamera(this.engine.camera, this.island);
    this.input = new InputManager(canvas);
    this.mobileControls = new MobileControls(this.input);
    this.mobileLayout = new MobileLayout();
    this.controller = new CharacterController(
      this.player,
      this.thirdPersonCamera,
      this.input,
      this.island
    );

    // Initialize systems: Inventory, Crafting, Missions, UI
    this.inventory = new Inventory();
    this.inventoryUI = new InventoryUI(this.inventory);
    this.craftingManager = new CraftingManager();
    this.craftingUI = new CraftingUI(this.craftingManager, this.inventory);
    this.missionManager = new MissionManager();
    this.hud = new HUD();
    this.mainMenu = new MainMenu();

    this.setupUIHandlers();
    this.setupMissions();
    this.applyLoadedSettings();

    // Re-lock pointer on canvas click if playing and modals are closed
    canvas.addEventListener('click', () => {
      if (
        this.state === 'PLAYING' &&
        !this.inventoryUI.isOpen() &&
        !this.craftingUI.isOpen() &&
        !this.buildingManager.isPlacing()
      ) {
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

        // Milestone recipe unlocks
        if (completed.id === 'light_campfire') {
          this.craftingManager.unlockCookingStation();
          this.hud.showToast('Recipe Unlocked: Cooking Station!');
        } else if (completed.id === 'cook_fish') {
          this.craftingManager.unlockBuildingRecipes();
          this.hud.showToast('Modular Building Unlocked: Wooden Floor, Wall & Roof!');
        } else if (completed.id === 'build_shelter') {
          this.hud.showToast('Shelter Complete! Weather protection activated.');
        }

        if (nextMission) {
          this.hud.showToast(`New Objective: ${nextMission.title}`);
        }
      }
    });

    // Track distance explored for beach mission
    this.controller.setOnMoveDistance((dist) => {
      this.missionManager.recordDistanceTraveled(dist);
    });

    // Track building shelter event
    this.buildingManager.setCallbacks({
      onShelterStatusChanged: (isComplete) => {
        if (isComplete) {
          this.missionManager.recordShelterBuilt();
          this.hud.showToast('Shelter Complete! Fully enclosed foundation & roof detected.');
        }
      }
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
      if (this.state === 'PLAYING' && !this.inventoryUI.isOpen() && !this.craftingUI.isOpen()) {
        this.handlePlayerInteraction();
      }
    });

    // Keyboard TAB Inventory Toggle
    this.input.setOnInventoryToggle(() => {
      if (this.state === 'PLAYING') {
        if (this.craftingUI.isOpen()) {
          this.craftingUI.close();
        }
        if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
        } else {
          if (this.buildingManager.isPlacing()) {
            this.buildingManager.cancelPlacement();
            this.hud.setPlacementMode(false);
          }
          this.inventoryUI.open();
          this.mobileControls.setVisible(false);
          this.input.exitPointerLock();
        }
      }
    });

    // Keyboard 'C' Crafting Toggle
    this.input.setOnCraftingToggle(() => {
      if (this.state === 'PLAYING') {
        if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
        }
        if (this.craftingUI.isOpen()) {
          this.craftingUI.close();
        } else {
          if (this.buildingManager.isPlacing()) {
            this.buildingManager.cancelPlacement();
            this.hud.setPlacementMode(false);
          }
          this.craftingUI.open();
          this.mobileControls.setVisible(false);
          this.input.exitPointerLock();
        }
      }
    });

    // Keyboard 'R' Rotate Placement
    this.input.setOnRotatePlacement(() => {
      if (this.state === 'PLAYING' && this.buildingManager.isPlacing()) {
        this.buildingManager.rotatePreview();
      }
    });

    // F3 Performance Stats Overlay Toggle
    this.input.setOnDebugToggle(() => {
      const active = this.hud.toggleDebugOverlay();
      if (active) {
        const stats = this.engine.updatePerformanceStats();
        this.hud.updateDebugOverlay(stats, this.atmosphere.currentWeather);
      }
    });

    // F4 Weather Cycle Toggle
    this.input.setOnWeatherToggle(() => {
      this.atmosphere.cycleWeather();
      this.hud.showToast(`Weather shifted to ${this.atmosphere.currentWeather}`);
      if (this.hud.isDebugOverlayVisible()) {
        const stats = this.engine.updatePerformanceStats();
        this.hud.updateDebugOverlay(stats, this.atmosphere.currentWeather);
      }
    });

    // Left Mouse Click Primary Action (Placement)
    this.input.setOnPrimaryAction(() => {
      if (this.state === 'PLAYING' && this.buildingManager.isPlacing()) {
        this.handlePlacementClick();
      }
    });

    // When inventory closes by UI button
    this.inventoryUI.setOnClose(() => {
      if (this.state === 'PLAYING' && !this.buildingManager.isPlacing()) {
        this.mobileControls.setVisible(this.input.touchDevice);
        this.input.requestPointerLock();
      }
    });

    // When crafting closes by UI button
    this.craftingUI.setOnClose(() => {
      if (this.state === 'PLAYING' && !this.buildingManager.isPlacing()) {
        this.mobileControls.setVisible(this.input.touchDevice);
        this.input.requestPointerLock();
      }
    });

    // Crafting callback
    this.craftingUI.setOnCraft((recipe) => {
      this.missionManager.recordCraftItem(recipe.resultType);
      this.hud.showToast(`Crafted ${recipe.name}! Added to bag.`);
    });

    // Inventory Item Consumption (Eat Coconut / Drink Water / Eat Fish)
    this.inventoryUI.setOnUseItem((type: ResourceType, slotIndex: number) => {
      const result = this.controller.consume(type);
      if (result.success) {
        this.inventory.removeAtSlot(slotIndex, 1);
        this.hud.showToast(result.message);
      } else {
        this.hud.showToast(result.message);
      }
    });

    // Inventory Tool Equip
    this.inventoryUI.setOnEquipTool((tool) => {
      this.controller.equipTool(tool);
      this.inventoryUI.setEquippedTool(tool);
      if (tool) {
        this.hud.showToast(`Equipped ${tool.replace('_', ' ')}! Wood harvesting doubled.`);
      } else {
        this.hud.showToast('Unequipped tool.');
      }
    });

    // Inventory Structure Placement Trigger
    this.inventoryUI.setOnStartPlacement((itemType) => {
      this.buildingManager.startPlacement(itemType as StructureType);
      this.hud.setPlacementMode(true);
      this.input.requestPointerLock();
      this.hud.showToast(`Placing ${itemType.replace('_', ' ')}. [L-Click] Place, [R] Rotate, [ESC] Cancel`);
    });

    // Keyboard ESC Pause Handler
    this.input.setOnPauseToggle(() => {
      if (this.state === 'PLAYING') {
        if (this.buildingManager.isPlacing()) {
          this.buildingManager.cancelPlacement();
          this.hud.setPlacementMode(false);
          this.hud.showToast('Placement cancelled.');
        } else if (this.craftingUI.isOpen()) {
          this.craftingUI.close();
        } else if (this.inventoryUI.isOpen()) {
          this.inventoryUI.close();
        } else {
          this.pauseGame();
        }
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
    });
  }

  private handlePlacementClick(): void {
    const activeType = this.buildingManager.getActivePlacementType();
    if (!activeType) return;

    const result = this.buildingManager.placeCurrent();
    if (result.success) {
      // Deduct exactly 1 piece from inventory
      this.inventory.removeItem(activeType, 1);
      this.hud.showToast(result.message);

      // Check if player still has pieces of this type
      const remaining = this.inventory.getItemCount(activeType);
      if (remaining <= 0) {
        this.buildingManager.cancelPlacement();
        this.hud.setPlacementMode(false);
        this.hud.showToast(`Out of ${activeType.replace('_', ' ')}s!`);
      }
    } else {
      this.hud.showToast(result.message);
    }
  }

  private applyLoadedSettings(): void {
    const settings = SaveSystem.loadSettings();
    this.applySettings(settings);
  }

  private applySettings(settings: GameSettings): void {
    if (settings.preset) {
      this.engine.setGraphicsPreset(settings.preset);
    }
    this.engine.setFOV(settings.fov);
    this.engine.setShadowQuality(settings.shadows);
    this.input.setSensitivity(settings.sensitivity);
    soundManager.setVolume(settings.volume / 100);
  }

  private startNewGame(): void {
    void this.mobileLayout.requestLandscape();
    soundManager.startOceanAmbience();
    this.controller.spawnOnBeach();
    this.controller.stats = {
      health: 100,
      hunger: 100,
      thirst: 100
    };
    this.controller.equipTool(null);
    this.inventoryUI.setEquippedTool(null);

    this.inventory.clear();
    this.craftingManager.resetToDefaults();
    this.buildingManager.clear();
    this.campfireManager.clear();
    this.collectiblesManager.resetAll();
    this.shipwreck.setSalvaged(false);
    this.missionManager.reset();

    this.hud.setMission(this.missionManager.getCurrentMissionText());
    this.hud.setPlacementMode(false);
    this.hud.setSheltered(false);
    this.gameTime = 0;
    this.state = 'PLAYING';
    this.hud.show();
    this.input.requestPointerLock();
    this.mobileControls.setVisible(this.input.touchDevice);
  }

  private continueGame(): void {
    void this.mobileLayout.requestLandscape();
    const data = SaveSystem.loadGame();
    if (!data) {
      this.startNewGame();
      return;
    }

    soundManager.startOceanAmbience();
    this.controller.setPositionAndRotation(data.playerPosition, data.playerRotation);
    this.controller.stats = { ...data.stats };
    this.controller.equipTool(data.equippedTool);
    this.inventoryUI.setEquippedTool(data.equippedTool);

    this.inventory.deserialize(data.inventory);
    this.craftingManager.deserialize(data.unlockedRecipes);
    this.campfireManager.deserialize(data.campfires);
    this.buildingManager.deserialize(data.placedStructures);
    this.collectiblesManager.restoreCollectedIds(data.collectedIds);
    this.shipwreck.setSalvaged(data.isShipwreckSalvaged);
    this.missionManager.deserialize(data.mission);

    this.hud.setMission(this.missionManager.getCurrentMissionText());
    this.hud.setPlacementMode(false);
    this.gameTime = data.gameTime || 0;
    this.thirdPersonCamera.yaw = data.playerRotation;

    this.state = 'PLAYING';
    this.hud.show();
    this.input.requestPointerLock();
    this.mobileControls.setVisible(this.input.touchDevice);
  }

  private pauseGame(): void {
    this.mobileControls.setVisible(false);
    this.state = 'PAUSED';
    this.input.exitPointerLock();
    this.mainMenu.showPauseMenu();
  }

  private resumeGame(): void {
    void this.mobileLayout.requestLandscape();
    this.state = 'PLAYING';
    this.mainMenu.hidePauseMenu();
    this.input.requestPointerLock();
    this.mobileControls.setVisible(this.input.touchDevice);
  }

  private saveGame(): void {
    const data: Omit<SaveDataV3, 'version'> = {
      playerPosition: {
        x: this.controller.position.x,
        y: this.controller.position.y,
        z: this.controller.position.z
      },
      playerRotation: this.controller.rotationY,
      stats: { ...this.controller.stats },
      inventory: this.inventory.serialize(),
      equippedTool: this.controller.equippedTool,
      unlockedRecipes: this.craftingManager.serialize(),
      placedStructures: this.buildingManager.serialize(),
      campfires: this.campfireManager.serialize(),
      shelterComplete: this.buildingManager.isShelterComplete,
      mission: this.missionManager.serialize(),
      collectedIds: this.collectiblesManager.getCollectedIds(),
      isShipwreckSalvaged: this.shipwreck.isSalvaged,
      gameTime: this.gameTime,
      timestamp: Date.now()
    };
    SaveSystem.saveGame(data);
  }

  private quitToMainMenu(): void {
    this.mobileControls.setVisible(false);
    this.state = 'MENU';
    if (this.inventoryUI.isOpen()) this.inventoryUI.close();
    if (this.craftingUI.isOpen()) this.craftingUI.close();
    if (this.buildingManager.isPlacing()) {
      this.buildingManager.cancelPlacement();
      this.hud.setPlacementMode(false);
    }
    this.hud.hide();
    this.input.exitPointerLock();
  }

  private handlePlayerInteraction(): void {
    // 1. Check for Campfire interaction
    const nearestCampfire = this.campfireManager.getNearestCampfire(this.controller.position, 3.2);
    if (nearestCampfire) {
      if (nearestCampfire.isCooking) {
        this.hud.showToast(`Fish is cooking... ${Math.ceil(nearestCampfire.cookingTimer)}s remaining.`);
        return;
      }

      if (nearestCampfire.isLit) {
        // If player has raw fish, cook it!
        if (this.inventory.getItemCount('raw_fish') > 0) {
          this.inventory.removeItem('raw_fish', 1);
          nearestCampfire.startCooking();
          this.hud.showToast('Started grilling Raw Fish over the campfire (5s)...');
          return;
        } else {
          // Extinguish campfire
          nearestCampfire.extinguish();
          this.hud.showToast('Extinguished campfire.');
          return;
        }
      } else {
        // Light campfire
        nearestCampfire.light();
        this.missionManager.recordCampfireLit();
        this.hud.showToast('Lit campfire! Fire crackles with warmth and light.');
        return;
      }
    }

    // 2. Check for Shoreline Fishing Spot
    if (this.fishingSpot.isPlayerNear(this.controller.position, 3.5)) {
      if (!this.inventory.hasFreeSpace('raw_fish')) {
        this.hud.showToast('Inventory full! Free a slot for fish.');
        return;
      }
      const res = this.fishingSpot.catchFish();
      if (res.success) {
        this.inventory.addItem('raw_fish', 1);
        this.hud.showToast(res.message);
      } else {
        this.hud.showToast(res.message);
      }
      return;
    }

    // 3. Check for nearby world collectible resource
    const nearestItem = this.collectiblesManager.getNearestCollectible(this.controller.position, 2.8);
    if (nearestItem) {
      if (!this.inventory.hasFreeSpace(nearestItem.type)) {
        this.hud.showToast('Inventory full! Cannot collect item.');
        return;
      }

      // Stone axe yields bonus wood!
      const countToAdd = (nearestItem.type === 'wood' && this.controller.equippedTool === 'stone_axe') ? 2 : 1;
      const res = this.inventory.addItem(nearestItem.type, countToAdd);

      if (res.added > 0) {
        this.collectiblesManager.collectItem(nearestItem);
        for (let i = 0; i < res.added; i++) {
          this.missionManager.recordResourceCollected(nearestItem.type);
        }
        const resourceName = nearestItem.promptText.replace('Collect ', '');
        if (countToAdd > 1) {
          this.hud.showToast(`Collected ${resourceName} (+${res.added}) [Axe Bonus!]`);
        } else {
          this.hud.showToast(`Collected ${resourceName} (+1)`);
        }
      }
      return;
    }

    // Story landmark: a repeating emergency signal in the inland jungle.
    if (this.signalRelay.isNear(this.controller.position)) {
      soundManager.playInteract();
      this.hud.showToast(this.signalRelay.inspect());
      this.missionManager.recordRelayInspected();
      return;
    }

    // 4. Check for Shipwreck interaction
    const distToShip = this.shipwreck.getInteractionDistance(this.controller.position);
    if (distToShip < 5.0) {
      soundManager.playInteract();
      const message = this.shipwreck.salvage();
      this.missionManager.recordShipwreckInspected();
      this.hud.showToast(message);
    }
  }

  private checkProximityInteractions(): void {
    if (this.buildingManager.isPlacing()) {
      this.hud.hideInteractionPrompt();
      return;
    }

    // 1. Campfire
    const nearestCampfire = this.campfireManager.getNearestCampfire(this.controller.position, 3.2);
    if (nearestCampfire) {
      if (nearestCampfire.isCooking) {
        this.hud.showInteractionPrompt(`Cooking Fish... (${Math.ceil(nearestCampfire.cookingTimer)}s)`);
      } else if (nearestCampfire.isLit) {
        if (this.inventory.getItemCount('raw_fish') > 0) {
          this.hud.showInteractionPrompt('Cook Raw Fish');
        } else {
          this.hud.showInteractionPrompt('Extinguish Campfire');
        }
      } else {
        this.hud.showInteractionPrompt('Light Campfire');
      }
      return;
    }

    // 2. Fishing Spot
    if (this.fishingSpot.isPlayerNear(this.controller.position, 3.5)) {
      this.hud.showInteractionPrompt('Catch Fish');
      return;
    }

    // 3. World Collectibles
    const nearestItem = this.collectiblesManager.getNearestCollectible(this.controller.position, 2.8);
    if (nearestItem) {
      this.hud.showInteractionPrompt(nearestItem.promptText);
      return;
    }

    if (this.signalRelay.isNear(this.controller.position)) {
      this.hud.showInteractionPrompt('Inspect RELAY 04 Emergency Log');
      return;
    }

    // 4. Shipwreck
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
    this.atmosphere.update(elapsedTime, this.state === 'PLAYING' ? this.controller.position : undefined);
    this.foliage.update(elapsedTime);
    this.signalRelay.update(elapsedTime);
    this.fishingSpot.update(elapsedTime);

    // Update campfires
    const { finishedCampfire } = this.campfireManager.update(deltaTime);
    if (finishedCampfire) {
      this.inventory.addItem('cooked_fish', 1);
      this.missionManager.recordFishCooked();
      this.hud.showToast('Cooked Fish (+1)! Savory grilled fish ready in your inventory.');
    }

    if (this.state === 'MENU') {
      // Cinematic camera orbit around island and shipwreck
      this.menuOrbitAngle += deltaTime * 0.12;
      const orbitRadius = 75;
      const camX = 42 + Math.cos(this.menuOrbitAngle) * orbitRadius;
      const camZ = 25 + Math.sin(this.menuOrbitAngle) * orbitRadius;
      const camY = Math.max(16, this.island.getHeightAt(camX, camZ) + 12);

      this.engine.camera.position.set(camX, camY, camZ);
      this.engine.camera.lookAt(new THREE.Vector3(42, 4, 25));
    } else if (this.state === 'PLAYING') {
      this.gameTime += deltaTime * 2.0;

      // Handle UI modals
      const isModalOpen = this.inventoryUI.isOpen() || this.craftingUI.isOpen();

      if (!isModalOpen) {
        const mouseDeltas = this.input.consumeMouseDeltas();
        if (this.input.pointerLocked || this.input.touchDevice) {
          this.thirdPersonCamera.updateMouseLook(mouseDeltas.x, mouseDeltas.y);
        }

        // Update character movement, animation & survival decay
        this.controller.update(deltaTime);

        // Update building preview if in placement mode
        if (this.buildingManager.isPlacing()) {
          const forward = this.thirdPersonCamera.getForwardVector();
          this.buildingManager.updatePreview(this.controller.position, forward);
        }
      } else {
        this.input.consumeMouseDeltas();
      }

      // Follow camera
      this.thirdPersonCamera.update(this.controller.position, deltaTime);

      // Shelter evaluation & weather protection flag
      const isSheltered = this.buildingManager.checkPlayerInsideShelter(this.controller.position);
      this.controller.isSheltered = isSheltered;
      this.hud.setSheltered(isSheltered);

      // HUD updates
      this.hud.update(this.controller.stats, this.controller.position, this.gameTime);
      this.checkProximityInteractions();
    }

    this.engine.render();

    // Performance debug overlay telemetry (F3)
    if (this.hud.isDebugOverlayVisible()) {
      const stats = this.engine.updatePerformanceStats();
      this.hud.updateDebugOverlay(stats, this.atmosphere.currentWeather);
    }
  }
}

// Boot game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
