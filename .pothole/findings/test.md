# Findings: test

Detector: detect-test. Coverage: NOT MEASURED. No coverage/lcov.info is committed and Pothole never runs the suite, so there is no hot-and-under-covered tool slice and no percentage is claimed; untested-behaviour findings rest on reading which production modules the 40 test files import and exercise. Assertion, skip, coupling and nondeterminism review is AI-only (no mutation testing, no flake detection, no run history). Read: every test file in src/ and api/. No .skip/.only/.todo/xit/xdescribe exists, and no retry setting in the vitest config (vite.config.js test block is globals only), so no stale-skip or retry findings. Minor nondeterminism noted, not filed: InputPhase.test.jsx and processingErrors.test.js reassign globalThis.requestIdleCallback / globalThis.localStorage without fully restoring them (file-local leakage only). Out of category, for detect-code: (1) src/hooks/useDndQuotes.js:59 undo calls removeFromCollection(collectionId, ids) with all dragged ids, including ones reported as skipped because they were already in the collection, so undo removes pre-existing memberships. (2) src/contexts/QuotesContext.jsx:136 object-form quotes from /api/share pass through unvalidated (q.id ? q : null) while the array form goes through validateShareQuote. (3) api/fetch-url.js checkHost resolves DNS and then fetch resolves again, a DNS-rebinding window (security/code). Signage: CLAUDE.md says manual React.memo was stripped, but TableView.jsx:107 and :280 use memo deliberately (commented in-file). [coverage=partial]

## PH-849 useSync.test.js never imports useSync: it calls a mocked global fetch and checks config constants

```yaml
id: PH-849
category: test
title: "useSync.test.js never imports useSync: it calls a mocked global fetch
  and checks config constants"
severity: major
traffic: 0.1728413322246163
confidence: ai-suspected
evidence:
  - src/hooks/__tests__/useSync.test.js:3-5
  - src/hooks/__tests__/useSync.test.js:26-38
  - src/hooks/__tests__/useSync.test.js:131-149
  - src/hooks/useSync.js:93-159
source:
  - detect-test
repair_cost: L
fingerprint: test:src/hooks/__tests__/useSync.test.js:sync-test-exercises-fetch-mock-not-hook
repair: Render useSync with renderHook inside a QueryClientProvider, stub
  apiRequest, and assert on store syncStatus, the debounced push payload, the
  empty-collection guard and the onSyncError throttle instead of on fetch
  itself.
partial: true
```

The header comment says fetchSyncData/pushSyncData are module-private so the logic is re-implemented; every test then calls globalThis.fetch directly against its own vi.fn and asserts the mock received what the test just passed it. The last three tests only range-check SYNC_* constants from config.js. Nothing in the file can fail if useSync.js changes: the debounced schedulePush, the initialLoadDone gate, the skip-when-empty guard at useSync.js:153, the optimistic synced status, the LS_SYNC_ENGAGED toast gate and the SYNC_ERROR_THROTTLE_MS throttle are all unexecuted. useSync.js is bus-factor-1 and is the only path user data takes to the cloud copy, yet the suite reports a sync test file as green.

## PH-850 processingErrors cloud-sync block asserts the behaviour of its own fetch mock, not of any sync code

```yaml
id: PH-850
category: test
title: processingErrors cloud-sync block asserts the behaviour of its own fetch
  mock, not of any sync code
severity: minor
traffic: 0.015986939294133067
confidence: ai-suspected
evidence:
  - src/hooks/__tests__/processingErrors.test.js:248-345
source:
  - detect-test
repair_cost: S
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:cloud-sync-block-tests-fetch-mock
kind: duplication
repair: Delete the cloud sync describe block and cover sync failure and
  reconnect through the real useSync hook in useSync.test.js.
partial: true
```

The backoff test recomputes 2000 * 2^n inline instead of reading useSync retryDelay; the three network tests replace globalThis.fetch with a rejecting mock, call fetch themselves, and assert that it rejected (or that a local payload object they never passed anywhere was not mutated). No production module is imported by the block, so it duplicates the useSync.test.js pattern and adds test count without protecting anything. It still uses the deprecated ?device_id= query form the client no longer sends.

## PH-851 batch-continuation test asserts less than its comments claim and stubs a removed /api/cache endpoint

```yaml
id: PH-851
category: test
title: batch-continuation test asserts less than its comments claim and stubs a
  removed /api/cache endpoint
severity: minor
traffic: 0.015986939294133067
confidence: ai-suspected
evidence:
  - src/hooks/__tests__/processingErrors.test.js:168-173
  - src/hooks/__tests__/processingErrors.test.js:87
  - src/hooks/__tests__/processingErrors.test.js:152
source:
  - detect-test
repair_cost: S
fingerprint: test:src/hooks/__tests__/processingErrors.test.js:weak-batch-continuation-assertions
repair: Assert identifyCallCount is exactly 3, failedEntries has exactly 10
  items and setQuotes received the two batch-2 quotes, and drop the dead
  /api/cache stubs.
partial: true
```

