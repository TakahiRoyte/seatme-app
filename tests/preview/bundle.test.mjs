import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('preview output removes production Firebase values even when Vite receives them', { timeout: 30000 }, async t => {
  const output = await mkdtemp(join(tmpdir(), 'seatme-preview-canary-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const fields = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID'];
  const canaries = Object.fromEntries(fields.map(field => ['VITE_FIREBASE_' + field, 'APEW_PRODUCTION_CANARY_' + field]));
  execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'apew-preview', '--outDir', output], { env: { ...process.env, ...canaries }, stdio: 'pipe' });
  let text = '';
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await collect(file);
      else if (/\.(js|html|json)$/.test(entry.name)) text += await readFile(file, 'utf8');
    }
  }
  await collect(output);
  for (const value of Object.values(canaries)) assert.ok(!text.includes(value), 'Production canary must not appear in any served bundle');
  assert.ok(text.includes('demo-apew-seatme'));
});
