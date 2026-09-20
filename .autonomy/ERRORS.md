# ERRORS

## E001 — `node --test test/` resolved as a module path (FAILED, FIXED)
- Symptom: `Cannot find module '...\\test'`, 1 failing pseudo-test.
- Cause: Node 22 `--test` does not accept a bare directory here.
- Fix: `node --test test/*.test.mjs` (D008).
- Status: fixed; 43/43 pass.

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