The comment says identify is called at least 3 times (batch 1, retry, batch 2) but the assertion is toBeGreaterThanOrEqual(2), which is satisfied by batch 1 and its retry alone; failedEntries is checked only as > 0 rather than the 10 entries of batch 1. The CLAUDE.md guarantee that a single-batch failure never prevents other batches from completing is therefore not pinned down. Every fetch stub in the file also routes /api/cache, an endpoint that no longer exists in api/ (identify.js writes the cache itself), so the stubs document a contract that is gone.

## PH-852 ResultsPhase filter and sort tests re-implement Array.filter/sort inline; the real sort in useViewPreferences is untested

```yaml
id: PH-852
category: test
title: ResultsPhase filter and sort tests re-implement Array.filter/sort inline;
  the real sort in useViewPreferences is untested
severity: major
traffic: 0.12424325814938902
confidence: ai-suspected
evidence:
  - src/components/__tests__/ResultsPhase.test.jsx:260-337
  - src/hooks/useViewPreferences.js:120-134
  - src/hooks/__tests__/useViewPreferences.test.js:13-70
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/__tests__/ResultsPhase.test.jsx:inline-sort-filter-mirror-tests
repair: Replace the seven inline tests with renderHook(useViewPreferences) cases
  that set catFilter, favFilter and sortBy and assert on the returned filtered
  list.
partial: true
```

Seven of the twelve tests in the top hotspot test file build a local array and call .filter/.sort/.reduce on it with a comparator written in the test, never touching ResultsPhase or useViewPreferences. The copies have already drifted: production alpha sort strips punctuation and compares with sensitivity base, and production confidence sort uses CONF_ORDER[x] || 0 while the test uses ?? 1. useViewPreferences.test.js covers favorites, stats and persistence but no sortBy branch, so every sort mode the results screen offers runs untested while the suite lists them as passing.

## PH-853 HeaderBar test asserts a hard-coded active style that no longer matches styles.addMoreBtnActive

```yaml
id: PH-853
category: test
title: HeaderBar test asserts a hard-coded active style that no longer matches
  styles.addMoreBtnActive
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - src/components/__tests__/HeaderBar.test.js:8-33
  - src/components/styles.js:851
  - src/components/HeaderBar.jsx:46
source:
  - detect-test
repair_cost: S
fingerprint: test:src/components/__tests__/HeaderBar.test.js:stale-local-style-copy
repair: Render HeaderBar with showAddMore true and false and assert the Add
  quotes button style against styles.addMoreBtnActive, or delete the file.
partial: true
```

The test defines its own activeOverride (accent color and accent border) and asserts that spreading it over styles.addMoreBtn yields those values, which is true of any object spread. Production HeaderBar.jsx:46 spreads styles.addMoreBtnActive, which is now var(--cp-text) and var(--cp-border), not accent; the test name still says blue accent. The file stays green against a design that was changed, so it actively misinforms anyone reading it about how the button looks.

## PH-854 CollectionDupeModal test named for the 800ms auto-close only checks the module loads; the rest mirror logic inline

```yaml
id: PH-854
category: test
title: CollectionDupeModal test named for the 800ms auto-close only checks the
  module loads; the rest mirror logic inline
severity: minor
traffic: 0.08333458252801561
confidence: ai-suspected
evidence:
  - src/components/__tests__/CollectionDupeModal.test.js:5-13
  - src/components/__tests__/CollectionDupeModal.test.js:16-69
  - src/components/CollectionDupeModal.jsx:26-31
source:
  - detect-test
repair_cost: S
fingerprint: test:src/components/__tests__/CollectionDupeModal.test.js:misnamed-and-mirror-tests
repair: Render the modal with fake timers, resolve every group via its Keep
  buttons, advance 800ms and assert onClose and onDeleteQuotes were called with
  the non-kept ids.
partial: true
```

uses 800ms delay (not 300ms) asserts only that mod.default is a function; its comment concedes the delay is not checked. returns null when dupeGroups is empty evaluates its own ternary, and the three resolved-group tests re-run a copied reduce/filter on literals. Nothing renders the modal, so the keep-one deletion and auto-close behaviour, which deletes user quotes, is untested while five passing tests suggest otherwise.

## PH-855 AddMorePanel, ShareImageModal and TableView tests assert on logic copied into the test file

