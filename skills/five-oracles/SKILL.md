---
name: five-oracles
description: >
  Adversarial project audit for non-trivial products, repositories, MVPs and
  launch decisions. Five independent oracles try to break the project from
  capital, engineering, naive-user, product-design and distribution/funding
  perspectives. A Finalist then kills, keeps or splits ideas and compiles one
  evidence-backed plan for MVP, XYZ metrics, deployment and go-to-market.
user_invocable: true
triggers:
  - activa 5 oráculos
  - cinco oráculos
  - audita con 5 oráculos
  - five oracles
  - oracle audit
---

# Skill — 5 Oracles + Finalist

## Purpose

Use this skill when being wrong is expensive: product direction, repository
architecture, MVP scope, monetization, launch, funding, major refactors or
portfolio decisions.

The skill is intentionally adversarial. Its purpose is not to validate the
owner's enthusiasm. Its purpose is to produce a project that survives scrutiny.

The five oracles work independently first. Do not let them converge early.

Evidence priority:

1. executable behavior and measured external evidence;
2. tests / CI / deployment / source code;
3. dated experiments and telemetry;
4. repository documentation;
5. stated plans and claims;
6. conversational memory.

Never promote a lower evidence layer above a higher one.

## Operating modes

- REVIEW — existing repo/project. Default when a repository already exists.
- BUILD — new product/MVP.
- RELEASE — readiness for deploy/launch.
- GROWTH — monetization/distribution campaign.
- PR — review a concrete diff/PR.

## Context bootstrap

Before convening the council:

1. identify repo + exact HEAD/branch;
2. read the smallest durable truth set available;
3. inspect current CI/deploy status;
4. identify public/private document boundaries;
5. inspect any current product-validation or XYZ registry;
6. when the answer depends on current prices, grants, platform limits, law or
   product availability, verify them against current primary sources;
7. write one neutral problem statement for all oracles.

Do not spend tokens reconstructing history that Git can provide.

## Non-negotiable truth rules

- Tests are not customer demand.
- Demo quality is not product-market fit.
- Technical confidence is not statistical probability unless calibrated.
- A grant opportunity is not funding until eligibility and application status
  are verified.
- A public data source is not automatically commercially reusable.
- A free tier is not automatically permitted for commercial SaaS.
- Never invent TAM, conversion, accuracy, revenue, users, pilots or customers.
- Every number must be tagged MEASURED, SOURCED, ASSUMPTION or TARGET.
- If evidence is missing, say BLOCKED and define the cheapest experiment.
- Private pricing, fundraising, customer research and competitive strategy
  should not be committed to public repositories.

## Safety boundary for security/compliance products

For third-party systems without explicit authorization, stay within passive or
low-impact public-surface analysis: public pages, DNS/certificates, documented
headers, policies, consent UX, broken links and other ordinary public evidence.

Do not turn prospecting into intrusive vulnerability scanning, credential
testing, brute force, authentication bypass, exploitation, destructive testing
or access to non-public data.

Authorized environments may use deeper checks when scope and permission are
explicitly established.

# Round 1 — Five independent Oracles

Each oracle MUST:

- identify the strongest asset;
- identify the likely fatal flaw;
- identify 3 evidence-backed improvements;
- identify one thing to delete/defer;
- define one measurable gate;
- state what evidence would change its opinion;
- never hedge merely to agree with another oracle.

## Oracle 1 — Capital & Market

Question: **Who pays, why now, and what would make this investable?**

Audit:
- painful recurring job / buyer / user distinction;
- willingness-to-pay evidence;
- distribution path;
- substitute / baseline workflow;
- defensibility and switching costs;
- evidence behind market claims;
- monetization route: OSS, service, SaaS, bundle, API, licensing;
- stage-appropriate capital requirement;
- cash conversion and marginal infrastructure cost.

Required output:
- INVESTMENT STANCE: €0 NOW / CONDITIONAL / INVESTABLE;
- minimum evidence required to change stance;
- capital needed to reach the next proof milestone, not an arbitrary funding ask;
- first monetizable offer;
- unit-economics assumptions clearly marked as assumptions;
- one kill criterion.

The oracle may say “€0 external capital now” when adding money would only finance
unvalidated complexity.

## Oracle 2 — Principal Systems / FinOps / Security

Question: **Can this survive production without consuming the founder's money or leaking the product?**

Audit:
- system boundaries and data contracts;
- dependency and vendor risk;
- secrets and key management;
- auth / tenant isolation / rate limits;
- observability, rollback and backups;
- licensing and privacy boundaries;
- CI/CD and reproducibility;
- cost per customer/job/report;
- zero/low-cost infrastructure;
- exact paid trigger: when and why to upgrade;
- ability for customer revenue to finance marginal infrastructure.

Required output:
- FREE-FIRST stack;
- COST TRIGGERS;
- production blockers;
- security P0/P1 findings;
- simplest scalable architecture;
- one architecture element to delete.

Do not choose infrastructure for prestige.

## Oracle 3 — First-Time User / “Mother Test” QA

Question: **Can a normal person use this without knowing what CI, adapters, confidence priors or a PR are?**

Act as a first-time user with no project history.

Audit:
- first 30 seconds;
- what the product appears to do;
- one primary action;
- labels and jargon;
- navigation and settings discovery;
- empty/error/offline states;
- mobile and Chromebook use;
- destructive actions;
- accessibility;
- trust: can the user distinguish live / cached / synthetic / inferred?
- report readability for a non-engineer.

