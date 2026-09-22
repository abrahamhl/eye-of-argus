# Product Validation Spec v1 — Eye of Argus

Status: **ACTIVE EXPERIMENT PLAN — outcomes not yet verified**

## 1. Product thesis

Eye of Argus should not be sold as a large OSINT globe. The MVP is a much
narrower evidence product:

> **Before an operator visits or allocates resources to a public-facing place,
> estimate the current crowd band, show the evidence behind it, and state how
> fresh and trustworthy that evidence is — without collecting personal data.**

The current engineering core is sufficient to test this thesis. New feature
families are frozen until the validation gates below are measured.

## 2. One buyer hypothesis

**Primary hypothesis:** an event/venue operations manager in the Netherlands who
must make repeated staffing, visitor-flow or on-site-check decisions around
public-facing locations.

This is a hypothesis, not a customer claim. If interviews show the problem is
weak, change the buyer before expanding the product.

## 3. One job to be done

> "Before I send staff or make a crowd/flow decision, tell me whether the place
> is likely LOW / MODERATE / HIGH / VERY HIGH, why, and whether the evidence is
> fresh enough to act on."

Baseline to compare against: the operator's existing workflow (manual check,
phone call, map search, single-source dashboard, intuition, or other method).
Record the baseline exactly; never invent one.

## 4. Frozen MVP surface

Required:
- place + timestamp;
- Crowd band and range;
- evidence-quality confidence (not probability);
- LIVE / CACHED / STALE / STATIC / INFERRED / UNAVAILABLE state;
- evidence inspector and source licences;
- COMMERCIAL_SAFE source profile;
- offline field-validation PWA;
- exportable decision/brief.

Secondary during this milestone:
- Calm can remain as an exploratory contextual measure.

Deferred from the investment proof:
- Cesium globe;
- voice control;
- new tactical/military layers;
- person identification or person tracking;
- additional "wow" features that do not improve validation or the buyer task.

Social Opportunity remains exploratory until a defensible ground-truth
definition exists.

## 5. North-star metric for this milestone

**Exact crowd-band accuracy on matched, independently observed field windows.**

Always report it with:
- N observations;
- number of distinct locations;
- date range;
- frozen methodology/model version;
- 95% Wilson interval;
- confusion matrix;
- false-high rate;
- false-low rate;
- unmatched predictions;
- suppressed/unsupported coverage.

Do not publish an accuracy claim before the repository's reporting gate is met.
The existing calibration documentation uses **50 observations** as the minimum
point at which classification accuracy should move beyond "report only".

## 6. Three investor XYZ gates

### Gate A — Product truth

**X:** Validated crowd-band estimates for real public locations.

**Y:** Matched field observations across at least 10 locations, reaching the
reporting gate; publish exact-band accuracy + 95% CI + false-high/false-low + N
+ date range + frozen version. Compare against at least one simple baseline if a
fair baseline can be reproduced.

**Z:** NDW/GTFS/weather evidence → normalization → freshness/correlation-aware
fusion → explainable estimate → independent field observation → validation CLI.

Status today: **BLOCKED ON REAL DATA**.

### Gate B — Decision value

**X:** The target operator completes one recurring crowd/flow decision more
efficiently or with less uncertainty.

**Y:** Run the same realistic task with the current baseline and with Argus.
Record completion time, whether the decision could be made, evidence consulted,
and a short post-task confidence/uncertainty rating. Report raw N and medians;
do not generalize beyond the pilot.

**Z:** One focused workflow using the existing simulator/brief rather than a
larger feature set.

Status today: **BLOCKED ON EXTERNAL USER EVIDENCE**.

### Gate C — Commercial signal

**X:** A target user demonstrates concrete follow-up intent.

**Y:** Record interviews separately from product telemetry. Strong signals are a
request for another session, willingness to share operational data, willingness
to run a pilot, or a concrete budget/pricing discussion. Do not convert polite
feedback into "demand".

**Z:** Show the validated workflow, ask about the current cost/problem, and test
a pilot proposition.

Status today: **BLOCKED ON EXTERNAL USER EVIDENCE**.

## 7. Arnhem field pilot

Suggested execution:
1. Freeze methodology/configuration hash before the first observation.
2. Select 10–20 varied public locations.
3. Collect observations across different dayparts and weekdays/weekends.
4. Observe before looking at the Argus prediction.
5. Where practical, use two independent observers for the same window.
6. Continue until the reporting gate is reached.
7. Run `bin/merge-observations.mjs` and `bin/validate.mjs`.
8. Publish aggregate metrics only; keep personal data out of the dataset.
9. Record failures and unsupported windows; they are product evidence too.

## 8. Investor evidence hierarchy

Strongest → weakest:

1. External measured outcome with reproducible data.
2. Repeated user behaviour / concrete pilot intent.
3. Live reliability history.
4. Deterministic tests and CI.
5. Architecture and code quality.
6. Demo aesthetics.

Engineering evidence matters, but it must not be presented as customer demand.

## 9. Stop / pivot rules

Pause feature expansion when:
- real-world accuracy is materially worse than a simple baseline;
- coverage is too low to support the buyer's actual task;
- the buyer does not experience the problem frequently enough;
- live-source reliability makes the workflow unusable;
- the legal/licensing boundary blocks the intended commercial use.

A failed experiment is a useful result if it is recorded honestly.

## 10. Definition of investor-MVP complete

The milestone is complete only when:
- Gate A has real field evidence;
- Gate B has external task evidence;
- Gate C has at least documented commercial-signal evidence;
- all published numbers state N/date/version/source;
- README/site/XYZ claims match the evidence state;
- no BLOCKED claim is described as achieved.
