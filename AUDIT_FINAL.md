# AUDIT_FINAL — Eye of Argus hardening, live data & product integration

Branch: `deepseek/hardening-live-v1` (based on `main` @ `f735316`).
Date: 2026-09-20. Model: DeepSeek V4.1 Flash.

## Commits on this branch

| SHA | Subject |
|---|---|
| `7cafb90` | fix(confidence): evaluate agreement in normalized space (P0) |
| `eb8770c` | feat(adapters): real GTFS-RT and Open-Meteo sources with offline cache (P1) |
| `9a61002` | docs(ci): calibration protocol, source blockers, pinned actions, AUDIT_FINAL |
| `593abf8` | feat(experiments): NDW DATEX II adapter, offline workspace, analyst mode |

Baseline before this branch: `f735316` (public repo `abrahamhl/eye-of-argus`,
65 tests, CI + Pages green).

## Commands run and actual results

| Command | Result |
|---|---|
| `node --test test/*.test.mjs` | **94 tests, 85 pass, 0 fail** |
| `node bin/arnhem-demo.mjs` | prints `SYNTHETIC DEMO` banner; writes briefs to `out/` |
| `node bin/build-site.mjs` | writes `site/data.json` from the core |
| `node bin/verify-site.mjs` | `site verification OK` |
| `node bin/fetch-live-fixtures.mjs` | recorded GTFS-RT (1292 vehicles → 31 in Arnhem bbox) + Open-Meteo |
| `node bin/live-smoke.mjs` | opt-in live check; **not** part of CI |

CI (GitHub Actions) after push to this branch: see the run linked on the branch.
Deterministic jobs use fixtures only; `live-smoke.yml` is separate (manual/cron).

## Acceptance gates

| # | Gate | Status |
|---|---|---|
| 1 | Confidence raw-unit bug fixed | ✅ `computeEvidenceConfidence` consumes normalized contributions |
| 2 | Regression tests pass | ✅ cross-unit agreement/contradiction tests added |
| 3 | Evidence Confidence semantics corrected | ✅ `confidenceSemantics: 'evidence-quality'`; docs say not a probability |
| 4 | Synthetic/demo outputs unmistakably marked | ✅ CLI banner, brief banner + JSON, simulator banner, tests |
| 5 | ≥2 real-data adapters **or** documented blocker | ✅ OVapi GTFS-RT + Open-Meteo + NDW DATEX II (3 live-capable) |
| 6 | Offline cache/freshness works | ✅ cache fallback keeps original timestamp → CACHED/STALE, never LIVE |
| 7 | Live and deterministic tests separated | ✅ CI = fixtures; `live-smoke.yml` = network |
| 8 | First visual workflow works | ✅ Pages simulator: select place, per-metric views, forecast, evidence, licence, privacy, compare, brief |
| 9 | Evidence drill-down works | ✅ Evidence Inspector (raw → normalized → base × corr → effective), explains Crowd=73 |
| 10 | God's Eye View attribution accurate | ✅ MIT credit + pinned SHA in NOTICE/PROVENANCE |
| 11 | No fake GitHub fork claim | ✅ NOTICE/README state it is **not** a GitHub fork |
| 12 | COMMERCIAL_SAFE enforced | ✅ NC/ND denylist + profile filtering, tested |
| 13 | No fake accuracy claims | ✅ calibration status = NOT YET CALIBRATED |
| 14 | Calibration protocol exists | ✅ `docs/REAL_WORLD_CALIBRATION_PROTOCOL.md` |
| 15 | Clean CI passes | see branch CI (tested locally: 94/94) |

## Live sources implemented

- **`ovapi-transit-live`** — `https://gtfs.ovapi.nl/nl/vehiclePositions.pb`
  (OVapi / Stichting OpenGeo, CC-BY-4.0, keyless). Protobuf parsed with a
  dependency-free reader; coordinates only. Contributes mobility pressure.
- **`open-meteo-live`** — `https://api.open-meteo.com/v1/forecast`
  (Open-Meteo, CC-BY-4.0, keyless). Contributes outdoor calm context.
- **`ndw-traffic-live`** — `https://opendata.ndw.nu/snelheden_en_intensiteiten_meetgegevens_en_configuratie_meetlocaties.xml.gz`
  (NDW, CC0-1.0, keyless). ~217 MB DATEX II v3 XML streamed by a bounded custom
  parser (20,532 live sites parsed); contributes road-traffic pressure. Arnhem
  slice recorded as a small fixture.

All three are fixture-backed in CI; live mode is opt-in via `bin/live-smoke.mjs`.

## Sources rejected / blocked

- **`https://v0.ovapi.nl/`** — connection failed on probe.
- **Social platforms** — no compliant aggregate interface; `UNAVAILABLE`.
- **Wi-Fi/BLE/MAC scanning, through-wall monitoring** — prohibited by design.

## Known limitations

- No calibration against ground truth; every confidence value is evidence
  quality, not probability.
- Arnhem demo is entirely synthetic (`dataClass: synthetic`).
- Correlation handling is a simple fixed damping factor, not a Bayesian model.
- `k = 5` is an engineering placeholder, not a compliance claim.
- The visual product is a static simulator page, not yet wired to the upstream
  Cesium globe.

## Unresolved blockers

- Real calibration requires lawful field observation collection.
- Cesium globe integration (separate presentation layer) is not started.

## Next highest-ROI experiments

1. Run the calibration pilot on 10–20 Arnhem sites; publish N, confusion matrix,
   Brier and ECE — or keep reporting NOT YET CALIBRATED.
2. Wire the core into the upstream Cesium globe as a separate presentation layer.
3. Extend the offline workspace with saved areas and a full offline replay mode.
4. Add a persisted live-smoke history to record provider reliability over time.
