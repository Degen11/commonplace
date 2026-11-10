// HeaderControls' own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const controlStyles = {
  // View toggles (table / compact / cards)
  viewTog:{display:"flex",border:"1px solid var(--cp-border)",borderRadius:4,overflow:"hidden"},
  viewBtn:{padding:"5px 8px",border:"none",background:"var(--cp-bg-card)",cursor:"pointer",color:"var(--cp-text-muted)",display:"flex",alignItems:"center",justifyContent:"center"},
  viewOn:{background:"var(--cp-bg-hover)",color:"var(--cp-text-secondary)"},

  // Header overflow menu
  hdrOverflowItem:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:"var(--cp-text-secondary)",cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease"},
  hdrOverflowDivider:{height:1,background:"var(--cp-border)",margin:"4px 0"},
  hdrOverflowSectionLabel:{padding:"6px 12px 2px",fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",color:"var(--cp-text-faint)"},
  hdrOverflowDestructive:{display:"flex",alignItems:"center",gap:10,width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"9px 12px",fontSize:13,color:"var(--cp-danger)",cursor:"pointer",borderRadius:4,fontFamily:"inherit",lineHeight:1,transition:"background .1s ease"},
};