```yaml
id: PH-855
category: test
title: AddMorePanel, ShareImageModal and TableView tests assert on logic copied
  into the test file
severity: minor
traffic: 0.0046501728851701726
confidence: ai-suspected
evidence:
  - src/components/__tests__/AddMorePanel.test.js:12-34
  - src/components/__tests__/ShareImageModal.test.js:3-38
  - src/components/__tests__/TableView.test.js:13-37
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/__tests__:mirror-copy-tests
kind: duplication
repair: Render each component (or export the helper from the component) and
  assert on the real output; delete tests that only exercise a copy.
partial: true
```

Each file re-declares a function or ternary from the component (tabStyle from AddMorePanel.jsx:105, the cursor/opacity expression from ShareImageModal.jsx:82-83, the isDragging transform guard from TableView.jsx:129-131) and tests the copy. If the component changes, the copy does not, so these tests cannot fail for a real regression; they only inflate the test count. The AddMorePanel import test (lines 3-9) and TableView memo check are the only lines touching production modules.

## PH-856 App.test.jsx mocks every phase and hook and never drives a phase transition in the hottest file

```yaml
id: PH-856
category: test
title: App.test.jsx mocks every phase and hook and never drives a phase
  transition in the hottest file
severity: major
traffic: 0.75153996915182
confidence: ai-suspected
evidence:
  - src/components/__tests__/App.test.jsx:36-170
  - src/components/__tests__/App.test.jsx:214-258
  - src/components/App.jsx:84
  - src/components/App.jsx:170
source:
  - detect-test
repair_cost: L
fingerprint: test:src/components/__tests__/App.test.jsx:phase-orchestration-untested
repair: Add tests that click the mocked process-btn and review-modal
  Confirm/Cancel buttons already wired in the file and assert which phase
  renders next, plus the append-mode return to input.
partial: true
```

App.jsx is the repo top-traffic component (192 commits) and its job is phase orchestration, but every test asserts only the initial render. The mocks for InputPhase (process-btn) and EntryReviewModal (Confirm/Cancel) are wired but no test fires an event, so the input to review to processing to results flow and the return-to-input append mode (App.jsx:84, :170) never execute. The App - draft persistence describe asserts only that input-phase renders, never that a draft is saved or restored. Assertions are getByTestId(...).toBeDefined(), which can only fail by throwing.

## PH-857 useProcessing duplicate-detection pre-pass and handleDupesContinue never run: pipeline tests stub similarity to 0 and localLookup to null

```yaml
id: PH-857
category: test
title: "useProcessing duplicate-detection pre-pass and handleDupesContinue never
  run: pipeline tests stub similarity to 0 and localLookup to null"
severity: major
traffic: 0.22087729473158527
confidence: ai-suspected
evidence:
  - src/hooks/useProcessing.js:360-420
  - src/hooks/useProcessing.js:146-166
  - src/hooks/__tests__/processingErrors.test.js:6-17
  - src/hooks/__tests__/lookupConfidence.test.js:6-17
source:
  - detect-test
repair_cost: L
fingerprint: test:src/hooks/useProcessing.js:dupe-prepass-and-local-lookup-untested
repair: Add renderHook tests that leave similarityFromKeys real, feed two
  near-identical entries plus an append-mode existing quote, and assert
  SHOW_DUPES fires and that handleDupesContinue keeps or skips entries per
  decision; add one with a localLookup stub that returns a match.
partial: true
```

Both hook-level suites mock similarity and similarityFromKeys to return 0 and localLookup to return null, so the near-duplicate scan against existing quotes (DUPE_SIMILARITY_THRESHOLD), the SHOW_DUPES dispatch, the pendingContinuationRef hand-off and handleDupesContinue keep/skip merge, and the local-DB match branch never execute. useProcessing.test.js covers only the reducer, so SHOW_DUPES is tested as a state transition but never as an outcome of input. This is the highest-complexity, worst-health, bus-factor-1 file in the repo, and the dupe path decides which user entries are silently dropped.

## PH-858 QuotesContext share-link decoding of untrusted URL data has no test

```yaml
id: PH-858
category: test
title: QuotesContext share-link decoding of untrusted URL data has no test
severity: minor
traffic: 0.18109258775720635
confidence: ai-suspected
evidence:
  - src/contexts/QuotesContext.jsx:44-56
  - src/contexts/QuotesContext.jsx:117-162
  - src/components/__tests__/App.test.jsx:163
source:
  - detect-test
repair_cost: L
fingerprint: test:src/contexts/QuotesContext.jsx:share-decode-untested
repair: Unit-test the exported safeDecodeShareData with valid, oversized,
  non-array, malformed base64 and over-MAX_SHARE_ITEMS input, and test the
  public-link branch with fetchWithTimeout stubbed to 404, 410 and malformed
  bodies.
partial: true
```

