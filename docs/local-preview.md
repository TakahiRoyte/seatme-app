# Isolated synthetic-data Preview (APEW APE-9)

The explicit apew-preview build mode fixes the Firebase project to demo-apew-seatme, uses the browser's own origin as the Firestore endpoint, and displays a synthetic-data notice. Normal builds retain the existing Firebase configuration path. Preview removes external font requests so it can operate under a same-origin CSP without Internet access.

Build with npm run build:preview and validate configuration with npm run test:preview. HTTP preview origins must be loopback; HTTPS origins are supported for a future protected hosting adapter. A gateway must proxy the Firestore WebChannel paths to an isolated emulator. The app does not start an emulator, seed data, or provide production migration operations.

Acceptance: the actual customer and staff routes must read synthetic data; staff changes must propagate through Firestore to the customer view; a reset must restore seed data; stopping must release Preview resources. APEW manages source-commit metadata, build artifacts, isolation, seed/reset, gateway headers and browser E2E evidence. This document defines the contract, not a claim that all acceptance tests have passed.

No production Firebase connection or deployment. Protected remote Preview, Access/MFA and independent review remain required. This branch is based on the unmerged dependency remediation branch; review it as a stacked draft. Implemented by the controlling Codex session while autonomous Developer accounting is unresolved.
