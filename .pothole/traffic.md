# Traffic Report

Generated 2026-11-02T11:19:10.000Z · 658 commits over last 24 months · complexity via scc.
Traffic = recency-weighted churn (half-life 90 days), normalized to [0,1].
169 file(s) measured, and 37 churned path(s) excluded because they no longer exist. Debt cannot be repaired in a deleted file, and counting one would pad the census that every RQI divides by.

## Hotspots (traffic × complexity)

| File | Commits | Traffic | Complexity | Hotspot | Authors |
|---|---|---|---|---|---|
| src/components/ResultsPhase.jsx | 58 | 0.43 | 77 | 0.32 | 4 |
| src/components/TableView.jsx | 128 | 0.57 | 47 | 0.26 | 4 |
| src/components/App.jsx | 192 | 0.75 | 33 | 0.24 | 4 |
| src/hooks/useProcessing.js | 40 | 0.22 | 102 | 0.22 | 3 |
| src/components/CollectionsSidebar.jsx | 59 | 0.32 | 47 | 0.15 | 3 |
| src/components/InputPhase.jsx | 67 | 0.42 | 33 | 0.14 | 4 |
| src/components/ToolbarSection.jsx | 44 | 0.27 | 48 | 0.13 | 4 |
| src/components/CardItem.jsx | 60 | 0.31 | 28 | 0.09 | 4 |
| src/hooks/useEditState.js | 31 | 0.17 | 48 | 0.08 | 4 |
| src/components/ProcessingPhase.jsx | 34 | 0.19 | 39 | 0.07 | 4 |
| src/hooks/useQuoteActions.js | 23 | 0.13 | 55 | 0.07 | 3 |
| src/contexts/QuotesContext.jsx | 37 | 0.18 | 33 | 0.06 | 3 |
| src/hooks/useViewPreferences.js | 25 | 0.12 | 44 | 0.05 | 2 |
| src/stores/quotesStore.js | 15 | 0.09 | 54 | 0.05 | 3 |
| src/components/AddMorePanel.jsx | 24 | 0.18 | 26 | 0.05 | 4 |
| api/_shared.js | 14 | 0.09 | 48 | 0.04 | 3 |
| src/components/EditForm.jsx | 33 | 0.18 | 22 | 0.04 | 4 |
| src/hooks/useSync.js | 30 | 0.17 | 23 | 0.04 | 4 |
| api/lookup.js | 15 | 0.09 | 40 | 0.04 | 2 |
| api/identify.js | 26 | 0.13 | 23 | 0.03 | 4 |

## Change coupling (files that move together)

| A | B | Co-changes | Strength |
|---|---|---|---|
| src/components/InputPhase.jsx | src/components/styles.js | 41 | 0.61 |
| src/components/CardItem.jsx | src/components/TableView.jsx | 38 | 0.63 |
| src/components/CardItem.jsx | src/components/styles.js | 30 | 0.50 |
| src/components/App.jsx | src/components/CardItem.jsx | 30 | 0.50 |
| src/components/App.jsx | src/contexts/QuotesContext.jsx | 26 | 0.70 |
| src/components/ToolbarSection.jsx | src/components/styles.js | 26 | 0.59 |
| src/components/App.jsx | src/hooks/useProcessing.js | 23 | 0.57 |
| src/components/QuoteActions.jsx | src/components/styles.js | 23 | 0.56 |
| src/components/HeaderBar.jsx | src/components/styles.js | 23 | 0.53 |
| src/components/HeaderBar.jsx | src/components/MiniHeader.jsx | 21 | 0.68 |
| src/components/ProcessingPhase.jsx | src/components/styles.js | 19 | 0.56 |
| src/components/App.jsx | src/components/ProcessingPhase.jsx | 19 | 0.56 |
| src/components/DupeModal.jsx | src/components/styles.js | 18 | 0.72 |
| src/contexts/QuotesContext.jsx | src/hooks/useSync.js | 18 | 0.60 |
| src/components/App.jsx | src/hooks/useSync.js | 17 | 0.57 |
| src/components/App.jsx | src/hooks/useQuoteActions.js | 16 | 0.70 |
| src/components/App.jsx | src/utils/helpers.js | 16 | 0.59 |
| src/components/App.jsx | src/hooks/useEditState.js | 16 | 0.52 |
| src/components/BulkBar.jsx | src/components/styles.js | 15 | 0.63 |
| src/components/StatsPanel.jsx | src/components/styles.js | 14 | 0.58 |

## Bus-factor-1 files (≥5 commits, ≥80% one author)

- src/components/CollectionsSidebar.jsx
- src/components/CardItem.jsx
- src/components/HeaderBar.jsx
- src/hooks/useProcessing.js
- src/components/ProcessingPhase.jsx
- src/contexts/QuotesContext.jsx
- src/hooks/useSync.js
- src/hooks/useEditState.js
- src/components/MiniHeader.jsx
- src/hooks/useQuoteActions.js
- src/hooks/useViewPreferences.js
- src/components/InlineEditors.jsx
- api/lookup.js
- src/components/CollectionDupeModal.jsx
- src/utils/export.js
- src/components/EmptyState.jsx
- api/sync.js
- src/components/HowItWorksAnimation.jsx
- src/utils/textFormatting.js
- api/fetch-url.js
- src/components/MobileSheet.jsx
- src/components/OnboardingModal.jsx
- src/components/ShortcutsModal.jsx
- src/contexts/ToastContext.jsx
- src/components/ConfirmModal.jsx
- src/components/Footer.jsx
- src/hooks/useToasts.js
- src/components/StatsOverlay.jsx
- supabase/migration.sql
- src/hooks/useKeyboardShortcuts.js
- src/utils/shareImage.js
- src/hooks/useLongPress.js
- src/components/HighlightText.jsx
- src/hooks/useSwipe.js
- src/hooks/useScrollLock.js
- src/utils/parsers.js
