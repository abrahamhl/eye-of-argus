# ERRORS

## E001 — `node --test test/` resolved as a module path (FAILED, FIXED)
- Symptom: `Cannot find module '...\\test'`, 1 failing pseudo-test.
- Cause: Node 22 `--test` does not accept a bare directory here.
- Fix: `node --test test/*.test.mjs` (D008).
- Status: fixed; 65/65 pass after S30 review fixes.

## E002 — Floating-point normalization (FAILED, FIXED)
- Symptom: `normalizeValue(80, {min:0,max:100}, true)` returned `19.999999999999996`.
- Cause: binary float on `(1 - 0.8) * 100`.
- Fix: round normalized output to 6 decimals in `normalizeValue`.
- Status: fixed.

## E003 — Upstream requires Node ≥24 (KNOWN LIMITATION)
- Symptom: `npm ci` on Node 22 emits `EBADENGINE`; two allocation microbenchmarks
  are skipped because they are calibrated for Node 24.
- Impact: our derivative does not depend on Node 24; upstream's full gate does.
- Mitigation: document; install Node 24 before claiming upstream's allocation gate.
- Status: open (documented in `docs/UPSTREAM_PROVENANCE.md`).

## E005 — PowerShell wrote a UTF-8 BOM into a JSON calibration fixture (FIXED)
- Symptom: `SyntaxError: Unexpected token '﻿'` from `bin/calibrate.mjs`.
- Cause: `Set-Content -Encoding utf8` on Windows PowerShell 5.1 emits a BOM.
- Fix: CLI strips a leading BOM before `JSON.parse` (and `[IO.File]::WriteAllText` for fixtures).
- Status: fixed.

## E004 — Governance docs pending
- Placeholder governance docs from donor/argus were **not** copied here. This
  project's autonomy files are the source of truth until S03/S29/S30 land.
- Status: open.

## S30 — Adversarial review (independent) — findings and fixes
An independent reviewer falsified several claims. All critical/high findings
were fixed in the same session; 65/65 tests pass.

| # | Severity | Defect | Fix | Regression test |
|---|---|---|---|---|
| R1 | critical | `invert` ignored without a `domain`, so noise *raised* Calm | `normalizeValue` applies invert on the no-domain path | `fusion.test.mjs` (noise=80 → 20) |
| R2 | critical | confidence dispersed relative to mean → magnitude-dependent and `[0,0]` = CONTRADICTED | range/scale dispersion, equal at low/high magnitude | `confidence.test.mjs` (3 new tests) |
| R3 | high | zero-MAD disabled outlier rejection; one loud source dominated | absolute cutoff floor (`max(3·MAD, 15)`), no rejection under 3 obs | `fusion.test.mjs` (zero-MAD test) |
| R4 | high | `COMMERCIAL_SAFE` trusted `commercialUse` and ignored an NC licence string | NC/ND licence denylist + case normalization | `registry.test.mjs` (NC bypass) |
| R5 | high | licence exclusions were computed then discarded; brief listed excluded sources | exclusions threaded into brief JSON + HTML | `verticalSlice.test.mjs` |
| R6 | high | Calm's number not traceable from its own evidence | derived crowd EvidenceRecord + `evidence` on result | `verticalSlice.test.mjs` |
| R7 | medium | evidence lacked raw/domain/cutoff; estimate id omitted range | evidence records diagnostics; range + confidenceState hashed | `integrity.test.mjs` |
| R8 | medium | nested `meta` dropped from observation hash → collisions | recursive canonical JSON | `integrity.test.mjs` |
| R9 | medium | missing/NaN `now` became STALE; invalid policy could promote cached to LIVE | finite-now guard + policy ordering validation | `freshness.test.mjs` |
| R10 | medium | released privacy cell exposed the exact count | band-only output | `privacy.test.mjs` |
| R11 | medium | privacy budget resettable by rewinding the clock | reject non-monotonic time | `privacy.test.mjs` |
| R12 | medium | `bandAccuracy` counted missing labels as correct | validity filter | `calibration.test.mjs` |
| R13 | medium | CONTRADICTED estimate styled "solid"; freshness branch dead | honesty class uses state + freshness | `placeBrief.js` (covered by verticalSlice) |

### Residual, not yet fixed
- Unknown licence with `commercialUse:true` still passes `COMMERCIAL_SAFE`; a
  legal review / explicit allowlist is required (documented in LICENSING_MATRIX).
- `kind` is caller-asserted; there is no adapter provenance proving an
  observation was truly observed rather than AI-inferred.
- Calm's 55/45 blend is a design choice, not a calibrated weight.
- `bin/` still owns evidence selection and ranking wiring (no formula, but not
  yet a declarative per-region signal spec).
- `bandAccuracy` fixture from a synthetic source exists under `out/` (gitignored)
  and is marked synthetic; not for publication.
