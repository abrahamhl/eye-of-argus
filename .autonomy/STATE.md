# STATE — Eye of Argus

Updated: 2026-09-20 (session 6 — field validation kit)

## CURRENT TRUTH

Generated facts live in the Truth Snapshot: `node -e "import('./src/argus/product/truthSnapshot.js').then(m=>console.log(m.buildTruthSnapshot()))"`.
Do not retype these numbers elsewhere.

- Deterministic tests: **120/120 pass** (`node --test test/*.test.mjs`).
- Runtime dependencies: **0**.
- Live-capable adapters: **3** (NDW DATEX II, OVapi GTFS-RT, Open-Meteo).
  - implementationStatus: IMPLEMENTED for all three.
  - fixtureStatus: FIXTURE_VERIFIED for all three.
  - liveStatus: per dated run in `docs/live-verification.json` (a single run is
    not a standing guarantee).
- Calibration: **NOT_YET_CALIBRATED**. No accuracy claim is made.
- Field validation kit: available (`site/field/`, `bin/validate.mjs`,
  `bin/merge-observations.mjs`).
- Commercial-safe licence policy: ACTIVE.
- Offline workspace: available (`src/argus/workspace/store.js`).
- Analyst mode: available (simulator tab).
- Cesium globe: **NOT integrated** (XYZ status BLOCKED).
- XYZ registry: `src/argus/product/xyz.js` (16 public entries).
- Private/public boundary: enforced by `bin/guard-private-boundary.mjs`.

## COMPLETED HISTORY (timestamped)

- 2026-09-20 s1: upstream forensics; original offline core; Arnhem synthetic
  slice; 43→65 tests; commits `b98a3b3`, `acae204`, `6f178eb`.
- 2026-09-20 s2: GitHub repo + CI + Pages simulator; commits `ad452bb`…`74c44c8`.
- 2026-09-20 s3: P0 confidence normalized + Evidence Quality + synthetic markers;
  P1 live adapters (GTFS-RT, Open-Meteo) + offline cache; commits `7cafb90`,
  `eb8770c`, CI pinning `9a61002`.
- 2026-09-20 s4: NDW DATEX II streaming adapter; offline workspace; Analyst mode;
  commits `593abf8`, `8075d4c`, `699bdde`.
- 2026-09-20 s5: XYZ truth layer (registry + snapshot + gates), private boundary;
  commit `9633135`.
- 2026-09-20 s6: field validation kit (offline PWA + merge/validate CLIs +
  reliability/model metrics); commits in this session.

## CURRENT BLOCKERS

- Real-world calibration: needs actual field ground truth. The kit now exists;
  status is BLOCKED only on data collection (`docs/VALIDATION_GUIDE.md`).
- Cesium globe integration: not started (XYZ `xyz-cesium-globe` = BLOCKED).
- Live reliability history: only single dated runs exist.

## NEXT

1. Run the field pilot (10–20 Arnhem sites) and feed `bin/validate.mjs`.
2. Cesium globe presentation layer (S42) — the only major unstarted feature.
3. Live-smoke reliability history (S43).
4. Offline replay mode (S44).

Continuation protocol: read STATE → `git status` → PRD.json → pick the highest
unblocked story → implement → test → commit → update STATE.
