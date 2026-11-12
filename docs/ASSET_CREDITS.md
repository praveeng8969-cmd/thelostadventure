# Imported asset provenance

The game build downloads a small set of licensed assets into `public/models/` and verifies Git blob SHA-1 and byte length before using them. These files are generated during `npm run build` and served from the built Vite `dist` folder. Source URLs are pinned to a known branch and protected by checksums; changing upstream content fails the build instead of silently importing different art.

## Environment — Quaternius Nature MegaKit
- `nature/tree1.glb`, `tree2.glb`, `tree3.glb`, `bush.glb`
- Author: Quaternius, CC0. Redistributed via [skyline-run](https://github.com/anshaneja5/skyline-run) with accompanying `LICENSE-quaternius.txt`.
- Used as jungle trees and shrubs; procedural palm trees remain as fallback until a suitable palm asset is sourced.
- Exact verified SHA and sizes are in `scripts/install-nature-assets.mjs`.

## Player — Quaternius Ultimate Modular Men Pack
- `characters/casual-character.glb`
- Author: Quaternius, CC0 1.0.
- [Redistribution provenance and licence inventory](https://github.com/euuuuuuan/fatal-funnel-public/blob/main/CREDITS.md)
- [Original Quaternius packs](https://quaternius.com/)
- This is a civilian character. The in-game procedural expedition survivor is a fallback if the GLB fails to load.
- GLB has been independently checksum-verified during Vercel preview build. Animation clip availability varies with source rig; the game uses procedural bone motion if needed.

## Shipwreck props — Kenney Survival Kit 2.0
- `props/barrel.glb`, `box.glb`, `chest.glb`, `rock-a.glb`, `tree-log.glb`, `colormap.png`
- Author: Kenney, CC0. [Official Survival Kit](https://kenney.nl/assets/survival-kit)
- [Redistribution provenance](https://github.com/euuuuuuan/fatal-funnel-public/blob/main/CREDITS.md)
- Used as additional beach salvage and the visible emergency chest.

## Additional candidate packs (not yet installed)
- [Kenney Animated Characters Survivors](https://kenney.nl/assets/animated-characters-survivors) — CC0, FBX character rig; requires export/retarget to browser-ready GLB.
- [Quaternius Ultimate Stylized Nature](https://quaternius.com/packs/ultimatestylizednature.html) — CC0 foliage and terrain assets; select and optimize individual glTF models before deployment.

## Constraints
- No unverified third-party assets or attribution-requiring models are silently bundled.
- Preserve the low graphics preset and full landscape HUD on mobile.
- All gameplay continues if an optional imported visual model fails.
