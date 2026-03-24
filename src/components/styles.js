export const CP_ACCENT       = "#3C5775";
export const CP_ACCENT_MUTED = "rgba(60,87,117,0.12)";
export const CP_ACCENT_TEXT  = "#2D4259";

// ── Shared design constants ──
// Eliminates hardcoded font stacks and color literals across components.
export const FONT_SANS  = "'Satoshi',-apple-system,sans-serif";
export const FONT_SERIF = "'Playfair Display',Georgia,serif";

// Semantic color palette — replaces scattered hex literals
export const CLR_RED     = "#DC2626";
export const CLR_GREEN   = "#16A34A";
export const CLR_BLUE    = "#2563EB";
export const CLR_AMBER   = "#D97706";
export const CLR_ORANGE  = "#EA580C";
export const CLR_VIOLET  = "#7C3AED";
export const CLR_EMERALD = "#059669";

// z-index scale: 50 pills, 59 overlays, 60 mini-header, 100 dropdowns, 200 tooltips, 500 bulk bar, 1000 modals, 2000 toasts
export const baseCSS = `
  :root{
    --cp-bg:#FAF8F4;--cp-bg-card:#FFFFFF;--cp-bg-panel:#FAFAFA;--cp-bg-hover:rgba(55,53,47,0.05);
    --cp-bg-tab:#F0EDE6;--cp-bg-input:#FFFFFF;--cp-bg-selected:#F0F7FF;--cp-bg-attention:rgba(234,88,12,0.06);--cp-bg-fav:#FFFDF5;--cp-fav-accent:#F59E0B;
    --cp-text:#1A1814;--cp-text-secondary:#37352F;--cp-text-muted:#9B9A97;--cp-text-faint:#C8C4BC;
    --cp-border:#E3E2DE;--cp-border-light:#E8E3DA;--cp-border-dim:#D3D3D0;
    --cp-shadow-card:0 2px 16px rgba(26,24,20,0.06);--cp-shadow-md:0 4px 16px rgba(0,0,0,.1);
    --cp-overlay:rgba(0,0,0,0.4);--cp-toast-bg:#37352F;--cp-toggle-off:#E0DCD4;
    --cp-mini-bg:rgba(250,248,244,0.72);
    --cp-accent:#3C5775;
    --cp-error-bg:#FEF2F2;--cp-error-border:#FECACA;--cp-error-text:#991B1B;
    --cp-warning-bg:#FFF7ED;--cp-warning-border:#FDBA74;--cp-warning-text:#9A3412;
    --cp-destructive:#EB5757;--cp-destructive-hover:#D64545;
    --cp-bulk-bg:rgba(30,42,56,0.95);--cp-bulk-border:rgba(255,255,255,0.08);--cp-bulk-divider:rgba(255,255,255,0.12);
    --cp-bulk-text:#E8E8E8;--cp-bulk-muted:rgba(255,255,255,0.45);
    --cp-bulk-badge:#fff;--cp-bulk-badge-text:#1A1814;
    --cp-bulk-input-bg:rgba(255,255,255,0.1);--cp-bulk-input-border:rgba(255,255,255,0.15);
    --cp-fav-chip-bg:#FEF3C7;--cp-fav-chip-border:#FDE68A;--cp-fav-chip-text:#D97706;
    --cp-suggest-bg:rgba(5,150,105,0.08);--cp-suggest-border:rgba(5,150,105,0.2);--cp-suggest-btn:#059669;
    --cp-conf-high:#16A34A;--cp-conf-medium:#D97706;--cp-conf-low:#DC2626;
    --cp-focus-ring:rgba(60,87,117,0.5);
    --cp-drag-insert:#3C5775;
    --cp-selection-bg:rgba(60,87,117,0.18);
  }
  html.dark{
    --cp-bg:#1A1A1A;--cp-bg-card:#262626;--cp-bg-panel:#222222;--cp-bg-hover:rgba(255,255,255,0.06);
    --cp-bg-tab:#2E2E2E;--cp-bg-input:#2A2A2A;--cp-bg-selected:rgba(35,131,226,0.15);--cp-bg-attention:rgba(234,88,12,0.07);--cp-bg-fav:rgba(250,204,21,0.06);--cp-fav-accent:rgba(250,204,21,0.4);
    --cp-text:#E8E8E8;--cp-text-secondary:#CCCCCC;--cp-text-muted:#9A9A9A;--cp-text-faint:#7A7A7A;
    --cp-border:#3A3A3A;--cp-border-light:#343434;--cp-border-dim:#4A4A4A;
    --cp-shadow-card:0 2px 16px rgba(0,0,0,0.3);--cp-shadow-md:0 4px 16px rgba(0,0,0,.3);
    --cp-overlay:rgba(0,0,0,0.6);--cp-toast-bg:#3A3A3A;--cp-toggle-off:#4A4A4A;
    --cp-mini-bg:rgba(26,26,26,0.72);
    --cp-accent:#90B4D4;
    --cp-error-bg:rgba(127,29,29,0.2);--cp-error-border:rgba(220,38,38,0.3);--cp-error-text:#FCA5A5;
    --cp-warning-bg:rgba(154,52,18,0.15);--cp-warning-border:rgba(234,88,12,0.3);--cp-warning-text:#FDBA74;
    --cp-destructive:#EF4444;--cp-destructive-hover:#DC2626;
    --cp-bulk-bg:rgba(50,50,50,0.95);--cp-bulk-border:rgba(255,255,255,0.08);--cp-bulk-divider:rgba(255,255,255,0.1);
    --cp-bulk-text:#E8E8E8;--cp-bulk-muted:rgba(255,255,255,0.4);
    --cp-bulk-badge:#90B4D4;--cp-bulk-badge-text:#1A1A1A;
    --cp-bulk-input-bg:rgba(255,255,255,0.08);--cp-bulk-input-border:rgba(255,255,255,0.12);
    --cp-fav-chip-bg:rgba(250,204,21,0.10);--cp-fav-chip-border:rgba(250,204,21,0.25);--cp-fav-chip-text:rgba(250,204,21,0.7);
    --cp-suggest-bg:rgba(5,150,105,0.12);--cp-suggest-border:rgba(5,150,105,0.3);--cp-suggest-btn:#10B981;
    --cp-conf-high:rgba(74,222,128,0.7);--cp-conf-medium:rgba(251,191,36,0.6);--cp-conf-low:rgba(248,113,113,0.6);
    --cp-focus-ring:rgba(144,180,212,0.5);
    --cp-drag-insert:#90B4D4;
    --cp-selection-bg:rgba(90,137,181,0.3);
  }
  @media(prefers-color-scheme:dark){
    html:not(.light){
      --cp-bg:#1A1A1A;--cp-bg-card:#262626;--cp-bg-panel:#222222;--cp-bg-hover:rgba(255,255,255,0.06);
      --cp-bg-tab:#2E2E2E;--cp-bg-input:#2A2A2A;--cp-bg-selected:rgba(35,131,226,0.15);--cp-bg-attention:rgba(234,88,12,0.07);--cp-bg-fav:rgba(250,204,21,0.06);--cp-fav-accent:rgba(250,204,21,0.4);
      --cp-text:#E8E8E8;--cp-text-secondary:#CCCCCC;--cp-text-muted:#9A9A9A;--cp-text-faint:#7A7A7A;
      --cp-border:#3A3A3A;--cp-border-light:#343434;--cp-border-dim:#4A4A4A;
      --cp-shadow-card:0 2px 16px rgba(0,0,0,0.3);--cp-shadow-md:0 4px 16px rgba(0,0,0,.3);
      --cp-overlay:rgba(0,0,0,0.6);--cp-toast-bg:#3A3A3A;--cp-toggle-off:#4A4A4A;
      --cp-mini-bg:rgba(26,26,26,0.72);
      --cp-accent:#90B4D4;
      --cp-error-bg:rgba(127,29,29,0.2);--cp-error-border:rgba(220,38,38,0.3);--cp-error-text:#FCA5A5;
      --cp-warning-bg:rgba(154,52,18,0.15);--cp-warning-border:rgba(234,88,12,0.3);--cp-warning-text:#FDBA74;
      --cp-destructive:#EF4444;--cp-destructive-hover:#DC2626;
      --cp-bulk-bg:rgba(50,50,50,0.95);--cp-bulk-border:rgba(255,255,255,0.08);--cp-bulk-divider:rgba(255,255,255,0.1);
      --cp-bulk-text:#E8E8E8;--cp-bulk-muted:rgba(255,255,255,0.4);
      --cp-bulk-badge:#90B4D4;--cp-bulk-badge-text:#1A1A1A;
      --cp-bulk-input-bg:rgba(255,255,255,0.08);--cp-bulk-input-border:rgba(255,255,255,0.12);
      --cp-fav-chip-bg:rgba(250,204,21,0.10);--cp-fav-chip-border:rgba(250,204,21,0.25);--cp-fav-chip-text:rgba(250,204,21,0.7);
      --cp-suggest-bg:rgba(5,150,105,0.12);--cp-suggest-border:rgba(5,150,105,0.3);--cp-suggest-btn:#10B981;
      --cp-conf-high:rgba(74,222,128,0.7);--cp-conf-medium:rgba(251,191,36,0.6);--cp-conf-low:rgba(248,113,113,0.6);
      --cp-focus-ring:rgba(144,180,212,0.5);
      --cp-drag-insert:#90B4D4;
      --cp-selection-bg:rgba(90,137,181,0.3);
    }
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--cp-bg);color:var(--cp-text);font-family:'Satoshi',-apple-system,sans-serif}

  /* Smooth theme transition — CSS custom property crossfade (fallback when View Transitions unavailable) */
  :root{transition:background-color .3s ease,color .3s ease}
  body{transition:background-color .3s ease,color .3s ease}
  .theme-transitioning,.theme-transitioning *,.theme-transitioning *::before,.theme-transitioning *::after{transition:background-color .3s ease,background .3s ease,color .3s ease,border-color .3s ease,box-shadow .3s ease,fill .3s ease !important}

  /* View Transition API — radial wipe for theme toggle */
  ::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}
  ::view-transition-old(root){z-index:1}
  ::view-transition-new(root){z-index:9999}
  ::selection{background:var(--cp-selection-bg)}
  html.dark ::selection{background:var(--cp-selection-bg)}
  @media(prefers-color-scheme:dark){html:not(.light) ::selection{background:var(--cp-selection-bg)}}
  textarea:focus,input:focus,select:focus{outline:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes staggerIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideD{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes savePulse{0%{background-color:rgba(5,150,105,0.12);border-radius:4px}100%{background-color:transparent}}
  @keyframes tpDot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
  @keyframes bulkSlideUp{0%{opacity:0;transform:translateY(100%)}60%{opacity:1;transform:translateY(-4px)}80%{transform:translateY(1px)}100%{transform:translateY(0)}}
  @keyframes overlayFade{from{opacity:0}to{opacity:1}}
  @keyframes exitFade{to{opacity:0}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes menuIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
  @keyframes modalScaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
  @keyframes backdropBlurIn{from{opacity:0;backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px)}to{opacity:1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}}
  @keyframes toastSlideIn{0%{opacity:0;transform:translateY(16px) scale(0.92)}40%{opacity:1;transform:translateY(-5px) scale(1.02)}65%{transform:translateY(1px) scale(0.99)}80%{transform:translateY(-1px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes copyPush{0%{transform:scale(1)}30%{transform:scale(.78)}60%{transform:scale(1.08)}80%{transform:scale(.97)}100%{transform:scale(1)}}
  @keyframes favPop{0%{transform:scale(1)}20%{transform:scale(0.75)}50%{transform:scale(1.18)}70%{transform:scale(0.95)}85%{transform:scale(1.04)}100%{transform:scale(1)}}
  @keyframes exitSlideLeft{to{opacity:0;transform:translateX(-24px)}}
  @keyframes shareLift{0%{transform:translateY(0)}40%{transform:translateY(-3px)}100%{transform:translateY(0)}}
  @keyframes completePop{0%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.15)}70%{transform:scale(0.95)}85%{transform:scale(1.04)}100%{transform:scale(1)}}
  @keyframes dropGlow{0%,100%{outline-color:rgba(60,87,117,0.35)}50%{outline-color:rgba(60,87,117,0.8)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .skeleton-row{display:flex;align-items:center;padding:12px 0;gap:12px;border-bottom:1px solid var(--cp-border)}
  .skeleton-bar{border-radius:4px;background:linear-gradient(90deg,var(--cp-border) 25%,var(--cp-bg-hover) 50%,var(--cp-border) 75%);background-size:200% 100%;animation:shimmer 1.8s ease infinite}
  @keyframes miniHeaderIn{0%{opacity:0;transform:translateY(-100%);backdrop-filter:blur(0) saturate(100%);-webkit-backdrop-filter:blur(0) saturate(100%)}50%{opacity:1;transform:translateY(0);backdrop-filter:blur(4px) saturate(120%);-webkit-backdrop-filter:blur(4px) saturate(120%)}100%{opacity:1;transform:translateY(0);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%)}}
  .spin{animation:spin 1s linear infinite}
  .copy-push{animation:copyPush .35s cubic-bezier(0.34,1.56,0.64,1)}
  .share-lift{animation:shareLift .25s ease}
  .fav-pop{animation:favPop .45s cubic-bezier(0.34,1.56,0.64,1)}
  .phase-in{animation:fadeUp .25s ease}.phase-out{opacity:0;transition:opacity .15s ease}
  html{scroll-behavior:smooth;scrollbar-gutter:stable}
  div[style]:focus{outline:none;border-color:transparent}

  /* Base UI — Menu item highlight on hover/keyboard navigation */
  .overflow-menu-item[data-highlighted],
  .hdr-overflow-item[data-highlighted]{background:var(--cp-bg-hover) !important}
  .overflow-menu-item-destructive[data-highlighted],
  .hdr-overflow-destructive[data-highlighted]{background:rgba(220,38,38,0.06) !important}
  .overflow-menu-item-fav[data-highlighted]{background:rgba(245,158,11,0.08) !important;color:#D97706 !important}
  /* Base UI — Dialog/Popover/Menu reset: prevent Base UI from injecting font overrides */
  [data-base-ui-popup]{font-family:'Satoshi',-apple-system,sans-serif}

  /* Fix 2 — column header drag handle - COMPLETELY REMOVE SHADOW */
  .col-drag-header{
    cursor:grab;
    user-select:none;
    transition:background .15s;
    border-radius:4px;
    padding:2px 0;
    margin:-2px 0;
  }
  .col-drag-header:hover{
    background:var(--cp-bg-hover);
  }
  .col-drag-header:active{cursor:grabbing}

  /*
   * Why !important: Base styles are applied inline via style={} props (e.g. styles.row,
   * styles.catPill) which have higher specificity than any CSS selector. Interactive
   * states (:hover, :active, :disabled) and responsive overrides (@media) must use
   * !important to win over inline styles. This is inherent to the inline-style architecture.
   */

  /* Row interactions (optimized) */
  .qrow{cursor:default;transition:background 0.1s ease}
  .qrow:hover{background:var(--cp-bg-hover) !important}
  .qrow:hover .checkbox-visual{opacity:1 !important}

  /* Drag handle — visible on row hover */
  .drag-handle{opacity:0;transition:opacity .12s;cursor:grab;color:var(--cp-text-faint);display:flex;align-items:center}
  .drag-handle:active{cursor:grabbing}
  .qrow:hover .drag-handle{opacity:0.5}
  .qrow:hover .drag-handle:hover{opacity:1}

  /* Inline edit affordances */
  .inline-src{cursor:text !important;transition:color .12s}
  .inline-src:hover{color:var(--cp-text-secondary) !important;text-decoration:underline;text-decoration-style:dotted;text-decoration-color:rgba(55,53,47,0.35)}
  .inline-cat{cursor:pointer !important;transition:opacity .12s,background .12s}
  .inline-cat:hover{opacity:0.75 !important;background:rgba(60,87,117,0.08) !important}

  /* Edit hint icons — appear on hover to signal click-to-edit */
  .edit-hint{opacity:0;transition:opacity .12s;flex-shrink:0;pointer-events:none}
  .qrow:hover .edit-hint,.qcard:hover .edit-hint{opacity:0.45}
  @media(max-width:640px){.edit-hint{opacity:0.35}}

  /* Checkbox hover affordance */
  .checkbox-visual:hover{border-color:var(--cp-accent) !important;background:rgba(60,87,117,0.08);transform:scale(1.05)}

  .dd-opt:hover,.dd-opt[data-highlighted]{background:var(--cp-bg-hover) !important}
  .proc-btn:hover:not(:disabled){box-shadow:0 2px 8px rgba(55,53,47,.25);transform:translateY(-1px)}
  .proc-btn{transition:all .15s ease}
  .try-btn:hover{background:var(--cp-bg-tab) !important}
  .tab-btn:hover{background:var(--cp-bg-hover) !important}
  .drop-zone{transition:all .2s ease}
  .how-card{transition:background .2s ease,transform .2s ease}
  .how-card:hover{background:var(--cp-bg-card);transform:translateY(-2px)}
  /* General-purpose UI tooltip (extends conf-tooltip pattern) */
  .ui-tip{position:relative}
  .ui-tip::after{
    content:attr(data-tip);
    position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);
    background:var(--cp-toast-bg);color:#fff;padding:4px 10px;border-radius:5px;
    font-size:11px;font-weight:400;white-space:nowrap;
    opacity:0;pointer-events:none;z-index:200;
    transition:opacity .12s ease .2s;
  }
  .ui-tip:hover::after{opacity:1}
  .ui-tip:active::after{opacity:0;transition:none}
  .ui-tip-below::after{bottom:auto;top:calc(100% + 6px)}
  .ui-tip-left::after{left:auto;right:0;transform:none}

  /* Drag insertion indicator */
  .drag-insert-above{box-shadow:inset 0 2px 0 var(--cp-drag-insert) !important}
  .drag-insert-below{box-shadow:inset 0 -2px 0 var(--cp-drag-insert) !important}

  /* Category pills horizontal scroll */
  .cat-scroll::-webkit-scrollbar{display:none}
  .cat-scroll{-ms-overflow-style:none;scrollbar-width:none}

  /* Focus-visible accessibility */
  button:focus-visible,a:focus-visible{outline:2px solid var(--cp-focus-ring);outline-offset:2px;border-radius:4px}
  input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--cp-focus-ring);outline-offset:1px}
  .check:focus-visible{outline:2px solid var(--cp-focus-ring);outline-offset:2px}

  /* Save pulse for inline edits */
  .save-pulse{animation:savePulse .4s ease}
  /* Full-row highlight for newly added quotes */
  .new-quote-pulse{animation:savePulse 1s ease}

  /* Header button hover states */
  .hdr-btn{transition:all .15s ease}
  .hdr-btn:hover{background:var(--cp-bg-hover)}
  .hdr-overflow-item:hover{background:var(--cp-bg-hover) !important}
  .hdr-overflow-destructive:hover{background:rgba(220,38,38,0.08) !important;color:#DC2626 !important}
  html.dark .hdr-overflow-destructive:hover{background:rgba(220,38,38,0.15) !important;color:#EF4444 !important}
  .sidebar-dupes-btn:hover{background:var(--cp-bg-hover) !important;border-color:var(--cp-border-dim) !important}
  .sidebar-dupes-btn:active{background:var(--cp-bg-tab) !important;transform:scale(0.97)}
  .new-batch-btn.hdr-btn:hover{background:rgba(220,38,38,0.06);color:#DC2626;border-color:#FECACA}
  .load-more-btn{transition:all .15s ease}
  .load-more-btn:hover{background:rgba(59,130,246,0.08) !important;border-color:rgba(59,130,246,0.3) !important}

  /* Confirm modal button hovers */
  .confirm-cancel:hover{background:var(--cp-bg-hover) !important;border-color:var(--cp-border-dim) !important}
  .confirm-yes:hover{opacity:.9}
  .dismiss-link:hover{opacity:.7}

  /* Action button hover — driven by --hover-color custom property */
  .act-btn:hover{color:var(--hover-color) !important}

  /* Overflow menu — hidden until row/card hover */
  .overflow-btn{opacity:0;transition:opacity .12s ease}
  .qrow:hover .overflow-btn{opacity:1}
  .qcard:hover .overflow-btn{opacity:1}
  .overflow-menu-item svg{transition:color .15s ease}
  .overflow-menu-item:hover{background:var(--cp-bg-hover) !important}
  .overflow-copy:hover svg{color:#2383E2 !important}
  .overflow-reidentify:hover svg{color:#EA580C !important}
  .overflow-share:hover svg{color:#7C3AED !important}
  .overflow-menu-item-destructive svg{transition:color .15s ease}
  .overflow-menu-item-destructive:hover{background:rgba(220,38,38,0.08) !important;color:#DC2626 !important}
  .overflow-menu-item-destructive:hover svg{color:#DC2626 !important}

  /* Button press feedback — subtle scale on mousedown */
  .hdr-btn:active,.proc-btn:active:not(:disabled),.confirm-cancel:active,.confirm-yes:active,.hp-primary:active,.try-btn:active,.bulk-apply:active:not(:disabled),.bulk-del:active,.bulk-reidentify:active:not(:disabled){transform:scale(0.97) !important;transition:transform .1s ease !important}
  .view-btn:active{transform:scale(0.94) !important;transition:transform .1s ease !important}

  /* List shuffle — triggered on sort/filter change for smooth staggered re-entrance */
  @keyframes listShuffle{from{opacity:0.3;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .list-shuffle .qrow,.list-shuffle .qcard{animation:listShuffle .3s cubic-bezier(0.16,1,0.3,1) both}
  .list-shuffle .qrow:nth-child(1),.list-shuffle .qcard:nth-child(1){animation-delay:0s}
  .list-shuffle .qrow:nth-child(2),.list-shuffle .qcard:nth-child(2){animation-delay:.02s}
  .list-shuffle .qrow:nth-child(3),.list-shuffle .qcard:nth-child(3){animation-delay:.04s}
  .list-shuffle .qrow:nth-child(4),.list-shuffle .qcard:nth-child(4){animation-delay:.06s}
  .list-shuffle .qrow:nth-child(5),.list-shuffle .qcard:nth-child(5){animation-delay:.08s}
  .list-shuffle .qrow:nth-child(6),.list-shuffle .qcard:nth-child(6){animation-delay:.1s}
  .list-shuffle .qrow:nth-child(7),.list-shuffle .qcard:nth-child(7){animation-delay:.12s}
  .list-shuffle .qrow:nth-child(8),.list-shuffle .qcard:nth-child(8){animation-delay:.14s}
  .list-shuffle .qrow:nth-child(9),.list-shuffle .qcard:nth-child(9){animation-delay:.16s}
  .list-shuffle .qrow:nth-child(10),.list-shuffle .qcard:nth-child(10){animation-delay:.18s}
  .list-shuffle .qrow:nth-child(n+11),.list-shuffle .qcard:nth-child(n+11){animation-delay:.2s}

  /* Staggered entrance for table rows — uses nth-child for cascade */
  .stagger-in .qrow{animation:staggerIn .2s ease both}
  .stagger-in .qrow:nth-child(1){animation-delay:0s}
  .stagger-in .qrow:nth-child(2){animation-delay:.03s}
  .stagger-in .qrow:nth-child(3){animation-delay:.06s}
  .stagger-in .qrow:nth-child(4){animation-delay:.09s}
  .stagger-in .qrow:nth-child(5){animation-delay:.12s}
  .stagger-in .qrow:nth-child(6){animation-delay:.15s}
  .stagger-in .qrow:nth-child(7){animation-delay:.18s}
  .stagger-in .qrow:nth-child(8){animation-delay:.21s}
  .stagger-in .qrow:nth-child(9){animation-delay:.24s}
  .stagger-in .qrow:nth-child(10){animation-delay:.27s}
  .stagger-in .qrow:nth-child(n+11){animation-delay:.3s}

  /* Card hover lift */
  .qcard{transition:border-color .15s ease, box-shadow .15s ease, transform .2s ease !important}
  .qcard:hover{transform:translateY(-2px) !important;box-shadow:var(--cp-shadow-card),0 4px 12px rgba(0,0,0,0.06) !important}

  /* Disabled cursor */
  button:disabled{cursor:not-allowed !important}

  /* View toggle button hover */
  .view-btn{transition:background .12s ease,color .12s ease}
  .view-btn:hover{background:var(--cp-bg-hover) !important;color:var(--cp-text-secondary) !important}

  /* Category pill interactions */
  .cat-pill{transition:background .15s ease,color .15s ease,opacity .15s ease;user-select:none}
  .cat-pill:hover{border-color:var(--cp-border-dim);background:var(--cp-bg-hover)}

  /* Filter chip hover (empty state, attention bar) */
  .filter-chip{transition:all .12s ease}
  .filter-chip:hover{border-color:var(--cp-border-dim) !important;background:var(--cp-bg-hover) !important}

  /* Bulk bar button hover states (dark-bg context) */
  .bulk-apply{transition:opacity .12s ease}
  .bulk-apply:hover:not(:disabled){opacity:.85}
  .bulk-del{transition:all .12s ease}
  .bulk-del:hover{background:rgba(248,113,113,0.15) !important;border-color:rgba(248,113,113,0.5) !important}
  .bulk-reidentify{transition:all .12s ease}
  .bulk-reidentify:hover:not(:disabled){background:rgba(255,255,255,0.08) !important}

  /* Attention bar dismiss hover */
  .attention-dismiss{transition:opacity .12s ease}
  .attention-dismiss:hover{opacity:1 !important}

  /* Reset/clear filter button hover */
  .reset-btn{transition:all .12s ease}
  .reset-btn:hover{background:var(--cp-bg-hover) !important;color:var(--cp-text-secondary) !important}

  /* Responsive: stack split layout on small screens */
  @media (max-width: 768px) {
    .split-layout { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .dupe-compare { grid-template-columns: 1fr !important; }
  }

  /* ═══════════ Homepage redesign ═══════════ */
  .hp-primary{transition:all .2s ease}
  .hp-primary:hover{box-shadow:0 4px 16px rgba(60,87,117,0.3);transform:translateY(-1px)}
  .hp-feature-card{transition:all .2s ease}
  .hp-feature-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08)}
  html.dark .hp-primary:hover{box-shadow:0 4px 16px rgba(60,87,117,0.5)}

  /* Hero split → stack on tablet */
  @media (max-width: 900px) {
    .hp-hero{grid-template-columns:1fr !important;text-align:center;gap:32px !important;min-height:auto !important;padding:80px 32px 48px !important}
    .hp-hero-headline{font-size:38px !important;letter-spacing:-1.5px !important}
    .hp-hero-sub{max-width:none !important;font-size:17px !important}
    .hp-mini-demo{text-align:left !important}
    .hp-features-grid{grid-template-columns:repeat(2, 1fr) !important}
    .hp-how-split{grid-template-columns:1fr !important;text-align:center;gap:32px !important}
    .hp-timeline-cols{grid-template-columns:repeat(2, 1fr) !important}
    .hp-section{padding:60px 32px !important}
  }
  @media (max-width: 600px) {
    .hp-features-grid{grid-template-columns:1fr !important}
    .hp-hero-sub{max-width:none !important}
    .hp-hero-headline{font-size:32px !important;letter-spacing:-1px !important}
    .hp-hero-sub{font-size:16px !important}
    .hp-section{padding:48px 20px !important}
    .hp-hero{padding:80px 20px 40px !important}
    .hp-timeline-cols{grid-template-columns:1fr !important}
  }
  @media (max-width: 480px) {
    .hp-hero-headline{font-size:28px !important}
    .hp-timeline-quote{flex-direction:column !important;align-items:flex-start !important;gap:4px !important}
  }

  /* Dark mode — element-level overrides */
  html.dark .inline-src:hover{color:var(--cp-text) !important;text-decoration-color:rgba(200,200,200,0.35)}
  html.dark .new-batch-btn.hdr-btn:hover{background:rgba(220,38,38,0.15) !important;color:#EF4444 !important;border-color:rgba(220,38,38,0.3) !important}
  html.dark .load-more-btn:hover{background:rgba(90,137,181,0.1) !important;border-color:rgba(90,137,181,0.3) !important}
  html.dark .overflow-menu-item-destructive:hover{background:rgba(220,38,38,0.12) !important}
  html.dark .proc-btn:hover:not(:disabled){box-shadow:0 2px 8px rgba(0,0,0,.4)}
  html.dark input,html.dark textarea,html.dark select{background-color:var(--cp-bg-input) !important;color:var(--cp-text) !important}

  /* Toast spring entrance animation + type-colored left borders */
  @keyframes toastIconPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.2)}70%{transform:scale(0.9)}100%{transform:scale(1);opacity:1}}
  @keyframes toastContentSlide{0%{opacity:0;transform:translateX(6px)}100%{opacity:1;transform:translateX(0)}}
  [data-sonner-toast][data-mounted="true"]{animation:toastSlideIn .45s cubic-bezier(0.34,1.56,0.64,1) !important}
  [data-sonner-toast][data-mounted="true"] [data-icon]{animation:toastIconPop .4s cubic-bezier(0.34,1.56,0.64,1) .05s both !important}
  [data-sonner-toast][data-mounted="true"] [data-content]{animation:toastContentSlide .3s ease .08s both !important}
  [data-sonner-toast][data-type="success"]{border-left:3px solid #16A34A !important}
  [data-sonner-toast][data-type="error"]{border-left:3px solid #DC2626 !important}
  [data-sonner-toast][data-type="info"]{border-left:3px solid #3B82F6 !important}
  [data-sonner-toast][data-removed="true"]{animation:toastExit .25s cubic-bezier(0.4,0,1,1) forwards !important}
  @keyframes toastExit{to{opacity:0;transform:translateY(8px) scale(0.95)}}

  /* ═══════════ Mobile-first optimizations ═══════════ */

  /* Safe area insets for notch/home bar devices */
  @supports(padding-bottom:env(safe-area-inset-bottom)){
    .bulk-bar-mobile{padding-bottom:calc(8px + env(safe-area-inset-bottom)) !important}
    .mobile-fab{bottom:calc(20px + env(safe-area-inset-bottom)) !important}
  }

  /* Mobile touch targets — enforce 44px minimum */
  @media(max-width:640px){
    .hdr-btn{min-height:40px;min-width:40px;display:inline-flex;align-items:center;justify-content:center}
    .view-btn{min-height:36px;min-width:36px}
    .cat-pill{min-height:36px;padding:6px 12px !important}
    .check-div{display:flex;align-items:center;justify-content:center}

    /* Show overflow menu + edit hints on mobile (no hover) */
    .overflow-btn{opacity:1 !important}
    .edit-hint{opacity:0.4 !important}

    /* Disable hover-lift on cards for mobile (prevents stuck transforms on touch) */
    .qcard:hover{transform:none !important;box-shadow:var(--cp-shadow-card) !important}

    /* Active tap feedback for interactive elements */
    .qcard:active{transform:scale(0.985) !important;transition:transform .1s ease !important}
    .cat-pill:active{transform:scale(0.95) !important;transition:transform .08s ease !important}
    .hdr-btn:active{transform:scale(0.93) !important;transition:transform .08s ease !important}
    .overflow-menu-item:active,.hdr-overflow-item:active{background:var(--cp-bg-hover) !important}

    /* Better scroll performance */
    .cat-scroll{-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
    .cat-pill{scroll-snap-align:start}

    /* Prevent text selection on interactive mobile elements */
    .qcard,.qrow,.cat-pill,.hdr-btn{-webkit-user-select:none;user-select:none}

    /* Tooltips — hide on mobile (they require hover) */
    .ui-tip::after{display:none !important}

    /* Tighter wrap padding on mobile */
    .cp-wrap{padding-left:16px !important;padding-right:16px !important}

    /* Sort dropdown full width on mobile */
    .mobile-sort-drop{left:auto !important;right:0 !important;min-width:180px !important}

    /* BulkBar responsive — allow wrapping on mobile */
    .bulk-bar-mobile{flex-wrap:wrap !important;width:calc(100vw - 16px) !important;gap:6px !important;padding:10px !important;bottom:8px !important}
    .bulk-bar-mobile .bulk-divider-hide{display:none !important}
  }

  /* Small phones (iPhone SE etc) */
  @media(max-width:375px){
    .cat-pill{font-size:11px !important;padding:5px 8px !important;min-height:32px}
  }
`;

