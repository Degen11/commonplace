# Findings: knowledge

Detector: detect-knowledge. Coverage: no ADR directory exists; CLAUDE.md (sole declaration, treated as intended) memo/sync/env claims checked against code; all 4 process.env reads traced (api/_shared.js); author data from the brief, cross-checked with git shortlog (one human under three identities Degen11/Degen/degen11 plus Claude, so the hotspot authors column overstates diversity). AI-only category, no tool corroborates any of it. Out of category: README.md:131 says 356 tests vs 40 files/443 tests in CLAUDE.md (signage); collections merge on createdAt and have no updatedAt, so collection renames/membership edits on one device can be overwritten by the cloud copy on pull (correctness, likely architecture/bug detector); ?device_id= fallback in api/sync.js has no recorded exit criterion (migration/architecture). [coverage=full]

## PH-949 CLAUDE.md says manual memoization was stripped, omitting the three React.memo wrappers the drag path depends on

```yaml
id: PH-949
category: knowledge
title: CLAUDE.md says manual memoization was stripped, omitting the three
  React.memo wrappers the drag path depends on
severity: major
traffic: 0.5664513387639842
confidence: ai-suspected
evidence:
  - CLAUDE.md:291
  - CLAUDE.md:365
  - src/components/TableView.jsx:103
  - src/components/TableView.jsx:280
  - src/components/CardItem.jsx:18
  - 86c0c55
  - "27e7971"
  - d581d56
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:CLAUDE.md:memo-exceptions-unrecorded
```

CLAUDE.md records one sanctioned useMemo and says manual memo/useCallback/useMemo have been stripped and must not be added. The code carries three deliberate React.memo wrappers (TableRow, TableView, CardItem) whose read-site comments explain they stop per-frame re-renders during drag. History shows the cost already landed: 86c0c55 removed manual memoization, then 27e7971 and d581d56 had to restore React.memo to fix drag jank. A reader or agent following the project instructions literally will strip them again. Repair is listing the exceptions alongside the existing useMemo and use-no-memo exceptions.

## PH-950 SUPABASE_SECRET_KEY documented as sync-only, but the global AI spend cap silently degrades to per-instance without a key valid for the hardcoded project

```yaml
id: PH-950
category: knowledge
title: SUPABASE_SECRET_KEY documented as sync-only, but the global AI spend cap
  silently degrades to per-instance without a key valid for the hardcoded
  project
severity: minor
traffic: 0.12881854052041353
confidence: ai-suspected
evidence:
  - README.md:125
  - api/_shared.js:4
  - api/_shared.js:15
  - api/_shared.js:54
  - api/_shared.js:180
  - api/identify.js:135
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:api/_shared.js:supabase-key-gates-spend-cap
```

README lists SUPABASE_SECRET_KEY as Required for sync. In fact getSupabase() returning null (missing key) or the check_rate_limit RPC failing (a key for a different project than the hardcoded SUPABASE_URL, or the migration function absent) makes checkRateLimit fall back to an in-memory map, so the site-wide AI daily cap of 2000 becomes per serverless instance with no error or log. The required value, a secret key for project aoyagemikimsycaupych with check_rate_limit deployed, is recorded nowhere a deployer meets it.

## PH-951 Sync conflict-resolution rules (cloud wins ties, collections compared on createdAt) have no recorded rationale

```yaml
id: PH-951
category: knowledge
title: Sync conflict-resolution rules (cloud wins ties, collections compared on
  createdAt) have no recorded rationale
severity: minor
traffic: 0.3478031482231616
confidence: ai-suspected
evidence:
  - src/utils/sync.js:27
  - src/stores/quotesStore.js:211
  - src/stores/quotesStore.js:353
  - CLAUDE.md:238
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:src/utils/sync.js:sync-merge-rules-undocumented
```

mergeByTimestamp lets the incoming copy win whenever its timestamp is >= the local one, and collections are merged on createdAt, a value that never changes after creation, so on pull the cloud copy of every existing collection replaces the local one. CLAUDE.md describes pull/push scheduling and tombstones but says nothing about how conflicts resolve or why collections are not versioned; the function comment only says keeping the newer version. A newcomer cannot tell whether this is intended last-pull-wins behaviour or an oversight.

## PH-952 Identification pipeline useProcessing.js is bus-factor-1 with its internal flow only partly recorded

```yaml
id: PH-952
category: knowledge
title: Identification pipeline useProcessing.js is bus-factor-1 with its
  internal flow only partly recorded
severity: minor
traffic: 0.3478031482231616
confidence: ai-suspected
evidence:
  - src/hooks/useProcessing.js:40
  - src/hooks/useProcessing.js:296
  - src/hooks/useProcessing.js:503
  - CLAUDE.md:302
source:
  - detect-knowledge
repair_cost: M
fingerprint: knowledge:src/hooks/useProcessing.js:processing-pipeline-concentration
```

The brief lists useProcessing.js under Bus-factor-1 files and as a hotspot (complexity 102, 40 commits, authors 3 counting aliases of one human). It is hand-written core logic: a 15-action reducer, a staged local/external/AI orchestrator, and an auto-group path. git shows 34 of its 40 commits came from AI sessions. CLAUDE.md records the stage order and the retry-once rule, but not the reducer action semantics, cancellation, or the dupe-decision handoff, so changes depend on re-deriving them from the code. Kept minor because the CLAUDE.md coverage and existing hook tests mitigate it.