safeDecodeShareData is exported and pure, and it is the only sanitiser between an attacker-controlled #s= hash and the store, yet no test imports it; the only test reference to QuotesContext mocks it out. The /c/<id> branch maps 404/410/empty/other failures to distinct toasts and falls back to pull(), also unexecuted. The file is bus-factor-1, so the rubric requires a test net before anyone changes it.

## PH-859 api/sync.js server-side merge, tombstone deletion and collections-column fallback have no test

```yaml
id: PH-859
category: test
title: api/sync.js server-side merge, tombstone deletion and collections-column
  fallback have no test
severity: minor
traffic: 0.07038251338668261
confidence: ai-suspected
evidence:
  - api/sync.js:5-31
  - api/sync.js:80-115
source:
  - detect-test
repair_cost: L
fingerprint: test:api/sync.js:server-merge-untested
repair: Export mergeQuotes and unit-test last-write-wins,
  tombstone-newer-than-quote deletion and missing updatedAt; then test the POST
  handler with a fake Supabase that rejects the collections column once.
partial: true
```

mergeQuotes decides what survives in the only cloud copy of a device data (last-write-wins by updatedAt, tombstones deleting rows whose deletedAt is newer), and the POST handler retries the upsert without collections on a specific error message. None of api/__tests__ imports sync.js; the client-side twin mergeByTimestamp is tested but has different semantics (no tombstones), so its tests say nothing about this one. Bus-factor-1 file with no test net.

## PH-860 withApiHandler origin and CSRF rejection paths are never exercised; every mock request is valid

```yaml
id: PH-860
category: test
title: withApiHandler origin and CSRF rejection paths are never exercised; every
  mock request is valid
severity: minor
traffic: 0.0914958755602203
confidence: ai-suspected
evidence:
  - api/_shared.js:90-99
  - api/_shared.js:253-258
  - api/__tests__/security.test.js:27-38
source:
  - detect-test
repair_cost: S
fingerprint: test:api/_shared.js:auth-gate-reject-paths-untested
repair: Add security tests that call a wrapped handler with a foreign Origin, a
  spoofed subdomain Referer, and a missing X-Requested-With header and assert
  403 without the handler running.
partial: true
```

security.test.js builds every request with an allowed origin and the CSRF header, so the 403 branches and validateOrigin referer parsing (which exists specifically to stop subdomain spoofing) never execute. A regression that inverted or removed the check would leave the suite green; this middleware guards every endpoint including the paid AI ones.

## PH-861 fetch-url per-hop SSRF re-check in the manual redirect loop is untested

```yaml
id: PH-861
category: test
title: fetch-url per-hop SSRF re-check in the manual redirect loop is untested
severity: minor
traffic: 0.06340544648552357
confidence: ai-suspected
evidence:
  - api/fetch-url.js:72-105
  - api/__tests__/security.test.js:154-178
source:
  - detect-test
repair_cost: L
fingerprint: test:api/fetch-url.js:redirect-hop-ssrf-untested
repair: Test the handler with a fetch stub returning a 302 to
  http://169.254.169.254/ and assert a 400 with the redirect-blocked message,
  plus non-http protocol and too-many-redirects cases.
partial: true
```

The SSRF tests call isPrivateAddress and checkHost directly; the handler loop that re-checks every redirect hop, rejects non-http protocols and caps hops never runs. CLAUDE.md says not to switch back to redirect follow or bypass these checks, but nothing in the suite would notice if someone did. Bus-factor-1 file.

## PH-862 Collection CRUD in quotesStore and its consumers (useDndQuotes drop/reorder, CollectionsSidebar) have no tests

```yaml
id: PH-862
category: test
title: Collection CRUD in quotesStore and its consumers (useDndQuotes
  drop/reorder, CollectionsSidebar) have no tests
severity: minor
traffic: 0.32016782885685596
confidence: ai-suspected
evidence:
  - src/stores/quotesStore.js:218-300
  - src/hooks/useDndQuotes.js:41-73
  - src/components/CollectionsSidebar.jsx:312-345
  - src/stores/__tests__/quotesStore.test.js:16-74
source:
  - detect-test
repair_cost: L
fingerprint: test:src/stores/quotesStore.js:collection-crud-untested
repair: Add store tests for create (duplicate and invalid names), rename,
  delete, addToCollection added/skipped counts and cleanCollectionRefs, then a
  renderHook test of useDndQuotes handleDndEnd for both the collection-drop and
  reorder branches.
partial: true
```

quotesStore.test.js covers tombstones, cloud merge and cross-tab sync only; createCollection, deleteCollection, renameCollection, addToCollection (whose added/skipped counts drive the toast and undo in useDndQuotes), removeFromCollection and cleanCollectionRefs have no test. useDndQuotes and CollectionsSidebar (hotspot, bus-factor-1, 644 lines) have no test file and are replaced by mocks in ResultsPhase.test.jsx.
