# Findings: signage

Detector: detect-signage. Coverage: 4 simulated newcomer tasks (add/adjust a results-list component under React Compiler; read or change quote state; add a client API call or clipboard copy; bring the repo up from README setup) plus a name/doc contradiction sweep of CLAUDE.md and README.md claims against code (directory layout, scripts, config constants, Z scale, API middleware/schemas, lazy-load, PWA/chunking, hover rules, helpers) and get*/is*/has*/load*/check* names in src and api. knip/ts-prune are not run in this phase, so dead-export coverage is AI-only; no documented-and-re-exported dead symbol found (no barrel index files exist). Out-of-category (architecture/code, code violating declared CLAUDE.md rules, not signage): CollectionsSidebar.jsx:403 does const Icon = getIcon(c.icon), the exact dynamic-component pattern CLAUDE.md forbids; raw fetchWithTimeout outside apiRequest in QuotesContext.jsx:121 (public share GET, also sends no X-Requested-With header) and useProcessing.js:508 (auto-group, not a listed exception); onMouseEnter/onMouseLeave hover state in SyncPill.jsx:82, CollectionsSidebar.jsx:118, HowItWorksAnimation.jsx:297; raw navigator.clipboard share-link copies in ExportDropdown.jsx:74 and :95 bypass copyWithToast (they do handle errors). Cosmetic, not filed: README test count 356 is stale (actual about 440); quotesStore isShareHash() also matches the /c/ path; CLAUDE.md test-dir list omits lookupConfidence.test.js. No drifted ADRs (none exist). [coverage=full]

## PH-449 CLAUDE.md says manual React.memo/useCallback were stripped, but hot list components depend on React.memo

```yaml
id: PH-449
category: signage
title: CLAUDE.md says manual React.memo/useCallback were stripped, but hot list
  components depend on React.memo
severity: major
traffic: 0.5664513387639842
confidence: ai-suspected
evidence:
  - CLAUDE.md:291
  - CLAUDE.md:365
  - src/components/TableView.jsx:103
  - src/components/TableView.jsx:107
  - src/components/TableView.jsx:280
  - src/components/CardItem.jsx:21
  - src/hooks/useSync.js:64
source:
  - detect-signage
repair_cost: S
fingerprint: signage:CLAUDE.md:claude-md-memo-stripped-claim-false
```

CLAUDE.md, the agent instruction file and the repo's only architecture declaration, states that manual memo/useCallback/useMemo 'have been stripped' and that only one intentional useMemo remains. In fact TableRow, TableView and CardItem are wrapped in React.memo (with in-file comments saying memo is required to stop drag-frame re-render churn and virtualizer shake), and useSync uses useCallback throughout. An agent trusting CLAUDE.md, especially while touching TableView (a top-2 hotspot), will read these memo wrappers as stragglers to remove and reintroduce the drag jank they exist to prevent. The doc should list the sanctioned memo exceptions the way it lists the 'use no memo' directives.

## PH-450 README points to QuotesContext.jsx as the global quote/collection state, but it provides no value; state lives in the unlisted Zustand store

```yaml
id: PH-450
category: signage
title: README points to QuotesContext.jsx as the global quote/collection state,
  but it provides no value; state lives in the unlisted Zustand store
severity: minor
traffic: 0.18109258775720635
confidence: ai-suspected
evidence:
  - README.md:88
  - src/contexts/QuotesContext.jsx:1
  - src/contexts/QuotesContext.jsx:2
  - src/stores/quotesStore.js:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-quotes-context-global-state
```

The README project structure labels QuotesContext.jsx 'Global state: quotes, collections, sync' and omits src/stores/ entirely. QuotesContext is a side-effects-only provider with no context value; quotes and collections are read via useQuotesStore() from src/stores/quotesStore.js. A human newcomer asked to read or change quote state follows the README to a context that has nothing to consume.

## PH-451 README prerequisite says Node.js 18+, but Vite 8 requires Node ^20.19 or >=22.12

```yaml
id: PH-451
category: signage
title: README prerequisite says Node.js 18+, but Vite 8 requires Node ^20.19 or
  >=22.12
severity: minor
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - README.md:108
  - package.json:64
  - .github/workflows/ci.yml:19
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-node-version-too-old
```

A reader following the README setup on Node 18 runs npm install and npm run dev against vite ^8, whose engines field requires ^20.19.0 || >=22.12.0, so the first dev command fails. CI already pins Node 22; the README prerequisite was never updated.

## PH-452 CLAUDE.md says eslint-plugin-react-hooks must be installed separately, but it is already a devDependency

```yaml
id: PH-452
category: signage
title: CLAUDE.md says eslint-plugin-react-hooks must be installed separately,
  but it is already a devDependency
severity: cosmetic
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - CLAUDE.md:332
  - package.json:61
  - eslint.config.js:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:CLAUDE.md:claude-md-react-hooks-plugin-install-note-stale
```

The note sends a reader or agent to install a package that npm install already provides, implying npm run lint is broken out of the box when it is not.
