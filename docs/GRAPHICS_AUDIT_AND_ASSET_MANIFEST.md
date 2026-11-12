# THE LOST ADVENTURE &mdash; Phase A Graphics Audit & Asset Manifest

## 1. Graphics Audit

### 1.1 Current Architecture & Rendering Pipeline
- **Engine / Core:** Three.js r174 running on Vite with TypeScript.
- **Renderer:** `THREE.WebGLRenderer` with `ACESFilmicToneMapping` and `PCFSoftShadowMap`.
- **Lighting:** One DirectionalLight (sun) and one HemisphereLight.
- **Draw Calls:** Each primitive tree, rock, crate, and building piece was an individual mesh draw call (~450+ draw calls).
- **Character Model:** Articulated procedural boxes (`BoxGeometry`) with basic limb rotation around joints, lacking skeletal rigging, skinning, mesh deformation, or real clothing/facial detail.
- **Terrain:** A subdivided plane with vertex colors lerped between hard color stops, lacking PBR textures, normal maps, sand ripple details, or realistic ground transitions.
- **Ocean:** Custom basic vertex shader with sine waves, lacking normal map wave reflections, Fresnel water depth, and realistic shoreline foam.
- **Vegetation:** Simple cylinder trunks and flat green shape geometry fronds without realistic bark texture, fibrous crown, or instanced draw call optimization.
- **Shipwreck:** Basic rectangular boxes representing the hull, lacking planking, structural ribs, rusted metal fittings, and realistic shipwreck wreckage.

### 1.2 Target Overhaul Requirements
1. **Character:** Genuine rigged humanoid 3D GLTF model with skeletal hierarchy, skinning, clothing textures, and smooth `THREE.AnimationMixer` crossfade blending (`Idle`, `Walk`, `Run`/`Sprint`, tool usage).
2. **Terrain & Textures:** High-resolution PBR surface textures with normal maps, roughness maps, sand ripples, soil, grass, and rock cliffs.
3. **Vegetation:** Multi-element detailed coconut palms with curved fibrous trunks and segmented fronds, broadleaf jungle canopies, lush undergrowth ferns, and fallen driftwood rendered via high-performance `THREE.InstancedMesh`.
4. **Ocean & Atmosphere:** Integration of physically based `Water` shader with `waternormals.jpg`, coupled with atmospheric scattering `Sky` and dynamic time-of-day/weather systems (clear, golden sunset, rain/storm with particle effects).
5. **Shipwreck & Props:** Realistic damaged sailing exploration vessel with broken ribs, deck planks, ropes, canvas sails, and detailed cargo.
6. **Performance & Presets:** Low / Medium / High graphics presets and real-time FPS/Draw Call counter overlay.

---

## 2. Asset Manifest & License Attribution

| Asset Name | Intended Use | Source / Origin | License / Terms | Format | Approx Size | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Soldier.glb** | Humanoid player survivor (adventurer in outdoor cargo trousers, hiking shoes, vest) with skeleton & animations | Three.js Examples (`three/examples/models/gltf/Soldier.glb`) / Mixamo | MIT License (Three.js repository) | GLB (glTF 2.0 Binary) | 2.16 MB | Verified & Installed in `public/models/` |
| **waternormals.jpg** | Ocean wave normal map for realistic surface water reflections & highlights | Three.js Examples (`three/examples/textures/waternormals.jpg`) | MIT License | JPEG Texture (2048x2048) | 248 KB | Verified & Installed in `public/textures/` |
| **Procedural PBR Sand** | Beach dunes, shoreline, wet sand (Diffuse + Normal + Roughness) | High-fidelity Canvas-generated procedural PBR textures | Custom Code (CC0 / Public Domain) | In-Engine Generated Texture | 0 KB (Procedural) | Implemented in `src/world/TextureGenerator.ts` |
| **Procedural PBR Grass & Soil** | Lush interior jungle floor, moss, and forest soil | High-fidelity Canvas-generated procedural PBR textures | Custom Code (CC0 / Public Domain) | In-Engine Generated Texture | 0 KB (Procedural) | Implemented in `src/world/TextureGenerator.ts` |
| **Procedural PBR Cliff Rock** | Volcanic rock ridges, weathered coastal boulders | High-fidelity Canvas-generated procedural PBR textures | Custom Code (CC0 / Public Domain) | In-Engine Generated Texture | 0 KB (Procedural) | Implemented in `src/world/TextureGenerator.ts` |
| **Procedural PBR Wood Grain** | Planks, ship hull, wooden walls, floors, tool handles | High-fidelity Canvas-generated procedural PBR textures | Custom Code (CC0 / Public Domain) | In-Engine Generated Texture | 0 KB (Procedural) | Implemented in `src/world/TextureGenerator.ts` |

---

## 3. Rollback Plan
- Git Tag: `checkpoint-before-graphics-overhaul`
- Commit: `990e84a`
- Command to restore baseline: `git reset --hard checkpoint-before-graphics-overhaul`

