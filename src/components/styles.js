// ===================== BASE CSS =====================
export const baseCSS = `
  *{box-sizing:border-box;margin:0;padding:0}body{background:#fff;color:#37352F}::selection{background:#2383E233}
  textarea:focus,input:focus,select:focus{outline:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideD{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .phase-in{animation:fadeUp .3s ease}.phase-out{opacity:0;transition:opacity .2s ease}
  .qrow{cursor:grab}.qrow:active{cursor:grabbing}
  .qrow:hover{background:#FAFAFA !important}.qrow:hover .row-actions{opacity:1 !important}.qrow:hover .checkbox{opacity:1 !important}
  .qrow:hover .src-col span:first-child{white-space:normal !important;overflow:visible !important}
  .dd-opt:hover{background:#F1F1EF !important}
  .proc-btn:hover:not(:disabled){box-shadow:0 2px 8px rgba(55,53,47,.25);transform:translateY(-1px)}
  .proc-btn{transition:all .15s ease}
  .try-btn:hover{background:#F1F1EF !important}
  .how-step{transition:transform .2s ease}.how-step:hover{transform:translateY(-2px)}
  .tab-btn:hover{background:#F1F1EF !important}
  .drop-zone{transition:all .2s ease}
`;

// ===================== MAIN STYLES =====================
export const Z = {
  // Layout
  wrap:{maxWidth:1120,margin:"0 auto",padding:"0 32px 80px",fontFamily:"'Inter',-apple-system,sans-serif",fontSize:14,color:"#37352F",minHeight:"100vh",background:"#fff"},

  // Landing
  landing:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:80},
  hero:{textAlign:"center",marginBottom:40},
  heroTitle:{fontSize:48,fontWeight:700,letterSpacing:-2,color:"#37352F",lineHeight:1},
  heroSub:{fontSize:16,color:"#9B9A97",marginTop:12,lineHeight:1.7},
  inputCard:{width:"100%",maxWidth:800,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:12,padding:20,animation:"fadeUp .4s ease"},

  // Input tabs
  tabRow:{display:"flex",gap:2,marginBottom:14,background:"#F1F1EF",borderRadius:8,padding:3},
  tabBtn:{flex:1,padding:"7px 0",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",background:"transparent",color:"#9B9A97",transition:"all .15s"},
  tabBtnActive:{background:"#fff",color:"#37352F",boxShadow:"0 1px 3px rgba(0,0,0,.08)"},

  // Drop zone
  dropZone:{border:"2px dashed #E3E2DE",borderRadius:10,padding:"40px 24px",textAlign:"center",cursor:"pointer",background:"#fff"},
  dropZoneActive:{borderColor:"#2383E2",background:"#EFF6FF"},
  dropIcon:{fontSize:32,marginBottom:12},
  dropTitle:{fontSize:15,fontWeight:600,color:"#37352F",marginBottom:6},
  dropSub:{fontSize:13,color:"#9B9A97"},
  dropFileName:{display:"inline-flex",alignItems:"center",gap:6,marginTop:12,padding:"6px 12px",background:"#F0FDF4",border:"1px solid #DCFCE7",borderRadius:6,fontSize:12,color:"#16A34A",fontWeight:500},

  bigTextarea:{width:"100%",border:"1px solid #E3E2DE",borderRadius:8,padding:16,fontSize:15,fontFamily:"inherit",color:"#37352F",resize:"vertical",minHeight:240,lineHeight:1.7,background:"#fff"},
  inputFooter:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,flexWrap:"wrap",gap:10},
  inputCount:{fontSize:13,color:"#9B9A97"},
  processBtn:{padding:"10px 24px",border:"none",borderRadius:8,background:"#37352F",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  tryBtn:{padding:"8px 16px",border:"1px solid #E3E2DE",borderRadius:8,background:"#fff",color:"#9B9A97",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"},

  // Restore session banner
  restoreBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#F0F7FF",border:"1px solid #DBEAFE",borderRadius:10,marginBottom:20,fontSize:13,color:"#1D4ED8",animation:"slideD .25s ease",flexWrap:"wrap",gap:8,width:"100%",maxWidth:800},
  restoreBtn:{padding:"5px 14px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  restoreDismiss:{padding:"5px 10px",borderRadius:6,border:"1px solid #BFDBFE",background:"transparent",color:"#2383E2",fontSize:12,cursor:"pointer",fontFamily:"inherit"},

  // How it works
  howWrap:{display:"flex",gap:24,marginTop:48,flexWrap:"wrap",justifyContent:"center",alignItems:"flex-start",width:"100%",maxWidth:600},
  howStep:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1,minWidth:120,textAlign:"center"},
  howIcon:{fontSize:28,marginBottom:4},
  howLabel:{fontSize:14,fontWeight:600,color:"#37352F"},
  howDesc:{fontSize:12,color:"#9B9A97",lineHeight:1.4},
  howArrow:{display:"flex",alignItems:"center",fontSize:20,color:"#D3D3D0",fontWeight:300,paddingTop:16},

  // Preview
  previewWrap:{display:"flex",gap:20,alignItems:"stretch",width:"100%",maxWidth:800,marginTop:48,animation:"fadeUp .5s ease",flexWrap:"wrap"},
  previewBox:{flex:1,minWidth:260,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:10,padding:16,overflow:"hidden"},
  previewLabel:{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,color:"#9B9A97",marginBottom:10},
  previewContent:{display:"flex",flexDirection:"column",gap:6},
  previewLine:{fontSize:13,color:"#787774",lineHeight:1.6,fontFamily:"'SF Mono',Menlo,monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  previewArrow:{display:"flex",alignItems:"center",fontSize:24,color:"#D3D3D0",fontWeight:300,flexShrink:0,padding:"0 4px"},
  previewResult:{display:"flex",alignItems:"center",gap:6,fontSize:12,lineHeight:1.5,minWidth:0},
  previewTag:{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:3,whiteSpace:"nowrap",flexShrink:0},
  previewText:{color:"#37352F",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0},
  previewSrc:{color:"#9B9A97",fontSize:11,whiteSpace:"nowrap",flexShrink:0},

  // Processing
  procWrap:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:120},
  procTitle:{fontSize:24,fontWeight:700,letterSpacing:-.5,marginBottom:8},
  procSub:{fontSize:14,color:"#9B9A97",marginBottom:32},
  procCard:{width:"100%",maxWidth:480,padding:20,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:12},
  procTop:{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:10},
  track:{height:4,borderRadius:2,background:"#EBEBEA",overflow:"hidden"},
  fill:{height:"100%",borderRadius:2,background:"#37352F",transition:"width .3s"},
  procCurrent:{fontSize:13,color:"#9B9A97",marginTop:8,fontStyle:"italic",animation:"pulse 1.5s infinite"},

  // Live feed
  feedWrap:{marginTop:20,width:"100%",maxWidth:480,maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:6},
  feedItem:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#fff",border:"1px solid #F1F1EF",borderRadius:7,fontSize:12,animation:"fadeUp .2s ease"},
  feedItemTag:{padding:"1px 7px",borderRadius:4,fontWeight:600,fontSize:10,flexShrink:0},
  feedItemText:{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:"#37352F"},
  feedItemSrc:{color:"#9B9A97",flexShrink:0,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},

  // Results header
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"40px 0 16px",borderBottom:"1px solid #F1F1EF",flexWrap:"wrap",gap:12},
  title:{fontSize:32,fontWeight:700,letterSpacing:-1,color:"#37352F",lineHeight:1},
  sub:{fontSize:13,color:"#9B9A97",marginTop:6},
  hdrBtn:{padding:"6px 12px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  exportBtn:{padding:"6px 14px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,fontWeight:600,color:"#37352F",cursor:"pointer",fontFamily:"inherit"},
  addMoreBtn:{padding:"6px 14px",border:"1px solid #2383E2",borderRadius:6,background:"#EFF6FF",color:"#2383E2",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  startOverBtn:{padding:"6px 14px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",color:"#37352F",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBtn:{padding:"6px 14px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",color:"#37352F",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBtnActive:{border:"1px solid #7C3AED",background:"#F5F3FF",color:"#7C3AED"},

  // View toggles (table / compact / cards)
  viewTog:{display:"flex",border:"1px solid #E3E2DE",borderRadius:6,overflow:"hidden"},
  viewBtn:{padding:"5px 8px",border:"none",background:"#fff",cursor:"pointer",color:"#9B9A97",display:"flex",alignItems:"center",justifyContent:"center"},
  viewOn:{background:"#F1F1EF",color:"#37352F"},

  // Export dropdown
  expDrop:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",border:"1px solid #E3E2DE",minWidth:200,zIndex:100,padding:4,animation:"slideD .15s ease"},
  expOpt:{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"8px 12px",fontSize:13,color:"#37352F",cursor:"pointer",borderRadius:4,fontFamily:"inherit"},
  expOptNote:{display:"block",width:"100%",padding:"4px 12px 8px",fontSize:11,color:"#9B9A97",fontFamily:"inherit"},

  // Bars
  errorBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,margin:"12px 0",fontSize:13,color:"#991B1B",animation:"slideD .2s ease",gap:12,flexWrap:"wrap"},
  retryBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #DC2626",background:"#fff",color:"#DC2626",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBar:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#F0FDF4",border:"1px solid #DCFCE7",borderRadius:8,margin:"12px 0",fontSize:13,color:"#37352F",flexWrap:"wrap",animation:"slideD .2s ease"},
  statDot:{width:3,height:3,borderRadius:"50%",background:"#D3D3D0"},
  statsDismiss:{background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:14,marginLeft:"auto"},
  addMorePanel:{background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:8,padding:14,margin:"12px 0",animation:"slideD .2s ease"},
  attentionBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,margin:"10px 0",fontSize:13,color:"#92400E",animation:"slideD .2s ease",gap:8},
  attentionCount:{fontWeight:700,fontSize:15,color:"#EA580C"},
  attentionBtn:{padding:"5px 14px",borderRadius:6,border:"none",background:"#EA580C",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  shareBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#EFF6FF",border:"1px solid #DBEAFE",borderRadius:8,margin:"12px 0",fontSize:13,color:"#2563EB",animation:"slideD .2s ease",flexWrap:"wrap",gap:8},
  shareBannerBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #2563EB",background:"#fff",color:"#2563EB",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},

  // Stats panel
  statsPanel:{background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:12,padding:20,margin:"12px 0",animation:"slideD .2s ease"},
  statsPanelTitle:{fontSize:13,fontWeight:600,color:"#37352F",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"},
  statsPanelClose:{background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:16,padding:"0 4px"},
  statsGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},
  statsSection:{display:"flex",flexDirection:"column",gap:10},
  statsSectionTitle:{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,color:"#9B9A97",marginBottom:4},
  statsBarRow:{display:"flex",flexDirection:"column",gap:4,marginBottom:6},
  statsBarLabel:{display:"flex",justifyContent:"space-between",fontSize:12,color:"#37352F"},
  statsBarTrack:{height:6,borderRadius:3,background:"#EBEBEA",overflow:"hidden"},
  statsBarFill:{height:"100%",borderRadius:3,transition:"width .4s ease"},
  statsHighlight:{fontSize:13,color:"#37352F",lineHeight:1.6,padding:"8px 10px",background:"#fff",border:"1px solid #F1F1EF",borderRadius:6},
  statsHighlightLabel:{fontSize:11,color:"#9B9A97",marginBottom:2},
  statNumber:{fontSize:28,fontWeight:700,color:"#37352F",letterSpacing:-1},
  statNumberSub:{fontSize:12,color:"#9B9A97",marginTop:2},

  // Dupe modal
  dupeModalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeUp .15s ease"},
  dupeModalBox:{background:"#fff",borderRadius:14,padding:0,maxWidth:560,width:"100%",boxShadow:"0 12px 40px rgba(0,0,0,.15)",overflow:"hidden"},
  dupeModalHeader:{padding:"18px 20px 14px",borderBottom:"1px solid #F1F1EF"},
  dupeModalTitle:{fontSize:16,fontWeight:700,color:"#37352F",marginBottom:4},
  dupeModalSub:{fontSize:13,color:"#9B9A97"},
  dupeList:{maxHeight:340,overflowY:"auto",padding:"12px 20px",display:"flex",flexDirection:"column",gap:10},
  dupeCard:{border:"1px solid #F1F1EF",borderRadius:8,overflow:"hidden"},
  dupePair:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0},
  dupeSide:{padding:"10px 12px",fontSize:12},
  dupeExisting:{background:"#FAFAFA"},
  dupeIncoming:{background:"#fff",borderLeft:"1px solid #F1F1EF"},
  dupeSideLabel:{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,color:"#9B9A97",marginBottom:4},
  dupeSideText:{fontSize:13,color:"#37352F",lineHeight:1.5,fontWeight:500},
  dupeSideSource:{fontSize:11,color:"#9B9A97",marginTop:2},
  dupeActions:{display:"flex",gap:6,padding:"8px 12px",borderTop:"1px solid #F1F1EF",background:"#FAFAFA",justifyContent:"flex-end"},
  dupeKeepBtn:{padding:"4px 12px",borderRadius:6,border:"none",background:"#37352F",color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  dupeSkipBtn:{padding:"4px 10px",borderRadius:6,border:"1px solid #E3E2DE",background:"#fff",color:"#9B9A97",fontSize:12,cursor:"pointer",fontFamily:"inherit"},
  dupeModalFooter:{padding:"12px 20px",borderTop:"1px solid #F1F1EF",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8},
  dupeContinueBtn:{padding:"8px 20px",borderRadius:8,border:"none",background:"#37352F",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  dupeKeptCount:{fontSize:12,color:"#9B9A97"},

  // Bulk edit
  bulkBar:{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F0F7FF",borderRadius:8,margin:"12px 0",flexWrap:"wrap",animation:"slideD .2s ease"},
  bulkN:{fontSize:13,fontWeight:600,color:"#2383E2",whiteSpace:"nowrap"},
  bulkF:{display:"flex",gap:6,alignItems:"center",flex:1,flexWrap:"wrap"},
  bulkSel:{border:"1px solid #D3D3D0",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",background:"#fff"},
  bulkIn:{border:"1px solid #D3D3D0",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",width:140},
  bulkApply:{padding:"5px 12px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  bulkDelBtn:{padding:"5px 12px",borderRadius:6,border:"1px solid #EB5757",background:"#fff",color:"#EB5757",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  bulkX:{background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:14},

  // Toolbar
  toolbar:{display:"flex",gap:8,alignItems:"center",padding:"12px 0",borderBottom:"1px solid #F1F1EF"},
  srchW:{position:"relative",flex:1},
  srchI:{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:.5},
  srchIn:{width:"100%",border:"1px solid #E3E2DE",borderRadius:6,padding:"7px 28px 7px 32px",fontSize:13,fontFamily:"inherit",color:"#37352F",background:"#fff"},
  clrBtn:{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:12},
  sortBtn:{padding:"7px 12px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"},
  sortDrop:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",border:"1px solid #E3E2DE",minWidth:220,zIndex:100,padding:4,animation:"slideD .15s ease"},
  sortOpt:{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"8px 12px",fontSize:13,color:"#37352F",cursor:"pointer",borderRadius:4,fontFamily:"inherit"},
  sortOptOn:{background:"#F1F1EF",fontWeight:600},

  // Category pills
  cats:{display:"flex",gap:6,padding:"10px 0",flexWrap:"wrap",alignItems:"center",borderBottom:"1px solid #F1F1EF"},
  catPill:{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:50,border:"1px solid #E3E2DE",background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  catOn:{background:"#37352F",color:"#fff",borderColor:"#37352F"},
  addCatBtn:{width:26,height:26,borderRadius:50,border:"1px dashed #D3D3D0",background:"transparent",color:"#9B9A97",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"},
  newCatIn:{border:"1px solid #2383E2",borderRadius:6,padding:"4px 8px",fontSize:12,width:90,fontFamily:"inherit"},
  newCatSv:{padding:"4px 10px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},

  // Table
  tHead:{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F1F1EF",fontSize:11,color:"#9B9A97",fontWeight:500,textTransform:"uppercase",letterSpacing:.5},
  row:{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #F7F6F3",transition:"background .1s, opacity .15s",minHeight:48},
  rowCompact:{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #F7F6F3",transition:"background .1s, opacity .15s",minHeight:34},
  favRow:{boxShadow:"inset 3px 0 0 #F59E0B",background:"#FFFDF5"},
  chkW:{width:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .15s"},
  check:{width:16,height:16,borderRadius:4,border:"1.5px solid #D3D3D0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .1s",flexShrink:0},
  checkOn:{background:"#2383E2",borderColor:"#2383E2"},
  entryText:{fontSize:14,lineHeight:1.55,color:"#37352F"},
  entryTextCompact:{fontSize:13,lineHeight:1.4,color:"#37352F"},
  srcCol:{width:200,display:"flex",alignItems:"center",gap:4,paddingRight:8},
  srcText:{fontSize:12,color:"#9B9A97",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",transition:"all .15s"},
  confDot:{width:6,height:6,borderRadius:"50%",flexShrink:0},
  tag:{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"},
  rowAct:{width:110,display:"flex",gap:1,opacity:0,transition:"opacity .15s",justifyContent:"flex-end"},
  actBtn:{background:"none",border:"none",cursor:"pointer",color:"#9B9A97",fontSize:14,padding:"2px 4px",borderRadius:4},

  // Edit form
  textarea:{width:"100%",border:"1px solid #E3E2DE",borderRadius:6,padding:10,fontSize:14,fontFamily:"inherit",color:"#37352F",resize:"vertical",minHeight:60,lineHeight:1.6,background:"#fff"},
  editIn:{flex:1,minWidth:100,border:"1px solid #2383E2",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit"},
  editSel:{border:"1px solid #E3E2DE",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff"},
  editSave:{padding:"4px 12px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  editCancel:{padding:"4px 8px",borderRadius:6,border:"none",background:"transparent",color:"#9B9A97",fontSize:12,cursor:"pointer",fontFamily:"inherit"},

  // Modal
  modalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeUp .15s ease"},
  confirmBox:{background:"#fff",borderRadius:12,padding:24,maxWidth:400,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.12)"},
  confirmCancel:{padding:"8px 16px",borderRadius:6,border:"1px solid #E3E2DE",background:"#fff",color:"#37352F",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  confirmYes:{padding:"8px 16px",borderRadius:6,border:"none",background:"#EB5757",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},

  // Input meta
  entryMeta:{fontSize:12,color:"#9B9A97"},
  warnBadge:{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:"#B45309",background:"#FEF3C7",padding:"2px 8px",borderRadius:50,fontWeight:500},
  fmtToggleWrap:{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#9B9A97",userSelect:"none",cursor:"pointer"},
  fmtToggleTrack:{width:30,height:17,borderRadius:50,transition:"background .2s",flexShrink:0,position:"relative",cursor:"pointer"},
  fmtToggleThumb:{position:"absolute",top:2,width:13,height:13,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transition:"left .2s"},

  // Misc
  empty:{textAlign:"center",padding:"60px 24px"},
  footer:{textAlign:"center",padding:"40px 0 20px",fontSize:12,color:"#D3D3D0",borderTop:"1px solid #F7F6F3",marginTop:40},
  footerLink:{color:"#9B9A97",textDecoration:"none"},
  toast:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#37352F",color:"#fff",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:12,zIndex:2000,boxShadow:"0 4px 16px rgba(0,0,0,.2)",animation:"toastIn .2s ease",fontFamily:"'Inter',-apple-system,sans-serif"},
  toastAction:{background:"none",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,color:"#fff",padding:"3px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
};

// ===================== CARD STYLES =====================
export const CZ = {
  card:{background:"#fff",border:"1px solid #F1F1EF",borderRadius:8,padding:16,transition:"all .15s",cursor:"grab"},
  favCard:{boxShadow:"inset 3px 0 0 #F59E0B",background:"#FFFDF5"},
  top:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10},
  acts:{display:"flex",gap:2,opacity:0,transition:"opacity .15s"},
  txt:{fontSize:15,lineHeight:1.6,color:"#37352F",marginBottom:10},
  srcRow:{display:"flex",alignItems:"center",gap:6},
  src:{fontSize:12,color:"#9B9A97"},
};
