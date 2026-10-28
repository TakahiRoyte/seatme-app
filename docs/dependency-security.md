# Dependency security maintenance (APEW APE-8)

The sample application's production dependency audit reported 17 affected packages, including two critical and two high severity packages. This change updates the dependency graph without connecting to production Firebase or merging a release.

## Acceptance criteria and evidence

- AC1: The entire installed graph, including development dependencies, passes npm audit --audit-level=low. Verified locally against the npm registry on 2026-10-28: zero vulnerabilities. CI repeats the registry check; advisories may change later.
- AC2: React Router supports the application's four route patterns, restaurant IDs, navigation/history, and internal customer/staff links. Four dependency contract tests pass in total, including the offline Firebase test below.
- AC3: React 18 and Firebase 10 remain installed at their existing versions; Firestore references, Timestamp and GeoPoint public APIs work offline. No claim of Firestore write/query/emulator E2E coverage.
- AC4: TypeScript and the Vite production build pass in a non-root Linux container with networking disabled. CI repeats tests and build from a clean npm ci --ignore-scripts.

## Changes

React Router moves from 6.30.3 to 7.18.5 because advisories affect the v6 line. The already-enabled v7 future options are removed from BrowserRouter; the application retains the same routes and React version. Vite moves within v6 to 6.4.5. Compatible transitive ranges refresh build/lint tooling in the lockfile.

Firebase's older pinned transitive dependencies require explicit same-major overrides: @grpc/grpc-js 1.13.6, protobufjs 7.6.6, @protobufjs/utf8 1.1.2, undici 6.29.1 and websocket-driver 0.7.5. Re-evaluate these when upgrading Firebase rather than keeping overrides indefinitely.

Relevant advisories: [protobufjs](https://github.com/advisories/GHSA-j3f2-48v5-ccww), [gRPC](https://github.com/advisories/GHSA-m9gg-hp2v-232j), [undici](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [websocket-driver](https://github.com/advisories/GHSA-mp7j-qc5w-4988). React Router retains its compatibility re-exports in [v7](https://api.reactrouter.com/v7/modules/react-router-dom.html).

## Reproduce

Use Node >=24.11.0. Run npm ci --ignore-scripts, npm audit --audit-level=low, npm run test:security, then npm run build. The tests use a demo Firebase identity and do not import production configuration. Browser E2E, real backend behavior, independent Agent review and protected Preview remain open; this PR is a draft.

This maintenance was implemented by the controlling Codex session, not the currently blocked autonomous Developer. It is independent of the future-availability bugfix PR #1. Merge and production deployment require a separate decision.
