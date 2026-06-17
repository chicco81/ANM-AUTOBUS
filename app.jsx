// ANM Deposito - React UMD (no build required)
const { useState, useEffect } = React;

const LS = {
  vehicles: "anm_vehicles",
  fleet:    "anm_fleet",
  history:  "anm_history",
  theme:    "anm_theme",
};
const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; } };

const FAULT_OPTIONS = [
  "Nessun guasto","Guasto motore","Guasto freni","Guasto porte",
  "Guasto climatizzatore","Guasto sistema elettrico","Guasto pneumatici",
  "Perdita olio","Guasto luci esterne","Altro (specificare)",
];
const CAMBIO_MOTIVI = [
  "Guasto mezzo","Fine turno mezzo","Cambio programmato","Mezzo ritirato in deposito","Altro",
];
const FLEET_STATO = {
  buono:         { label:"Buono",          icon:"✅", color:"#22c55e" },
  guasto:        { label:"Guasto",         icon:"⚠️", color:"#ef4444" },
  manutenzione:  { label:"Manutenzione",   icon:"🔧", color:"#f59e0b" },
  fuori_servizio:{ label:"Fuori servizio", icon:"🚫", color:"#64748b" },
};
const TIPO_RIENTRO = {
  deposito: { label:"Rientra in deposito", icon:"🏠", color:"#22c55e" },
  linea:    { label:"Smonto in linea",     icon:"🛣️", color:"#3b82f6" },
};
const STATUS_COLORS = {
  "In deposito":    "#22c55e",
  "In servizio":    "#f59e0b",
  "Smonto in linea":"#3b82f6",
  "Guasto":         "#ef4444",
};
const THEMES = {
  dark: {
    bg:"#0b0f1a",headerBg:"#0f172a",headerBorder:"#1e40af",
    cardBg:"#0f172a",cardBorder:"#1e293b",inputBg:"#0b0f1a",inputBorder:"#1e293b",
    text:"#e2e8f0",textMuted:"#64748b",textSub:"#475569",textMeta:"#94a3b8",
    accent:"#f59e0b",accentBlue:"#3b82f6",sectionColor:"#3b82f6",
    tripCardBg:"#0b0f1a",tabActiveBg:"#1e40af",tabActiveBorder:"#3b82f6",
    btnPrimaryBg:"#1e40af",btnPrimaryBorder:"#3b82f6",kpiCardBg:"#0f172a",shadow:"none",
    navBg:"#0f172a",navBorder:"#1e293b",
  },
  light: {
    bg:"#f1f5f9",headerBg:"#ffffff",headerBorder:"#3b82f6",
    cardBg:"#ffffff",cardBorder:"#e2e8f0",inputBg:"#f8fafc",inputBorder:"#cbd5e1",
    text:"#0f172a",textMuted:"#64748b",textSub:"#94a3b8",textMeta:"#475569",
    accent:"#d97706",accentBlue:"#2563eb",sectionColor:"#2563eb",
    tripCardBg:"#f8fafc",tabActiveBg:"#2563eb",tabActiveBorder:"#1d4ed8",
    btnPrimaryBg:"#2563eb",btnPrimaryBorder:"#1d4ed8",kpiCardBg:"#ffffff",
    shadow:"0 1px 4px rgba(0,0,0,0.08)",
    navBg:"#ffffff",navBorder:"#e2e8f0",
  },
};

const getNow   = () => new Date().toTimeString().slice(0,5);
const getToday = () => new Date().toISOString().slice(0,10);
const genId    = () => Date.now().toString(36)+Math.random().toString(36).slice(2);

const emptyMezzo = () => ({ id:genId(), mezzo:"", motivo:"" });
const emptyTrip  = () => ({
  id:genId(), linea:"", oraUscita:getNow(), oraRientro:"", tipoRientro:"deposito",
  mezzi:[emptyMezzo()],
});

function getVehicleStatus(v) {
  if (!v.trips?.length) return "In deposito";
  const last = v.trips[v.trips.length-1];
  if (!last.oraRientro) return "In servizio";
  return last.tipoRientro==="linea" ? "Smonto in linea" : "In deposito";
}
function getStatusForDisplay(v) {
  return (v.fault && v.fault!=="Nessun guasto") ? "Guasto" : getVehicleStatus(v);
}

function Badge({ color, icon, label, small }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,
      padding:small?"2px 8px":"4px 12px",borderRadius:20,
      border:`1px solid ${color}44`,background:`${color}18`,
      color,fontSize:small?11:12,fontWeight:600}}>
      {icon&&<span>{icon}</span>} {label}
    </span>
  );
}

