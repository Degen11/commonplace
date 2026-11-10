import { Z } from "../data/constants";

// TableView's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const tableStyles = {
  tHead:{
    display:"flex",
    alignItems:"center",
    padding:"12px 0 8px 0",
    borderBottom:"1px solid var(--cp-border)",
    fontSize:11,
    color:"var(--cp-text-faint)",
    fontWeight:500,
    letterSpacing:"0.04em",
    textTransform:"uppercase",
    background:"var(--cp-bg)",
    marginBottom:0,
    textAlign:"left",
    position:"sticky",
    top:44,
    zIndex:Z.CATEGORY_PILLS - 1,
  },

  row:{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--cp-border)",transition:"background .1s ease, opacity .15s",minHeight:48,background:"var(--cp-bg-card)"},

  rowCompact:{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:"1px solid var(--cp-border)",transition:"background .12s ease, opacity .15s",minHeight:34,background:"var(--cp-bg-card)"},

  chkW:{width:32,display:"flex",alignItems:"center",justifyContent:"flex-start",transition:"opacity .15s"},

  entryText:{fontSize:15,lineHeight:1.6,color:"var(--cp-text)",whiteSpace:"pre-wrap",cursor:"text"},

  entryTextCompact:{fontSize:13,lineHeight:1.35,color:"var(--cp-text-secondary)",whiteSpace:"pre-wrap",cursor:"text"},

  srcText:{fontSize:12,color:"var(--cp-text-muted)",wordWrap:"break-word",whiteSpace:"normal",lineHeight:1.4,flex:1,wordBreak:"break-word"},

  favMark:{display:"inline-block",verticalAlign:"-1px",marginLeft:6,color:"var(--cp-fav-accent)"},

  rowAct:{flex:"0 0 36px",display:"flex",justifyContent:"flex-end",alignItems:"center",position:"relative"},
};
