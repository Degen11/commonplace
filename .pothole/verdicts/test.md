# Verdicts: test

Inspector: inspect-test. Coverage: every finding judged; all evidence refs opened. PH-851 refs 87/152 sit one-two lines from the /api/cache stubs (86/154).

## PH-849 confirmed

```yaml
id: PH-849
verdict: confirmed
reason: "evidence holds: useSync.test.js:3-5 admits re-implementation; every
  test calls its own vi.fn fetch (27-38) and 131-149 only range-check config
  constants; no test file imports useSync (grep), so schedulePush guard at
  useSync.js:153, onMutate/onError throttle (93-133) never run. No trap matches
  (not a shared-helper or explicit doesNotThrow test)."
fingerprint: test:src/hooks/__tests__/useSync.test.js:sync-test-exercises-fetch-mock-not-hook
```

## PH-850 confirmed

```yaml
id: PH-850
verdict: confirmed
reason: "evidence holds: processingErrors.test.js:248-345 imports no sync
  module; 249-256 recomputes 2000*2^n inline, 258-344 call a rejecting/resolving
  fetch mock directly and assert on it; 264 uses the legacy ?device_id= form. No
  trap or documented intent."
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:cloud-sync-block-tests-fetch-mock
```

## PH-851 confirmed

```yaml
id: PH-851
verdict: confirmed
reason: "evidence: processingErrors.test.js:168-169 comment says at least 3
  identify calls but asserts >=2, and 171 asserts failedEntries >0 not 10; api/
  has no cache endpoint and no non-test source references /api/cache. Note: the
  /api/cache stub lines are 86 and 154 (refs 87/152 are adjacent lines), drift
  not a mismatch of claim."
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:weak-batch-continuation-assertions
```

## PH-852 confirmed

```yaml
id: PH-852
verdict: confirmed
reason: "evidence holds: ResultsPhase.test.jsx:259-337 sorts/filters local
  arrays with test-written comparators; useViewPreferences.js:127-134 differs
  (strip+sensitivity base for alpha, CONF_ORDER||0 vs ??1);
  useViewPreferences.test.js only checks sortBy default (line 26), no sort
  branch exercised."
fingerprint: test:src/components/__tests__/ResultsPhase.test.jsx:inline-sort-filter-mirror-tests
```

## PH-853 confirmed

```yaml
id: PH-853
verdict: confirmed
reason: "evidence holds: HeaderBar.test.js:8-33 asserts a local activeOverride
  with --cp-accent; styles.js:851 addMoreBtnActive is --cp-text/--cp-border and
  HeaderBar.jsx:46 spreads that, so the test cannot fail and describes the old
  design."
fingerprint: test:src/components/__tests__/HeaderBar.test.js:stale-local-style-copy
```

## PH-854 confirmed

```yaml
id: PH-854
verdict: confirmed
reason: "evidence holds: CollectionDupeModal.test.js:5-13 only checks
  mod.default is a function (comment concedes delay unchecked); 16-69 evaluate
  inline ternary/reduce/filter on literals; CollectionDupeModal.jsx:26-31
  setTimeout(onClose,800) never rendered."
fingerprint: test:src/components/__tests__/CollectionDupeModal.test.js:misnamed-and-mirror-tests
```

## PH-855 confirmed

```yaml
id: PH-855
verdict: confirmed
reason: "evidence holds: AddMorePanel.test.js:12-34,
  ShareImageModal.test.js:3-38 and TableView.test.js:13-37 each test a local
  copy of tabStyle (AddMorePanel.jsx:105), cursor/opacity
  (ShareImageModal.jsx:82-83) and the isDragging guard (TableView.jsx:129-131);
  none render the component."
fingerprint: test:src/components/__tests__:mirror-copy-tests
```

## PH-856 confirmed

```yaml
id: PH-856
verdict: confirmed
reason: "evidence holds: App.test.jsx has no fireEvent/userEvent/click anywhere;
  all phase tests assert initial render only (186-213), draft-persistence tests
  (236-258) assert only render. App.jsx:84 sync-to-results transition is driven
  only by pre-seeded store. Minor ref note: App.jsx:170 is clearParentState
  (start fresh -> input), not append mode; core claim unaffected."
fingerprint: test:src/components/__tests__/App.test.jsx:phase-orchestration-untested
```

## PH-857 confirmed

```yaml
id: PH-857
verdict: confirmed
reason: "evidence holds: processingErrors.test.js:6-17 and
  lookupConfidence.test.js:6-17 stub localLookup->null and
  similarity/similarityFromKeys->0; no test feeds duplicate entries,
  handleDupesContinue appears only as an App.test mock, useProcessing.test.js
  imports only the reducer. useProcessing.js:146-166 match branch and 360-420
  SHOW_DUPES/continuation are unexecuted."
fingerprint: test:src/hooks/useProcessing.js:dupe-prepass-and-local-lookup-untested
```

## PH-858 confirmed

```yaml
id: PH-858
verdict: confirmed
reason: "evidence holds: safeDecodeShareData (QuotesContext.jsx:44-56) is
  exported and pure but grep finds no test importing it or validateShareQuote;
  the only test reference mocks QuotesContext out (App.test.jsx:163); the
  /c/<id> branch 117-162 is unexecuted."
fingerprint: test:src/contexts/QuotesContext.jsx:share-decode-untested
```

## PH-859 confirmed

```yaml
id: PH-859
verdict: confirmed
reason: "evidence holds: api/__tests__ imports only lookup.js, _shared.js,
  identify.js, fetch-url.js, share-page.js and _shareData.js; mergeQuotes
  (sync.js:5-31) is module-private and the collections-column retry
  (sync.js:99-104) is untested."
fingerprint: test:api/sync.js:server-merge-untested
```

## PH-860 confirmed

```yaml
id: PH-860
verdict: confirmed
reason: "evidence holds: security.test.js:27-38 mockReq always sets an allowed
  origin and x-requested-with and no test mutates headers; validateOrigin is
  never called in tests, so _shared.js:90-99 referer parsing and the 403
  branches at 256-257 never run."
fingerprint: test:api/_shared.js:auth-gate-reject-paths-untested
```

## PH-861 confirmed

```yaml
id: PH-861
verdict: confirmed
reason: "evidence holds: security.test.js:154-178 calls only
  isPrivateAddress/checkHost; the fetch-url default handler (redirect loop
  fetch-url.js:72-105, per-hop recheck, protocol and hop-cap rejections) is
  never invoked in any test."
fingerprint: test:api/fetch-url.js:redirect-hop-ssrf-untested
```

## PH-862 confirmed

```yaml
id: PH-862
verdict: confirmed
reason: "evidence holds: quotesStore.test.js has only tombstone, cloud-merge and
  cross-tab describes; collection CRUD (quotesStore.js:218-300) appears in tests
  only as vi.fn mocks in App/ResultsPhase tests; no test file for useDndQuotes
  or CollectionsSidebar (mocked at ResultsPhase.test.jsx:114).
  CollectionsSidebar 312-326 is handleSmartGroup, handleCreate/handleRename
  follow at 328-345."
fingerprint: test:src/stores/quotesStore.js:collection-crud-untested
```
