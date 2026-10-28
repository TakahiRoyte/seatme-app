import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateGroupAvailability } from '../.test-build/lib/availabilityUtils.js';

const now = Date.parse('2026-10-28T04:00:00Z');
const table = occupiedSince => ({ id: 'T1', type: 'table', capacity: 4, status: 'occupied', occupiedSince });
const status = tables => calculateGroupAvailability(tables)['3-4'].statusKey;
afterEach(() => mock.restoreAll());
const freezeClock = () => mock.method(Date, 'now', () => now);

test('future occupancy timestamps cannot predict a table freeing soon', () => {
  freezeClock();
  assert.equal(status([table(new Date(now + 60_000))]), 'unlikely');
  assert.equal(status([table(new Date(now + 86_400_000))]), 'unlikely');
});

test('invalid occupancy timestamps cannot predict availability', () => {
  freezeClock();
  assert.equal(status([table(new Date('invalid'))]), 'unlikely');
});

test('missing occupancy timestamps cannot predict availability', () => {
  freezeClock();
  assert.equal(status([table(null)]), 'unlikely');
  assert.equal(status([table(undefined)]), 'unlikely');
});

test('existing current-to-30-minute threshold remains inclusive', () => {
  freezeClock();
  for (const minutes of [0, 15, 30]) assert.equal(status([table(new Date(now - minutes * 60_000))]), 'freeingSoon');
  assert.equal(status([table(new Date(now - 30 * 60_000 - 1))]), 'unlikely');
});

test('available tables still take precedence regardless of occupancy metadata', () => {
  freezeClock();
  const available = { ...table(new Date(now + 60_000)), status: 'available' };
  assert.equal(status([available]), 'availableWithCount');
  assert.equal(status([{ ...available, occupiedSince: null }]), 'availableWithCount');
});

test('capacity constraints and input immutability are preserved', () => {
  freezeClock();
  const input = Object.freeze([Object.freeze({ ...table(new Date(now)), capacity: 2 })]);
  const before = structuredClone(input);
  const result = calculateGroupAvailability(input);
  assert.equal(result['1-2'].statusKey, 'freeingSoon');
  assert.equal(result['3-4'].statusKey, 'unlikely');
  assert.deepEqual(input, before);
});

test('no tables yields no unsupported availability claim', () => {
  freezeClock();
  for (const result of Object.values(calculateGroupAvailability([]))) assert.equal(result.statusKey, 'unlikely');
});

test('all emitted availability and wait keys resolve to existing Japanese messages', async () => {
  freezeClock();
  const messages = JSON.parse(await readFile(new URL('../src/locales/ja.json', import.meta.url), 'utf8')).availability;
  const available = { ...table(null), status: 'available' };
  const scenarios = [[], [table(new Date(now))], [available], [available, table(null), table(null)]];
  const emitted = new Set();
  for (const tables of scenarios) for (const result of Object.values(calculateGroupAvailability(tables))) {
    for (const key of [result.statusKey, result.waitKey].filter(Boolean)) {
      assert.equal(typeof messages[key], 'string', key);
      emitted.add(key);
    }
  }
  assert.deepEqual([...emitted].sort(), ['availableWithCount', 'freeingSoon', 'limited', 'unlikely', 'wait10_20', 'wait20_plus', 'wait5_15'].sort());
});
