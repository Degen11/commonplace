# Verdicts: code

Inspector: inspect-code. Coverage: every finding judged; all evidence refs opened, PH-249 verified by executing the module normalizer against every data key.

## PH-249 confirmed

```yaml
id: PH-249
verdict: confirmed
reason: "All refutation routes failed: ran every LOCAL_DB entry through the
  module's own normalizeForLookup (localQuotes.js:3821) and exactly 25 keys
  change (23 Russian with ё/й, \"not penny’s boat\", \"spider-man\"); all 25
  MISS localLookup with exactOnly (the mode reIdentify/batchReIdentify use,
  useQuoteActions.js:111,180) and 11 also miss every fuzzy fallback.
  LOCAL_MAP/WORD_INDEX are built from raw entry.t (3806-3818). Survey excludes
  data rows but this is the index-building code. Note: 2815619 (15:00) predates
  9b55e90 (15:12) on 2026-02-23, so the Russian rows were added after the
  normalizer switch, not before; the defect is unaffected."
fingerprint: code:src/data:local-map-keys-not-normalized
```

## PH-250 confirmed

```yaml
id: PH-250
verdict: confirmed
reason: "Three identical bodies verified: textFormatting.js:142 normalize,
  api/_shared.js:207 normalizeForCache, localQuotes.js:3821 normalizeForLookup.
  History holds: client went Unicode in e985fb1 (2026-02-23); a696b35
  (2026-03-15) is where _shared.js dropped the ASCII [^\\w\\s] strip. The sync
  comment and CLAUDE.md name only two copies, so documented intent does not
  cover the third, and a documented sync rule does not refute the cost claim. No
  trap matches; all copies are live."
fingerprint: code:src/utils:normalize-triplicated
```

## PH-251 confirmed

```yaml
id: PH-251
verdict: confirmed
reason: useQuoteActions.js:212 catch swallows every non-abort batch error
  ('Continue with remaining batches') and line 219 shows an unconditional
  success toast 'Re-identified N quotes', even when every call failed. No retry
  and no failed-count reporting, unlike useProcessing.js:260-282 (retry once,
  API_ERROR with affected count) and :321 FAILED_ENTRIES. Single reIdentify
  (line 128) does nothing visible on an empty result array. Not documented as
  intentional, reachable from BulkBar Re-identify.
fingerprint: code:src/hooks:reidentify-batch-loop-diverged
```

## PH-252 confirmed

```yaml
id: PH-252
verdict: confirmed
reason: "MiniHeader.jsx:59 renders '+ Add' unconditionally, including on mobile,
  while ResultsPhase.jsx:1169 shows the mobile FAB whenever !showBulkBar &&
  !showAddMore, and MiniHeader renders whenever !headerVisible
  (ResultsPhase:779), so both appear together after scrolling. HeaderBar (lines
  67-68 of the cited area, about 85) has a mobile Layout/ViewMenuItems section
  that MiniHeader's mobile overflow (65-71) lacks, and the desktop ViewToggle is
  hidden on mobile. b3c39ea did not touch MiniHeader.jsx: its last commit is
  5147078, from before b3c39ea."
fingerprint: code:src/components:miniheader-mobile-diverged
```

## PH-253 confirmed

```yaml
id: PH-253
verdict: confirmed
reason: useEditState.js:84 saveEdit only guards blank text and writes source as
  given, untrimmed and possibly empty, with confidence 'high'. saveInlineField
  (:106) has the blank-source no-op that b3c39ea's message describes.
  EditForm.jsx:169 passes source straight to onSave, wired to saveEdit in
  TableView:154 and CardItem:107/110. isUnknownSource treats '' as unknown, so
  the quote reads as unknown but is high-confidence. Real, minor.
fingerprint: code:src/hooks:blank-source-guard-inline-only
```

## PH-254 confirmed

```yaml
id: PH-254
verdict: confirmed
reason: useProcessing.js:130 throws only 'API returned <status>' with no body
  read and no .status. apiErrors.js:9 maps any 429 to 'Wait a moment and try
  again'. api/identify.js:134-136 returns the 429 AI_DAILY_LIMIT 'try again
  tomorrow' message, which is lost. The handleApiBatch retry
  (useProcessing.js:260ff) re-calls on that 429. apiRequest (api.js:72) and
  autoGroup (:516) do read the body. Divergence verified, no documented reason.
fingerprint: code:src/hooks:identify-batch-drops-server-error
```

## PH-255 confirmed

```yaml
id: PH-255
verdict: confirmed
reason: "Facts verified: 1,022 lines; 215 commits in the window, the most of any
  file per the survey; 4 unrelated export groups (palette at :3, baseCSS at :31
  to about :685, syncPillStyles, styles at :716, cardStyles at :1015); survey
  names it the change-coupling hub. Not generated, vendored or a barrel, so no
  trap. The CLAUDE.md single-file convention is documented intent but refutes
  only 'accidental', not the cost claim. Caveat for the gate: about 69% of
  commits are Claude sessions plus one human, so the cost is mainly two-file
  edits per UI change and parallel-session conflicts, not a large team
  serialising."
fingerprint: code:src/components:styles-js-god-file
```
