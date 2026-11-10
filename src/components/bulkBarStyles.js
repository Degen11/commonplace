import { Z } from "../data/constants";

// BulkBar's own styles (moved out of styles.js, which keeps the
// tokens, baseCSS and styles shared across components).
export const bulkStyles = {
  // Bulk edit — floating pill (dark bg in light mode, light bg in dark mode)
  bulkBar:{position:"fixed",bottom:16,left:0,right:0,marginInline:"auto",width:"fit-content",display:"flex",alignItems:"center",gap:2,padding:"6px 6px 6px 16px",background:"var(--cp-bulk-bg)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--cp-bulk-border)",borderRadius:6,boxShadow:"0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",zIndex:Z.BULK_BAR,maxWidth:"calc(100vw - 32px)"},
  bulkN:{fontSize:13,color:"var(--cp-bulk-text)",whiteSpace:"nowrap",marginRight:4},
  bulkNCount:{fontWeight:700,color:"#fff",fontVariantNumeric:"tabular-nums"},
  bulkClear:{height:30,padding:"0 8px",border:"none",borderRadius:4,background:"transparent",color:"var(--cp-bulk-muted)",fontSize:13,fontFamily:"inherit",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3},
  bulkDivider:{width:1,height:18,background:"var(--cp-bulk-divider)",margin:"0 8px",flexShrink:0},
  bulkBtn:{display:"inline-flex",alignItems:"center",gap:6,height:30,padding:"0 10px",border:"none",borderRadius:4,background:"transparent",color:"var(--cp-bulk-text)",fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"},
  bulkDelBtn:{display:"inline-flex",alignItems:"center",gap:6,height:30,padding:"0 10px",border:"none",borderRadius:4,background:"transparent",color:"#F87171",fontSize:13,fontWeight:500,fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"},
  bulkMenu:{background:"var(--cp-bg-card)",border:"1px solid var(--cp-border)",borderRadius:6,boxShadow:"var(--cp-shadow-md)",padding:4,minWidth:180,maxHeight:"min(320px, 50vh)",overflowY:"auto",animation:"menuIn .14s ease"},
  bulkSrcIn:{flex:1,minWidth:0,border:"1px solid var(--cp-border)",borderRadius:4,padding:"5px 8px",fontSize:13,fontFamily:"inherit",background:"var(--cp-bg-input)",color:"var(--cp-text)"},
};
