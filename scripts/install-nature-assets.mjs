/**
 * Install verified, CC0 Quaternius nature models to public/models/nature/.
 * Run: npm run assets:install
 * Source: anshaneja5/skyline-run (optimized models from Quaternius Nature MegaKit)
 * Credit: https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = 'https://raw.githubusercontent.com/anshaneja5/skyline-run/main/public/assets/models/';
const assets = [
  ['tree1.glb', '80bd662cc51f983986f4e201463dc3a729a6cd4a', 516044],
  ['tree2.glb', '0197de65879eb650247c8d56ac52da34489938cb', 446732],
  ['tree3.glb', '828786b4bdb5224a8b3672f5e5d6cebe1c65bd93', 332440],
  ['bush.glb', '84b4153c17e988a658e56d4093b0028d1b034c3f', 108520],
  ['LICENSE-quaternius.txt', '657f7740c85a77dd2f9d45e91238856a394b5ae1', 847],
];
const destination = join(process.cwd(), 'public', 'models', 'nature');
await mkdir(destination, { recursive: true });

for (const [name, expectedSha, expectedSize] of assets) {
  console.log('Downloading', name);
  const response = await fetch(base + name, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Failed to download ' + name + ': HTTP ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength !== expectedSize) {
    throw new Error('Unexpected size for ' + name + ', expected ' + expectedSize + ', got ' + bytes.byteLength);
  }
  const blobHeader = Buffer.from('blob ' + bytes.length + '\0');
  const sha = createHash('sha1').update(blobHeader).update(bytes).digest('hex');
  if (sha !== expectedSha) throw new Error('Checksum mismatch for ' + name);
  await writeFile(join(destination, name), bytes);
  console.log('Verified and saved:', name);
}
console.log('Quaternius nature assets installed. Run npm run dev.');

/** Civilian survivor, Quaternius Ultimate Modular Men Pack, CC0.
 * Redistribution provenance: https://github.com/euuuuuuan/fatal-funnel-public/blob/main/CREDITS.md
 */
const characterBase = 'https://raw.githubusercontent.com/euuuuuuan/fatal-funnel-public/main/packages/renderer/assets/models/quaternius-men/';
const characterDir = join(process.cwd(), 'public', 'models', 'characters');
await mkdir(characterDir, { recursive: true });
{
  const name = 'casual-character.glb';
  const expectedSha = 'f31ba8b389268d4df6005cc62d4d7011de728bce';
  const expectedSize = 1430660;
  const response = await fetch(characterBase + name, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Character download failed: HTTP ' + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== expectedSize) throw new Error('Character size mismatch');
  const sha = createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
  if (sha !== expectedSha) throw new Error('Character checksum mismatch');
  await writeFile(join(characterDir, name), bytes);
  console.log('Verified and saved CC0 civilian survivor:', name);
}

/** Kenney Survival Kit 2.0, CC0: shipwreck props and shared palette. */
const propBase = 'https://raw.githubusercontent.com/euuuuuuan/fatal-funnel-public/main/packages/renderer/assets/models/kenney-survival/';
const propDir = join(process.cwd(), 'public', 'models', 'props');
await mkdir(propDir, { recursive: true });
const props = [
  ['barrel.glb','3d8ab426079eb42943984943450cc5bf86c5ff9e',34256],
  ['box.glb','2a53ffb6eebf866610f6896f7c38917f87effaf8',14056],
  ['chest.glb','b2ea6da074bcf316201c3cafd08ce46eee98a9c5',35172],
  ['rock-a.glb','a541c5104e00f5d5c1e95f959b36c603f277d4c9',10812],
  ['tree-log.glb','8e55fb3f5c8772ae5452e3ebfb344129a743ce3e',9180],
  ['colormap.png','6e6a5fc7d858aa6d372378742387bbba38b1c415',7440],
];
for (const [name, expectedSha, expectedSize] of props) {
  const response = await fetch(propBase + name, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Survival prop download failed: ' + name);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha = createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
  if (bytes.length !== expectedSize || sha !== expectedSha) throw new Error('Survival prop checksum mismatch: ' + name);
  await writeFile(join(propDir, name), bytes);
  console.log('Verified Kenney CC0 prop:', name);
}
