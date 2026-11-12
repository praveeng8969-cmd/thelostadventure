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
