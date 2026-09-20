# XYZ method

Eye of Argus explains engineering value with XYZ statements plus internal
machine-readable evidence. One registry is authoritative; nothing user-facing
may hardcode a claim or a measured number.

## The four parts

- **X — Outcome.** An observable capability or outcome.
- **Y — Measurement.** How we know X is true. Measurable: test count, CI result,
  benchmark, parser/site count, fixture, output, latency, deterministic
  reproduction, calibration result. Never "high quality" or "enterprise ready".
- **Z — Engineering.** The concrete code/architecture that produced X.
- **Evidence (internal).** Pointers to real files and tests, plus status.

## Where it lives

- Registry: `src/argus/product/xyz.js`
- Truth Snapshot (measured facts): `src/argus/product/truthSnapshot.js`
- Site build consumes both: `bin/build-site.mjs`
- Deployment gate: `bin/verify-site.mjs` (fails on drift)
- Private/public boundary guard: `bin/guard-private-boundary.mjs`

## Statuses

`VERIFIED` · `SUPPORTED` · `EXPERIMENTAL` · `BLOCKED` · `RETIRED`.

- A `VERIFIED` entry **must** carry at least one existing evidence pointer
  (a test and/or source file). `test/truth-layer.test.mjs` enforces this.
- `BLOCKED` features must never be presented as achieved (Cesium is `BLOCKED`).
- `RETIRED` entries are never exported publicly.

## Measured numbers are generated, never typed

Y values may embed snapshot tokens such as `{{tests.total}}` or
`{{runtimeDependencies}}`. They are resolved from the Truth Snapshot at build
time, so a hardcoded `65/65` cannot survive: `bin/verify-site.mjs` compares the
published test count to the live source count and fails otherwise.

## Live vs fixture vs implemented

Adapters keep three separate fields and never collapse them:

- `implementationStatus` — the adapter exists.
- `fixtureStatus` — deterministic tests pass against a recorded fixture.
- `liveStatus` — a **dated** successful remote run (`docs/live-verification.json`).

A single live run is a historical observation, not a standing guarantee of
upstream availability.

## Calibration honesty

The calibration pipeline entry is `SUPPORTED`, and calibration status is
`NOT_YET_CALIBRATED`. No accuracy claim is permitted until ground truth exists
(see `docs/REAL_WORLD_CALIBRATION_PROTOCOL.md`).

## Adding a claim

1. Implement the behaviour.
2. Add an executable verification (test) and/or real source path.
3. Add an entry to `src/argus/product/xyz.js` with X, Y (templated if measured),
   Z and evidence pointers.
4. Run `node --test test/*.test.mjs && node bin/build-site.mjs && node bin/verify-site.mjs`.
5. Only then set `status: VERIFIED`.
