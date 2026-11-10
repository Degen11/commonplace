// CollectionsSidebar's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const sidebarStyles = {
  // Sidebar overview card
  sidebarHead:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 8px 6px 8px"},
  sidebarLabel:{fontSize:11,fontWeight:500,letterSpacing:"0.04em",textTransform:"uppercase",color:"var(--cp-text-faint)"},
  sidebarIconBtn:{width:24,height:24,display:"grid",placeItems:"center",padding:0,border:"none",borderRadius:4,background:"transparent",color:"var(--cp-text-muted)",cursor:"pointer"},
  sidebarDivider:{height:1,background:"var(--cp-border-light)",margin:"10px 16px 12px 8px"},
  sidebarToolBtn:{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px",border:"none",borderRadius:4,background:"transparent",fontSize:13,color:"var(--cp-text-secondary)",cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"background .12s"},
  sidebarToolIcon:{color:"var(--cp-text-muted)",flexShrink:0},
};
