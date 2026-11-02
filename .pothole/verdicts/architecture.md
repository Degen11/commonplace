# Verdicts: architecture

Inspector: inspect-architecture. Coverage: every finding judged; all evidence refs resolved and were opened, commits checked with git show/log -S. madge reported 0 cycles (JS/TS, tool-backed); no cycle findings to judge.

## PH-749 refuted

```yaml
id: PH-749
verdict: refuted
reason: "miscategorized: wrong category, this is code debt (diverged twins)
  because the unit is a duplicated batch loop inside two functions
  (useQuoteActions.batchReIdentify vs useProcessing.handleApiBatch), not a
  module-level zombie path; useQuoteActions.js is a live multi-purpose module,
  not a legacy twin of useProcessing. Evidence itself checks out: :212 swallows
  a failed batch, :219 toasts success for all, e12a8f5 touched only
  useProcessing.js, batchReIdentify reachable via ResultsPhase.jsx:883, and
  useQuoteActions.test.js has no batchReIdentify coverage - refile under code at
  major."
fingerprint: architecture:src/hooks:zombie-batch-identify-flow
```

## PH-750 refuted

```yaml
id: PH-750
verdict: refuted
reason: "miscategorized: wrong category, a single-file deviation from a code
  convention is not module-graph architecture; the two handlers
  (ExportDropdown.jsx:74, :95) route around copyWithToast because it cannot
  carry what they need (in-place toast {id} update, Retry action, show-the-URL
  fallback on failure) - that is swerve's routing-around-a-helper evidence.
  b9afc5b converted the export-menu copies that failed silently and left these,
  which already report failure, so the declared never-silent intent holds."
fingerprint: architecture:src/components:clipboard-bypasses-copywithtoast
```

## PH-751 refuted

```yaml
id: PH-751
verdict: refuted
reason: "trap (generic best practice is not a declaration): CLAUDE.md declares
  no api import-direction rule; the survey's 'api may import only api/_*.js plus
  logo geometry' is an informal inference (survey says 'Declared, informally').
  The CAT_COLORS edge was added in c2454f5 together with the per-share OG cards
  and the logoPaths/wordmark edges; src/data/constants.js imports nothing, so
  the edge is to a pure data leaf and a category colour change reaching the OG
  card is palette consistency, not unintended coupling."
fingerprint: architecture:api:api-imports-client-constants
```
