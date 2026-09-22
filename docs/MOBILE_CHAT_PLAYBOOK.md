# Mobile Chat Development Playbook

This project can be maintained from a normal ChatGPT conversation with the
connected GitHub account. The workflow deliberately does not depend on Work,
Codex, a long-running agent session, or a large local context window.

## Core rule

**Git is the memory. The chat is the operator.**

Each request should be one bounded change with an observable acceptance check.
Do not ask a mobile chat model to "work for hours"; ask it to inspect the current
repository state, make one coherent change on a branch, verify it, and leave a
pull request.

## Recommended mobile loop

### 1. Inspect

Send:

> Inspect `abrahamhl/eye-of-argus` at current HEAD, the latest CI runs and
> `.autonomy/STATE.md`. Do not change anything. Tell me the highest-value
> unblocked investor-MVP task and the evidence for that choice.

### 2. Implement one task

Send:

> Implement that task on a new `chat/<short-name>` branch. Keep claims
> evidence-backed, add or update tests where behaviour changes, do not rewrite
> history, and open a draft PR. Do not touch unrelated files.

### 3. Audit the PR

Send:

> Audit the PR against the base branch. Check claim drift, regression risk,
> privacy/licensing, tests and whether it actually advances
> `docs/INVESTOR_MVP_SPEC.md`. Do not merge.

### 4. Repair failures

Send:

> Read the failed CI jobs for this PR and fix only the root cause on the same
> branch. Re-check the diff for accidental scope expansion.

### 5. Merge only on explicit instruction

Send:

> If CI is green and the PR has no unresolved P0/P1 findings, merge it. Otherwise
> leave it open and tell me exactly what remains.

## Small-model discipline

For a fast/free model, reduce reasoning burden by keeping repository truth in:
- `.autonomy/STATE.md`;
- `src/argus/product/truthSnapshot.js`;
- `src/argus/product/xyz.js`;
- `docs/INVESTOR_MVP_SPEC.md`;
- Git commits and PRs;
- CI results.

A fresh chat should re-read those sources instead of relying on conversational
memory.

## Task sizing

Good mobile-chat task:
- one bug;
- one adapter;
- one metric;
- one experiment;
- one documentation truth fix;
- one CI failure;
- one small UI workflow.

Bad task:
- "finish the whole product";
- "work overnight";
- "add every possible data source";
- simultaneous architecture + redesign + deployment + research.

Split large work into PR-sized slices.

## Deployment path

The public demo is deployed through GitHub Pages from repository workflows.
Normal release flow:

1. merge a green PR into `main`;
2. confirm the CI workflow succeeds;
3. confirm the Pages workflow succeeds;
4. open the published simulator;
5. check that the generated investor XYZ view matches the merged registry.

If Pages fails, inspect the workflow run before changing application code.

## What the phone is enough for

From chat + GitHub connection you can:
- inspect files/commits/PRs;
- create branches;
- edit source/docs;
- open PRs;
- inspect CI;
- iterate fixes;
- merge when explicitly requested.

Local hardware is still useful for physical field collection and any test that
requires a real browser/device/sensor, but it is not required for ordinary
repository maintenance.


## Five Oracles audit

For high-stakes product/release decisions, send:

> Activa 5 Oráculos y audita `abrahamhl/eye-of-argus` at current HEAD. Read
> `skills/five-oracles/SKILL.md` first and follow it. Separate public evidence
> from private commercial strategy. Do not merge or deploy until the Finalist
> gives the deployment gate.

The trigger is shorthand. The repository skill, not conversational memory, is
the durable definition.
