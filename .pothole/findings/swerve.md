# Findings: swerve

Detector: detect-swerve. Coverage: full git history (1108 commits, not shallow) walked for the 24-month window with workaround/revert/again/stale/compiler/z-index/tooltip greps; source grepped for folklore, catch-and-swallow, flags and wrapper chains; hotspots ResultsPhase, TableView, CardItem, useProcessing, QuotesContext, useSync, api/sync.js and styles.js read at the cited lines. No deterministic tool covers swerve debt. No flag graveyard and no catch-and-swallow cluster found (the few empty catches are fire-and-forget prefetch/history calls). Out of category, seen but not reported: (signage) CLAUDE.md says manual memo/useCallback were stripped and one useMemo remains, but TableRow, TableView and CardItem are memo()-wrapped and useSync.js uses useCallback; (code/signage) the apiRequest migration in b9afc5b was left incomplete: useProcessing.js:508 auto-group and QuotesContext.jsx:121 share fetch still hand-roll fetchWithTimeout and status handling and are not among the declared exceptions, and the status 410/404 branching there is api territory. The Feb 2026 TableView padding/scroll revert thrash (b24c1dd, 0b0cfb1, 55bf34f, f39343f) is old layout iteration with no surviving detour. No architecture-level cycle or layer violation observed. [coverage=full]

## PH-349 Pseudo-element tooltip routed around per clip container with :has() overflow overrides and z-index lifts

```yaml
id: PH-349
category: swerve
title: Pseudo-element tooltip routed around per clip container with :has()
  overflow overrides and z-index lifts
severity: major
traffic: 1
confidence: ai-suspected
evidence:
  - src/components/styles.js:302
  - src/components/styles.js:304
  - src/components/styles.js:307
  - src/components/styles.js:446
  - commit ceba665 Fix tooltip clipping in notification bars
  - commit c1ac354 Fix tooltip linger artifact in notification bars
  - commit fcb2fed Fix tooltip fade-out direction
  - commit d7a5a4d Fix card tooltip being clipped by sibling card stacking
    contexts
  - commit fc4cf3f Revert card tooltip to above; bump wrapper z-index above
    sticky bar
  - commit 8db8f7d Revert Upgrade tooltips to @floating-ui
source:
  - detect-swerve
repair_cost: M
fingerprint: swerve:src/components:ui-tip-clipping-detours
```

The .ui-tip tooltip is a CSS ::after pseudo-element, so it cannot escape any overflow:hidden or stacking-context ancestor. Instead of fixing that, each container that clips it got its own detour: sidebar-rail and notif-bar-wrapper flip overflow to visible via :has(.ui-tip:hover) with !important, notif-bar tooltips get a special zero-duration fade-out to hide the artifact that override causes, card wrappers get a :has(.qcard:hover) z-index lift, and the convention doc carves out a native-title exception for clip containers. Six tooltip fixes landed on 2026-04-17 alone; the one root-cause attempt (portal tooltips via @floating-ui, 054e74e) was reverted wholesale in 8db8f7d. Every new clipping container needs another override.

## PH-350 Drag-and-drop list rendering patched around the React Compiler with restored memo() and use-no-memo opt-outs

```yaml
id: PH-350
category: swerve
title: Drag-and-drop list rendering patched around the React Compiler with
  restored memo() and use-no-memo opt-outs
severity: major
traffic: 0.5664513387639842
confidence: ai-suspected
evidence:
  - src/components/TableView.jsx:104
  - src/components/TableView.jsx:276
  - src/components/TableView.jsx:289
  - src/components/CardItem.jsx:18
  - src/components/ResultsPhase.jsx:60
  - src/hooks/useDndQuotes.js:38
  - commit 27e7971 Restore React.memo on TableRow to fix drag jank in table view
  - commit d581d56 Restore React.memo on CardItem to fix card view drag jank
  - "commit f0d1495 fix: eliminate table shake during drag-and-drop"
  - commit 905154e fix empty virtualized list after view switch
  - commit 845af57 Fix drag-and-drop gaps caused by virtualizer absolute
    positioning
source:
  - detect-swerve
repair_cost: L
fingerprint: swerve:src/components:dnd-virtualizer-compiler-optouts
```

The project policy is compiler-managed memoization with manual memo stripped (86c0c55), but the virtualized, sortable result lists keep failing under it, and each failure was patched locally rather than fixed at the source: memo() restored on TableRow, CardItem and TableView, use-no-memo opt-outs on TableView and MobileCardList, and sortable transforms gated to the dragged row only. The underlying cause named in those commits, overDragId state held high in ResultsPhase and updated on every drag frame (useDndQuotes.js:38), was never moved. TableView is now both memo()-wrapped and opted out of the compiler, and each comment says the wrapper is required, so a reader cannot remove any of them safely. Hotspot files (TableView 128 commits, ResultsPhase hotspot 0.32) with CardItem bus-factor-1.

## PH-351 Sync API silently retries without the collections column instead of relying on the migration

```yaml
id: PH-351
category: swerve
title: Sync API silently retries without the collections column instead of
  relying on the migration
severity: minor
traffic: 0.07038251338668261
confidence: ai-suspected
evidence:
  - api/sync.js:51
  - api/sync.js:100
  - supabase/migration.sql:97
  - "commit 5906058 Fix sync failure: handle missing collections column in
    device_data"
source:
  - detect-swerve
repair_cost: S
fingerprint: swerve:api:sync-collections-column-fallback
```

When the collections column was added in March 2026, sync broke on a database that had not run the ALTER TABLE, and instead of applying the migration the endpoint learned to sniff the error message for the word collections and retry the read and upsert without it. The migration now exists in migration.sql, but the fallback has no exit condition and stays live: if it ever fires, collections are dropped from the cloud backup without any error reaching the client. api/sync.js is bus-factor-1.

## PH-352 Interactive styles route around inline style objects through an !important override layer

```yaml
id: PH-352
category: swerve
title: Interactive styles route around inline style objects through an
  !important override layer
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - src/components/styles.js:214
  - src/components/styles.js:630
  - src/components/styles.js:223
  - commit 38cc3f3 Fix card confidence stripe on hover and tooltip cutoff
source:
  - detect-swerve
repair_cost: L
fingerprint: swerve:src/components:important-override-layer
```

Base styles are spread as inline style props, which no selector can beat, so every hover, active, disabled and responsive state is written as a class rule with !important (about 109 in baseCSS), plus a family of .hov-* helper classes that exist only to override inline resting colors. The comment at styles.js:214 records the detour as inherent to the inline-style setup. It has already caused a bug: 38cc3f3 fixed an !important hover box-shadow that overwrote the card's inline confidence stripe, which was then patched by moving the stripe into a CSS variable. The CSS-in-JS choice is declared in CLAUDE.md. The debt is the growing override layer that each new interactive state has to join, not the choice itself.
