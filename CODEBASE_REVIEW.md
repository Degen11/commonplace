# Codebase Review: Commonplace

**Date:** 2026-03-06
**Scope:** Full codebase analysis — no code changes made

---

## 5 UI Enhancements

### 1. Replace faux-checkboxes and faux-tables with semantic HTML
The table view (`TableView.jsx`) uses flex-based `<div>` layouts instead of actual `<table>`/`<th>`/`<td>` elements, and checkboxes are styled divs rather than `<input type="checkbox">`. This hurts accessibility — screen readers can't announce row/column context and selection state is invisible to assistive technology. Swapping to real semantic elements with existing styles applied would be a major accessibility win with no visual change.

### 2. Add a visible drag handle to reorderable rows
Rows are draggable but there's no visual affordance — only the cursor changes. Users have no way to discover this feature. A small grip icon (e.g., `GripVertical` from lucide-react) on the left edge of each row would make drag-to-reorder discoverable. This also needs a keyboard alternative (e.g., Alt+Arrow to move selected items).

### 3. Fix inline category dropdown viewport clipping
The `InlineCategorySelect` in `TableView.jsx` (line 49) positions the dropdown with `position: absolute` but performs no boundary detection. When editing a quote near the bottom or right edge of the viewport, the dropdown renders off-screen. A simple check against `window.innerHeight` to flip the dropdown upward when near the bottom would fix this.

### 4. Consolidate sync status pill styling between HeaderBar and MiniHeader
The sync status indicators use slightly different font sizes (11px vs 10px), padding, and background values between `HeaderBar.jsx` (lines 20-23) and `MiniHeader.jsx` (lines 20-22). Extracting a shared `syncPillStyle` in `styles.js` would create visual consistency as users scroll between the full header and sticky mini-header.

### 5. Add a formatting preview before applying text cleanup
In `InputPhase.jsx`, the formatting toggle applies smart quotes, dash normalization, and capitalization fixes — but users can't preview what will change before committing. A small "Preview changes" expandable that shows a diff of before/after for a few sample entries would build trust and prevent surprises, especially for users pasting poetry or intentionally stylized text.

---

## 3 Small Features

### 1. Batch re-identify for low-confidence quotes
Currently users can only re-identify quotes one at a time via `QuoteActions.jsx`. Adding a "Re-identify all Unknown" or "Re-identify selected" button to the `BulkBar` would let users fix misidentified quotes in bulk. The infrastructure already exists — `useQuoteActions.reIdentify` just needs to be extended to accept an array and batch the API calls the same way `useProcessing` does.

### 2. Keyboard shortcuts cheat sheet
The app has useful shortcuts (Esc cascade, Ctrl+A select all, Shift+click range select, Enter to save edits) but none are documented in the UI. A small `?` button in the header that opens a shortcuts overlay would improve discoverability.

### 3. Undo support for bulk delete
Single-quote deletion has undo via a toast notification, but bulk delete in `BulkBar.jsx` is immediate and irreversible. The pattern already exists in `useQuoteActions.js` — store a snapshot before deletion and show an "Undo" action in the toast.

---

## 3 Big Features

### 1. Collections / Tags system
Currently all quotes live in a single flat list filtered only by category. Adding user-defined collections (e.g., "Favorites for essay," "Wedding speech," "Philosophy class") would let users organize quotes for specific purposes. This would require a new data model (`collections: [{id, name, quoteIds}]`), a sidebar or tab UI for switching collections, and updates to the sync/export pipeline.

### 2. User accounts and cross-device sync
The current device-based UUID sync means users can't access their collection from a new device without manual export/import. Adding lightweight authentication (e.g., magic link email via Supabase Auth) would enable true cross-device sync. The sync infrastructure in `useSync.js` is already solid — the main work is adding auth UI, migrating from `device_id` to `user_id`, and handling the migration path for existing anonymous users.

### 3. "Daily Quote" and discovery features
The local database of 600+ curated quotes is currently only used for identification matching. Surfacing this as a "Daily Quote" feature plus a "Discover" tab where users can browse and save quotes from the curated database would turn Commonplace from a quote *management* tool into a quote *discovery* platform.

---

## 3 Bugs

### 1. Similarity function division-by-zero with empty wordsets
**Location:** `src/utils/textFormatting.js` lines 152-164
**Problem:** The `similarity()` function computes `(overlap * 2) / (wa.size + wb.size)`, but if both input strings consist entirely of stopwords or normalize to empty strings, both `wa` and `wb` will be empty Sets, producing `0 / 0 = NaN`. This `NaN` propagates into duplicate detection in `useProcessing.js` (line 181), where `similarity(s, norm) > 0.55` evaluates to `false`, so duplicates won't be caught.
**Fix:** Guard with `if (wa.size + wb.size === 0) return 0;`

### 2. Sync push retries send stale data due to closure capture
**Location:** `src/hooks/useSync.js` lines 100-102
**Problem:** When a push fails, the retry is scheduled via `setTimeout(() => push(), retryMs)`. The `push()` function closes over `quotes`, `customCats`, and `deletedIds` from the render cycle when the retry was scheduled — not when it fires. If the user edits quotes during the retry delay (up to 16 seconds with exponential backoff), the retry sends old data, potentially overwriting recent edits on the server. Additionally, retry timeouts aren't tracked in `pushTimer.current`, so they survive component unmount.
**Fix:** Read current state from refs inside `push()` rather than closing over stale values, and track retry timeouts for cleanup.

### 3. Proper noun capitalization corrupts words containing proper noun substrings
**Location:** `src/utils/textFormatting.js` lines 115-118
**Problem:** Proper noun restoration uses `new RegExp(lower, "gi")` without word boundary anchors. If the proper noun database contains "john", the regex matches and corrupts words like "johnson" → "Johnson" (incorrect mid-word capitalization).
**Fix:** Wrap the pattern with `\b` word boundaries: `new RegExp('\\b' + lower + '\\b', 'gi')`
