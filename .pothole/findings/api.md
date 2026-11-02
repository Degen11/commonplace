# Findings: api

Detector: detect-api. Coverage: all 9 Vercel endpoints in api/ tabulated (identify, auto-group, lookup, fetch-url, sync GET/POST, share GET/POST, og, share-page) for envelope, error shape, pagination and field naming, plus every in-repo consumer (useProcessing, useSync, QuotesContext, ExportDropdown, AddMorePanel, UrlImportPanel, InputPhase pre-warm). Error bodies are uniform {error: string} via withApiHandler and handlers; no list endpoint paginates (all bounded by schema max). Declared migrations (#p= to /c/, ?device_id= to X-Device-Id on sync GET) were not reported. Dropped as too thin: share GET validates id with a loose Zod schema while og.js and share-page.js use SHARE_ID_RE, and og.js collapses expired to 404 where share.js and share-page.js return 410 (no consumer impact found). No tool covers api debt in this phase (no OpenAPI or spectral linting is wired), so this slice is entirely AI-only. [coverage=full]

## PH-1149 /api/identify proxies the raw Anthropic message envelope while every other endpoint returns its own shape, and its consumer parses model text and an Anthropic error object the server never sends

```yaml
id: PH-1149
category: api
title: /api/identify proxies the raw Anthropic message envelope while every
  other endpoint returns its own shape, and its consumer parses model text and
  an Anthropic error object the server never sends
severity: major
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - api/identify.js:164
  - api/identify.js:79
  - api/auto-group.js:56
  - api/lookup.js:214
  - src/hooks/useProcessing.js:130
  - src/hooks/useProcessing.js:132
  - src/hooks/useProcessing.js:516
source:
  - detect-api
repair_cost: M
fingerprint: api:api/identify.js:identify-raw-anthropic-envelope
```

auto-group returns {indices} and lookup returns {results}, but identify returns Anthropic's response body as-is ({content:[{text}]}). The server already parses that text into results (parseResults, used for caching) but throws the parsed array away, so useProcessing.identifyBatch re-implements the same fence-stripping and '[' prefill repair on the client. It also special-cases the error shape: it reads d.error.message, Anthropic's nested error form, which the server never emits (its errors are {error: string}), and on a non-2xx it throws 'API returned <status>' and drops the server's message. autoGroup in the same file reads err.error correctly at line 516. As a result the daily-cap and overload messages never reach the user from identify. Fix: return {results} from the already-parsed array, keep the raw envelope only for old cached builds, and route the consumer through one error reader. useProcessing.js is a hotspot and is bus-factor-1, but useProcessing tests exist, so M rather than L.

## PH-1150 /api/identify accepts two request shapes (items and legacy messages) with no exit condition for the legacy one

```yaml
id: PH-1150
category: api
title: /api/identify accepts two request shapes (items and legacy messages) with
  no exit condition for the legacy one
severity: minor
traffic: 0.12881854052041353
confidence: ai-suspected
evidence:
  - api/_schemas.js:29
  - api/_schemas.js:38
  - api/identify.js:129
  - api/identify.js:162
  - db4af86
source:
  - detect-api
repair_cost: S
fingerprint: api:api/_schemas.js:identify-legacy-messages-shape
```

Commit db4af86 moved prompt building to the server (items[]) but kept the old messages[] shape for clients on a cached older build. Results from that shape are never cached. Unlike the two migrations the survey declares, this one names no exit condition, so a client-built prompt path stays live on a paid AI endpoint indefinitely. Removing it means picking a date after which a service-worker cycle has surely passed and deleting the branch.

## PH-1151 /api/sync identifies the device by an X-Device-Id header on GET but by a snake_case device_id body field on POST, inside an otherwise camelCase body

```yaml
id: PH-1151
category: api
title: /api/sync identifies the device by an X-Device-Id header on GET but by a
  snake_case device_id body field on POST, inside an otherwise camelCase body
severity: minor
traffic: 0.1728413322246163
confidence: ai-suspected
evidence:
  - api/sync.js:40
  - api/_schemas.js:75
  - api/_schemas.js:77
  - src/hooks/useSync.js:37
  - src/hooks/useSync.js:45
source:
  - detect-api
repair_cost: M
fingerprint: api:api/sync.js:sync-device-id-split-transport
```

db4af86 moved the device credential into a header for GET to keep it out of URL logs, but POST still carries it as device_id in the JSON body, next to camelCase customCategories and deletedIds and a camelCase response. A new consumer has to know that the same credential travels two different ways, under two spellings, depending on the method. The fix is to accept the header on POST too, with a body fallback kept for cached builds, so it is a few files rather than one.
