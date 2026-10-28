# Group availability: occupancy timestamp validity

PBI: APEW SeatMe future occupancy timestamp regression (2026-10-28).

The calculation describes a possibility, never a seating guarantee. An occupied table may contribute to the existing `freeingSoon` hint only when `occupiedSince` is a valid Date and its elapsed time is between zero and 30 minutes inclusive. Future, invalid, or missing timestamps provide no evidence that a table is freeing soon.

Existing capacity matching, available-table precedence, counts, thresholds and translation keys remain unchanged. This PBI does not validate whether the pre-existing 30-minute business rule is an accurate forecast; that needs a separate product decision.

Acceptance criteria:

1. Future occupancy does not generate `freeingSoon`.
2. Invalid or missing timestamps do not generate `freeingSoon`.
3. Current-to-30-minute timestamps preserve the existing inclusive behavior; older timestamps do not qualify.
4. Available tables and group capacities behave as before; inputs are not mutated.
5. `npm test`, `npm run lint` and `npm run build` provide reproducible evidence, with no Firebase credentials or production database access.

The regression tests use a fixed clock and compile the real TypeScript helper. They do not substitute a fake implementation or connect to Firestore. Browser/Firestore integration and protected remote Preview require a separate environment and remain unverified by these unit tests.
