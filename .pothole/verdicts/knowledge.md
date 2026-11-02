# Verdicts: knowledge

Inspector: inspect-knowledge. Coverage: every finding judged; all evidence refs opened and commits checked with git log.

## PH-949 confirmed

```yaml
id: PH-949
verdict: confirmed
reason: "All refs resolve: CLAUDE.md:291 forbids manual React.memo and :365
  claims manual memo was stripped, yet TableView.jsx:107/280 and CardItem.jsx:21
  wrap in memo; commits 86c0c55 (strip) then 27e7971/d581d56 (restore for drag
  jank) show the cost landed. No trap or ESLint-requirement exception covers it.
  Lowered major->minor: read-site comments (TableView.jsx:103, :276,
  CardItem.jsx:18) state React.memo is required and why, so a reader editing
  those components is warned; only the project-level doc is stale, not reliably
  misleading."
fingerprint: knowledge:CLAUDE.md:memo-exceptions-unrecorded
severity: minor
severity_was: major
```

## PH-950 refuted

```yaml
id: PH-950
verdict: refuted
reason: "documented: the in-memory fallback is deliberate and recorded at the
  read site (api/_shared.js:63-66 comment) and in CLAUDE.md Known issues (rate
  limiting falls back to per-instance tracking when Supabase is unavailable);
  SUPABASE_URL is a visible constant at _shared.js:4, so no required value lives
  only in someone's head. The remaining gap (README.md:125 says the key is
  required 'for sync' only) is an incomplete setup instruction, which is
  signage's per Category boundaries."
fingerprint: knowledge:api/_shared.js:supabase-key-gates-spend-cap
```

## PH-951 refuted

```yaml
id: PH-951
verdict: refuted
reason: "trap (Case 4 'Not this'): a plain last-writer-wins merge with the
  comment 'keeping the newer version' (src/utils/sync.js:5-13) is not a
  surprising hand-rolled replacement for something standard. The real problem in
  the evidence, collections merged on immutable createdAt (quotesStore.js:211,
  :353) so cloud overwrites local collection edits, is a correctness defect for
  architecture/bug detectors, not missing rationale; the detector itself flagged
  it out of category."
fingerprint: knowledge:src/utils/sync.js:sync-merge-rules-undocumented
```

## PH-952 refuted

```yaml
id: PH-952
verdict: refuted
reason: "evidence: CLAUDE.md:302 is the React Compiler rules bullet, not
  pipeline documentation; the actual recording is CLAUDE.md:249 (useProcessing
  bullet), the Data flow section and the Known issues batch-retry note, which
  together cover stage order, sub-functions, dupe detection and retry. The
  reducer (useProcessing.js:40-90) is 15 one-line self-describing cases,
  cancellation is a visible AbortController (:296-300), and two test files
  exist; the claimed unrecorded concentration is not shown by the cited refs."
fingerprint: knowledge:src/hooks/useProcessing.js:processing-pipeline-concentration
```
