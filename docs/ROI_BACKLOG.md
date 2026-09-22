# ROI backlog

## Current stage gate — prove value before adding spectacle

Until the investor MVP is validated, priority is:

1. **Real-world crowd validation** — collect matched predictions + independent field truth.
2. **Buyer-task validation** — test one real decision workflow against its current baseline.
3. **Live-source reliability history** — measure availability over time, not one successful run.
4. **Only then** expand visualisation (including Cesium) or add new feature families.

The current buyer hypothesis and measurable gates live in
[`INVESTOR_MVP_SPEC.md`](INVESTOR_MVP_SPEC.md). A feature that cannot improve a
measured user outcome, validation quality or reliability is deferred.

Every major engineering feature gets a heuristic score. We do **not** implement impressive-but-useless
features. Values are 1–5. Priority = VALUE×2 + PORTFOLIO + DIFFERENTIATION − COST.

| # | Feature | USER | PROBLEM | VALUE | ENG COST | DATA COST | LEGAL | PORTFOLIO | BUSINESS | DIFFERENTIATION | PRIORITY |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Crowd/Calm/Social fusion core | consumer, planner | "how busy/calm is here?" | 5 | 3 | 1 | 1 | 5 | 5 | 5 | **26** |
| 2 | Evidence traceability + confidence | analyst, reviewer | "prove it" | 5 | 2 | 1 | 1 | 5 | 4 | 5 | **26** |
| 3 | Licence-profile engine | business | avoid non-commercial data | 4 | 1 | 1 | 3 | 4 | 5 | 4 | **22** |
| 4 | Offline cache + freshness states | field worker | no network on site | 5 | 3 | 1 | 1 | 4 | 4 | 4 | **23** |
| 5 | NOW/+15/+30/+60 forecast | consumer | "when calmer?" | 4 | 3 | 2 | 1 | 4 | 4 | 4 | **20** |
| 6 | Place brief (JSON/HTML) | business, analyst | shareable decision | 4 | 2 | 1 | 1 | 4 | 4 | 3 | **20** |
| 7 | Arnhem NDW + OVapi live adapters | consumer | real data | 5 | 3 | 3 | 2 | 4 | 4 | 4 | **19** |
| 8 | Calibration harness + pilot | business | trust/accuracy | 4 | 3 | 4 | 2 | 5 | 4 | 5 | **18** |
| 9 | Calm/Social routing overlay | consumer | route by mood | 4 | 4 | 3 | 2 | 4 | 4 | 4 | **15** |
| 10 | Analyst mode (source provenance UI) | analyst | situational awareness | 4 | 4 | 2 | 3 | 5 | 3 | 4 | **16** |
| 11 | Cesium globe integration | portfolio | cinematic UX | 3 | 5 | 2 | 3 | 5 | 3 | 3 | **10** |
| 12 | Voice control | consumer | hands-free | 2 | 5 | 2 | 2 | 3 | 2 | 2 | **2** (defer) |

## Product lines (experiments, not claims)

B2C accessibility/social navigation; B2B venue crowd intelligence; events;
mobility; tourism; field service; urban planning; municipal digital twins;
public safety; civil protection; privacy-preserving occupancy sensing;
defence-adjacent public-source situational awareness.

None of these has verified demand yet. Each requires an experiment before any
customer claim. No fake customers, no fake pilots.
