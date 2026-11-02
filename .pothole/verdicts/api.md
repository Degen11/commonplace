# Verdicts: api

Inspector: inspect-api. Coverage: every finding judged; all evidence refs opened and resolved. This slice is entirely AI-only: no OpenAPI, spectral or contract tool is wired. No authorization issues on these handlers were judged; that belongs to security.

## PH-1149 confirmed

```yaml
id: PH-1149
verdict: confirmed
reason: "All refs resolve: identify.js:164 returns the raw Anthropic body while
  auto-group.js:56 returns {indices} and lookup.js:214 {results}; identify.js:79
  parseResults already parses the array server-side, and
  useProcessing.js:134-140 re-implements the same fence-strip and '[' repair.
  useProcessing.js:132 reads d.error.message, which no server path emits
  (non-2xx is thrown at :130 as 'API returned <status>', dropping the server's
  {error} text), whereas autoGroup at :516 reads err.error. Effect checked in
  utils/apiErrors.js: the daily-cap 429 is rendered as the generic 'Rate
  limited, wait a moment' message. Not the single-caller trap: the repo itself
  keeps a legacy identify request shape for cached PWA builds, so client and
  server do not ship in lockstep. Not documented as intentional; reachable on
  every AI batch. Major holds: hooks hotspot plus a shipped misleading error."
fingerprint: api:api/identify.js:identify-raw-anthropic-envelope
```

## PH-1150 confirmed

```yaml
id: PH-1150
verdict: confirmed
reason: "_schemas.js:29-38 keeps the legacy messages[] shape beside items[], and
  identify.js:129/162 branch on it (legacy results uncached). The only stated
  exit is the schema comment 'until their service worker updates', with no date
  or removal criterion, and unlike the ?device_id= fallback it is declared in
  neither CLAUDE.md nor the survey's migrations. Worse than filed: the current
  build still sends the legacy field itself, since the InputPhase.jsx:131-134
  pre-warm posts {messages: []}, so the old shape can never age out on its own.
  Checked the trap (no declared v1/v2 exit), documented (comment gives intent
  but no exit) and reachable (yes)."
fingerprint: api:api/_schemas.js:identify-legacy-messages-shape
```

## PH-1151 refuted

```yaml
id: PH-1151
verdict: refuted
reason: "documented: the header exists only to keep the device credential out of
  URL logs (sync.js:37-39 comment, useSync.js:34-35, CLAUDE.md 'Sync device ID
  goes in the X-Device-Id header, not the URL', commit db4af86). A POST body is
  not part of the URL, so the GET/POST transport difference is the stated design
  applied correctly, not an accidental split. Also, by the category boundary,
  this is a difference between two methods of one endpoint (/api/sync), not a
  disagreement between endpoints. The device_id spelling matches the legacy GET
  query param and the DB column. A new consumer of this one-team, internal
  endpoint learns nothing the schema does not already state."
fingerprint: api:api/sync.js:sync-device-id-split-transport
```
