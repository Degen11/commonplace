# Verdicts: security

Inspector: inspect-security. Coverage: every finding judged; all evidence refs opened (lookup.js:185 and useProcessing.js:169 resolve to the adjacent cache-hit return and the Phase-2 trust comment, within a line or two). Supabase SQL-editor transaction behaviour taken from Postgres multi-statement semantics; live DB state not inspected.

## PH-549 confirmed

```yaml
id: PH-549
verdict: confirmed
reason: Survived evidence/trap/documented/unreachable. identify.js:67-73
  interpolates client text/hint/candidate verbatim into the prompt; cacheResults
  (identify.js:93-119) upserts model output keyed by normalized item text and
  skips rows already high (line 116-117), so a poisoned high row is never
  corrected; lookup.js:184-186 serves any cache hit before Wikiquote and its own
  writeCache only runs on a miss; useProcessing.js:169-189 trusts high lookup
  results with no AI step. The identify.js:89-92 comment claims clients cannot
  plant attributions, which this contradicts. Integrity exposure to all users,
  so major holds under the exposure carve-out.
fingerprint: security:api/identify.js:identify-cache-poisoning-via-prompt
```

## PH-550 confirmed

```yaml
id: PH-550
verdict: confirmed
reason: "Evidence resolves: checkHost resolves via dns lookup (fetch-url.js:45)
  and fetch() re-resolves independently (line 82), per hop (line 77); body text
  is returned to caller (line 149). documented route does not refute: the
  comment at fetch-url.js:33-34 acknowledges the window as a known open gap, it
  does not argue it costs nothing. Minor is appropriate given rate limit and
  rebinding timing."
fingerprint: security:api/fetch-url.js:fetch-url-dns-rebinding-window
```

## PH-551 confirmed

```yaml
id: PH-551
verdict: confirmed
reason: "Evidence resolves: every statement in supabase/migration.sql is guarded
  (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS) except CREATE TRIGGER at line
  35, so a re-run against an existing DB errors and the multi-statement run
  rolls back the appended RLS enable (line 101) and policy drop (line 118). No
  CI job touches the schema (.github/workflows/ci.yml has no supabase/postgres
  step), no documented reset path, and api/sync.js:51 and :103 keep
  collections-column fallbacks for exactly this drift. Fresh-from-empty replay
  works, so this is the re-apply variant of Case 4, not a squashed-baseline
  trap."
fingerprint: security:supabase/migration.sql:migration-not-replayable
```

## PH-552 confirmed

```yaml
id: PH-552
verdict: confirmed
reason: "Evidence resolves: one global 'global:ai-daily' bucket
  (_shared.js:187-189, default 2000 at :180) shared by identify
  (identify.js:135) and auto-group (auto-group.js:35) with only per-minute
  per-IP limits (identify 30, auto-group 15 at _shared.js:166-170); 45/min from
  one IP exhausts 2000 in about 45 minutes and then every user gets
  AI_DAILY_LIMIT. The _shared.js:176-179 comment and CLAUDE.md document the cap
  as a spend bound but say nothing about single-client exhaustion, so documented
  does not refute the cost."
fingerprint: security:api/_shared.js:ai-daily-cap-single-client-exhaustion
```

## PH-553 refuted

```yaml
id: PH-553
verdict: refuted
reason: "miscategorized (with evidence): the security claim, an arbitrary client
  prompt forwarded under the app key with the raw Anthropic envelope returned,
  holds just as much for the current items path. buildPrompt (identify.js:67-73)
  puts any 10k-char item text in verbatim, and line 164 returns the raw data for
  both shapes, so removing the legacy path closes no exposure. What remains is a
  legacy request shape kept for cached clients with no sunset or exit criterion.
  That is swerve/knowledge debt (a migration in flight with no removal
  criterion), not security."
fingerprint: security:api/identify.js:identify-legacy-raw-prompt-path
```
