# Calibration methodology

The Crowd Engine must be measurable. No accuracy claim may be made until it is
measured against ground truth and recorded here.

## Ground truth

For pilot locations, record manual or legitimately obtained ground-truth
observations (order-of-magnitude counts within a time window). Keep the
benchmark dataset **separate** from any marketing claim.

## Metrics

| Metric | Applies to | Target (initial) |
|---|---|---|
| Classification accuracy | band vs ground-truth band | report only until ≥50 observations |
| MAE | count ranges vs point truth | report only |
| Brier score | probabilistic predictions | lower is better |
| Calibration curve | predicted confidence vs observed frequency | monotonically increasing |
| False high-crowd rate | predicted HIGH when actually low | minimise |
| False low-crowd rate | predicted LOW when actually high | minimise |

## Protocol

1. Collect ground truth at fixed intervals at fixed pilot cells.
2. Freeze the model (`methodologyVersion`, `configurationHash`) for the run.
3. Replay the same evidence offline through the core.
4. Emit `{ observations, metrics, calibrationCurve, modelVersion }` to
   `out/calibration/` (gitignored) and summarise only the aggregate here.
5. Account for suppressed cells (`k` threshold) in coverage.

## Current status

**No calibration has been performed.** The Arnhem fixtures are synthetic and are
not ground truth. Any accuracy number in this repository before calibration is
forbidden. This section is the gate.
