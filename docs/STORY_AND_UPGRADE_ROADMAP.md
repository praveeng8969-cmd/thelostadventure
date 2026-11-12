# THE LOST ADVENTURE — Story & Upgrade Roadmap (v1)

## Creative direction
A grounded, non-combat tropical-island survival mystery. A civilian expedition's vessel runs aground after an unexplained radio signal. The island appears uninhabited, but abandoned research facilities suggest someone has been monitoring the survivors. The central question is not who to fight, but **what happened here and how to escape without repeating it**.

## Chapter structure
1. **Wreckage** — Survive the beach. Explore, gather, secure fresh water, inspect the damaged ship, build shelter. These are the existing missions and must remain compatible with saved games.
2. **Signals in the Canopy** — Follow a repeating distress broadcast inland; restore a damaged relay with found components. Environmental navigation and repair puzzles.
3. **The Empty Village** — Discover diaries, generators and evacuation notices; learn that the island's radio blackout was deliberate. Restore power without triggering a storm-damaged grid.
4. **Below the Mountain** — Explore a cave network and a sealed research outpost; discover experiments involving weather and communications. Solve pressure, valve and circuit puzzles, no combat.
5. **The Last Transmission** — Repair the mountaintop radio tower, uncover conflicting survivor logs, and choose whether to send a warning or request immediate rescue. Choice affects dialogue and ending, not survival soft-locks.
6. **Beyond the Reef** — Build a seaworthy escape raft/boat using mission-unlocked components; coordinate an escape through weather and reef hazards. Solo completion remains possible.

## Implementation rules
- Keep chapter 1 mission IDs, progress statistics and save structure stable.
- New chapters should use optional/forward-compatible save fields with migration.
- No mandatory combat, jump scares or time-limited irreversible failures.
- Each chapter must add playable interactions, not just on-screen text.
- Player may explore and build between objectives; essential items must respawn or be recoverable.
- Story should work offline, without paid external APIs.

## Physics milestones
- P1: Frame-rate-independent acceleration, uphill slowdown, steep-slope blocking (initial change in this branch).
- P2: Character capsule collision against rocks, trees, shipwreck and placed structures; sliding along obstacles.
- P3: Grounded/airborne states, gravity, safe falling, jump and swim/wade controls for touch and keyboard.
- P4: Buoyancy for rafts, wave response, currents and simple rope/attachment interactions.
- Keep simulation lightweight on mobile; avoid expensive full-world rigid-body physics.

## Graphics milestones
- G1: Audit asset licensing and commit browser-ready GLB/texture files (not only installer scripts). Verify files actually load on Vercel.
- G2: Replace soldier with a suitable civilian survivor with idle/walk/run/gather animations. Preserve existing tool attachment.
- G3: Replace placeholder jungle/palm/rock models with coherent tropical assets. Use instancing and distance culling.
- G4: Multi-material terrain, high-quality but compressed PBR textures, beach foam and shallow water.
- G5: Weather transitions, subtle foliage sway and color grading with Low/Medium/High presets.

## Mobile acceptance criteria
- Entire 3D canvas fills landscape viewport.
- HUD (health, hunger, thirst, objective, time, position) remains visible.
- Joystick, look, run, use, bag, craft, place, rotate, pause and help remain accessible.
- Target playable 30 FPS on typical midrange phones at Low settings; benchmark rather than assume.
- No mandatory orientation-specific screen rotation hacks or heavy postprocessing.

## Definition of done per milestone
Build succeeds; browser assets load with no 404s; gameplay, missions, saves and mobile touch controls still work; before/after screenshots and FPS measurements recorded.