function TipoRientroSelector({ value, onChange, t }) {
  return (
    <div>
      <div style={{fontSize:11,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>
        Tipo rientro
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.entries(TIPO_RIENTRO).map(([key,opt])=>{
          const active=value===key;
          return (
            <button key={key} onClick={()=>onChange(key)} style={{
              display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,
              cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:active?700:400,
              border:`2px solid ${active?opt.color:t.cardBorder}`,
              background:active?`${opt.color}20`:"transparent",
              color:active?opt.color:t.textMuted,transition:"all 0.15s",
            }}>
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MezziRipresa({ mezzi, onChange, fleet, t, S, readOnly=false }) {
  function updateM(idx,field,val) {
    onChange(mezzi.map((m,i)=>i===idx?{...m,[field]:val}:m));
  }
  function addM() { onChange([...mezzi, emptyMezzo()]); }
  function removeM(idx) { if(mezzi.length===1) return; onChange(mezzi.filter((_,i)=>i!==idx)); }

  return (
    <div>
      {mezzi.map((m,idx)=>{
        const fleetM = fleet.find(f=>f.mezzo===m.mezzo.toUpperCase());
        const fleetStato = fleetM ? FLEET_STATO[fleetM.stato] : null;
        const sugg = !readOnly && m.mezzo.length>0
          ? fleet.filter(f=>f.mezzo.toLowerCase().includes(m.mezzo.toLowerCase())).slice(0,4)
          : [];
        return (
          <div key={m.id} style={{
            display:"flex",alignItems:"flex-start",gap:8,marginBottom:8,
            background:t.tripCardBg,borderRadius:8,padding:10,
            border:`1px solid ${t.cardBorder}`,
            borderLeft:`3px solid ${idx===0?t.accentBlue:"#f59e0b"}`,
            position:"relative",
          }}>
            <div style={{
              minWidth:22,height:22,borderRadius:"50%",
              background:idx===0?`${t.accentBlue}33`:"#f59e0b33",
              color:idx===0?t.accentBlue:"#f59e0b",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:700,flexShrink:0,marginTop:2,
            }}>{idx+1}</div>
            <div style={{flex:1}}>
              <div style={{position:"relative"}}>
                <div style={{fontSize:10,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
                  {idx===0?"Mezzo iniziale":"Mezzo sostitutivo"}
                </div>
                {readOnly ? (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16,fontWeight:700,color:t.accent,letterSpacing:2}}>{m.mezzo||"—"}</span>
                    {fleetStato && <Badge color={fleetStato.color} icon={fleetStato.icon} label={fleetStato.label} small/>}
                  </div>
                ) : (
                  <>
                    <input style={{...S.input,fontSize:14,letterSpacing:1,fontWeight:600}}
                      placeholder="es. BC123"
                      value={m.mezzo}
                      onChange={e=>updateM(idx,"mezzo",e.target.value.toUpperCase())}/>
                    {sugg.length>0 && (
                      <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:300,
                        background:t.cardBg,border:`1px solid ${t.cardBorder}`,
                        borderRadius:6,overflow:"hidden",boxShadow:"0 4px 16px #0006"}}>
                        {sugg.map(f=>{
                          const so=FLEET_STATO[f.stato]||FLEET_STATO.buono;
                          return (
                            <div key={f.id} onClick={()=>updateM(idx,"mezzo",f.mezzo)}
                              style={{padding:"8px 12px",cursor:"pointer",display:"flex",
                                justifyContent:"space-between",alignItems:"center",
                                borderBottom:`1px solid ${t.cardBorder}`,
                                background:t.cardBg,color:t.text,fontSize:14}}>
                              <strong>{f.mezzo}</strong>
                              <Badge color={so.color} icon={so.icon} label={so.label} small/>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {fleetStato && fleetM.stato!=="buono" && (
                      <div style={{fontSize:11,color:fleetStato.color,marginTop:3}}>
                        {fleetStato.icon} Stato in anagrafica: {fleetStato.label}
                        {fleetM.faultNote && ` — ${fleetM.faultNote}`}
                      </div>
                    )}
                  </>
                )}
              </div>
              {idx>0 && (
                <div style={{marginTop:8}}>
                  <div style={{fontSize:10,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>
                    Motivo cambio
                  </div>
                  {readOnly ? (
                    <span style={{fontSize:12,color:t.textMeta}}>{m.motivo||"—"}</span>
                  ) : (
                    <select style={{...S.input,fontSize:13}} value={m.motivo}
                      onChange={e=>updateM(idx,"motivo",e.target.value)}>
                      <option value="">Seleziona motivo...</option>
                      {CAMBIO_MOTIVI.map(o=><option key={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>
            {!readOnly && mezzi.length>1 && (
              <button onClick={()=>removeM(idx)}
                style={{background:"transparent",border:"none",color:"#ef4444",
                  cursor:"pointer",fontSize:16,padding:0,lineHeight:1,flexShrink:0,marginTop:2}}>
                ✕
              </button>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <button onClick={addM} style={{
          width:"100%",background:"transparent",
          border:`1px dashed ${t.accentBlue}66`,borderRadius:8,
          color:t.accentBlue,padding:"6px",fontSize:12,cursor:"pointer",
          fontFamily:"inherit",marginTop:2,
        }}>
          🚌 + Aggiungi mezzo sostitutivo
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
function App() {
  const [theme,setTheme]       = useState(load(LS.theme,"dark"));
  const t                      = THEMES[theme];
  const S                      = buildStyles(t);
  const [section,setSection]   = useState("dashboard");
  const [vehicles,setVehicles] = useState(()=>load(LS.vehicles,[]));
  const [fleet,setFleet]       = useState(()=>load(LS.fleet,[]));
  const [history,setHistory]   = useState(()=>load(LS.history,[]));
  const [view,setView]           = useState("list");
  const [selectedId,setSelectedId] = useState(null);
  const [filter,setFilter]       = useState("Tutti");
  const [search,setSearch]       = useState("");
  const [formNote,setFormNote]               = useState("");
  const [formFault,setFormFault]             = useState("Nessun guasto");
  const [formFaultDetail,setFormFaultDetail] = useState("");
  const [formData,setFormData]               = useState(getToday());
  const [formTrips,setFormTrips]             = useState([emptyTrip()]);

  useEffect(()=>{localStorage.setItem(LS.vehicles,JSON.stringify(vehicles));},[vehicles]);
  useEffect(()=>{localStorage.setItem(LS.fleet,   JSON.stringify(fleet));   },[fleet]);
  useEffect(()=>{localStorage.setItem(LS.history, JSON.stringify(history)); },[history]);
  useEffect(()=>{localStorage.setItem(LS.theme,   theme);                   },[theme]);

  function archiviaGiornata() {
    if (!vehicles.length) return alert("Nessun mezzo da archiviare.");
    if (!confirm(`Archiviare la giornata del ${getToday()}?`)) return;
    setHistory(p=>[{id:genId(),data:getToday(),timestamp:Date.now(),mezzi:vehicles},...p]);
    setVehicles([]);
    setView("list");
  }

  function updateFormTrip(idx,field,val) {
    setFormTrips(p=>p.map((tr,i)=>i===idx?{...tr,[field]:val}:tr));
  }
  function updateFormTripMezzi(idx,newMezzi) {
    setFormTrips(p=>p.map((tr,i)=>i===idx?{...tr,mezzi:newMezzi}:tr));
  }
  const addFormTrip    = ()    => setFormTrips(p=>[...p,emptyTrip()]);
  const removeFormTrip = (idx) => setFormTrips(p=>p.length===1?p:p.filter((_,i)=>i!==idx));

  function saveNewVehicle() {
    const valid = formTrips.filter(tr=>tr.linea.trim()&&tr.oraUscita&&tr.mezzi.some(m=>m.mezzo.trim()));
    if (!valid.length) return alert("Inserisci almeno una ripresa con linea, ora uscita e almeno un mezzo.");
    const newV = {
      id:genId(),data:formData,note:formNote,fault:formFault,faultDetail:formFaultDetail,
      mezzo: valid[0].mezzi.find(m=>m.mezzo.trim())?.mezzo.trim().toUpperCase() || "—",
      trips: valid.map(tr=>({
        id:genId(),linea:tr.linea.trim().toUpperCase(),
        oraUscita:tr.oraUscita,oraRientro:tr.oraRientro||null,
        tipoRientro:tr.oraRientro?tr.tipoRientro:null,
        mezzi:tr.mezzi.filter(m=>m.mezzo.trim()).map(m=>({
          id:genId(),mezzo:m.mezzo.trim().toUpperCase(),motivo:m.motivo||"",
        })),
      })),
    };
    setVehicles(p=>[newV,...p]);
    setFormNote(""); setFormFault("Nessun guasto"); setFormFaultDetail("");
    setFormData(getToday()); setFormTrips([emptyTrip()]);
    setView("list");
  }

  function addTripToVehicle(vid,trip) {
    setVehicles(p=>p.map(v=>v.id!==vid?v:{...v,trips:[...v.trips,trip]}));
  }
  function updateTrip(vid,tid,changes) {
    setVehicles(p=>p.map(v=>v.id!==vid?v:{
      ...v,trips:v.trips.map(tr=>tr.id===tid?{...tr,...changes}:tr)
    }));
  }
  function updateFault(vid,fault,detail) {
    setVehicles(p=>p.map(v=>v.id===vid?{...v,fault,faultDetail:detail}:v));
  }
  function deleteVehicle(id) {
    if (!confirm("Eliminare questo record dalla giornata?")) return;
    setVehicles(p=>p.filter(v=>v.id!==id)); setView("list");
  }
  function deleteTrip(vid,tid) {
    setVehicles(p=>p.map(v=>v.id!==vid?v:{...v,trips:v.trips.filter(tr=>tr.id!==tid)}));
  }

  const filtered = vehicles.filter(v=>{
    const allMezzi = v.trips?.flatMap(tr=>tr.mezzi?.map(m=>m.mezzo)||[])||[];
    const m = allMezzi.some(mz=>mz.toLowerCase().includes(search.toLowerCase()))
           || v.mezzo.toLowerCase().includes(search.toLowerCase());
    const s = getVehicleStatus(v);
    if (filter==="Tutti")           return m;
    if (filter==="In servizio")     return m && s==="In servizio";
    if (filter==="In deposito")     return m && s==="In deposito";
    if (filter==="Smonto in linea") return m && s==="Smonto in linea";
    if (filter==="Guasto")          return m && v.fault!=="Nessun guasto";
    return m;
  });

  const counts = {
    totale:   vehicles.length,
    servizio: vehicles.filter(v=>getVehicleStatus(v)==="In servizio").length,
    deposito: vehicles.filter(v=>getVehicleStatus(v)==="In deposito").length,
    linea:    vehicles.filter(v=>getVehicleStatus(v)==="Smonto in linea").length,
    guasto:   vehicles.filter(v=>v.fault&&v.fault!=="Nessun guasto").length,
  };

  function addFleetMezzo(mezzo,tipo,stato,note) {
    if (!mezzo.trim()) return alert("Inserisci il numero del mezzo.");
    if (fleet.find(f=>f.mezzo===mezzo.trim().toUpperCase()))
      return alert("Mezzo già presente in anagrafica.");
    setFleet(p=>[{id:genId(),mezzo:mezzo.trim().toUpperCase(),tipo,stato,note,aggiornato:getToday()},...p]);
  }
  function updateFleetStato(id,stato,note) {
    setFleet(p=>p.map(f=>f.id===id?{...f,stato,faultNote:note,aggiornato:getToday()}:f));
  }
  function deleteFleetMezzo(id) {
    if (!confirm("Rimuovere il mezzo dall'anagrafica?")) return;
    setFleet(p=>p.filter(f=>f.id!==id));
  }
  function deleteHistoryDay(id) {
    if (!confirm("Eliminare questa giornata dallo storico?")) return;
    setHistory(p=>p.filter(d=>d.id!==id));
  }

  const selectedVehicle = vehicles.find(v=>v.id===selectedId);
  const TABS = [
    {id:"dashboard",icon:"🚌",label:"Giornata",badge:vehicles.length||null},
    {id:"fleet",    icon:"📋",label:"Anagrafica",badge:null},
    {id:"history",  icon:"📅",label:"Storico",badge:history.length||null},
  ];

  return (
    <div style={S.root}>
      {/* HEADER */}
      <header style={S.header}>
        <div style={S.hInner}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>🚌</span>
            <div>
              <div style={{fontSize:17,fontWeight:700,letterSpacing:3,color:t.accent}}>ANM DEPOSITO</div>
              <div style={{fontSize:10,color:t.textSub,letterSpacing:1}}>Gestione Mezzi · {getToday()}</div>
            </div>
          </div>
          <button onClick={()=>setTheme(p=>p==="dark"?"light":"dark")} style={S.themeBtn}>
            {theme==="dark"?"☀️":"🌙"}
            <span style={{fontSize:11,fontWeight:600}}>{theme==="dark"?"Giorno":"Notte"}</span>
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav style={{background:t.navBg,borderBottom:`1px solid ${t.navBorder}`,
                   display:"flex",position:"sticky",top:50,zIndex:90}}>
        {TABS.map(tab=>{
          const active=section===tab.id;
          return (
            <button key={tab.id} onClick={()=>{setSection(tab.id);setView("list");}}
              style={{flex:1,padding:"11px 8px",border:"none",
                borderBottom:`3px solid ${active?t.accentBlue:"transparent"}`,
                background:"transparent",color:active?t.accentBlue:t.textMuted,
                fontSize:13,fontWeight:active?700:400,cursor:"pointer",fontFamily:"inherit",
                display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s"}}>
              {tab.icon} {tab.label}
              {tab.badge&&tab.badge>0&&(
                <span style={{background:active?t.accentBlue:t.textMuted,color:"#fff",
                  borderRadius:10,fontSize:10,padding:"1px 6px",fontWeight:700}}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BARRA AZIONI */}
      {section==="dashboard"&&view==="list"&&(
        <div style={{background:t.headerBg,borderBottom:`1px solid ${t.navBorder}`,
          padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{fontSize:12,color:t.textMuted}}>
            {vehicles.length>0?`${vehicles.length} scheda/e oggi`:"Nessuna scheda oggi"}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {vehicles.length>0&&(
              <button onClick={archiviaGiornata} style={{
                background:"transparent",border:`1px solid ${t.cardBorder}`,
                borderRadius:8,color:t.textMuted,padding:"6px 12px",
                fontSize:12,cursor:"pointer",fontFamily:"inherit",
              }}>📦 Archivia giornata</button>
            )}
            <button onClick={()=>{setFormTrips([emptyTrip()]);setView("form");}} style={{
              background:t.btnPrimaryBg,border:`1px solid ${t.btnPrimaryBorder}`,
              borderRadius:8,color:"#fff",padding:"6px 14px",
              fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600,
            }}>+ Nuova scheda</button>
          </div>
        </div>
      )}

      {/* ══ GIORNATA ══ */}
      {section==="dashboard"&&(
        <>
          {view==="list"&&(
            <div style={S.content}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:18}}>
                {[
                  {label:"Totale",     val:counts.totale,   color:t.text},
                  {label:"In servizio",val:counts.servizio,  color:"#f59e0b"},
                  {label:"In deposito",val:counts.deposito,  color:"#22c55e"},
                  {label:"In linea",   val:counts.linea,     color:"#3b82f6"},
                  {label:"Guasti",     val:counts.guasto,    color:"#ef4444"},
                ].map(k=>(
                  <div key={k.label} style={{...S.kpiCard,borderTopColor:k.color}}>
                    <div style={{fontSize:24,fontWeight:700,color:k.color,lineHeight:1,width:"100%",textAlign:"center"}}>{k.val}</div>
                    <div style={{fontSize:10,color:t.textMuted,marginTop:5,letterSpacing:0.5,textTransform:"uppercase",width:"100%",textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k.label}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                <input style={S.searchInput} placeholder="🔍 Cerca mezzo..."
                  value={search} onChange={e=>setSearch(e.target.value)}/>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {["Tutti","In servizio","In deposito","Smonto in linea","Guasto"].map(f=>(
                    <button key={f} onClick={()=>setFilter(f)}
                      style={{...S.tab,...(filter===f?S.tabActive:{})}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length===0?(
                <div style={{textAlign:"center",color:t.textMuted,padding:"50px 0"}}>
                  <div style={{fontSize:44,marginBottom:10}}>🚌</div>
                  <div>Nessuna scheda nella giornata corrente.</div>
                  <div style={{fontSize:12,marginTop:6,color:t.textSub}}>Premi "+ Nuova scheda" per iniziare.</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
                  {filtered.map(v=>{
                    const status=getStatusForDisplay(v);
                    const sc=STATUS_COLORS[status]||"#94a3b8";
                    return (
                      <div key={v.id} style={S.vehicleCard}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                                     marginBottom:10,cursor:"pointer"}}
                             onClick={()=>{setSelectedId(v.id);setView("detail");}}>
                          <div>
                            <div style={{fontSize:11,color:t.textMuted,letterSpacing:1,marginBottom:2}}>SCHEDA TURNO</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                              {(v.trips[0]?.mezzi||[]).map((m,i)=>(
                                <span key={m.id} style={{fontSize:18,fontWeight:700,
                                  color:i===0?t.accent:"#f59e0b",letterSpacing:1}}>
                                  {m.mezzo}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Badge color={sc} label={status} small/>
                        </div>
                        {v.trips.map((tr,idx)=>{
                          const ri=tr.oraRientro
                            ?(tr.tipoRientro==="linea"
                              ?{icon:"🛣️",color:"#3b82f6",txt:tr.oraRientro}
                              :{icon:"🏠",color:"#22c55e",txt:tr.oraRientro})
                            :{icon:"⏳",color:"#f59e0b",txt:"in servizio"};
                          const tuttiMezzi=(tr.mezzi||[]).map(m=>m.mezzo).filter(Boolean).join(" → ");
                          return (
                            <div key={tr.id} style={{fontSize:12,color:t.textMeta,
                                                     marginBottom:5,display:"flex",
                                                     gap:7,flexWrap:"wrap",alignItems:"center"}}>
                              <span style={{background:`${t.accentBlue}22`,borderRadius:4,
                                padding:"1px 6px",fontSize:11,color:t.accentBlue,fontWeight:700}}>
                                R{idx+1}
                              </span>
                              <span style={{color:t.accent,fontWeight:600}}>{tuttiMezzi}</span>
                              <span>🛣️ {tr.linea}</span>
                              <span>⬆️ {tr.oraUscita}</span>
                              <span style={{color:ri.color}}>{ri.icon} {ri.txt}</span>
                            </div>
                          );
                        })}
                        <div style={{display:"flex",justifyContent:"space-between",
                                     alignItems:"center",borderTop:`1px solid ${t.cardBorder}`,
                                     paddingTop:8,marginTop:8}}>
                          <button onClick={()=>{setSelectedId(v.id);setView("detail");}}
                            style={{...S.btnSecondary,padding:"4px 12px",fontSize:12}}>
                            ✏️ Dettaglio
                          </button>
                          {v.fault&&v.fault!=="Nessun guasto"
                            ?<span style={{fontSize:11,color:"#ef4444",background:"#ef44441a",
                                           padding:"2px 8px",borderRadius:4}}>⚠️ {v.fault}</span>
                            :<span/>}
                          <span style={{fontSize:11,color:t.textSub}}>{v.trips?.length||0} ripresa/e</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view==="form"&&(
            <FormNuovaScheda
              t={t} S={S} fleet={fleet}
              formNote={formNote} setFormNote={setFormNote}
              formFault={formFault} setFormFault={setFormFault}
              formFaultDetail={formFaultDetail} setFormFaultDetail={setFormFaultDetail}
              formData={formData} setFormData={setFormData}
              formTrips={formTrips}
              updateFormTrip={updateFormTrip}
              updateFormTripMezzi={updateFormTripMezzi}
              addFormTrip={addFormTrip} removeFormTrip={removeFormTrip}
              onSave={saveNewVehicle} onCancel={()=>setView("list")}
            />
          )}

          {view==="detail"&&selectedVehicle&&(
            <DetailView
              v={selectedVehicle} t={t} S={S} fleet={fleet}
              onBack={()=>setView("list")}
              onAddTrip={addTripToVehicle}
              onUpdateTrip={updateTrip}
              onUpdateFault={updateFault}
              onDelete={deleteVehicle}
              onDeleteTrip={deleteTrip}
            />
          )}
        </>
      )}

      {section==="fleet"&&(
        <FleetView t={t} S={S} fleet={fleet} history={history}
          onAdd={addFleetMezzo} onUpdateStato={updateFleetStato} onDelete={deleteFleetMezzo}/>
      )}
      {section==="history"&&(
        <HistoryView t={t} S={S} history={history} onDelete={deleteHistoryDay}/>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FORM NUOVA SCHEDA
// ════════════════════════════════════════════════════════════════════════════
function FormNuovaScheda({t,S,fleet,formNote,setFormNote,formFault,setFormFault,
  formFaultDetail,setFormFaultDetail,formData,setFormData,formTrips,
  updateFormTrip,updateFormTripMezzi,addFormTrip,removeFormTrip,onSave,onCancel}) {
  return (
    <div style={S.content}>
      <div style={S.formCard}>
        <div style={{fontSize:18,fontWeight:700,color:t.accent,letterSpacing:1,marginBottom:18}}>
          Nuova scheda turno
        </div>
        <div style={{marginBottom:14}}>
          <div style={S.formLabel}>Data</div>
          <input style={{...S.input,maxWidth:180}} type="date"
            value={formData} onChange={e=>setFormData(e.target.value)}/>
        </div>
        <div style={S.sectionHdr}>Riprese / Corse del giorno</div>
        <div style={{fontSize:12,color:t.textMuted,marginBottom:12}}>
          Per ogni ripresa puoi aggiungere più mezzi: il primo è quello di partenza, i successivi sono sostituzioni.
        </div>
        {formTrips.map((tr,idx)=>(
          <div key={tr.id} style={{...S.tripFormBox,borderLeftColor:t.accentBlue,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:700,color:t.accentBlue,letterSpacing:1}}>RIPRESA {idx+1}</span>
              {formTrips.length>1&&(
                <button onClick={()=>removeFormTrip(idx)}
                  style={{background:"transparent",border:"none",color:"#ef4444",
                    cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
                  ✕ Rimuovi ripresa
                </button>
              )}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
              <div style={{flex:2,minWidth:100}}>
                <div style={S.formLabel}>Linea *</div>
                <input style={S.input} placeholder="es. 180 / R6"
                  value={tr.linea} onChange={e=>updateFormTrip(idx,"linea",e.target.value)}/>
              </div>
              <div style={{flex:1,minWidth:80}}>
                <div style={S.formLabel}>Ora uscita *</div>
                <input style={S.input} type="time"
                  value={tr.oraUscita} onChange={e=>updateFormTrip(idx,"oraUscita",e.target.value)}/>
              </div>
              <div style={{flex:1,minWidth:80}}>
                <div style={S.formLabel}>Ora rientro</div>
                <input style={S.input} type="time"
                  value={tr.oraRientro} onChange={e=>updateFormTrip(idx,"oraRientro",e.target.value)}/>
              </div>
            </div>
            {tr.oraRientro&&(
              <div style={{marginBottom:12}}>
                <TipoRientroSelector value={tr.tipoRientro}
                  onChange={val=>updateFormTrip(idx,"tipoRientro",val)} t={t}/>
              </div>
            )}
            <div style={{fontSize:11,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>
              Mezzi utilizzati in questa ripresa
            </div>
            <MezziRipresa
              mezzi={tr.mezzi}
              onChange={newMezzi=>updateFormTripMezzi(idx,newMezzi)}
              fleet={fleet} t={t} S={S}/>
          </div>
        ))}
        <button onClick={addFormTrip}
          style={{...S.btnSecondary,width:"100%",marginBottom:18,borderStyle:"dashed"}}>
          + Aggiungi ripresa
        </button>
        <div style={S.sectionHdr}>Stato / Guasto</div>
        <div style={{marginBottom:12}}>
          <div style={S.formLabel}>Segnalazione guasto</div>
          <select style={S.input} value={formFault} onChange={e=>setFormFault(e.target.value)}>
            {FAULT_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
        {formFault==="Altro (specificare)"&&(
          <div style={{marginBottom:12}}>
            <div style={S.formLabel}>Descrizione guasto</div>
            <input style={S.input} placeholder="Descrivi..."
              value={formFaultDetail} onChange={e=>setFormFaultDetail(e.target.value)}/>
          </div>
        )}
        <div style={{marginBottom:12}}>
          <div style={S.formLabel}>Note aggiuntive</div>
          <textarea style={{...S.input,minHeight:54,resize:"vertical"}}
            placeholder="Note operative..."
            value={formNote} onChange={e=>setFormNote(e.target.value)}/>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:14}}>
          <button onClick={onCancel} style={S.btnSecondary}>Annulla</button>
          <button onClick={onSave}   style={S.btnPrimary}>✅ Salva scheda</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL VIEW
// ════════════════════════════════════════════════════════════════════════════
function DetailView({v,t,S,fleet,onBack,onAddTrip,onUpdateTrip,onUpdateFault,onDelete,onDeleteTrip}) {
  const [fault,setFault]             = useState(v.fault||"Nessun guasto");
  const [faultDetail,setFaultDetail] = useState(v.faultDetail||"");
  const [showAdd,setShowAdd]         = useState(false);
  const [rientroMap,setRientroMap]   = useState({});
  const [tipoMap,setTipoMap]         = useState({});
  const [newTrip,setNewTrip]         = useState(emptyTrip());
  const isGuasto = fault!=="Nessun guasto";

  function saveRientro(tid) {
    const ora=rientroMap[tid]; const tipo=tipoMap[tid]||"deposito";
    if (!ora) return alert("Inserisci l'ora di rientro.");
    onUpdateTrip(v.id,tid,{oraRientro:ora,tipoRientro:tipo});
  }
  function handleAddTrip() {
    if (!newTrip.linea.trim()) return alert("Inserisci la linea.");
    if (!newTrip.oraUscita)    return alert("Inserisci l'ora di uscita.");
    const m = newTrip.mezzi.filter(m=>m.mezzo.trim());
    if (!m.length) return alert("Inserisci almeno un mezzo.");
    onAddTrip(v.id,{
      id:genId(),linea:newTrip.linea.trim().toUpperCase(),
      oraUscita:newTrip.oraUscita,
      oraRientro:newTrip.oraRientro||null,
      tipoRientro:newTrip.oraRientro?newTrip.tipoRientro:null,
      mezzi:m.map(m=>({id:genId(),mezzo:m.mezzo.trim().toUpperCase(),motivo:m.motivo||""})),
    });
    setNewTrip(emptyTrip()); setShowAdd(false);
  }

  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>
      <div style={S.formCard}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
          <button onClick={onBack} style={S.backBtn}>← Indietro</button>
          <div style={{fontSize:16,fontWeight:700,color:t.accent,letterSpacing:1}}>
            Scheda turno · {v.data}
          </div>
        </div>
        <div style={{border:`1px solid ${isGuasto?"#ef444455":"#22c55e55"}`,
                     background:isGuasto?"#ef44440d":"#22c55e0d",borderRadius:8,padding:12,marginBottom:14}}>
          <div style={S.formLabel}>Stato guasto</div>
          <select style={{...S.input,borderColor:isGuasto?"#ef4444":"#22c55e"}} value={fault}
            onChange={e=>{setFault(e.target.value);onUpdateFault(v.id,e.target.value,faultDetail);}}>
            {FAULT_OPTIONS.map(o=><option key={o}>{o}</option>)}
          </select>
          {fault==="Altro (specificare)"&&(
            <input style={{...S.input,marginTop:8}} placeholder="Descrivi..."
              value={faultDetail}
              onChange={e=>{setFaultDetail(e.target.value);onUpdateFault(v.id,fault,e.target.value);}}/>
          )}
          {!isGuasto
            ?<div style={{color:"#22c55e",fontSize:13,marginTop:6}}>✅ Nessun guasto</div>
            :<div style={{color:"#ef4444",fontSize:13,marginTop:6}}>⚠️ {fault}{faultDetail?` — ${faultDetail}`:""}</div>}
        </div>
        <div style={S.sectionHdr}>
          Corse / Riprese <span style={{fontSize:12,fontWeight:400,color:t.textMuted}}>({v.trips.length})</span>
        </div>
        {v.trips.map((tr,idx)=>{
          const hasR=!!tr.oraRientro;
          const tOpt=tr.tipoRientro?TIPO_RIENTRO[tr.tipoRientro]:null;
          return (
            <div key={tr.id} style={{...S.tripCardDetail,borderLeftColor:t.accentBlue,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:t.textSub,letterSpacing:1,textTransform:"uppercase"}}>Ripresa {idx+1}</span>
                  <span style={{fontSize:16,fontWeight:700,color:t.accentBlue}}>Linea {tr.linea}</span>
                </div>
                <button onClick={()=>{if(confirm(`Eliminare ripresa ${idx+1}?`))onDeleteTrip(v.id,tr.id);}}
                  style={{background:"transparent",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>🗑️</button>
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Mezzi utilizzati</div>
                <MezziRipresa
                  mezzi={tr.mezzi||[{id:genId(),mezzo:v.mezzo,motivo:""}]}
                  onChange={newMezzi=>onUpdateTrip(v.id,tr.id,{mezzi:newMezzi})}
                  fleet={fleet} t={t} S={S} readOnly={false}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:t.textSub,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>USCITA</div>
                  <div style={{fontSize:22,fontWeight:700,color:t.accent,letterSpacing:2}}>{tr.oraUscita}</div>
                </div>
                <div style={{color:t.textSub,fontSize:18,paddingTop:16}}>→</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:t.textSub,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>RIENTRO</div>
                  {hasR?(
                    <div>
                      <div style={{fontSize:22,fontWeight:700,color:tOpt?.color||"#22c55e",letterSpacing:2}}>{tr.oraRientro}</div>
                      {tOpt&&<div style={{marginTop:5}}><Badge color={tOpt.color} icon={tOpt.icon} label={tOpt.label} small/></div>}
                    </div>
                  ):(
                    <div>
                      <input type="time" style={{...S.input,padding:"5px 8px",fontSize:14,width:110,marginBottom:8}}
                        value={rientroMap[tr.id]||""}
                        onChange={e=>setRientroMap(p=>({...p,[tr.id]:e.target.value}))}/>
                      {rientroMap[tr.id]&&(
                        <div style={{marginBottom:8}}>
                          <TipoRientroSelector value={tipoMap[tr.id]||"deposito"}
                            onChange={val=>setTipoMap(p=>({...p,[tr.id]:val}))} t={t}/>
                        </div>
                      )}
                      <button onClick={()=>saveRientro(tr.id)} style={S.btnSmall}>Salva rientro</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{...S.btnSecondary,width:"100%",marginTop:4,borderStyle:showAdd?"solid":"dashed"}}>
          {showAdd?"✕ Annulla":"+  Aggiungi nuova ripresa (spezzato)"}
        </button>
        {showAdd&&(
          <div style={{background:t.tripCardBg,border:`1px dashed ${t.cardBorder}`,borderRadius:8,padding:14,marginTop:10}}>
            <div style={{fontSize:12,fontWeight:700,color:t.accentBlue,letterSpacing:1,marginBottom:12}}>NUOVA RIPRESA</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
              <div style={{flex:2,minWidth:100}}>
                <div style={S.formLabel}>Linea *</div>
                <input style={S.input} placeholder="es. R6"
                  value={newTrip.linea} onChange={e=>setNewTrip(p=>({...p,linea:e.target.value}))}/>
              </div>
              <div style={{flex:1,minWidth:80}}>
                <div style={S.formLabel}>Ora uscita *</div>
                <input style={S.input} type="time"
                  value={newTrip.oraUscita} onChange={e=>setNewTrip(p=>({...p,oraUscita:e.target.value}))}/>
              </div>
              <div style={{flex:1,minWidth:80}}>
                <div style={S.formLabel}>Ora rientro</div>
                <input style={S.input} type="time"
                  value={newTrip.oraRientro} onChange={e=>setNewTrip(p=>({...p,oraRientro:e.target.value}))}/>
              </div>
            </div>
            {newTrip.oraRientro&&(
              <div style={{marginBottom:12}}>
                <TipoRientroSelector value={newTrip.tipoRientro}
                  onChange={val=>setNewTrip(p=>({...p,tipoRientro:val}))} t={t}/>
              </div>
            )}
            <div style={{fontSize:11,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Mezzi di questa ripresa</div>
            <MezziRipresa
              mezzi={newTrip.mezzi}
              onChange={m=>setNewTrip(p=>({...p,mezzi:m}))}
              fleet={fleet} t={t} S={S}/>
            <button onClick={handleAddTrip} style={{...S.btnPrimary,marginTop:12}}>✅ Aggiungi ripresa</button>
          </div>
        )}
        {v.note&&(
          <div style={{background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:12,marginTop:14}}>
            <div style={S.formLabel}>Note</div>
            <div style={{fontSize:14,color:t.textMeta}}>{v.note}</div>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:18}}>
          <button onClick={()=>onDelete(v.id)} style={S.btnDanger}>🗑️ Elimina scheda</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLEET VIEW
// ════════════════════════════════════════════════════════════════════════════
function FleetView({t,S,fleet,onAdd,onUpdateStato,onDelete,history}) {
  const [newMezzo,setNewMezzo]   = useState("");
  const [newTipo,setNewTipo]     = useState("Bus");
  const [newStato,setNewStato]   = useState("buono");
  const [newNote,setNewNote]     = useState("");
  const [filterStato,setFilterStato] = useState("tutti");
  const [searchF,setSearchF]     = useState("");
  const [editId,setEditId]       = useState(null);
  const [editStato,setEditStato] = useState("");
  const [editNote,setEditNote]   = useState("");

  const usageCount={}, lastUsed={};
  history.forEach(day=>day.mezzi?.forEach(v=>
    v.trips?.forEach(tr=>tr.mezzi?.forEach(m=>{
      if (!m.mezzo) return;
      usageCount[m.mezzo]=(usageCount[m.mezzo]||0)+1;
      if (!lastUsed[m.mezzo]||day.data>lastUsed[m.mezzo]) lastUsed[m.mezzo]=day.data;
    }))
  ));

  const filtered=fleet.filter(f=>{
    const m=f.mezzo.toLowerCase().includes(searchF.toLowerCase());
    return filterStato==="tutti"?m:m&&f.stato===filterStato;
  });
  const cnt={
    totale:fleet.length,buono:fleet.filter(f=>f.stato==="buono").length,
    guasto:fleet.filter(f=>f.stato==="guasto").length,
    manutenzione:fleet.filter(f=>f.stato==="manutenzione").length,
    fuori:fleet.filter(f=>f.stato==="fuori_servizio").length,
  };

  return (
    <div style={S.content}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:18}}>
        {[
          {label:"Totale",      val:cnt.totale,       color:t.text},
          {label:"Buoni",       val:cnt.buono,         color:"#22c55e"},
          {label:"Guasti",      val:cnt.guasto,        color:"#ef4444"},
          {label:"Manut.",      val:cnt.manutenzione,  color:"#f59e0b"},
          {label:"Fuori serv.", val:cnt.fuori,         color:"#64748b"},
        ].map(k=>(
          <div key={k.label} style={{...S.kpiCard,borderTopColor:k.color}}>
            <div style={{fontSize:24,fontWeight:700,color:k.color,lineHeight:1,width:"100%",textAlign:"center"}}>{k.val}</div>
            <div style={{fontSize:10,color:t.textMuted,marginTop:5,letterSpacing:0.5,textTransform:"uppercase",width:"100%",textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{...S.formCard,marginBottom:18}}>
        <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:12}}>➕ Aggiungi mezzo</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
          <div style={{flex:2,minWidth:100}}>
            <div style={S.formLabel}>Numero mezzo *</div>
            <input style={S.input} placeholder="es. BC123" value={newMezzo} onChange={e=>setNewMezzo(e.target.value)}/>
          </div>
          <div style={{flex:1,minWidth:80}}>
            <div style={S.formLabel}>Tipo</div>
            <select style={S.input} value={newTipo} onChange={e=>setNewTipo(e.target.value)}>
              {["Bus","Minibus","Bus articolato","Bus elettrico","Altro"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={{flex:1,minWidth:110}}>
            <div style={S.formLabel}>Stato</div>
            <select style={S.input} value={newStato} onChange={e=>setNewStato(e.target.value)}>
              {Object.entries(FLEET_STATO).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
        </div>
        <input style={{...S.input,marginBottom:10}} placeholder="Note (opzionale)" value={newNote} onChange={e=>setNewNote(e.target.value)}/>
        <button onClick={()=>{onAdd(newMezzo,newTipo,newStato,newNote);setNewMezzo("");setNewNote("");}} style={S.btnPrimary}>✅ Aggiungi</button>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        <input style={S.searchInput} placeholder="🔍 Cerca..." value={searchF} onChange={e=>setSearchF(e.target.value)}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {[["tutti","Tutti"],["buono","✅ Buoni"],["guasto","⚠️ Guasti"],
            ["manutenzione","🔧 Manut."],["fuori_servizio","🚫 Fuori"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilterStato(k)} style={{...S.tab,...(filterStato===k?S.tabActive:{})}}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0?(
        <div style={{textAlign:"center",color:t.textMuted,padding:"40px 0"}}>
          <div style={{fontSize:40,marginBottom:10}}>📋</div>
          <div>Nessun mezzo in anagrafica.</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:10}}>
          {filtered.map(f=>{
            const so=FLEET_STATO[f.stato]||FLEET_STATO.buono;
            const uses=usageCount[f.mezzo]||0;
            const last=lastUsed[f.mezzo]||null;
            const isEditing=editId===f.id;
            return (
              <div key={f.id} style={{...S.vehicleCard,borderLeft:`3px solid ${so.color}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:700,color:t.accent,letterSpacing:2}}>{f.mezzo}</div>
                    <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>{f.tipo}</div>
                  </div>
                  <Badge color={so.color} icon={so.icon} label={so.label} small/>
                </div>
                <div style={{display:"flex",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:t.textMeta}}>📊 {uses} utilizzo/i</span>
                  {last&&<span style={{fontSize:12,color:t.textMeta}}>📅 {last}</span>}
                </div>
                {f.faultNote&&!isEditing&&<div style={{fontSize:12,color:"#ef4444",marginBottom:6}}>⚠️ {f.faultNote}</div>}
                {f.note&&!isEditing&&<div style={{fontSize:12,color:t.textMuted,marginBottom:6,fontStyle:"italic"}}>{f.note}</div>}
                {isEditing?(
                  <div style={{borderTop:`1px solid ${t.cardBorder}`,paddingTop:10,marginTop:6}}>
                    <div style={S.formLabel}>Cambia stato</div>
                    <select style={{...S.input,marginBottom:8}} value={editStato} onChange={e=>setEditStato(e.target.value)}>
                      {Object.entries(FLEET_STATO).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <input style={{...S.input,marginBottom:10}} placeholder="Note guasto..." value={editNote} onChange={e=>setEditNote(e.target.value)}/>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{onUpdateStato(f.id,editStato,editNote);setEditId(null);}} style={S.btnSmall}>✅ Salva</button>
                      <button onClick={()=>setEditId(null)} style={{...S.btnSecondary,padding:"5px 12px",fontSize:12}}>Annulla</button>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8,borderTop:`1px solid ${t.cardBorder}`,paddingTop:8,marginTop:4}}>
                    <button onClick={()=>{setEditId(f.id);setEditStato(f.stato);setEditNote(f.faultNote||"");}}
                      style={{...S.btnSecondary,padding:"4px 10px",fontSize:12,flex:1}}>
                      🔄 Aggiorna stato
                    </button>
                    <button onClick={()=>onDelete(f.id)}
                      style={{background:"transparent",border:"1px solid #ef444466",borderRadius:6,
                        color:"#ef4444",padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HISTORY VIEW
// ════════════════════════════════════════════════════════════════════════════
function HistoryView({t,S,history,onDelete}) {
  const [search,setSearch]           = useState("");
  const [openDay,setOpenDay]         = useState(null);
  const [searchMezzo,setSearchMezzo] = useState("");

  const mezzoResults = searchMezzo.trim().length>1
    ? history.flatMap(day=>
        (day.mezzi||[]).flatMap(v=>
          (v.trips||[]).flatMap(tr=>
            (tr.mezzi||[]).filter(m=>m.mezzo.toLowerCase().includes(searchMezzo.toLowerCase()))
              .map(()=>({...v,_data:day.data,_dayId:day.id,
                _trips:v.trips?.map(t2=>({...t2,
                  _highlight:t2.mezzi?.some(mx=>mx.mezzo.toLowerCase().includes(searchMezzo.toLowerCase()))
                }))||[]}))
          )
        )
      ).filter((v,i,a)=>a.findIndex(x=>x.id===v.id&&x._data===v._data)===i)
    : [];

  const filteredDays=history.filter(d=>
    d.data.includes(search)||
    (d.mezzi||[]).some(v=>
      v.trips?.some(tr=>tr.mezzi?.some(m=>m.mezzo.toLowerCase().includes(search.toLowerCase())))
    )
  );

  return (
    <div style={S.content}>
      <div style={{...S.formCard,marginBottom:18}}>
        <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:12}}>🔍 Cerca mezzo nello storico</div>
        <input style={S.input} placeholder="Inserisci numero mezzo (es. BC123)..."
          value={searchMezzo} onChange={e=>setSearchMezzo(e.target.value)}/>
        {searchMezzo.trim().length>1&&(
          mezzoResults.length===0?(
            <div style={{color:t.textMuted,fontSize:13,marginTop:10}}>Nessun utilizzo trovato per "{searchMezzo}".</div>
          ):(
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,color:t.textMuted,marginBottom:8}}>{mezzoResults.length} scheda/e trovata/e:</div>
              {mezzoResults.map((v,i)=>(
                <div key={i} style={{background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:12,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontWeight:700,color:t.accent}}>📅 {v._data}</span>
                    {v.fault&&v.fault!=="Nessun guasto"&&<span style={{fontSize:11,color:"#ef4444"}}>⚠️ {v.fault}</span>}
                  </div>
                  {v._trips.map((tr,j)=>{
                    const tOpt=tr.tipoRientro?TIPO_RIENTRO[tr.tipoRientro]:null;
                    const mList=(tr.mezzi||[]).map(m=>m.mezzo).join(" → ");
                    return (
                      <div key={j} style={{fontSize:12,color:tr._highlight?t.text:t.textMeta,
                                           marginBottom:5,display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",fontWeight:tr._highlight?600:400}}>
                        <span style={{background:`${t.accentBlue}22`,borderRadius:4,padding:"0 6px",fontSize:11,color:t.accentBlue,fontWeight:700}}>{j+1}</span>
                        <span style={{color:t.accent}}>{mList}</span>
                        <span>🛣️ {tr.linea}</span>
                        <span>⬆️ {tr.oraUscita}</span>
                        {tr.oraRientro&&<span>⬇️ {tr.oraRientro}</span>}
                        {tOpt&&<Badge color={tOpt.color} icon={tOpt.icon} label={tOpt.label} small/>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
        <input style={S.searchInput} placeholder="🔍 Filtra per data o mezzo..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <span style={{fontSize:13,color:t.textMuted}}>{filteredDays.length} giornata/e</span>
      </div>
      {filteredDays.length===0?(
        <div style={{textAlign:"center",color:t.textMuted,padding:"40px 0"}}>
          <div style={{fontSize:40,marginBottom:10}}>📅</div>
          <div>Nessuna giornata archiviata.</div>
          <div style={{fontSize:12,marginTop:6,color:t.textSub}}>Usa "📦 Archivia" nella schermata Giornata per salvare.</div>
        </div>
      ):filteredDays.map(day=>{
        const isOpen=openDay===day.id;
        const mezziCount=day.mezzi?.length||0;
        const tuttiMezzi=[...new Set((day.mezzi||[]).flatMap(v=>
          v.trips?.flatMap(tr=>tr.mezzi?.map(m=>m.mezzo)||[])||[]
        ))];
        const linee=[...new Set((day.mezzi||[]).flatMap(v=>v.trips?.map(tr=>tr.linea)||[]))];
        return (
          <div key={day.id} style={{...S.vehicleCard,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                 onClick={()=>setOpenDay(isOpen?null:day.id)}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:t.accent}}>📅 {day.data}</div>
                <div style={{fontSize:12,color:t.textMuted,marginTop:2}}>
                  {mezziCount} scheda/e · Mezzi: {tuttiMezzi.slice(0,4).join(", ")}{tuttiMezzi.length>4?"…":""} · Linee: {linee.join(", ")||"—"}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{color:t.textMuted}}>{isOpen?"▲":"▼"}</span>
                <button onClick={e=>{e.stopPropagation();onDelete(day.id);}}
                  style={{background:"transparent",border:"1px solid #ef444466",borderRadius:6,
                    color:"#ef4444",padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                  🗑️
                </button>
              </div>
            </div>
            {isOpen&&(
              <div style={{borderTop:`1px solid ${t.cardBorder}`,marginTop:12,paddingTop:12}}>
                {(day.mezzi||[]).map(v=>{
                  const status=getStatusForDisplay(v);
                  const sc=STATUS_COLORS[status]||"#94a3b8";
                  return (
                    <div key={v.id} style={{background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderRadius:8,padding:12,marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <Badge color={sc} label={status} small/>
                        {v.fault&&v.fault!=="Nessun guasto"&&<span style={{fontSize:11,color:"#ef4444"}}>⚠️ {v.fault}</span>}
                      </div>
                      {v.trips?.map((tr,j)=>{
                        const tOpt=tr.tipoRientro?TIPO_RIENTRO[tr.tipoRientro]:null;
                        const mList=(tr.mezzi||[]).map(m=>m.mezzo).filter(Boolean);
                        return (
                          <div key={j} style={{marginBottom:8,paddingBottom:8,borderBottom:j<v.trips.length-1?`1px solid ${t.cardBorder}`:"none"}}>
                            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                              <span style={{background:`${t.accentBlue}22`,borderRadius:4,padding:"0 6px",fontSize:11,color:t.accentBlue,fontWeight:700}}>R{j+1}</span>
                              <span style={{fontSize:13,fontWeight:700,color:t.accentBlue}}>Linea {tr.linea}</span>
                              <span style={{fontSize:12,color:t.textMeta}}>⬆️ {tr.oraUscita}</span>
                              {tr.oraRientro&&<span style={{fontSize:12,color:t.textMeta}}>⬇️ {tr.oraRientro}</span>}
                              {tOpt&&<Badge color={tOpt.color} icon={tOpt.icon} label={tOpt.label} small/>}
                            </div>
                            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginLeft:24}}>
                              {mList.map((mz,mi)=>(
                                <span key={mi} style={{display:"flex",alignItems:"center",gap:5}}>
                                  {mi>0&&<span style={{color:t.textSub}}>→</span>}
                                  <span style={{fontWeight:700,color:mi===0?t.accent:"#f59e0b",fontSize:13,letterSpacing:1}}>{mz}</span>
                                  {tr.mezzi[mi]?.motivo&&mi>0&&<span style={{fontSize:10,color:t.textMuted}}>({tr.mezzi[mi].motivo})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── STYLE FACTORY ───────────────────────────────────────────────────────────
function buildStyles(t) {
  return {
    root:          {minHeight:"100vh",background:t.bg,color:t.text,fontFamily:"'DM Mono','Courier New',monospace",transition:"background 0.25s,color 0.25s"},
    header:        {background:t.headerBg,borderBottom:`2px solid ${t.headerBorder}`,padding:"0 16px",position:"sticky",top:0,zIndex:100,boxShadow:t.shadow},
    hInner:        {maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"},
    content:       {maxWidth:960,margin:"0 auto",padding:"18px 16px"},
    kpiCard:       {background:t.kpiCardBg,border:`1px solid ${t.cardBorder}`,borderTop:"3px solid",borderRadius:8,padding:"12px 8px",boxShadow:t.shadow,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minWidth:0,overflow:"hidden"},
    vehicleCard:   {background:t.cardBg,border:`1px solid ${t.cardBorder}`,borderRadius:10,padding:14,boxShadow:t.shadow},
    formCard:      {background:t.cardBg,border:`1px solid ${t.cardBorder}`,borderRadius:12,padding:20,maxWidth:720,margin:"0 auto",boxShadow:t.shadow},
    input:         {width:"100%",background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:6,color:t.text,padding:"8px 11px",fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
    searchInput:   {width:185,background:t.inputBg,border:`1px solid ${t.inputBorder}`,borderRadius:6,color:t.text,padding:"7px 11px",fontSize:13,outline:"none"},
    tab:           {background:"transparent",border:`1px solid ${t.cardBorder}`,borderRadius:6,color:t.textMuted,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"},
    tabActive:     {background:t.tabActiveBg,border:`1px solid ${t.tabActiveBorder}`,color:"#fff"},
    sectionHdr:    {fontSize:11,letterSpacing:2,textTransform:"uppercase",color:t.sectionColor,borderBottom:`1px solid ${t.cardBorder}`,paddingBottom:7,marginBottom:12,marginTop:18},
    formLabel:     {fontSize:11,color:t.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:5},
    tripFormBox:   {background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderLeft:"3px solid",borderRadius:8,padding:12,marginBottom:10},
    tripCardDetail:{background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderLeft:"3px solid",borderRadius:8,padding:12,marginBottom:10},
    btnPrimary:    {background:t.btnPrimaryBg,border:`1px solid ${t.btnPrimaryBorder}`,borderRadius:8,color:"#fff",padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600},
    btnSecondary:  {background:"transparent",border:`1px solid ${t.cardBorder}`,borderRadius:8,color:t.textMuted,padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
    btnDanger:     {background:"transparent",border:"1px solid #ef4444",borderRadius:8,color:"#ef4444",padding:"9px 18px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
    btnSmall:      {background:t.btnPrimaryBg,border:"none",borderRadius:6,color:"#fff",padding:"5px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"},
    backBtn:       {background:"transparent",border:`1px solid ${t.cardBorder}`,borderRadius:6,color:t.textMuted,padding:"5px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"},
    themeBtn:      {background:t.tripCardBg,border:`1px solid ${t.cardBorder}`,borderRadius:20,color:t.text,padding:"6px 12px",fontSize:14,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"},
  };
}

// ─── MOUNT ───────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
