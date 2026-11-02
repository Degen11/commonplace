# Findings: security

Detector: detect-security. Coverage: authz/abuse trace over all 9 api/ entry points (identify, auto-group, sync GET/POST, share GET/POST, share-page, og, lookup, fetch-url) through withApiHandler in api/_shared.js; Supabase RLS and function grants in supabase/migration.sql; client XSS sinks and CSP in vercel.json. gitleaks ran (0) so secret coverage is tool-backed; semgrep failed (registry blocked), so known-insecure-pattern coverage is AI-only, hence partial. No user accounts exist by design (device UUID is the credential), so there is no UI-only permission check to find. Did not restate the eslint-sonar hotspots (slow-regex, no-hardcoded-ip in fetch-url, pseudo-random and code-eval in tests); none of them looked reachable enough to raise. Saw and left to api: identify returns the raw Anthropic envelope while other endpoints return shaped JSON. [coverage=partial]

## PH-549 Client-controlled prompt fields let any caller plant permanent high-confidence attributions in the shared quote cache

```yaml
id: PH-549
category: security
title: Client-controlled prompt fields let any caller plant permanent
  high-confidence attributions in the shared quote cache
severity: major
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - api/identify.js:67
  - api/identify.js:93
  - api/identify.js:117
  - api/_schemas.js:17
  - api/lookup.js:185
  - src/hooks/useProcessing.js:169
source:
  - detect-security
repair_cost: M
fingerprint: security:api/identify.js:identify-cache-poisoning-via-prompt
partial: true
```

The db4af86 hardening removed /api/cache so that browsers could no longer plant attributions for every user, and the comment at identify.js:89 still claims that guarantee. But buildPrompt interpolates the client-supplied text, hint and candidate.source/category verbatim into the user turn, each up to 10k chars and with newlines allowed. A caller can embed instructions or fake numbered items, or supply a forged 'unverified match found online' candidate, to steer the model to a chosen source at confidence high. cacheResults then upserts that answer keyed by the normalized text. Once a row is high it is locked against all later corrections (identify.js:117 skips high rows). /api/lookup serves it to every user as platform cache, and useProcessing trusts high lookup results outright with no AI step. Net effect: anyone can permanently mis-attribute any quote that is not in the bundled local DB, for all users. The fix is to cache only when the prompt carried no client hint or candidate (or only at medium confidence), and to give high rows a provenance or review path.

## PH-550 fetch-url SSRF guard has a check-then-fetch DNS rebinding window and returns the response body

```yaml
id: PH-550
category: security
title: fetch-url SSRF guard has a check-then-fetch DNS rebinding window and
  returns the response body
severity: minor
traffic: 0.06340544648552357
confidence: ai-suspected
evidence:
  - api/fetch-url.js:33
  - api/fetch-url.js:77
  - api/fetch-url.js:82
  - api/fetch-url.js:149
source:
  - detect-security
repair_cost: M
fingerprint: security:api/fetch-url.js:fetch-url-dns-rebinding-window
partial: true
```

checkHost resolves the hostname and rejects private addresses, then fetch() resolves the name again on its own (the comment at line 33 acknowledges this). A low-TTL attacker domain can answer public on the first lookup and loopback or internal on the second. This is a full-read SSRF because the extracted text is returned to the caller, so anything on the function host loopback that serves text or JSON could be read. It is bounded by the 15/min rate limit and needs rebinding timing, so it is minor. The fix is to pin the connection to the checked address with a custom undici dispatcher/lookup that rejects private results at connect time.

## PH-551 migration.sql cannot be re-applied to an existing database, so later appended security statements only land by hand

```yaml
id: PH-551
category: security
title: migration.sql cannot be re-applied to an existing database, so later
  appended security statements only land by hand
severity: minor
traffic: 0.07038251338668261
confidence: ai-suspected
evidence:
  - supabase/migration.sql:35
  - supabase/migration.sql:96
  - supabase/migration.sql:117
  - api/sync.js:51
  - api/sync.js:104
source:
  - detect-security
repair_cost: S
fingerprint: security:supabase/migration.sql:migration-not-replayable
partial: true
```

The single schema file grows by appending statements (the collections column is marked 'added after the table was first created'), and every statement is idempotent except CREATE TRIGGER device_data_updated_at, which has no OR REPLACE or DROP IF EXISTS guard. Re-running the file in the Supabase SQL editor against the live DB aborts at line 35. Because that is a single implicit transaction, the appended RLS enablement on rate_limits and the DROP of the public SELECT policy on shared_collections are rolled back with it. They can only be applied by hand-picking statements. No CI job builds the schema from empty. api/sync.js still carries try-then-retry fallbacks for a missing collections column, compensation for exactly this kind of drift. The fix is CREATE OR REPLACE TRIGGER (or a migration tool with ordered files) plus a CI step that applies the schema to an empty Postgres.

## PH-552 Global AI daily cap can be exhausted by a single IP, turning the spend guard into a site-wide outage

```yaml
id: PH-552
category: security
title: Global AI daily cap can be exhausted by a single IP, turning the spend
  guard into a site-wide outage
severity: minor
traffic: 0.12881854052041353
confidence: ai-suspected
evidence:
  - api/_shared.js:166
  - api/_shared.js:180
  - api/_shared.js:188
  - api/identify.js:135
  - api/auto-group.js:35
source:
  - detect-security
repair_cost: M
fingerprint: security:api/_shared.js:ai-daily-cap-single-client-exhaustion
partial: true
```

identify (30/min/IP) and auto-group (15/min/IP) draw from one global 2000/day bucket. One IP sending valid minimal requests to both reaches 2000 in under an hour. After that every user gets the 'at capacity for today' error for the rest of the 24h window. There is no per-IP or per-device daily sub-quota, so the control that bounds Anthropic spend also hands any single client a cheap denial of service for the core feature. The fix is a per-IP daily allowance well below the global cap, checked before the global bucket.

## PH-553 Legacy identify messages path forwards an arbitrary client prompt to Anthropic with no removal criterion

```yaml
id: PH-553
category: security
title: Legacy identify messages path forwards an arbitrary client prompt to
  Anthropic with no removal criterion
severity: minor
traffic: 0.12881854052041353
confidence: ai-suspected
evidence:
  - api/_schemas.js:29
  - api/identify.js:129
  - api/identify.js:164
source:
  - detect-security
repair_cost: S
fingerprint: security:api/identify.js:identify-legacy-raw-prompt-path
partial: true
```

Kept for clients on a cached older build, the messages shape passes a client-authored 10k-char user turn straight to the model under the app key and returns the raw Anthropic response. This is a general-purpose LLM proxy whose only constraints are the system prompt and the '[' prefill. Its results are not cached, but it consumes the shared AI budget and ignores the structured-items contract the hardening introduced. Nothing records when the service-worker turnover makes it safe to delete. The fix is to remove it, or give it a dated sunset, once the precache revision has rolled over.
