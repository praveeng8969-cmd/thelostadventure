# Nature asset integration — first pass

This branch replaces the **jungle tree** and **fern/shrub** visuals with imported glTF models while keeping the existing positions, mission triggers, collisions, inventory, crafting, and save logic unchanged.

## Install and run

```bash
npm install
npm run assets:install
npm run dev
```

The installer downloads four GLB files and their license to `public/models/nature/` and verifies the Git blob SHA-1 and byte length of every file before writing it. The GLB binaries are **not yet committed to GitHub**; you must run the installer locally (or add them to Git LFS after checking size).

## Sources and licensing

Assets: `tree1.glb`, `tree2.glb`, `tree3.glb`, `bush.glb` from [anshaneja5/skyline-run](https://github.com/anshaneja5/skyline-run/tree/main/public/assets/models), credited there to Quaternius. The source includes `LICENSE-quaternius.txt`, which the installer also downloads. Confirm the original pack's license before publishing commercially.

This first batch consists of **game-ready stylized models**, not photorealistic foliage. The visual result may still need better materials and a higher-detail palm-specific asset.

## What changes

- Procedural dodecahedron jungle tree canopies are replaced after the GLB files load.
- Procedural cone ferns are replaced with an imported shrub model.
- Procedural palms remain until a verified palm-specific model is selected.
- If model files are missing, the game falls back to existing foliage and logs a warning.
- This branch does **not** replace `Soldier.glb`, terrain textures, rocks, or shipwreck.

## Manual verification

1. Run `npm run assets:install`, then `npm run dev`.
2. Open browser developer tools and confirm `[Foliage] Installed Quaternius trees and shrubs are active.`
3. Confirm there are no 404s for `/models/nature/*.glb`.
4. Inspect the jungle; imported trees should replace the geometric canopies.
5. Check player movement, collision, collecting, crafting, building and save/load.
6. Run `npm run build` and inspect performance using F3.

No local browser build or screenshot was executed in this environment. Test on your actual integrated GPU before merging.
