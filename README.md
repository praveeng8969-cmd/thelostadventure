# THE LOST ADVENTURE (v0.1 Prototype)

A 3D browser-based survival adventure game built with Vite, TypeScript, and Three.js.

## Overview
A group of friends becomes stranded on a mysterious tropical island after a storm destroys their ship. They must survive, explore abandoned structures, uncover secret military experiments, repair their ship, and escape.

Version 0.1 delivers a fully functional single-player prototype featuring 3D terrain rendering, animated ocean water, atmospheric lighting, foliage & rocks, third-person character locomotion with collision & limb animation, survival status HUD, and an interactive menu system with persistent saves.

---

## Features Implemented in v0.1

### 1. 3D Tropical Island Environment
- **Procedural Island Heightmap:** Smooth sandy beaches, transition scrublands, lush jungle plateaus, and rocky cliff ridges.
- **Dynamic Ocean:** Animated vertex wave displacement shader with turquoise-to-deep blue gradients, specular sun highlights, and wave foam tips.
- **Foliage & Undergrowth:** Procedurally generated coconut palm trees with curved trunks & fronds, tiered jungle canopies, and tropical ferns.
- **Rocks & Boulders:** Stylized weathered coastal boulders and mountain ridges.
- **Damaged Shipwreck:** Fractured wooden keel split open on the sandbar, broken mast, snapped yardarm, ripped canvas sail, ship wheel, and scattered cargo debris.
- **Atmospheric Lighting & Fog:** Soft directional sun with PCF soft shadows, dual-tone hemisphere light, sky dome gradient, and tropical haze distance fog.

### 2. Third-Person Character Locomotion
- **Controls:** WASD movement oriented to the camera's perspective.
- **Sprinting:** Hold `Left Shift` to sprint (with increased stride, forward lean, and higher thirst/hunger consumption).
- **Mouse Camera:** Smooth orbit follow camera with pitch clamping and terrain collision clearance.
- **Terrain Collision:** Exact height clamping with shallow water wading resistance.
- **Limb Animation:** Procedural walking, sprinting, and idle breathing animations.
- **Synthesized Audio:** Procedural Web Audio API for ocean waves, footstep rustling on sand, and interaction chimes without external network asset dependencies.

### 3. Survival HUD
- Real-time **Health**, **Hunger**, and **Thirst** status meters.
- Current mission display (starts with exploring the shoreline for the wreckage, updates upon salvaging the ship's cache).
- World coordinate tracking and in-game day clock.
- Contextual interaction prompt when near items (`[E] Search Shipwreck Cache`).

### 4. Main Menu, Pause Menu & Save System
- **Start Adventure:** Initiates a new expedition on the beach.
- **Continue Journey:** Reads save data from `localStorage` (player location, rotation, survival stats, mission progress). Only active when a save file exists.
- **Controls Guide:** Comprehensive dialog explaining inputs and mechanics.
- **Settings:** Sliders for Master Audio Volume, Mouse Sensitivity, Field of View (FOV), and Shadow Detail (High, Low, Off).
- **In-Game Pause (`ESC`):** Pause menu offering Resume, Save Game, Settings, and Return to Main Menu.

---

## Project Structure

```
The Lost Adventure/
├── index.html                   # HTML entry point, HUD markup, Menu & Modals
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
├── src/
│   ├── main.ts                  # Central coordinator & game loop
│   ├── style.css                # Adventure survival theme UI stylesheet
│   ├── core/
│   │   ├── Engine.ts            # Three.js scene, camera, renderer, shadows & resize
│   │   ├── InputManager.ts      # Keyboard, mouse look, pointer lock, sensitivity
│   │   ├── SaveSystem.ts        # localStorage serialization for game & settings
│   │   └── SoundManager.ts      # Procedural Web Audio synthesis (ocean, steps, SFX)
│   ├── world/
│   │   ├── Island.ts            # Mathematical island terrain & height collision
│   │   ├── Ocean.ts             # Custom wave displacement shader & water reflections
│   │   ├── Atmosphere.ts        # Sun lighting, sky dome, and distance fog
│   │   ├── Foliage.ts           # Palm trees, jungle canopies, and tropical ferns
│   │   ├── Rocks.ts             # Coastal boulders & mountain rock formations
│   │   └── Shipwreck.ts         # Storm-wrecked ship, cargo crates & salvage chest
│   ├── entities/
│   │   ├── Player.ts            # Articulated character model & procedural animations
│   │   ├── ThirdPersonCamera.ts # Orbit spring camera with terrain clearance
│   │   └── CharacterController.ts # Movement physics, stats decay, footstep timing
│   └── ui/
│       ├── HUD.ts               # Survival meters, mission prompt, interaction toast
│       └── MainMenu.ts          # Start, Continue, Controls modal, Settings modal & Pause
└── dist/                        # Production build output
```

---

## How to Launch and Test

1. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

2. **In the Main Menu:**
   - Click **Controls** to review keys.
   - Click **Settings** to adjust volume, sensitivity, FOV, or shadow quality.
   - Click **Start Adventure** to spawn on the beach.

3. **In the Game:**
   - Click anywhere to lock the mouse cursor.
   - Use **WASD** to move and **Shift** to sprint.
   - Move the **Mouse** to look around.
   - Approach the damaged shipwreck on the beach and press **E** to salvage the emergency cache.
   - Press **ESC** at any time to open the pause menu and click **Save Game**.
   - Return to the Main Menu and test the newly enabled **Continue Journey** button to resume your saved session!

4. **Production Build:**
   ```bash
   npm run build
   npm run preview
   ```

