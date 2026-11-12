# THE LOST ADVENTURE (Version 0.1B)

A 3D browser-based survival adventure game built with Vite, TypeScript, and Three.js.

## Overview
A group of friends becomes stranded on a mysterious tropical island after a storm destroys their ship. They must survive, explore abandoned structures, uncover secret military experiments, repair their ship, and escape.

Version 0.1B introduces full resource gathering, a 16-slot stackable inventory system, active hunger and thirst decay, consumable food/water items with stats recovery, sequential introductory missions with event-driven progress tracking, and versioned `localStorage` save/load.

---

## Features in Version 0.1B

### 1. Resource Gathering
- **Four Resource Types:**
  - **Wood:** Driftwood branches and logs washed ashore on the beaches.
  - **Stone:** Smooth coastal pebbles and volcanic stones.
  - **Coconut:** Fallen coconuts under coastal palm groves.
  - **Fresh Water:** An inland natural rock spring oasis basin.
- **Proximity Detection & Prompts:**
  - Approaching collectibles displays: `[E] Collect Wood`, `[E] Collect Stone`, `[E] Collect Coconut`, `[E] Collect Water`.
  - Pressing `E` collects the resource, adds it to the inventory, plays an interaction chime, and deactivates the world object.
  - Items cannot be collected repeatedly, and collected states persist across saves.

### 2. 16-Slot Survivor Inventory (`Tab`)
- **Grid Layout:** 4x4 grid (16 slots) displaying item icons, names, and quantity badges.
- **Stackable Resources:** Stack limits (Wood & Stone up to 20; Coconut & Fresh Water up to 10).
- **Inspection & Actions:**
  - Select any item to view its description and current count.
  - **Use:** Eat Coconuts or Drink Water to restore survival meters.
  - **Discard:** Drop/remove items one by one.
- **Seamless Pointer Lock:** Opening the inventory automatically frees the cursor; closing it or pressing `Tab`/`ESC` re-engages camera look.

### 3. Survival Simulation
- **Initial Values:** Health: 100, Hunger: 100, Thirst: 100.
- **Controlled Decay:**
  - Hunger decreases by 1 point every 60 seconds (1/60s).
  - Thirst decreases by 1 point every 40 seconds (1/40s).
- **Damage Rate-Limiting:** If Hunger or Thirst drops to 0, health decreases gradually via a rate-limited damage tick (not every animation frame).
- **Pause Safety:** All survival decay pauses when the game is paused.
- **Clamped Bounds:** All stats are strictly bounded between 0 and 100.

### 4. Consumables & Feedback
- **Coconut:** Restores 20 Hunger.
- **Fresh Water:** Restores 30 Thirst.
- **Safety Checks:** Prevents consumption if the relevant stat is already at 100% (with toast feedback: "Hunger is already full!").
- Consuming an item deducts 1 from its inventory stack and updates HUD bars immediately.

### 5. Sequential Introductory Missions
Tracks valid gameplay events (survives item consumption/spending and credits prior gatherings):
1. **Explore the beach** (walk along the shoreline)
2. **Collect 5 wood** (`Wood 0/5` -> `Wood 5/5`)
3. **Collect 3 stones** (`Stone 0/3` -> `Stone 3/3`)
4. **Find 2 coconuts** (`Coconuts 0/2` -> `Coconuts 2/2`)
5. **Collect drinking water** (`Fresh Water 0/1`)
6. **Inspect the damaged ship** (approach and salvage the emergency cache)

Features an animated **Mission Complete** banner, audio cue, and automatic progression to the next objective.

### 6. Versioned Save / Load System (v2)
- Serializes player coordinates, rotation, survival stats, 16 inventory slots, mission progress, collected item IDs, and shipwreck state to `localStorage`.
- Graceful backward compatibility with v1 prototype saves and corruption resilience.
- Continue Journey button automatically enables when save data exists.

---

## Controls

| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** | Walk & directional movement |
| **Left Shift** | Sprint (faster movement) |
| **Mouse** | Camera orbit & mouse look |
| **E** | Collect resources & interact with shipwreck |
| **TAB** | Open / Close 16-slot inventory |
| **ESC** | Open Pause Menu (Save, Settings, Resume, Quit) |

---

## How to Run & Test Locally

1. **Start Vite Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

2. **Manual Test Checklist:**
   - [x] Click **Start Adventure**.
   - [x] Walk across the beach to complete Mission 1 ("Explore the beach").
   - [x] Pick up 5 wood branches along the shore with `E` to complete Mission 2.
   - [x] Press `Tab` to verify 16-slot inventory slots, icons, and quantities.
   - [x] Gather 3 stones and 2 coconuts with `E`.
   - [x] Open inventory (`Tab`), select Coconut, and click "Use" to restore hunger (note: if full, it will notify "Hunger is already full!").
   - [x] Journey inland to the freshwater spring oasis (LOC: ~2, -12), collect water, and drink to verify thirst replenishment.
   - [x] Inspect the shipwreck to complete the final introductory mission.
   - [x] Press `ESC`, click **Save Game**, return to the main menu, and click **Continue Journey** to verify persistence.

3. **Production Build:**
   ```bash
   npm run build
   ```
