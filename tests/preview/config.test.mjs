import test from 'node:test';
import assert from 'node:assert/strict';
import { previewConfiguration } from '../../src/lib/previewConfig.ts';
test('normal builds retain their existing Firebase configuration path', () => { assert.equal(previewConfiguration('production', 'http://localhost:3200'), null); });
test('preview fixes the demo project and uses only its current origin for Firestore', () => {
  const local = previewConfiguration('apew-preview', 'http://127.0.0.1:3200');
  assert.equal(local.firebase.projectId, 'demo-apew-seatme');
  assert.equal(local.firestore.host, '127.0.0.1:3200'); assert.equal(local.firestore.ssl, false);
  const remote = previewConfiguration('apew-preview', 'https://preview.test-domain.dev');
  assert.equal(remote.firestore.host, 'preview.test-domain.dev'); assert.equal(remote.firestore.ssl, true);
});
test('preview configuration refuses non-origin inputs and non-loopback plain HTTP', () => {
  for (const origin of ['file:///tmp/app', 'http://example.com', 'https://u:p@example.com', 'https://example.com/path', 'https://example.com?token=x']) assert.throws(() => previewConfiguration('apew-preview', origin));
});
