# THE LOST ADVENTURE (Version 0.1C)

A 3D browser-based survival adventure game built with Vite, TypeScript, and Three.js.

## Overview
A group of friends becomes stranded on a mysterious tropical island after a storm destroys their ship. They must survive, explore abandoned structures, uncover secret military experiments, repair their ship, and escape.

Version 0.1C introduces **Crafting (C)**, **Stone Axe Tool Equipping**, **Campfire Placement & Lighting**, **Shoreline Fishing & Campfire Cooking**, **Modular Shelter Building with Grid Snapping**, **Structural Shelter Recognition with Weather Protection**, and extended **Progression Missions**.

---

## Features in Version 0.1C (Phase 3)

### 1. Island Crafting Workbench (`C`)
- Toggled with key `C`.
- **Configurable Recipes:**
  - **Stone Axe:** 3 Wood + 2 Stone (Initially unlocked)
  - **Campfire:** 5 Wood + 4 Stone (Initially unlocked)
  - **Wooden Floor:** 4 Wood (Unlocked via mission milestone)
  - **Wooden Wall:** 5 Wood (Unlocked via mission milestone)
  - **Wooden Roof:** 6 Wood (Unlocked via mission milestone)
  - **Cooking Station:** 6 Wood + 5 Stone (Unlocked via campfire mission)
- Ingredient verification against inventory with exact single deduction upon crafting.
- Clear visual indicators of requirements, unlock milestones, and immediate toast feedback.

### 2. Usable & Equippable Stone Axe
- Select the crafted Stone Axe in the inventory (`Tab`) and click **EQUIP TOOL**.
- Real 3D stone axe model attaches dynamically to the character's right hand.
- When equipped, wood harvesting yields **+2 Wood** instead of 1 from beach driftwood.

### 3. Campfire & Placement System
- Craft a Campfire and select **PLACE / BUILD** from inventory.
- **Interactive 3D Placement Mode:**
  - Real-time transparent preview that follows terrain contour.
  - **Green** preview = Valid location (dry ground, clear terrain).
  - **Red** preview = Invalid location (deep ocean, colliding obstacles, shipwreck).
  - `Left-Click` to place on the ground.
  - `R` to rotate preview in 90° increments.
  - `Escape` to cancel placement without deducting the item.
- **Lighting & Fire Effects:**
  - Approach unlit campfire and press `[E] Light Campfire`.
  - Dynamic firelight glow, animated flame flicker, and warm orange point lighting.
  - Press `[E] Extinguish Campfire` when no raw fish is carried.

### 4. Shoreline Fishing & Cooking
- **Shoreline Fishing Spot:** Located near coastal rocks (LOC: `X: 45, Z: 45`).
- Approach and press `[E] Catch Fish` to reel in **Raw Fish** (`🐟`).
- **Campfire Cooking:**
  - Approach a lit campfire carrying raw fish and press `[E] Cook Raw Fish`.
  - Takes **5 seconds** with real-time countdown prompt and campfire sizzle.
  - Yields **Cooked Fish** (`🍱`), which can be consumed from inventory to restore **+35 Hunger**!

### 5. Modular Base Building
- **Three Modular Pieces:**
  - **Wooden Floor:** 4m x 4m sturdy foundation platform.
  - **Wooden Wall:** 4m x 3m timber wall that snaps along floor edges.
  - **Wooden Roof:** 4m x 4m timber and thatch ceiling that snaps onto supported walls.
- **Intelligent Grid Snapping:**
  - Floors snap to adjacent floors or to the 4m world grid.
  - Walls automatically snap to the 4 perimeter edges of floors.
  - Roofs snap directly overhead onto supported walls.
- Prevents floating structures, duplicate overlaps, or building in deep water.

### 6. Structural Shelter Recognition & Weather Protection
- **Algorithmic Structural Check:**
  - Recognizes a completed shelter when a floor has enclosing walls on at least 3 perimeter sides and a roof overhead.
  - Displays **"Shelter Complete"** celebration banner.
- **Weather Protection Flag:**
  - When the player enters inside a completed shelter structure, the HUD displays `🛡️ SHELTERED: WEATHER PROTECTED`.

### 7. Sequential Progression Missions
1. **Explore the beach**
2. **Collect 5 wood**
3. **Collect 3 stones**
4. **Find 2 coconuts**
5. **Collect drinking water**
6. **Inspect the damaged ship**
7. **Craft a stone axe**
8. **Craft a campfire**
9. **Place and light the campfire**
10. **Cook one fish**
11. **Build a basic shelter**
12. **Return to the shipwreck**

Missions unlock recipes at milestone achievements and track verified gameplay events.

### 8. Extended Save / Load System (Version 3)
- Persists player location, rotation, survival stats, 16 inventory slots, equipped tool, unlocked recipes, placed modular structures, campfires with lit state, shelter completion, and mission progress.
- Fully backward-compatible with Version 1 and Version 2 saves.

---

## Controls

| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** | Walk & directional movement |
| **Left Shift** | Sprint across sand and terrain |
| **Mouse** | Orbit camera look (click screen to lock cursor) |
| **E** | Collect resources, catch fish, light/extinguish campfire, cook fish |
| **TAB** | Open / Close 16-slot Survivor Inventory |
| **C** | Open / Close Crafting Workbench |
| **R** | Rotate structure preview (90°) in Placement Mode |
| **L-Click** | Place building structure in Placement Mode |
| **ESC** | Pause Menu / Cancel Placement Mode / Close Modals |

---

## How to Run & Test Locally

1. **Start the local server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your desktop browser.

2. **Phase 3 Testing Walkthrough:**
   - [x] Click **Start Adventure**.
   - [x] Gather wood and stones on the beach with `E`.
   - [x] Press `C` to open the Crafting Workbench.
   - [x] Craft a **Stone Axe** (3 Wood + 2 Stone).
   - [x] Open inventory (`Tab`), select the Stone Axe, and click **EQUIP TOOL**. Notice the axe on the character's right hand and test collecting wood (+2 bonus!).
   - [x] Craft a **Campfire** (5 Wood + 4 Stone).
   - [x] In inventory (`Tab`), select Campfire and click **PLACE / BUILD**.
   - [x] Move around to see the green placement preview, press `R` to rotate, and Left-Click to place it on dry sand.
   - [x] Walk to the placed campfire and press `E` to light it.
   - [x] Head to the shoreline fishing spot (LOC: `45, 45`) and press `E` to catch Raw Fish.
   - [x] Return to the lit campfire and press `E` to cook the fish (5 seconds).
   - [x] Open inventory (`Tab`) and eat the Cooked Fish (+35 Hunger). Notice building recipes are now unlocked!
   - [x] Press `C`, craft **Wooden Floor**, **Wooden Walls**, and **Wooden Roof**.
   - [x] Place the floor, snap walls to its edges, and place the roof on top.
   - [x] Step inside the completed structure to verify the `🛡️ SHELTERED: WEATHER PROTECTED` indicator.
   - [x] Press `ESC` -> **Save Game**, return to the main menu, and test **Continue Journey** to verify that all placed buildings, campfires, tools, and progress restore cleanly.

3. **Production Build:**
   ```bash
   npm run build
   ```
