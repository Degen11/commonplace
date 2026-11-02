# Findings: code

Detector: detect-code. Coverage: full sweep of src/, api/, scripts/, public/boot.js for diverged twins (copy-admission grep, keep-in-sync comments, cross-file comparison of pipeline/header/edit/save paths with git -L / -S history) and fossilized markers (zero TODO/FIXME/HACK/XXX in production code; provisional/legacy comments all young or tied to declared migrations). No feature flags exist (no boolean config toggles, no env flags beyond secrets/AI_DAILY_LIMIT), so no flag-gated dead paths. Tool gaps: sonar not configured, semgrep failed, repowise-health truncated at 60/136, so complexity is eslint-sonarjs plus partial repowise only. Deliberately not restated: the jscpd internal reIdentify/batchReIdentify block in useQuoteActions.js, every cognitive-complexity/bumpy-road/large-method finding on ResultsPhase, TableView, CardItem, useProcessing, QuotesContext; ResultsPhase god-component shape is covered by those and acknowledged in CLAUDE.md. Out of category: (swerve/security) api/_schemas.js:29 keeps a legacy free-text messages shape for /api/identify, added 2026-09-27 (db4af86) with no exit criterion and not listed among the survey migrations; (signage) CLAUDE.md declares only two normalize copies that must stay in sync, a third exists in localQuotes.js. Test files were not reviewed for debt (test owns them). [coverage=full]

## PH-249 Local quote DB indexes 25 entries by un-normalized text, so their exact lookup can never match

```yaml
id: PH-249
category: code
title: Local quote DB indexes 25 entries by un-normalized text, so their exact
  lookup can never match
severity: major
traffic: 0.08245855696719873
confidence: ai-suspected
evidence:
  - src/data/localQuotes.js:3806
  - src/data/localQuotes.js:3834
  - src/data/localQuotes.js:694
  - src/data/localQuotes.js:2240
  - src/data/localQuotes.js:3795
  - commit 9b55e90 Added Russian support
  - commit 2815619 Updated helpers
source:
  - detect-code
repair_cost: S
fingerprint: code:src/data:local-map-keys-not-normalized
kind: duplication
repair: Build LOCAL_MAP, ENTRY_WORDSETS and WORD_INDEX from
  normalizeForLookup(entry.t) instead of the raw entry.t, and add a test that
  every data key round-trips through the normalizer.
```

localLookup normalizes the input (NFKD, strip marks and punctuation) but LOCAL_MAP is keyed by the raw data string. Any key containing a character the normalizer rewrites is unreachable by exact match: 25 rows today, including 23 Russian-language rows, most added in 9b55e90 (every one has ё or й, since NFKD strips the diacritic), "not penny’s boat" (curly apostrophe) and "spider-man" (hyphen). Short ones fail every fuzzy fallback too (substring needs >15 chars, word overlap needs 4+ words), and re-identify uses exactOnly, so those quotes always fall through to the paid AI call. The data was authored against the old ASCII normalizer; when 2815619 switched the lookup to the Unicode one, nobody re-keyed the index. No tool can see this, because the data and the code each look correct on their own.

## PH-250 normalize() exists in three hand-synced copies; the server copy already lagged the client fix for three weeks

```yaml
id: PH-250
category: code
title: normalize() exists in three hand-synced copies; the server copy already
  lagged the client fix for three weeks
severity: minor
traffic: 0.0914958755602203
confidence: ai-suspected
evidence:
  - src/utils/textFormatting.js:142
  - api/_shared.js:207
  - src/data/localQuotes.js:3821
  - commit e985fb1 Helpers update
  - "commit a696b35 Refactor: extract shared hooks, consolidate patterns, break
    up ResultsPhase"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/utils:normalize-triplicated
kind: duplication
repair: Have localQuotes.js import normalize from utils/textFormatting.js, and
  move the shared body into one module that both src/ and api/ import, as
  logoPaths.js already is.
```

The client normalize got Unicode-aware on 2026-02-23 (e985fb1). The server normalizeForCache kept the ASCII [^\w\s] strip until 2026-03-15 (a696b35). For those three weeks every non-Latin quote normalized to an empty cache key on the server, so they all collided on one cache row. The localQuotes copy was patched separately in 2815619. The "must stay in sync" comment and CLAUDE.md name only two copies; the third is undeclared, so the next change will probably miss it.

## PH-251 Batch re-identify never got the pipeline's retry and failure reporting, and reports success when every batch fails

```yaml
id: PH-251
category: code
title: Batch re-identify never got the pipeline's retry and failure reporting,
  and reports success when every batch fails
severity: major
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - src/hooks/useQuoteActions.js:212
  - src/hooks/useQuoteActions.js:219
  - src/hooks/useQuoteActions.js:128
  - src/hooks/useProcessing.js:260
  - src/hooks/useProcessing.js:321
  - "commit e12a8f5 feat: pre-warm API, partial batch retry, and integration
    tests"
source:
  - detect-code
repair_cost: M
fingerprint: code:src/hooks:reidentify-batch-loop-diverged
kind: duplication
repair: Extract the batch-with-retry loop from useProcessing.handleApiBatch into
  a shared helper that returns {results, failed}, use it in batchReIdentify, and
  show an error toast for the failed count instead of the unconditional success
  toast.
```

