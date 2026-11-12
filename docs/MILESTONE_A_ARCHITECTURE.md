# Milestone A — Architecture Audit and Acceptance Gates

Audit date: 2026-11-12. Repository: `praveeng8969-cmd/thelostadventure`.

## Verified source inventory

| Area | Existing implementation | Limitation / next action |
|---|---|---|
| Frontend | Vite 6, TypeScript 5.7, Three.js 0.174 | Keep the game frontend and progressively extend |
| Rendering | WebGLRenderer, ACES tone mapping, three graphics presets, FPS/draw-call counters | Capture real FPS and memory on desktop and midrange mobile before changing world size |
| World | `Island.ts` single terrain, `Foliage.ts` trees, `WorldDetails.ts` instanced grass, `Ocean.ts`, `Atmosphere.ts` | Current terrain is not a 4 km streamed world; design deterministic terrain chunks, biomes and streaming |
| Assets | Build-time SHA-verified Quaternius trees and civilian GLB, Kenney survival props | Preserve `docs/ASSET_CREDITS.md`, audit model licenses and verify runtime loading |
| Player | `Player.ts`, `CharacterController.ts`, `ThirdPersonCamera.ts` | One local player, no network entity interpolation or 10 selectable avatars |
| Gameplay | Inventory, crafting, campfire, fishing, building, missions and radio relay | Client-side game state must become authoritative on multiplayer server |
| Saves | `SaveSystem.ts` localStorage save v3 with migrations | Preserve offline saves; multiplayer persistence must live on server |
| UI | `MainMenu.ts`, HUD, inventory, crafting, mobile controls and orientation layout | Add room lobby and character selection without breaking landscape controls |
| Multiplayer | No WebSocket server, room persistence, matchmaking or synchronization code | Implement as new independently deployed Node.js server, not as Vercel functions |
| CI / tests | TypeScript and Vite build; no automated test command in package.json | Add repeatable quality gates and then integration tests |

## Network architecture decision (Milestones B–C)

- Keep Vercel as the static HTTPS client deployment.
- Add a separate `server/` Node.js service for WebSocket rooms, hosted on an always-on WebSocket-compatible platform.
- Prefer Colyseus or Socket.IO; choose one after confirming provider constraints and version compatibility.
- Server owns room membership, maximum capacity (2–10), host election, inventory, resources, placed buildings, missions and survival state.
- Client sends **input intentions**, not arbitrary positions, resources or health values. Server validates rate and movement bounds.
- Send compact periodic state snapshots; render remote characters with interpolation and local prediction.
- Reconnect using a short-lived server-issued token; password-protect private rooms; apply chat and input rate limits.
- Persist room state with a database and versioned migrations; single-player remains functional offline.
- A room code must be generated securely on the server and checked for collision.
- Multiplayer UI must not advertise live room creation until a real backend is deployed and health-checked.

## Open-world architecture decision (Milestones E–F)

- Introduce deterministic chunked terrain (proposed 128 m chunks), seed-based biome placement and distance LOD.
- Stream terrain, vegetation, collision and assets around the camera; keep a compact collision neighborhood loaded.
- Never allocate all 4 km × 4 km terrain meshes simultaneously on mobile.
- Prioritize photorealistic **appearance** from properly licensed PBR assets over unaffordable per-pixel effects.
- Add biome-specific foliage with GPU instancing, object pooling, compressed textures and culling.
- Validate map generation, navigation and mission locations before switching from the current island.

## Acceptance gates

**A — audit & quality foundation**
- [x] Inventory current game modules and asset sources.
- [x] Record authoritative networking and world-streaming architecture.
- [x] Add repeatable repository integrity checks.
- [ ] Capture reproducible desktop/mobile performance baselines on actual devices.
- [ ] Verify imported models, materials and animation quality in browser.

**B — multiplayer lobby**
- [ ] Live server deployed separately; HTTPS/WSS URLs configured.
- [ ] Create/join/password/ready/start/leave; max 2–10 enforced server-side.
- [ ] Test simultaneous clients at capacities 2, 5 and 10.

**C — state & persistence**
- [ ] Movement and rotation replication with interpolation.
- [ ] Authoritative gathering, crafting, building and missions.
- [ ] Reconnect, host disconnect, save migrations and rate-limit tests.

**D–J — visual/gameplay expansion**
- [ ] Ten distinct validated character variants and animation coverage.
- [ ] Streamed multi-biome terrain with mobile performance budgets.
- [ ] Vegetation, PBR materials, lighting, water and weather.
- [ ] Wildlife, cooperative survival, all six playable chapters.
- [ ] End-to-end mobile, desktop, security and load verification.

## Performance targets (not yet measured)

- Midrange mobile: aim 30 FPS in landscape on Low preset.
- Capable desktop: aim 60 FPS with suitable quality.
- Monitor draw calls, triangles, frame time, memory, network bandwidth and server tick time.
- Treat measured regression, broken touch controls or lost save data as release blockers.

## Release process

1. Implement a small, independently testable feature branch.
2. Run `npm test`, `npm run build`, plus relevant server integration tests.
3. Verify Vercel preview is READY and critical game routes/assets load.
4. Merge to main only after verification.
5. Confirm production deploy is READY and report what was actually tested.
6. Do not call a mock lobby, offline simulation or static 3D preview real multiplayer.
