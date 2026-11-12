import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('core gameplay and mobile modules remain in repository', () => {
  for (const path of [
    'src/main.ts', 'src/core/Engine.ts', 'src/core/SaveSystem.ts',
    'src/entities/CharacterController.ts', 'src/ui/MobileControls.ts',
    'src/ui/MobileLayout.ts', 'src/inventory/Inventory.ts',
    'src/crafting/Crafting.ts', 'src/building/BuildingManager.ts',
    'src/missions/MissionManager.ts', 'src/world/Island.ts',
    'src/world/SignalRelay.ts'
  ]) {
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), path + ' must exist');
  }
});

test('portrait-to-landscape canvas resize fix remains active', () => {
  const engine = read('src/core/Engine.ts');
  assert.match(engine, /setSize\([^;]+, false\)/, 'renderer must not overwrite canvas CSS sizing');
  assert.match(engine, /ResizeObserver/, 'canvas must respond to container resize');
});

test('save system preserves single-player migration and versioning', () => {
  const save = read('src/core/SaveSystem.ts');
  assert.match(save, /SAVE_KEY_V3/);
  assert.match(save, /SAVE_KEY_V2/);
  assert.match(save, /SAVE_KEY_V1/);
  assert.match(save, /relayInspected/);
});

test('verified assets and licensing remain documented', () => {
  const installer = read('scripts/install-nature-assets.mjs');
  const credits = read('docs/ASSET_CREDITS.md');
  assert.match(installer, /createHash\('sha1'\)/);
  assert.match(installer, /casual-character\.glb/);
  assert.match(installer, /tree1\.glb/);
  assert.match(installer, /barrel\.glb/);
  assert.match(credits, /Quaternius/);
  assert.match(credits, /Kenney/);
});

test('mobile input and game controls remain available', () => {
  const controls = read('src/ui/MobileControls.ts');
  const menu = read('src/ui/MainMenu.ts');
  assert.match(controls, /joystick/i);
  assert.match(controls, /camera/i);
  assert.match(menu, /btnStart/);
  assert.match(menu, /btnContinue/);
});

test('multiplayer cannot be misrepresented as implemented', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.type, 'module');
  assert.ok(packageJson.scripts.build);
  // This gate checks the architectural specification; it does not simulate
  // clients or claim multiplayer exists.
  assert.match(read('docs/MILESTONE_A_ARCHITECTURE.md'), /server owns room membership/i);
});
