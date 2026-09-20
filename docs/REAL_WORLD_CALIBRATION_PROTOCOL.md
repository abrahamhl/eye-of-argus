# Real-world calibration protocol

This is the path from "engineering demo" to "measured predictive evidence".
Until this protocol has been executed and its results reviewed, the system must
report **NOT YET CALIBRATED** everywhere it shows confidence. No accuracy,
probability or performance claim may be published from synthetic fixtures.

## Objective

Measure how well the Crowd Index bands and probabilistic outputs match ground
truth at real Arnhem/Gelderland locations, honestly including error.

## Pilot design (minimum viable)

- **Locations:** 10–20 Arnhem sites, stratified: busy retail street, park,
  station surroundings, residential street, event venue.
- **Windows:** at least 3 per site, spread across day-of-week and hours
  (e.g. weekday 12:00, weekday 17:30, Saturday 14:00), Europe/Amsterdam local.
- **Ground truth:** a human observer records a band per window using a fixed
  rubric (see below), plus an approximate count range where lawful and
  appropriate. No personal data, no photos of identifiable people, no
  private-property observation.
- **Lawfulness:** observation only in public space; follow AVG/GDPR and local
  rules; record only aggregate bands/count ranges.

### Band rubric (ground truth)

| Band | Observable proxy (30 s observation) |
|---|---|
| LOW | mostly empty; individuals pass |
| MODERATE | steady flow; several people present |
| HIGH | dense, sustained flow; limited standing room |
| VERY HIGH | congested; movement slowed |

## Collection format

One JSON record per observation window, `out/calibration/ground-truth.jsonl`:

```json
{"placeId":"...","lat":51.98,"lon":5.89,"windowStart":"2026-10-05T12:00:00+02:00","durationSec":30,"truthBand":"HIGH","truthCountLow":30,"truthCountHigh":60,"observer":"initials"}
```

Ground truth MUST be collected independently of, and ideally before seeing, the
model output for that window.

## Procedure

1. Freeze the model: record `methodologyVersion`, `configurationHash`, adapter
   versions and source manifests.
2. For each window, replay the model offline on the observations valid at that
   time (live mode or cached), producing a predicted band, score, range and
   evidence-quality confidence.
3. Run `bin/calibrate.mjs --fixture out/calibration/replay.json` (with
   `synthetic: false`) to compute metrics.
4. Store raw predictions and ground truth together; never summarise without them.

## Metrics

| Metric | Definition | Notes |
|---|---|---|
| Classification accuracy | fraction of windows with matching band | report per band too |
| Confusion matrix | predicted band × truth band | mandatory |
| MAE | mean abs error vs count midpoint, where count ranges exist | only for counted sites |
| Brier score | mean((confidence − outcome)²), outcome = band matched | confidence must be stated as evidence quality, not probability |
| Calibration error (ECE) | bin confidence, compare to observed match rate | bins of 5 |
| False-high rate | predicted HIGH/VERY HIGH when truth is LOW/MODERATE | trust-critical |
| False-low rate | predicted LOW when truth is HIGH/VERY HIGH | |

## Reporting rules

- Report N, the metric, and its uncertainty (e.g. Wilson interval for accuracy).
- Never report a metric without N and the frozen `configurationHash`.
- Never convert evidence-quality confidence into a probability claim without ECE.
- Publish `NOT YET CALIBRATED` until this protocol has run and been reviewed.

## Current status

**NOT YET CALIBRATED.** No ground truth has been collected. The synthetic
fixtures used in CI are engineering artifacts only and are explicitly marked
`SYNTHETIC DEMO`.
