# EXPERIMENTS

Hypotheses to test before claiming value. No results yet unless marked.

## X001 — Does Calm diverge from inverse-Crowd in a way users notice?
- Method: label a set of venue types; check Calm/Crowd rank correlation.
- Success: rank correlation < 0.9 and at least one "busy but calm" case.
- Status: core supports it (park case); needs more venue variety.

## X002 — Which single source adds the most Crowd information?
- Method: ablation. Remove each source; measure change in band stability.
- Status: not started.

## X003 — Does opt-in telemetry improve estimates beyond public sources?
- Method: compare with/without `optin-crowd` on the Arnhem fixtures.
- Status: not started. Requires privacy review before any real telemetry.

## X004 — Forecast skill vs persistence baseline
- Method: Brier score of +60m forecast vs "persist NOW".
- Status: blocked on ground-truth data (see CALIBRATION.md).

## X005 — Licence-profile engine prevents accidental non-commercial loads
- Method: assert COMMERCIAL_SAFE excludes NC sources across the registry.
- Status: tested (`test/registry.test.mjs`, `test/verticalSlice.test.mjs`).
