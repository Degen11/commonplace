import { CP_ACCENT } from "./styles";
import { Z } from "../data/constants";

// ToolbarSection's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const toolbarStyles = {
  sortOptOn:{background:"var(--cp-bg-hover)",fontWeight:600},

  // Category pills — horizontal scroll with fade
  cats:{display:"flex",gap:6,padding:"10px 0",flexWrap:"nowrap",alignItems:"center",borderBottom:"1px solid var(--cp-border)",position:"sticky",top:0,background:"var(--cp-bg)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:Z.CATEGORY_PILLS,overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch"},
  catPill:{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:50,borderWidth:1,borderStyle:"solid",borderColor:"transparent",background:"transparent",fontSize:12,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",fontWeight:500,letterSpacing:"0.02em",whiteSpace:"nowrap",flexShrink:0,transition:"background .15s ease, color .15s ease, opacity .15s ease"},
  catOn:{background:"var(--cp-text)",color:"var(--cp-bg)",borderColor:"var(--cp-text)"},
  searchKbd:{fontSize:10,fontFamily:"inherit",lineHeight:"14px",padding:"0 5px",marginRight:6,border:"1px solid var(--cp-border)",borderRadius:4,color:"var(--cp-text-muted)",flexShrink:0},
  addCatBtn:{width:26,height:26,borderRadius:50,border:"1px dashed var(--cp-border-dim)",background:"transparent",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  newCatIn:{border:`1px solid ${CP_ACCENT}`,borderRadius:6,padding:"4px 8px",fontSize:12,width:90,fontFamily:"inherit"},
  newCatSv:{padding:"4px 10px",borderRadius:6,border:"none",background:CP_ACCENT,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
};
