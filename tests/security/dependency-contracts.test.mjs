import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createMemoryRouter, matchRoutes, StaticRouter, Link } from 'react-router-dom';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, collection, Timestamp, GeoPoint, terminate } from 'firebase/firestore';

// Use the route paths actually declared by App; no production Firebase imports.
const source = await readFile(new URL('../../src/App.tsx', import.meta.url), 'utf8');
const paths = [...source.matchAll(/<Route path="([^"]+)"/g)].map(match => match[1]);
const routes = paths.map(path => ({ path, element: React.createElement('span', null, path) }));

test('all four application paths still resolve, including restaurant IDs', () => {
  assert.equal(paths.length, 4);
  for (const [pathname, route, id] of [
    ['/', '/', undefined], ['/restaurant/sample-cafe', '/restaurant/:id', 'sample-cafe'],
    ['/staff', '/staff', undefined], ['/staff/restaurant/sample-cafe', '/staff/restaurant/:id', 'sample-cafe'],
  ]) {
    const matches = matchRoutes(routes, pathname);
    assert.equal(matches?.at(-1).route.path, route);
    assert.equal(matches?.at(-1).params.id, id);
  }
  assert.equal(matchRoutes(routes, '/unknown'), null);
});

test('navigation and history retain the route and query after the v7 migration', async t => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] });
  t.after(() => router.dispose());
  await router.navigate('/restaurant/sample-cafe?lang=en');
  assert.equal(router.state.location.pathname, '/restaurant/sample-cafe');
  assert.equal(router.state.location.search, '?lang=en');
  assert.equal(router.state.matches.at(-1).params.id, 'sample-cafe');
  await router.navigate('/staff/restaurant/sample-cafe');
  await router.navigate(-1);
  assert.equal(router.state.location.pathname, '/restaurant/sample-cafe');
});

test('customer and staff links retain internal hrefs', () => {
  const markup = renderToStaticMarkup(React.createElement(StaticRouter, { location: "/" },
    React.createElement(Link, { to: '/restaurant/sample-cafe' }, 'Customer'),
    React.createElement(Link, { to: '/staff/restaurant/sample-cafe' }, 'Staff')));
  assert.match(markup, /href="\/restaurant\/sample-cafe"/);
  assert.match(markup, /href="\/staff\/restaurant\/sample-cafe"/);
});

test('Firebase Firestore public references and value types remain compatible offline', async t => {
  const app = initializeApp({ projectId: 'demo-apew-security', apiKey: 'fixture-only', appId: 'fixture-only' }, 'security-contract');
  const db = getFirestore(app);
  t.after(async () => { await terminate(db); await deleteApp(app); });
  assert.equal(doc(db, 'restaurants', 'sample-cafe').path, 'restaurants/sample-cafe');
  assert.equal(collection(db, 'restaurants').path, 'restaurants');
  const timestamp = Timestamp.fromMillis(1700000000000);
  assert.equal(timestamp.toMillis(), 1700000000000);
  assert.ok(new GeoPoint(35.68, 139.76).isEqual(new GeoPoint(35.68, 139.76)));
});
