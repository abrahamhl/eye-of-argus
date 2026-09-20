# STATE — Eye of Argus

Updated: 2026-09-20 (session 1)
Phase: intelligence core scaffolded and tested; live adapters + UI pending.

## Done this session

- Phase Zero forensics on `bilawalsidhu/gods-eye-view` @ `0d41b6be5490db1f10a171f238be75db4d4ec3b4` (MIT).
- Reproduced upstream baseline on Node 22.22.2:
  - `npm ci` exit 0 (EBADENGINE warning: upstream wants Node ≥24.14)
  - `npm test` exit 0 — 4145 tests, 4135 pass, 0 fail, 10 skipped
  - `npm run check:boundaries` exit 0
  - `npm run build` exit 0 (vite, 6.63 s)
- Original offline intelligence core under `src/argus/`:
  freshness/clock, source manifest + licence-aware registry, observation,
  evidence chain, confidence states, robust fusion, crowd, calm, social,
  forecast, privacy suppression, place brief.
- First vertical slice `bin/arnhem-demo.mjs` (two venues, now/+15/+30/+60, CALM vs SOCIAL ranking, briefs written to `out/`).
- Deterministic tests: **94/94 pass** (`node --test test/*.test.mjs`) after S30 fixes.
- Docs: provenance, capability matrix, licensing matrix, source candidates, evidence model, privacy model, calibration gate, ROI backlog, case study.
- Calibration metrics (`src/argus/calibration/metrics.js`) + CLI (`bin/calibrate.mjs`) that refuses to report on a synthetic fixture without `--allow-synthetic`.
- Performance test: fusion of 1000 observations is deterministic and bounded (`test/perf.test.mjs`).
- Donor SHA captured: calmpath-maps-pro `4ccaf84461564a524cb334726f5142385a35f778`; argus `1fe1e8554304c32a19937c6f17ff066a0b8e753b`.

## Current test command

```
node --test test/*.test.mjs
```

## Deployment

- Public repository: https://github.com/abrahamhl/eye-of-argus (branch `main`).
- **Live simulator (GitHub Pages):** https://abrahamhl.github.io/eye-of-argus/
  - `site/` is a dependency-free static HUD (canvas radar, per-metric views,
    forecast, evidence drill-down, licence engine, privacy suppression,
    investor XYZ view).
  - `bin/build-site.mjs` generates `site/data.json` from the real core at a
    fixed clock; `bin/verify-site.mjs` gates the artifact.
  - Pages workflow: build → verify → upload → deploy (runs on `main`).
  - Latest verified: `CI` and `Pages` runs both **success**; site returns 200;
    deployed `data.json` = product Eye of Argus, tests 94, deps 0, 2 places, 5 XYZ.
- CI workflow `.github/workflows/ci.yml` runs on push/PR/manual, Node 20.x and
  22.x, and is **verified green** on GitHub:
  - asserts zero runtime dependencies
  - syntax-checks every `src/`, `bin/`, `test/` script
  - `# tests 94 / # pass 94`
  - runs the Arnhem vertical slice
  - calibration CLI refuses a synthetic fixture and accepts it with `--allow-synthetic`
  - provenance job confirms `LICENSE`, `NOTICE.md` and the upstream SHA
- First two runs: `35535133849` (15s) and `35535169906` (16s), both **success**.

## Session 2 — hardening + live data (branch `deepseek/hardening-live-v1`)

- P0: confidence now evaluates agreement in **normalized** space
  (`computeEvidenceConfidence`); cross-unit regression tests added.
- P0: confidence renamed to **Evidence Quality** (`confidenceSemantics`), never a
  probability; documented.
- P0: `dataClass` (`live|synthetic|mixed|unknown`) propagated to estimates;
  SYNTHETIC DEMO banner in CLI, HTML brief and simulator; tests assert it.
- P1: two live-capable adapters — OVapi GTFS-RT vehicle positions (mobility) and
  Open-Meteo current weather (context) — dependency-free; fixture-backed CI.
- P1: bounded `httpFetch`, offline cache that never upgrades freshness.
- P1: versioned methodology config `m0.2` + correlation damping for mobility.
- Evidence Inspector (`explainEstimate`) in briefs and simulator.
- Calibration protocol + source candidate/blocker docs; CI actions pinned to SHAs.
- Tests: **94/94 pass**. Commits `7cafb90`, `eb8770c`.

## Not yet done (do not claim otherwise)

- Live adapters (NDW, OVapi, PDOK) — only synthetic fixtures exist.
- Local persistence / true offline cache store.
- Cesium globe integration or any UI.
- Calibration against ground truth (none performed).
- Perf budget documented at 2000 ms for 1000 observations (headless core only).
- Upstream module import into this repo (no integration yet).
- Remote GitHub repository (local git only; no push, no visibility decision).