// ── Shared sync status pill — used by both HeaderBar and MiniHeader ──
const syncPillBase = {
  fontWeight: 500,
  borderRadius: 4,
  fontFamily: FONT_SANS,
  letterSpacing: 0.2,
  whiteSpace: "nowrap",
  alignSelf: "center",
};
export const syncPillStyles = {
  full: {
    syncing: { ...syncPillBase, fontSize: 11, padding: "2px 8px", lineHeight: "16px", color: "var(--cp-text-muted)", background: "var(--cp-bg-tab)" },
    synced:  { ...syncPillBase, fontSize: 11, padding: "2px 8px", lineHeight: "16px", color: "#16A34A", background: "rgba(34,197,94,0.10)" },
    error:   { ...syncPillBase, fontSize: 11, padding: "2px 8px", lineHeight: "16px", color: "#DC2626", background: "rgba(220,38,38,0.10)" },
  },
  mini: {
    syncing: { ...syncPillBase, fontSize: 10, padding: "1px 6px", lineHeight: "14px", color: "var(--cp-text-muted)", background: "var(--cp-bg-tab)" },
    synced:  { ...syncPillBase, fontSize: 10, padding: "1px 6px", lineHeight: "14px", color: "#16A34A", background: "rgba(34,197,94,0.10)" },
    error:   { ...syncPillBase, fontSize: 10, padding: "1px 6px", lineHeight: "14px", color: "#DC2626", background: "rgba(220,38,38,0.10)" },
  },
};