useQuoteActions copies the identify batch loop instead of sharing it. When e12a8f5 taught useProcessing to retry each failed batch once and surface the failed entries with a count-specific error, the re-identify copy was not touched. batchReIdentify still swallows every non-abort error and then always shows "Re-identified N quotes" as a success toast, even if every API call failed. Single reIdentify also says nothing when the API returns an empty array. Users are told their quotes were re-checked when they were not.

## PH-252 MiniHeader missed the mobile header redesign: duplicate Add button and no layout menu on mobile

```yaml
id: PH-252
category: code
title: "MiniHeader missed the mobile header redesign: duplicate Add button and
  no layout menu on mobile"
severity: minor
traffic: 0.42808818545053934
confidence: ai-suspected
evidence:
  - src/components/MiniHeader.jsx:59
  - src/components/HeaderBar.jsx:67
  - src/components/HeaderBar.jsx:85
  - src/components/ResultsPhase.jsx:1169
  - "commit b3c39ea Facelift: landing input card, quote table rows, mobile cards"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/components:miniheader-mobile-diverged
kind: duplication
repair: Hide MiniHeader's "+ Add" button when isMobile and add the mobile Layout
  section (ViewMenuItems) to its overflow menu, ideally by having both headers
  render one shared overflow-menu component.
```

HeaderBar and MiniHeader change together (co-change 0.68) because they render the same toolbar. b3c39ea moved mobile Add into a floating button and removed it from HeaderBar, but did not touch MiniHeader. Once a mobile user scrolls past the header, MiniHeader's "+ Add" and the FAB are both on screen. MiniHeader's mobile overflow menu also never got the Layout items that HeaderBar has had since 905154e, so the view switch is gone whenever the sticky header is showing.

## PH-253 Blank-source guard was added to inline save only; the full editor still saves an empty source as high confidence

```yaml
id: PH-253
category: code
title: Blank-source guard was added to inline save only; the full editor still
  saves an empty source as high confidence
severity: minor
traffic: 0.1820996834885893
confidence: ai-suspected
evidence:
  - src/hooks/useEditState.js:84
  - src/hooks/useEditState.js:106
  - src/components/EditForm.jsx:169
  - "commit b3c39ea Facelift: landing input card, quote table rows, mobile cards"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/hooks:blank-source-guard-inline-only
kind: duplication
repair: Trim the source in saveEdit and keep the existing source (or skip the
  confidence bump) when it is blank, so both save paths share one rule.
```

b3c39ea fixed "saving a blank source from inline edit marks the quote high confidence" inside saveInlineField. The twin save path, saveEdit (used by EditForm, including the review-queue flow), still writes whatever source it gets, untrimmed and possibly empty, with confidence "high". The quote then shows as unknown but counts as verified.

## PH-254 identifyBatch discards the server error message, so the AI daily-cap notice shows as a generic 'wait a moment' rate limit

```yaml
id: PH-254
category: code
title: identifyBatch discards the server error message, so the AI daily-cap
  notice shows as a generic 'wait a moment' rate limit
severity: minor
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - src/hooks/useProcessing.js:130
  - src/hooks/useProcessing.js:516
  - src/utils/api.js:72
  - src/utils/apiErrors.js:9
  - api/identify.js:136
  - "commit db4af86 Security hardening: AI spend cap, per-endpoint rate limits,
    SSRF, cache poisoning, sync ID"
source:
  - detect-code
repair_cost: S
fingerprint: code:src/hooks:identify-batch-drops-server-error
kind: duplication
repair: In identifyBatch, read the JSON body on a non-OK response and throw its
  error message with .status attached, as apiRequest does, and let
  describeApiError prefer a server-supplied message.
```

identifyBatch hand-rolls the response handling that apiRequest and autoGroup both do, minus reading the error body. When db4af86 added the global AI daily cap (429 with "at capacity for today, try tomorrow"), the message reaches autoGroup and apiRequest callers but never the main identify path. There, describeApiError turns the bare 429 into "Rate limited, wait a moment and try again", and the batch-retry loop spends a second call on a cap that will not lift until tomorrow.

## PH-255 styles.js is a god file: every component's styles, the palette and global CSS in one 1,000-line module that changes with everything

```yaml
id: PH-255
category: code
title: "styles.js is a god file: every component's styles, the palette and
  global CSS in one 1,000-line module that changes with everything"
severity: major
traffic: 1
confidence: ai-suspected
evidence:
  - src/components/styles.js:3
  - src/components/styles.js:31
  - src/components/styles.js:716
  - src/components/styles.js:1015
source:
  - detect-code
repair_cost: L
fingerprint: code:src/components:styles-js-god-file
kind: terrible
repair: Keep tokens and baseCSS in styles.js, and move each component's style
  object next to its component (as inputPhaseStyles.js already does for the
  landing page), one component per PR.
```

styles.js has 215 commits in the 24-month window, the most of any file (traffic 1.00). It is the hub of the change-coupling table, pairing with InputPhase (41 co-changes), CardItem (30), ToolbarSection (26), QuoteActions (23), HeaderBar (23), plus DupeModal and BulkBar. It holds unrelated things: brand palette constants, a 650-line global CSS string, ~180 per-component style objects, and cardStyles. Any UI change touches it, so parallel UI work collides here. The single file is a declared convention in CLAUDE.md, and inputPhaseStyles.js shows the split has already been done once. No tool reports this file at all, because its complexity is near zero.
