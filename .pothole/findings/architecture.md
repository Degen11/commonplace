# Findings: architecture

Detector: detect-architecture. Coverage: madge ran (JS/TS) and reported 0 cycles, so cycle detection is tool-backed and clean; no load-bearing cycle to argue. Drift checked against the CLAUDE.md declarations and layering rules recorded in the survey (supabase server-only, api imports, apiRequest, copyWithToast, storage helpers, lazy localQuotes/compromise, manual memoization, withApiHandler, QuotesContext value-less, normalize twins, lower-layer back-imports): only the two drift items below survived; useSync useCallback and TableView/CardItem memo carry stated compiler/effect-deps justifications and were not reported. Zombie-path and god-module coverage is AI-only: styles.js, config.js, constants.js, helpers.js are libraries (no feature back-imports), so no god module. Out of category: api/og.js and api/share-page.js validate the id with SHARE_ID_RE instead of a Zod schema from _schemas.js (api); ResultsPhase.jsx size and CardItem/TableView co-change are code god-file/twin territory. [coverage=full]

## PH-749 Batch re-identify is a second live AI-batching flow that never received the pipeline's retry-and-failure-accounting fix

```yaml
id: PH-749
category: architecture
title: Batch re-identify is a second live AI-batching flow that never received
  the pipeline's retry-and-failure-accounting fix
severity: major
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - src/hooks/useQuoteActions.js:152
  - src/hooks/useQuoteActions.js:212
  - src/hooks/useQuoteActions.js:219
  - src/hooks/useProcessing.js:260
  - e12a8f5
  - 4ba7b70
source:
  - detect-architecture
repair_cost: L
fingerprint: architecture:src/hooks:zombie-batch-identify-flow
```

useProcessing.handleApiBatch and useQuoteActions.batchReIdentify both chunk quotes by API_BATCH_SIZE and call the same identifyBatch (injected via App.jsx), and both are reachable (batch re-identify from BulkBar via ResultsPhase.jsx:883). Commit e12a8f5 added retry-once and per-batch failure accounting to the processing pipeline only; batchReIdentify (from 4ba7b70, older) still swallows a failed batch with a bare comment and then toasts success for every selected quote, so a transient API failure silently leaves quotes unchanged while reporting them re-identified. Every future batching fix (retries, error surfacing, cap handling) has to be made twice or diverges further. L by the mandatory clause: useQuoteActions.js is a brief hotspot and bus-factor-1, and useQuoteActions.test.js has no coverage of batchReIdentify, so a shared batch runner needs a test net first.

## PH-750 ExportDropdown share-link copies bypass the declared copyWithToast clipboard path

```yaml
id: PH-750
category: architecture
title: ExportDropdown share-link copies bypass the declared copyWithToast
  clipboard path
severity: minor
traffic: 0.19453210748037558
confidence: ai-suspected
evidence:
  - src/components/ExportDropdown.jsx:74
  - src/components/ExportDropdown.jsx:95
  - src/utils/shareLinks.js:55
  - b9afc5b
source:
  - detect-architecture
repair_cost: S
fingerprint: architecture:src/components:clipboard-bypasses-copywithtoast
```

CLAUDE.md declares that every clipboard copy goes through copyWithToast (utils/shareLinks.js); commit b9afc5b routed copies through it, yet both share-link handlers in ExportDropdown still call navigator.clipboard.writeText directly with their own hand-rolled success/error toasts. The other two copy actions in the same menu do use copyWithToast, so a change to copy feedback (message, COPY_PULSE_MS behaviour, error wording) has to be found and repeated in these two places too.

## PH-751 api/og.js imports client category constants, an api-to-src edge outside the declared layering

```yaml
id: PH-751
category: architecture
title: api/og.js imports client category constants, an api-to-src edge outside
  the declared layering
severity: minor
traffic: 0.0885421617927656
confidence: ai-suspected
evidence:
  - api/og.js:8
  - src/data/constants.js:1
source:
  - detect-architecture
repair_cost: S
fingerprint: architecture:api:api-imports-client-constants
```

The survey records that api/* endpoints may import only api/_*.js private modules plus the shared logo geometry (logoPaths.js / the traced wordmark). og.js also imports CAT_COLORS from src/data/constants.js, so the serverless bundle now depends on a client data module that changes for UI reasons (category pill colours, z-index scale, URL-import modes); a client-only edit to constants.js silently changes and redeploys the OG card renderer. Either declare the edge or move the shared palette to a module both sides own.