Output:
- “I expected… / I found…” failures;
- top 5 stupid-simple blockers;
- one golden path;
- the exact first screen / CTA;
- a “for a normal person” explanation in <=50 words.

This oracle has veto power over features nobody can discover or understand.

## Oracle 4 — Product / UX / Visual Systems

Question: **Does the interface make a complex product feel inevitable rather than complicated?**

Audit:
- information hierarchy;
- progressive disclosure;
- design system consistency;
- responsive behavior;
- perceived performance;
- motion/effects serving meaning;
- accessibility and keyboard/touch targets;
- next-gen visual identity without sacrificing comprehension;
- dashboard density;
- map/HUD semantics;
- whether “wow” UI is masking missing product value.

Output:
- KEEP / REDESIGN / REMOVE per major surface;
- target design language;
- component/system changes;
- performance budget;
- one wow interaction that demonstrates product value;
- one visual gimmick to kill.

## Oracle 5 — Distribution / Funding / Growth

Question: **How does this move from GitHub to users, revenue, collaborators or grant reviewers?**

First classify the product:
- OPEN SOURCE;
- PAID SaaS;
- SERVICE;
- API;
- BUNDLE;
- HYBRID.

Then design distribution for that classification.

Audit:
- launch surface;
- community fit;
- content/demo hooks;
- partnerships;
- outbound/pilot motion;
- proof assets;
- pricing experiment (kept private where required);
- public funding / accelerator fit;
- application readiness;
- current eligibility and deadlines when funding is mentioned.

Required output:
- 3 launch campaigns;
- one 7-day acquisition experiment;
- one open-source contributor loop if applicable;
- one grant/funding path if genuinely relevant;
- what NOT to market yet;
- metrics: impressions are never enough; define action/conversion evidence.

No fake scarcity, fear marketing, or unsubstantiated legal threats.

# Round 2 — Destruction pass

After all five independent analyses, anonymize them as A–E.

The Finalist must cross-examine them before synthesis:

1. Which proposal creates value fastest?
2. Which proposal hides the largest assumption?
3. Which proposal has the worst cost/risk ratio?
4. What do all five miss?
5. Which recommendation would still make sense if the budget were €0?
6. Which recommendation would still matter after a competitor copied the UI?
7. Which recommendation creates measurable external evidence?

Do not average scores. Resolve contradictions.

# Finalist — Decision Compiler

The Finalist is responsible for the final answer. It may reject recommendations
from all five oracles.

## Mandatory final structure

### 0 — For-normal-people summary
In plain language:
- what this is;
- who it is for;
- what currently works;
- what does NOT work yet;
- what to do next.

### 1 — Verdict
Exactly one:
- KEEP AND FOCUS;
- SPLIT;
- PIVOT;
- PAUSE;
- KILL.

Explain why in <=150 words.

### 2 — Product boundary
- parent/platform;
- product(s);
- explicit NON-GOALS.

### 3 — MVP
- one buyer;
- one job;
- one golden path;
- minimum surfaces;
- things deferred.

### 4 — Three XYZ proof statements
For every XYZ:
- X outcome;
- Y evidence/measurement;
- Z mechanism;
- status VERIFIED / SUPPORTED / EXPERIMENTAL / BLOCKED;
- cheapest experiment to advance status.

At least:
1. product truth;
2. user/business value;
3. commercial/distribution signal.

### 5 — Engineering + free-first stack
For each service:
- purpose;
- free allocation or starting cost from current primary source;
- paid trigger;
- lock-in risk;
- fallback.

### 6 — Economics
- current external-capital stance;
- cash needed for next milestone;
- marginal cost assumptions;
- first paid offer;
- what customer revenue should finance;
- kill/upgrade thresholds.

Never store sensitive pricing/fundraising strategy in a public repo.

### 7 — UX destruction report
- top 5 obvious user failures;
- golden-path redesign;
- mobile/Chromebook requirements;
- accessibility issue(s);
- one wow feature that earns its complexity.

### 8 — Security/privacy/licensing
P0 / P1 / P2 only.
No theatre.

### 9 — Distribution
Three campaign cards:
- audience;
- hook;
- asset;
- CTA;
- channel;
- measurable conversion;
- stop condition.

### 10 — Funding
Only sourced/current opportunities.
For each:
- fit;
- eligibility blocker;
- maturity required;
- next action;
- do-not-apply-yet reason when applicable.

### 11 — 7-day board
Maximum 7 items.
Each item must create product evidence, revenue evidence, reliability or safety.
No GitHub decoration tasks.

### 12 — Direct execution prompt
Compile one standalone prompt for the next coding/engineering agent.
It must include:
- repo/ref;
- objective;
- constraints;
- exact files or boundaries;
- acceptance tests;
- deployment verification;
- no unrelated changes.

### 13 — Deployment gate
State exactly:
- what merges;
- where it deploys;
- verification URL/workflow;
- rollback condition.

## Final scoring

Scores are diagnostic, not marketing:
- Product Truth /10
- User Value /10
- Engineering /10
- UX /10
- Security & Privacy /10
- Economics /10
- Distribution /10
- Funding Readiness /10

A public project should not be called “master”, “enterprise-ready”, “investor
ready” or similar solely from these scores.

## Invocation examples

- “Activa 5 Oráculos y audita este repo.”
- “5 Oráculos: decide si esto debe ser SaaS, OSS o servicio.”
- “5 Oráculos sobre PR #18; dime si lo desplegamos.”
- “5 Oráculos: destruye este MVP y dame la versión que sí venderías.”
