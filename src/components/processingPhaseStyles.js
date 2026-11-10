import { btnSm } from "./styles";

// ProcessingPhase's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const processingStyles = {
  // Nav
  nav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"26px 0 22px",borderBottom:"1px solid var(--cp-border-light)"},
  navLogo:{color:"var(--cp-text)",textDecoration:"none"},
  navRight:{display:"flex",alignItems:"center",gap:28,fontSize:13,color:"var(--cp-text-muted)"},

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

  hdrBtn:btnSm,
};
