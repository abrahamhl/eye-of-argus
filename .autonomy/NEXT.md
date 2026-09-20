# NEXT — atomic, unblocked stories

Execute top-down. Each story: implement → test → commit → update STATE.

## S03 — Reproduce CalmPath donor check/build (forensics)
- Command: `cd C:\dev\recruiter-evidence\calmpath-maps-pro && corepack pnpm@10.4.1 install --frozen-lockfile && pnpm check && pnpm build`
- Deliverable: `docs/DONOR_NOTES.md` with what was reusable (algorithms/concepts) and what was intentionally not imported.
- Blocker: needs donor deps installed; no secrets required.

## S27 — Calibration fixture framework
- Add `src/argus/calibration/metrics.js`: band accuracy, MAE, Brier, calibration curve.
- Add `test/calibration.test.mjs` with a tiny labelled fixture (deterministic).
- Wire `bin/calibrate.mjs --fixture <file>` writing `out/calibration/*.json` (gitignored).
- Do NOT publish accuracy numbers from synthetic data.

## S28 — Performance/visual audit of the core
- Add `test/perf.test.mjs` bounding fusion of 1,000 observations under a budget.
- Document results in `docs/PERFORMANCE.md`.

## S30 — Adversarial review
- Spawn an independent reviewer over the core; record findings in `.autonomy/ERRORS.md`.

## S29 — Case study
- `docs/CASE_STUDY.md`: problem, evidence philosophy, offline-first, licence engine, results, limits.

## S19 — Confidence UI (later)
- Only after upstream globe integration story is scoped.

## Continuation protocol
1. Read STATE.md; `git status`; read PRD.json.
2. Pick the highest-priority unblocked story above.
3. Implement, test with `node --test test/*.test.mjs`, commit atomically.
4. Update STATE.md + PRD.json + NEXT.md. Continue.
