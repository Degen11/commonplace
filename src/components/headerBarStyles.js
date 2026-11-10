import { btnSm } from "./styles";

// HeaderBar's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const headerStyles = {
  // Results header — #4 tightened padding rhythm
  header:{padding:"24px 0 18px"},
  headerTop:{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12},
  collectionHead:{display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:"4px 12px",marginTop:24},
  collectionTitle:{margin:0,fontSize:30,lineHeight:1.15,fontWeight:700,letterSpacing:"-0.03em",color:"var(--cp-text)",overflowWrap:"anywhere"},
  collectionMeta:{fontSize:14,color:"var(--cp-text-muted)",fontVariantNumeric:"tabular-nums",letterSpacing:"0.01em"},
  hdrGhostBtn:{...btnSm,padding:"6px 8px",border:"1px solid transparent",background:"transparent",color:"var(--cp-text-muted)"},

  // Mobile: collection title doubles as the collection switcher
  collectionSwitch:{display:"inline-flex",alignItems:"center",gap:6,padding:0,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",color:"var(--cp-text)"},

  title:{color:"var(--cp-text-secondary)"},

  addMoreBtnActive:{background:"var(--cp-bg-tab)",color:"var(--cp-text)",borderColor:"var(--cp-border)"},
};
