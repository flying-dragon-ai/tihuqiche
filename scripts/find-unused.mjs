#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const shouldDelete = process.argv.includes('--delete');
const allowedRoots = ['src/'];
const protectedFiles = new Set([
  'src/main.js',
  'src/entry-server.js',
  'src/share-qr.js',
  'src/outfit-thumbnails.js',
]);
// Keep locale-specific variants even if a generic file looks unused.
const excludedPatterns = ['.id.', '.my.', '.ph.', '.sg.', '.vn.', '.th.', '.br.'];

const result = spawnSync('pnpm', ['exec', 'knip', '--include', 'files', '--no-progress'], {
  encoding: 'utf8',
});
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const files = [
  ...new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^src\/.+\.(js|vue)$/.test(line))
      .filter((file) => allowedRoots.some((root) => file.startsWith(root)))
      .filter((file) => !protectedFiles.has(file))
      .filter((file) => !excludedPatterns.some((pattern) => file.includes(pattern))),
  ),
];

if (!files.length) {
  console.log('No unused source files.');
  process.exit(0);
}

console.log('Unused source files:');
for (const file of files) console.log(`  ${file}`);

if (!shouldDelete) {
  console.log('\nDry run. Re-run with --delete to remove these files.');
  process.exit(0);
}

for (const file of files) {
  rmSync(file);
  console.log(`removed ${file}`);
}
