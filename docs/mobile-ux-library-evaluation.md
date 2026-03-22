# Mobile UX Library Evaluation

Evaluated 2026-03-22 against the current Commonplace codebase.

## Current Mobile UX State

- **Gestures**: Swipe (via @use-gesture/react) and long-press (raw touch events) on CardItem
- **Layout**: Auto-switches to card view below 640px, BulkBar wraps, EditForm enlarges inputs
- **Virtualization**: TableView uses @tanstack/react-virtual; CardItem does NOT
- **Touch targets**: 36–40px minimums enforced via CSS media queries
- **Safe areas**: `env(safe-area-inset-*)` already applied to BulkBar and FAB
- **Sidebar**: CollectionsSidebar collapses to 48px icons on narrow viewports but has no mobile drawer pattern

## Recommendations

### Tier 1: Do These (High Impact, Low/Zero Cost)

#### 1. Virtualize Card View
- **Library**: @tanstack/react-virtual (already installed, v3.13.22)
- **Cost**: Zero new dependencies
- **Impact**: High — card view renders all paginated items to DOM; virtualizing would cut DOM nodes significantly for large collections
- **Where**: ResultsPhase.jsx card rendering section (currently CSS columns layout)
- **Consideration**: CSS columns layout is incompatible with virtualizer (needs fixed row heights or estimator). Would need to switch to a flex/grid layout with known dimensions, which may affect the masonry-like card stacking

#### 2. Haptic Feedback via navigator.vibrate()
- **Library**: None (built-in browser API)
- **Cost**: Zero
- **Impact**: Medium — adds tactile feedback to swipe-complete, delete, favorite, long-press-select
- **Where**: CardItem.jsx swipe handlers, useQuoteActions.js delete/favorite, useLongPress.js selection
- **Pattern**: `navigator.vibrate?.(10)` — one line per handler
- **Note**: Not supported on iOS Safari (silent no-op via optional chaining)

#### 3. Migrate useLongPress.js to @use-gesture/react
- **Library**: @use-gesture/react (already installed, v10.3.1)
- **Cost**: Zero new dependencies
- **Impact**: Medium — gains velocity-based detection, better scroll/press conflict resolution, consistency with useSwipe.js
- **Where**: src/hooks/useLongPress.js — replace raw onTouchStart/Move/End with useLongPress from @use-gesture
- **Benefit**: Single gesture system instead of split between library (swipe) and manual (long-press)

### Tier 2: Strong Candidates

#### 4. react-modal-sheet (Bottom Sheet)
- **Library**: react-modal-sheet
- **Cost**: ~one new dependency; built on motion (already installed)
- **Impact**: High — transforms mobile modals from overlay dialogs to native-feeling swipe-up drawers
- **Use cases**:
  - CollectionsSidebar on mobile → swipe-up drawer instead of cramped sticky panel
  - EditForm on mobile → drag-to-dismiss instead of modal overlay
  - BulkBar on mobile → bottom sheet with full action set (currently hides most actions)
- **Why over Vaul**: Vaul uses Radix Dialog; this project uses @base-ui/react + motion. react-modal-sheet integrates directly with the existing animation system

#### 5. clsx
- **Library**: clsx (~228B)
- **Cost**: Negligible bundle impact
- **Impact**: Low — code cleanliness improvement for conditional className patterns
- **Where**: Throughout components that conditionally apply CSS classes
- **Pattern**: `className={clsx({ 'bulk-bar-mobile': isMobile })}` vs ternary strings

### Tier 3: Not Recommended Now

#### 6. Vaul (Bottom Sheet)
- **Skip reason**: Redundant with react-modal-sheet. Vaul is Radix Dialog-based; this project uses @base-ui/react which is adjacent but not identical. react-modal-sheet fits the existing motion-based animation stack better

#### 7. Pull-to-Refresh Libraries
- **Skip reason**: Sync already triggers on mount. A pull-to-refresh gesture can be built with a few lines of @use-gesture/react drag detection rather than adding a new dependency. UX design decision more than library decision

#### 8. open-props (CSS Utilities)
- **Skip reason**: Project already has a well-defined design system — animation tiers in config.js, CSS custom properties for theming, consistent breakpoint system in styles.js. Adding open-props would create a parallel system

#### 9. Safe Area Handling
- **Skip reason**: Already implemented. styles.js uses `env(safe-area-inset-*)` with `@supports` feature detection on .bulk-bar-mobile and .mobile-fab

## Implementation Priority

1. **Virtualize card view** — biggest performance win, zero cost
2. **Haptic feedback** — easiest to add, instant UX improvement
3. **Consolidate gesture hooks** — consistency win, zero cost
4. **react-modal-sheet** — biggest UX transformation, one dependency
5. **clsx** — nice-to-have cleanup
