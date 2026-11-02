# Verdicts: swerve

Inspector: inspect-swerve. Coverage: every finding judged; all evidence refs and commits opened at HEAD 92b293e.

## PH-349 confirmed

```yaml
id: PH-349
verdict: confirmed
reason: "All refs resolve: styles.js:302/304 :has(.ui-tip:hover)
  overflow:visible!important on sidebar-rail and notif-bar-wrapper, :307
  zero-duration fade to hide the clip artifact, :446 qcard-wrap z-index lift;
  six tooltip-clipping fixes on 2026-04-17
  (ceba665,c1ac354,fcb2fed,38cc3f3,d7a5a4d,fc4cf3f) are a workaround cluster on
  hot styles.js. Not a trap (no exit condition, repeated). CLAUDE.md documents
  the sidebar-rail rule and the native-title carve-out, which refutes
  'unexplained' but not the per-container cost claimed. Caveat: 8db8f7d reverted
  a bundled multi-change commit (054e74e also touched sync, masonry, view
  transitions), so it is weak evidence that the portal approach itself was
  rejected."
fingerprint: swerve:src/components:ui-tip-clipping-detours
```

## PH-350 confirmed

```yaml
id: PH-350
verdict: confirmed
reason: Refs resolve (TableView.jsx:104/276 are the 'memo is required' comment
  heads for memo() at 107/280; 289 and ResultsPhase.jsx:60 are 'use no memo';
  CardItem.jsx:18 comment + memo at 21; useDndQuotes.js:38 setOverDragId on
  every dragover, state held at useDndQuotes.js:16 and threaded through
  ResultsPhase.jsx:253/1040). Commits 27e7971/d581d56/f0d1495 restored memo the
  day after 86c0c55 stripped it, each citing overDragId re-renders, and the
  cause was never moved. 'use no memo' is documented in CLAUDE.md but memo()
  restorations contradict the declared policy, so documented route does not
  apply; hot files, cluster of detours.
fingerprint: swerve:src/components:dnd-virtualizer-compiler-optouts
```

## PH-351 refuted

```yaml
id: PH-351
verdict: refuted
reason: "miscategorized: wrong category — this is api debt because the branch at
  api/sync.js:51 and :100 is keyed on a contract/schema fact (a column name
  sniffed from the error message), which the swerve study case assigns to api
  (Case 2); nothing routes around our own code — it routes around an unapplied
  DB migration (5906058 body). The silent-drop of collections on fallback is
  real and should be refiled under api next scan."
fingerprint: swerve:api:sync-collections-column-fallback
```

## PH-352 refuted

```yaml
id: PH-352
verdict: refuted
reason: "trap: Case 1 'Not this' — implementing a declared design is design, not
  swerve. The !important layer and .hov-* helpers are the prescribed path, not a
  detour: styles.js:214 records it as inherent to the declared inline-style
  architecture, styles.js:630 and CLAUDE.md:307 instruct contributors to use
  .hov-* / @media(hover:hover) rules. No one changed behaviour to avoid a
  module; the finding itself concedes the choice is declared. The 154 !important
  rules and the 38cc3f3 stripe collision may be code/architecture cost of that
  design, for another category to file."
fingerprint: swerve:src/components:important-override-layer
```
