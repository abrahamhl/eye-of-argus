# Upstream provenance

## Canonical upstream

| Field | Value |
|---|---|
| Repository | `bilawalsidhu/gods-eye-view` |
| Commit SHA | `0d41b6be5490db1f10a171f238be75db4d4ec3b4` |
| Branch | `main` |
| Retrieved | 2026-09-20 |
| Licence | **MIT** (`LICENSE`, "Copyright (c) 2026 Bilawal Sidhu"); `package.json` `"license": "MIT"` |
| Language | JavaScript (browser, Cesium, Vite) |
| Stars at snapshot | 39,375 |
| Decoy (NOT used) | `VrushankPatel/godseye` — a different project; not related |

`gh repo view` reported `licenseInfo.key = other`; the repository's own `LICENSE`
and `package.json` both say MIT, which is authoritative for our derivative.

## Baseline reproduction (Node 22.22.2; upstream declares Node ≥24.14 <25 || ≥26 <27)

| Check | Command | Result |
|---|---|---|
| Install | `npm ci` | exit 0 (EBADENGINE warning: running Node 22) |
| Unit tests | `npm test` | exit 0 — `4145` tests, `4135` pass, `0` fail, `10` skipped (2 allocation microbenchmarks skipped because they are calibrated for Node 24) |
| Import/package boundaries | `npm run check:boundaries` | exit 0 |
| Production build | `npm run build` | exit 0 (`vite build`, 6.63 s) |

These are the numbers the derivative must not regress. Re-run under Node 24
before claiming the allocation gate.

## Attribution obligations

- Keep upstream MIT copyright notice on any copied/derived code.
- Clearly mark original contributions. This repository keeps its intelligence
  core in `src/argus/` as original work; upstream modules, if imported, stay
  credited.
- Do not present upstream's globe/UI as our own contribution.

## Third-party datasets inside upstream (not MIT)

Upstream bundles several datasets under their own licences. These must never be
loaded under the `COMMERCIAL_SAFE` profile unless replaced or licensed:

- TeleGeography submarine cables — **CC BY-NC-SA 3.0** (non-commercial).
- Bhote Koshi event pack + `src/data/bhoteKoshiFloodPath.js` — **CC BY-NC 4.0**.
- OSM-derived datacenters/dams — ODbL 1.0 (share-alike on the *data*).
- Natural Earth — public domain; DataSF neighborhoods — PDDL 1.0.

See [`LICENSING_MATRIX.md`](LICENSING_MATRIX.md) for the derivative policy.

## Donor and philosophy inputs

| Role | Repository | SHA |
|---|---|---|
| Donor (concepts only, not merged) | `abrahamhl/calmpath-maps-pro` | `4ccaf84461564a524cb334726f5142385a35f778` |
| Evidence philosophy | `abrahamhl/argus` | `1fe1e8554304c32a19937c6f17ff066a0b8e753b` |

CalmPath donated calm-routing and environmental-scoring ideas; no React
components or dependency graph were imported. ARGUS donated the
Signal→Evidence→Finding philosophy, translated here to
**Signal → Observation → Evidence → Estimate → Context → Decision → Verification**.