export const styles = {
  // Layout
  wrap:{maxWidth:1120,margin:"0 auto",padding:"0 32px 80px",fontFamily:FONT_SANS,fontSize:14,color:"var(--cp-text)",minHeight:"100vh",background:"var(--cp-bg)"},

  // Nav
  nav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"26px 0 22px",borderBottom:"1px solid var(--cp-border-light)"},
  navLogo:{fontFamily:FONT_SERIF,fontSize:19,fontWeight:700,letterSpacing:"-0.3px",color:"var(--cp-text)",textDecoration:"none"},
  navRight:{display:"flex",alignItems:"center",gap:28,fontSize:13,color:"var(--cp-text-muted)"},

  // Landing
  landing:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:44},

  // Split layout (replaces old hero)
  splitLayout:{display:"grid",gridTemplateColumns:"5fr 6fr",gap:40,alignItems:"stretch",width:"100%",animation:"fadeUp .5s ease"},
  splitLeft:{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:24,paddingTop:8},
  splitRight:{display:"flex",flexDirection:"column",gap:16},

  // Hero brand mark — dominant visual anchor
  heroBrandWrap:{display:"flex",alignItems:"center",gap:10,marginBottom:4,justifyContent:"center"},
  heroBrandName:{fontFamily:FONT_SERIF,fontSize:42,fontWeight:700,letterSpacing:-1.5,color:"var(--cp-text)",lineHeight:1.1},

  // Tagline — clearly secondary
  heroTagline:{fontFamily:FONT_SANS,fontSize:18,fontWeight:300,color:"var(--cp-text-muted)",lineHeight:1.5,marginTop:2},

  splitDesc:{fontSize:15,color:"var(--cp-text-muted)",marginTop:8,lineHeight:1.75,fontWeight:300},

  inputCard:{width:"100%",maxWidth:800,background:"var(--cp-bg-card)",border:"1px solid var(--cp-border-light)",borderRadius:6,padding:20,animation:"fadeUp .45s ease",boxShadow:"var(--cp-shadow-card)"},

  // Input tabs
  tabRow:{display:"flex",gap:2,marginBottom:14,background:"var(--cp-bg-tab)",borderRadius:6,padding:3},
  tabBtn:{flex:1,padding:"7px 0",border:"none",borderRadius:4,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",color:"var(--cp-text-muted)",transition:"all .15s"},
  tabBtnActive:{background:"var(--cp-bg-card)",color:"var(--cp-text)",boxShadow:"0 1px 3px rgba(0,0,0,.08)"},

  // Drop zone
  dropZone:{borderWidth:2,borderStyle:"dashed",borderColor:"var(--cp-border)",borderRadius:6,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:"var(--cp-bg-card)"},
  dropZoneActive:{borderColor:"#2563EB",background:"rgba(59,130,246,0.08)"},
  dropIcon:{fontSize:32,marginBottom:12},
  dropTitle:{fontSize:14,fontWeight:600,color:"var(--cp-text-secondary)",marginBottom:6},
  dropSub:{fontSize:13,color:"var(--cp-text-muted)"},
  dropFileName:{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,padding:"6px 12px",background:"rgba(34,197,94,0.10)",border:"1px solid rgba(34,197,94,0.20)",borderRadius:6,fontSize:12,color:CLR_GREEN,fontWeight:500},

  bigTextarea:{width:"100%",border:"1px solid var(--cp-border)",borderRadius:4,padding:16,fontSize:14,fontFamily:"inherit",color:"var(--cp-text-secondary)",resize:"vertical",minHeight:240,lineHeight:1.7,background:"var(--cp-bg-card)"},
  inputFooter:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,flexWrap:"wrap",gap:10},
  processBtn:{padding:"10px 24px",border:"none",borderRadius:4,background:CP_ACCENT,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  tryBtn:{padding:"8px 16px",border:"1px solid var(--cp-border)",borderRadius:4,background:"var(--cp-bg-card)",color:"var(--cp-text-muted)",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"},

  // Restore session banner
  restoreBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"rgba(60,87,117,0.06)",border:"1px solid rgba(60,87,117,0.14)",borderRadius:6,marginBottom:20,fontSize:13,color:CP_ACCENT_TEXT,animation:"slideD .25s ease",flexWrap:"wrap",gap:8,width:"100%",maxWidth:800},
  restoreBtn:{padding:"5px 14px",borderRadius:6,border:"none",background:CP_ACCENT,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  restoreDismiss:{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(60,87,117,0.25)",background:"transparent",color:CP_ACCENT,fontSize:12,cursor:"pointer",fontFamily:"inherit"},

  // How it works
  howSection:{width:"100%",maxWidth:800,marginTop:56,animation:"fadeUp .6s .1s ease both"},
  howSectionTitle:{fontFamily:FONT_SANS,fontSize:26,fontWeight:700,letterSpacing:"-0.03em",color:CP_ACCENT,marginBottom:20,display:"flex",alignItems:"center",gap:12},
  howSectionTitleLine:{flex:1,height:1,background:"var(--cp-border-light)"},
  // Features grid — 3-column, 2 rows
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  },

  featureCard: {
    background: "var(--cp-bg-card)",
    border: "1px solid var(--cp-border)",
    borderRadius: 6,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    cursor: "default",
  },

  featureIcon: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    flexShrink: 0,
  },

  featureContent: {
    textAlign: "center",
  },

  featureTitle: {
    fontWeight: 600,
    fontSize: 13,
    color: "var(--cp-text)",
    lineHeight: 1.3,
  },

  // Processing
  procWrap:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:64},
  procTitle:{fontSize:24,fontWeight:700,letterSpacing:"-0.02em",marginBottom:8},
  procSub:{fontSize:14,color:"var(--cp-text-muted)",marginBottom:32},
  procCard:{width:"100%",maxWidth:480,padding:20,background:"var(--cp-bg-panel)",border:"1px solid var(--cp-border)",borderRadius:6},
  procTop:{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:10},
  track:{height:4,borderRadius:2,background:"var(--cp-border)",overflow:"hidden"},
  fill:{height:"100%",borderRadius:2,background:"var(--cp-text-secondary)",transition:"width .3s"},
  procCurrent:{fontSize:13,color:"var(--cp-text-muted)",marginTop:8,fontStyle:"italic",animation:"pulse 1.5s infinite"},

  // Live feed
  feedWrap:{marginTop:20,width:"100%",maxWidth:480,maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:6},
  feedItem:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"var(--cp-bg-card)",border:"1px solid var(--cp-border)",borderRadius:6,fontSize:12,animation:"fadeUp .25s ease"},
  feedItemTag:{padding:"1px 7px",borderRadius:4,fontWeight:600,fontSize:11,letterSpacing:"0.02em",flexShrink:0},
  feedItemText:{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"var(--cp-text-secondary)"},
  feedItemSrc:{color:"var(--cp-text-muted)",flexShrink:0,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},

  // Results header — #4 tightened padding rhythm
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"32px 0 16px",borderBottom:"1px solid var(--cp-border)",flexWrap:"wrap",gap:12},
  title:{fontFamily:FONT_SERIF,fontSize:32,fontWeight:700,letterSpacing:-1,color:"var(--cp-text-secondary)",lineHeight:1},
  sub:{fontSize:13,color:"var(--cp-text-muted)",marginTop:6,letterSpacing:"0.01em"},
  hdrBtn:{padding:"6px 12px",border:"1px solid var(--cp-border)",borderRadius:6,background:"var(--cp-bg-card)",fontSize:12,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  exportBtn:{padding:"6px 14px",border:"1px solid var(--cp-border)",borderRadius:6,background:"var(--cp-bg-card)",fontSize:12,fontWeight:600,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit"},
  addMoreBtn:{padding:"6px 14px",border:"1px solid #2563EB",borderRadius:6,background:"rgba(59,130,246,0.08)",color:CLR_BLUE,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  startOverBtn:{padding:"6px 14px",border:`1px solid ${CLR_RED}4D`,borderRadius:6,background:"var(--cp-bg-card)",color:CLR_RED,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBtn:{padding:"6px 14px",border:"1px solid var(--cp-border)",borderRadius:6,background:"var(--cp-bg-card)",color:"var(--cp-text-secondary)",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBtnActive:{border:"1px solid #7C3AED",background:"rgba(124,58,237,0.10)",color:CLR_VIOLET},

  // View toggles (table / compact / cards)
  viewTog:{display:"flex",border:"1px solid var(--cp-border)",borderRadius:6,overflow:"hidden"},
  viewBtn:{padding:"5px 8px",border:"none",background:"var(--cp-bg-card)",cursor:"pointer",color:"var(--cp-text-muted)",display:"flex",alignItems:"center",justifyContent:"center"},
  viewOn:{background:"var(--cp-bg-hover)",color:"var(--cp-text-secondary)"},

  // Export dropdown
  expOptNote:{display:"block",width:"100%",padding:"4px 12px 8px",fontSize:11,color:"var(--cp-text-muted)",fontFamily:"inherit"},

  // Bars
  errorBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.20)",borderRadius:6,margin:"12px 0",fontSize:13,color:CLR_RED,gap:12,flexWrap:"wrap"},
  retryBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #DC2626",background:"var(--cp-bg-card)",color:CLR_RED,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBar:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.16)",borderRadius:6,margin:"12px 0",fontSize:13,color:"var(--cp-text-secondary)",flexWrap:"wrap"},
  statDot:{width:4,height:4,borderRadius:"50%",background:"var(--cp-border-dim)"},
  statsDismiss:{background:"none",border:"none",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:14,marginLeft:"auto"},
  addMorePanel:{background:"var(--cp-bg-panel)",border:"1px solid var(--cp-border)",borderRadius:6,padding:14,margin:"12px 0"},
  attentionBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(234,88,12,0.08)",border:"1px solid rgba(234,88,12,0.20)",borderRadius:6,margin:"10px 0",fontSize:13,color:CLR_ORANGE,gap:8},
  attentionCount:{fontWeight:700,fontSize:14,color:CLR_ORANGE},
  attentionBtn:{padding:"5px 14px",borderRadius:6,border:"none",background:"#EA580C",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  attentionDismiss:{background:"none",border:"none",color:CLR_ORANGE,cursor:"pointer",fontSize:18,lineHeight:1,padding:"4px 6px",borderRadius:4,opacity:0.6,transition:"opacity .12s"},

  shareBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.16)",borderRadius:6,margin:"12px 0",fontSize:13,color:CLR_BLUE,flexWrap:"wrap",gap:8},
  shareBannerBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #2563EB",background:"var(--cp-bg-card)",color:CLR_BLUE,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},

  // Stats panel
  statsPanel:{background:"var(--cp-bg-panel)",border:"1px solid var(--cp-border)",borderRadius:6,padding:20,margin:0,animation:"slideD .25s ease",boxShadow:"0 8px 32px rgba(0,0,0,.12)"},
  statsPanelTitle:{fontSize:14,fontWeight:600,color:"var(--cp-text-secondary)",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"},
  statsPanelClose:{background:"none",border:"none",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:16,padding:"0 4px"},
  statsSection:{display:"flex",flexDirection:"column",gap:10},
  statsSectionTitle:{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",color:"#3C5775",marginBottom:4},

  // Dupe modal — #9 removed shadow (overlay provides depth)
  dupeModalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeUp .15s ease-out"},
  dupeModalBox:{background:"var(--cp-bg-card)",borderRadius:6,padding:0,maxWidth:"min(90vw, 560px)",width:"100%",overflow:"clip",fontFamily:FONT_SANS,maxHeight:"85vh",display:"flex",flexDirection:"column"},
  dupeModalHeader:{padding:"18px 20px 14px",borderBottom:"1px solid var(--cp-border)"},
  dupeModalTitle:{fontSize:16,fontWeight:700,color:"var(--cp-text-secondary)",marginBottom:4,fontFamily:FONT_SANS},
  dupeModalSub:{fontSize:13,color:"var(--cp-text-muted)",fontFamily:FONT_SANS},
  dupeList:{flex:1,minHeight:0,overflowY:"auto",padding:"12px 20px",display:"flex",flexDirection:"column",gap:10},
  // Bulk edit — floating pill (dark bg in light mode, light bg in dark mode)
  bulkBar:{position:"fixed",bottom:16,left:0,right:0,marginInline:"auto",width:"fit-content",display:"flex",alignItems:"center",gap:0,padding:"8px 12px 8px 8px",background:"var(--cp-bulk-bg)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--cp-bulk-border)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",zIndex:500,maxWidth:"calc(100vw - 32px)"},
  bulkN:{fontSize:12,fontWeight:600,color:"var(--cp-bulk-badge-text)",whiteSpace:"nowrap",background:"var(--cp-bulk-badge)",padding:"5px 12px",borderRadius:4,lineHeight:1,letterSpacing:0.2},
  bulkDivider:{width:1,height:20,background:"var(--cp-bulk-divider)",margin:"0 10px",flexShrink:0},
  bulkGroup:{display:"flex",gap:5,alignItems:"center",whiteSpace:"nowrap"},
  bulkSel:{border:"1px solid var(--cp-bulk-input-border)",borderRadius:6,padding:"5px 24px 5px 8px",fontSize:12,fontFamily:"inherit",background:"var(--cp-bulk-input-bg)",color:"var(--cp-bulk-text)"},
  bulkIn:{border:"1px solid var(--cp-bulk-input-border)",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",width:120,background:"var(--cp-bulk-input-bg)",color:"var(--cp-bulk-text)"},
  bulkApply:{padding:"5px 12px",borderRadius:6,border:"none",background:"#fff",color:CP_ACCENT,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  bulkDelBtn:{padding:"5px 10px",borderRadius:6,border:"1px solid rgba(235,87,87,0.4)",background:"transparent",color:"#F87171",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",justifyContent:"center"},
  bulkX:{background:"none",border:"none",color:"var(--cp-bulk-muted)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",padding:4,borderRadius:6},

  // Header overflow menu
  hdrOverflowMenu:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"var(--cp-bg-card)",borderRadius:6,boxShadow:"var(--cp-shadow-md)",border:"1px solid var(--cp-border)",minWidth:200,zIndex:100,padding:4,animation:"menuIn .14s ease",transformOrigin:"top right"},
  hdrOverflowItem:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:"var(--cp-text-secondary)",cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease"},
  hdrOverflowDivider:{height:1,background:"var(--cp-border)",margin:"4px 0"},
  hdrOverflowSectionLabel:{padding:"6px 12px 2px",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",color:"var(--cp-text-faint)"},
  hdrOverflowDestructive:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:CLR_RED,cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease"},

  // Sidebar overview card
  sidebarOverview:{padding:"12px 8px 12px 0",borderBottom:"1px solid var(--cp-border-light)",marginBottom:4},
  sidebarOverviewLabel:{fontSize:13,fontWeight:600,color:"var(--cp-accent)"},
  sidebarOverviewRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",fontSize:12},
  sidebarOverviewValue:{fontWeight:600,color:"var(--cp-text-secondary)"},
  sidebarOverviewMuted:{color:"var(--cp-text-muted)"},
  sidebarActionBtn:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"6px 10px",border:"none",borderRadius:6,background:"transparent",fontSize:12,fontWeight:500,color:"var(--cp-text-muted)",cursor:"pointer",fontFamily:"inherit",textAlign:"left"},
  sidebarDupesBtn:{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"6px 10px",border:"1px solid var(--cp-border)",borderRadius:6,background:"var(--cp-bg-card)",fontSize:12,fontWeight:500,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",textAlign:"left",justifyContent:"center"},

  // Toolbar — #4 matched padding to pills rhythm
  toolbar:{display:"flex",gap:8,alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--cp-border)"},
  srchW:{position:"relative",flex:1},
  srchI:{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:.5,display:"flex",alignItems:"center"},
  srchIn:{width:"100%",border:"1px solid var(--cp-border)",borderRadius:6,padding:"7px 28px 7px 32px",fontSize:12,fontFamily:"inherit",color:"var(--cp-text-secondary)",background:"var(--cp-bg-card)"},
  clrBtn:{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:12},
  sortBtn:{display:"flex",alignItems:"center",padding:"7px 12px",border:"1px solid var(--cp-border)",borderRadius:6,background:"var(--cp-bg-card)",fontSize:12,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",minWidth:180},
  sortDrop:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"var(--cp-bg-card)",borderRadius:6,boxShadow:"var(--cp-shadow-md)",border:"1px solid var(--cp-border)",minWidth:220,zIndex:100,padding:4,transition:"opacity .15s ease, transform .15s ease"},
  sortOpt:{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"8px 12px",fontSize:12,color:"var(--cp-text-secondary)",cursor:"pointer",borderRadius:4,fontFamily:"inherit"},
  sortOptOn:{background:"var(--cp-bg-hover)",fontWeight:600},

  // Category pills — horizontal scroll with fade
  cats:{display:"flex",gap:6,padding:"10px 0",flexWrap:"nowrap",alignItems:"center",borderBottom:"1px solid var(--cp-border)",position:"sticky",top:0,background:"var(--cp-bg)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:50,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"},
  catPill:{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:50,borderWidth:1,borderStyle:"solid",borderColor:"var(--cp-border)",background:"var(--cp-bg-card)",fontSize:12,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",fontWeight:500,letterSpacing:"0.02em",whiteSpace:"nowrap",flexShrink:0,transition:"background .15s ease, color .15s ease, opacity .15s ease"},
  catOn:{background:CP_ACCENT,color:"#fff",borderColor:CP_ACCENT},
  addCatBtn:{width:26,height:26,borderRadius:50,border:"1px dashed var(--cp-border-dim)",background:"transparent",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  newCatIn:{border:`1px solid ${CP_ACCENT}`,borderRadius:6,padding:"4px 8px",fontSize:12,width:90,fontFamily:"inherit"},
  newCatSv:{padding:"4px 10px",borderRadius:6,border:"none",background:CP_ACCENT,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},

  // Table — #2 unified borders, #3 removed tHead tint, #6 row bg to white
  tHead:{
    display:"flex",
    alignItems:"center",
    padding:"12px 0 8px 0",
    borderBottom:"1px solid var(--cp-border)",
    fontSize:13,
    color:"var(--cp-accent)",
    fontWeight:600,
    letterSpacing:"0.04em",
    background:"var(--cp-bg)",
    marginBottom:0,
    textAlign:"left",
    position:"sticky",
    top:44,
    zIndex:49,
  },
  row:{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--cp-border)",transition:"background .1s ease, opacity .15s",minHeight:48,background:"var(--cp-bg-card)"},
  rowCompact:{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--cp-border)",transition:"background .12s ease, opacity .15s",minHeight:34,background:"var(--cp-bg-card)"},
  chkW:{width:32,display:"flex",alignItems:"center",justifyContent:"flex-start",opacity:0.35,transition:"opacity .15s"},
  check:{width:16,height:16,borderRadius:4,border:"1.5px solid var(--cp-border-dim)",borderColor:"var(--cp-border-dim)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .12s, border-color .12s",flexShrink:0,outline:"none"},
  checkOn:{background:"var(--cp-accent)",borderColor:"var(--cp-accent)"},
  entryText:{fontSize:14,lineHeight:1.65,color:"var(--cp-text-secondary)",whiteSpace:"pre-wrap",cursor:"text"},
  entryTextCompact:{fontSize:13,lineHeight:1.35,color:"var(--cp-text-secondary)",whiteSpace:"pre-wrap",cursor:"text"},
  // #8 srcCol flex instead of fixed width
  srcCol:{minWidth:100,maxWidth:220,flex:"0 1 220px",display:"flex",alignItems:"center",paddingLeft:10,paddingRight:12,borderLeft:"1px solid var(--cp-border-light)"},
  srcText:{fontSize:12,color:"var(--cp-text-muted)",wordWrap:"break-word",whiteSpace:"normal",lineHeight:1.4,flex:1,wordBreak:"break-word"},
  tag:{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:4,letterSpacing:"0.02em",whiteSpace:"nowrap"},
  rowAct:{flex:"0 0 36px",display:"flex",justifyContent:"flex-end",alignItems:"center",position:"relative"},
  actBtn:{background:"none",border:"none",cursor:"pointer",color:"var(--cp-text-faint)",fontSize:14,padding:"4px 5px",borderRadius:4,display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1,transition:"color .12s, background .12s"},
  overflowWrap:{position:"relative"},
  overflowMenu:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"var(--cp-bg-card)",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)",minWidth:172,zIndex:100,padding:4,animation:"menuIn .14s ease",transformOrigin:"top right"},
  overflowMenuItem:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:"var(--cp-text-secondary)",cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease"},
  overflowMenuDivider:{height:1,background:"var(--cp-border)",margin:"4px 0"},
  overflowMenuItemDestructive:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:"#EB5757",cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease, color .1s ease"},

  // Edit form
  textarea:{width:"100%",border:"1px solid var(--cp-border)",borderRadius:6,padding:10,fontSize:14,fontFamily:"inherit",color:"var(--cp-text-secondary)",resize:"vertical",minHeight:60,lineHeight:1.6,background:"var(--cp-bg-card)"},
  editIn:{flex:1,minWidth:100,border:`1px solid ${CP_ACCENT}`,borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit"},
  editSel:{border:"1px solid var(--cp-border)",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"var(--cp-bg-card)"},
  editSave:{padding:"4px 12px",borderRadius:6,border:"none",background:CP_ACCENT,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  editCancel:{padding:"4px 8px",borderRadius:6,border:"none",background:"transparent",color:"var(--cp-text-muted)",fontSize:12,cursor:"pointer",fontFamily:"inherit"},

  // Inline field editing (source / category)
  inlineSrcInput:{border:`1px solid ${CP_ACCENT}`,borderRadius:4,padding:"2px 6px",fontSize:12,fontFamily:"inherit",color:"var(--cp-text-secondary)",width:"100%",background:"var(--cp-bg-card)"},
  inlineCatSel:{border:`1px solid ${CP_ACCENT}`,borderRadius:4,padding:"2px 2px",fontSize:11,fontFamily:"inherit",background:"var(--cp-bg-card)",cursor:"pointer",width:78},

  // Modal — #9 removed shadow (overlay provides depth)
  modalOverlay:{position:"fixed",inset:0,background:"var(--cp-overlay)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeUp .15s ease-out"},
  confirmBox:{background:"var(--cp-bg-card)",borderRadius:6,padding:24,maxWidth:"min(90vw, 400px)",width:"100%"},
  confirmCancel:{padding:"8px 16px",borderRadius:6,border:"1px solid var(--cp-border)",background:"var(--cp-bg-card)",color:"var(--cp-text-secondary)",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  confirmYes:{padding:"8px 16px",borderRadius:6,border:"none",background:"var(--cp-destructive)",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},

  // Input meta
  entryMeta:{fontSize:12,color:"var(--cp-text-muted)"},
  warnBadge:{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:CLR_AMBER,background:"rgba(217,119,6,0.12)",padding:"2px 8px",borderRadius:50,fontWeight:500},
  fmtToggleWrap:{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"var(--cp-text-muted)",userSelect:"none",cursor:"pointer"},
  fmtToggleTrack:{width:30,height:17,borderRadius:50,transition:"background .2s",flexShrink:0,position:"relative",cursor:"pointer"},
  fmtToggleThumb:{position:"absolute",top:2,width:13,height:13,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transition:"left .2s"},

  // Misc
  empty:{textAlign:"center",padding:"60px 24px"},
  footer:{textAlign:"center",padding:"40px 0 20px",fontSize:12,color:"var(--cp-text-faint)",borderTop:"1px solid var(--cp-border-light)",marginTop:40},
  footerLink:{color:"var(--cp-text-muted)",textDecoration:"none"},
};

export const cardStyles = {
  card:{background:"var(--cp-bg-card)",border:"1px solid var(--cp-border)",borderRadius:6,padding:16,transition:"border-color .15s, box-shadow .15s",cursor:"grab"},
  top:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10},
  acts:{display:"flex",gap:2,opacity:0.3,transition:"opacity .15s"},
  txt:{fontSize:14,lineHeight:1.6,color:"var(--cp-text-secondary)",marginBottom:10,whiteSpace:"pre-wrap"},
  srcRow:{display:"flex",alignItems:"center",gap:6},
  src:{fontSize:12,color:"var(--cp-text-muted)"},
};
