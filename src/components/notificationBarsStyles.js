import { CLR_ORANGE, btnXs } from "./styles";

// NotificationBars' own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const notifStyles = {
  errorBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--cp-danger-bg)",border:"1px solid var(--cp-danger-border)",borderRadius:6,margin:"12px 0",fontSize:13,color:"var(--cp-danger)",gap:12,flexWrap:"wrap"},

  retryBtn:{...btnXs,border:"1px solid var(--cp-danger)",color:"var(--cp-danger)"},

  statsBar:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.16)",borderRadius:6,margin:"12px 0",fontSize:13,color:"var(--cp-text-secondary)",flexWrap:"wrap"},

  statDot:{width:4,height:4,borderRadius:"50%",background:"var(--cp-border-dim)"},

  statsDismiss:{background:"none",border:"none",color:"var(--cp-text-muted)",cursor:"pointer",fontSize:14,marginLeft:"auto"},

  attentionBar:{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--cp-text-secondary)",flexWrap:"wrap"},

  attentionDot:{width:7,height:7,borderRadius:"50%",background:CLR_ORANGE,flexShrink:0},

  attentionLink:{background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500,color:"var(--cp-warning-text)",textDecoration:"underline",textUnderlineOffset:3,textDecorationThickness:1},

  attentionDismiss:{background:"none",border:"none",color:"var(--cp-text-faint)",cursor:"pointer",lineHeight:1,padding:"4px",borderRadius:4,opacity:0.7,display:"inline-flex",alignItems:"center",transition:"opacity .12s"},

  shareBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--cp-info-bg)",border:"1px solid var(--cp-info-border)",borderRadius:6,margin:"12px 0",fontSize:13,color:"var(--cp-info)",flexWrap:"wrap",gap:8},
  shareBannerBtn:{...btnXs,border:"1px solid var(--cp-info)",color:"var(--cp-info)"},
};
