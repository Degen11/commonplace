// ── Centralized configuration ──
// All tunable limits, thresholds, and durations in one place.

// Sync
export const SYNC_DEBOUNCE_MS       = 2000;
export const SYNC_MAX_RETRIES       = 4;
export const SYNC_INITIAL_DELAY_MS  = 2000;  // first retry after 2s, then 4s, 8s, 16s
export const SYNC_ERROR_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes between user-facing error toasts

// API
export const API_TIMEOUT_MS         = 30_000;
export const AUTO_GROUP_TIMEOUT_MS  = 45_000;
export const API_BATCH_SIZE         = 10;

// Toast
export const TOAST_DURATION_MS      = 2500;
export const TOAST_ACTION_DURATION_MS = 3500;  // longer for undo / action toasts
export const TOAST_EXIT_MS          = 180;

// UI animations
export const DELETE_ANIM_MS         = 200;
export const COPY_PULSE_MS          = 1200;
export const SAVED_PULSE_MS         = 600;
export const PHASE_TRANSITION_MS    = 200;
export const PROCESSING_DONE_MS     = 3000;
export const SEARCH_DEBOUNCE_MS     = 300;
export const DRAFT_SAVE_DEBOUNCE_MS = 500;
export const PERSIST_DEBOUNCE_MS    = 300;

// Storage
export const TOMBSTONE_TTL_MS       = 7 * 24 * 60 * 60 * 1000; // 7 days
export const STORAGE_WARN_BYTES     = 4 * 1024 * 1024;          // 4 MB

// Validation limits
export const MAX_QUOTE_TEXT_LENGTH  = 5000;
export const MAX_SOURCE_LENGTH      = 500;
export const MAX_CATEGORY_LENGTH    = 100;
export const MAX_NAME_LENGTH        = 50;
export const MAX_SHARE_ITEMS        = 10_000;

// Import
export const MAX_IMPORT_FILE_BYTES  = 5 * 1024 * 1024; // 5 MB

// Share link
export const SHARE_URL_WARN_LENGTH  = 2000;
export const SHARE_URL_MAX_LENGTH   = 8000;

// Duplicate detection
export const DUPE_SIMILARITY_THRESHOLD = 0.55;

// localStorage keys (single source of truth)
export const LS_QUOTES      = "commonplace_quotes";
export const LS_CATS        = "commonplace_cats";
export const LS_FILTERS     = "commonplace_filters";
export const LS_DRAFT       = "commonplace_draft";
export const LS_COL_ORDER   = "commonplace_col_order";
export const LS_DELETED_IDS = "commonplace_deleted_ids";
export const LS_COLLECTIONS = "commonplace_collections";
