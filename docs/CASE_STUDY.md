# Case study — Eye of Argus (first vertical slice)

## Problem

People and planners repeatedly ask contextual questions that maps answer badly:
*which nearby place is likely least crowded, calmest, or most social right now —
and why should I believe it?* Existing answers either hide their evidence behind
an opaque score or pretend sensor precision they do not have.

## Approach

An offline-first evidence engine that turns heterogeneous public sources into
explicit estimates:

- **Observation → Evidence → Estimate.** Every number resolves to source
  manifests through `EvidenceRecord`s. `traceSources()` proves it in tests.
- **Four separate measures.** Crowd, Calm, Social Opportunity and Confidence,
  never collapsed into one unexplained score.
- **Honest uncertainty.** Scores carry a range and a band; confidence is derived
  from evidence quality, not from the score. All-inferred evidence cannot reach
  `VERIFIED`.
- **Freshness is explicit.** `LIVE · CACHED · STALE · STATIC · INFERRED ·
  UNAVAILABLE` drive contribution weight; cached data is never shown as live.
- **Licence safety.** A machine-readable profile (`COMMERCIAL_SAFE`) excludes
  non-commercial sources *before* fusion and reports the exclusions.
- **Privacy by construction.** k-threshold suppression, coarse grid aggregation
  and a local query budget; no device identifiers anywhere.

## Result (measured, reproducible)

- Headless core with **65/65 deterministic tests** (`node --test test/*.test.mjs`),
  no network required.
- Arnhem slice: Burger King Centrum → Crowd **HIGH 73.0** (range 63–83),
  Calm **LOW 22.0**; Park Sonsbeek → Crowd **MODERATE 38.1**,
  Calm **HIGH 70.9**. The busy park is the calmer place — Calm is deliberately
  not the inverse of Crowd, and a high noise reading lowers Calm.
- CALM mode ranks the park first; SOCIAL mode ranks the Burger King first —
  the same evidence model, with the mode simply choosing which measure ranks
  the destinations (no hidden weighting).
- Forecast at NOW/+15/+30/+60 with uncertainty that widens and confidence that
  decays; forecasts are not silently treated as observations.

## What this is not

- Not calibrated. No ground-truth benchmark has been collected, so **no accuracy
  claim is made** (`docs/CALIBRATION.md` gates it).
- Not live. Source values in this slice are synthetic fixtures; adapters are the
  next engineering step.
- Not a person counter. Estimates are bands with ranges.
- Not a Waze competitor. Routing is a later, secondary overlay.

## Upstream credit

Derivative of the MIT-licensed `bilawalsidhu/gods-eye-view` @ `0d41b6b`
(39,375★). Upstream baseline reproduced: 4,135 passing unit tests, boundary
gates and a production build all green. Eye of Argus adds the original
intelligence core; upstream's globe is not claimed as ours.

## Repeat it

```bash
node --test test/*.test.mjs
node bin/arnhem-demo.mjs
```
