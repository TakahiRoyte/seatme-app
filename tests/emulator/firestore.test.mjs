import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, onSnapshot, Timestamp, runTransaction, deleteDoc, terminate } from 'firebase/firestore';
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (!host || !/^(?:127\.0\.0\.1|apew-firestore-[a-f0-9-]+):8080$/.test(host)) throw new Error('An explicit isolated emulator is required; no production fallback.');
const [hostname, port] = host.split(':');
const app = initializeApp({ projectId: 'demo-apew-seatme', apiKey: 'synthetic-only', appId: 'synthetic-only' }, 'emulator-contract');
const db = initializeFirestore(app, {});
connectFirestoreEmulator(db, hostname, Number(port));

test('SeatMe Firebase SDK performs real reads, updates, transactions and realtime notifications', { timeout: 30000 }, async t => {
  t.after(async () => { await terminate(db); await deleteApp(app); });
  const ref = doc(db, 'restaurants', 'dependency-contract');
  const timestamp = Timestamp.fromMillis(1700000000000);
  await setDoc(ref, { name: 'Synthetic Cafe', order: 0, tables: [{ id: 'T1', type: 'table', capacity: 4, status: 'available' }], lastUpdated: timestamp });
  assert.equal((await getDoc(ref)).data().lastUpdated.toMillis(), timestamp.toMillis());
  let unsubscribe = () => {};
  t.after(() => unsubscribe());
  const observed = new Promise((resolve, reject) => {
    unsubscribe = onSnapshot(ref, snapshot => {
      if (snapshot.data()?.tables?.[0]?.status === 'occupied') resolve(snapshot.data());
    }, reject);
  });
  await updateDoc(ref, { tables: [{ id: 'T1', type: 'table', capacity: 4, status: 'occupied', occupiedSince: timestamp }] });
  assert.equal((await observed).tables[0].occupiedSince.toMillis(), timestamp.toMillis());
  await runTransaction(db, async tx => { const snapshot = await tx.get(ref); tx.update(ref, { order: snapshot.data().order + 1 }); });
  assert.equal((await getDoc(ref)).data().order, 1);
  await assert.rejects(setDoc(doc(db, 'outside-preview-scope', 'denied'), { value: 'denied' }), error => error.code === 'permission-denied');
  unsubscribe();
  await deleteDoc(ref);
  assert.equal((await getDoc(ref)).exists(), false);
});
