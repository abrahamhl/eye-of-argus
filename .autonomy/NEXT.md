# NEXT — atomic, unblocked stories

Execute top-down. Each story: implement → test → commit → update STATE.

## S30 — Adversarial review of the core
- Independent reviewer inspects `src/argus/**` and `test/**`.
- Challenge the tests themselves: do they assert real behaviour or tautologies?
- Record findings in `.autonomy/ERRORS.md`; open follow-ups as new stories.
- Status: IN PROGRESS (see ERRORS.md additions).

## S03 — Reproduce CalmPath donor check/build (forensics)
- Command: `cd C:\dev\recruiter-evidence\calmpath-maps-pro; corepack prepare pnpm@10.4.1 --activate; pnpm install --frozen-lockfile; pnpm check; pnpm build`
- Deliverable: `docs/DONOR_NOTES.md` — reusable concepts vs intentionally excluded components (no React import).
- No secrets required.

## S19 — Confidence UI
- Blocked until a UI-integration story is scoped against upstream's globe.

## S24 — Real offline/cache store
- Persist last-known observations + registry to a local store; keep freshness states.
- Must never surface cached data as live. Tests must cover the offline path.

## S12/S13 — Live adapters (NDW, OVapi)
- Replace synthetic fixtures with server-side fetchers behind the existing manifest/observation contract.
- Requires server key-broker pattern from upstream; no keys committed.
- Smoke tests stay separate from deterministic CI.

## Continuation protocol
1. Read STATE.md; `git status`; read PRD.json.
2. Pick the highest-priority unblocked story above.
3. Implement, test with `node --test test/*.test.mjs`, commit atomically.
4. Update STATE.md + PRD.json + NEXT.md. Continue.
