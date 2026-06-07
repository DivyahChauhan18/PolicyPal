import { useState, useRef, useEffect } from "react";

const C = {
  // Light base
  bg:          "#FAF8F5",
  bgDeep:      "#F3F0EA",
  surface:     "#FFFFFF",
  surfaceWarm: "#FDF9F5",
  // Sage sidebar
  sage:        "#3D6B4F",
  sageMid:     "#4E7D60",
  sageLight:   "#5F8F71",
  sageBorder:  "rgba(61,107,79,0.15)",
  // Terracotta accent
  terra:       "#C4622D",
  terraDim:    "#A0501F",
  terraBright: "#D4743F",
  terraGlow:   "rgba(196,98,45,0.18)",
  terraTrace:  "rgba(196,98,45,0.07)",
  terraFaint:  "rgba(196,98,45,0.04)",
  // Ink
  ink:         "#1A1612",
  inkMid:      "#3A3028",
  inkLight:    "#6A6058",
  inkMute:     "#9A9088",
  inkFaint:    "#CAC4BC",
  // Borders
  border:      "#E4DDD4",
  borderDark:  "#D0C8BC",
  shadow:      "rgba(26,22,18,0.06)",
  shadowDeep:  "rgba(26,22,18,0.14)",
  // Fonts
  serif:       "'Cormorant Garamond', Georgia, serif",
  sans:        "'Plus Jakarta Sans', system-ui, sans-serif",
  mono:        "'DM Mono', monospace",
};

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/* ── Message renderer ── */
function renderMsg(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      const t = line.replace(/^#+\s/, '');
      return <p key={i} style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", color:C.sage, margin:"14px 0 5px", fontSize:"1.05rem", lineHeight:1.3 }}>{t}</p>;
    }
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      return <p key={i} style={{ fontSize:"0.6rem", fontWeight:700, color:C.terra, margin:"12px 0 5px", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:C.mono }}>{line.slice(2,-2)}</p>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const pts = line.slice(2).split(/\*\*(.*?)\*\*/g);
      return <div key={i} style={{ display:"flex", gap:10, margin:"5px 0", paddingLeft:12, borderLeft:`2px solid ${C.terra}40` }}>
        <span style={{ fontSize:"0.83rem", color:C.inkMid, lineHeight:1.78, fontFamily:C.sans }}>
          {pts.map((p,j) => j%2===1 ? <strong key={j} style={{ color:C.ink, fontWeight:600 }}>{p}</strong> : p)}
        </span>
      </div>;
    }
    if (!line.trim()) return <div key={i} style={{ height:7 }}/>;
    const pts = line.replace(/^---+$/, '').split(/\*\*(.*?)\*\*/g);
    if (line.match(/^---+$/)) return <div key={i} style={{ height:1, background:C.border, margin:"10px 0" }}/>;
    return <p key={i} style={{ margin:"4px 0", lineHeight:1.82, fontSize:"0.83rem", color:C.inkMid, fontFamily:C.sans }}>
      {pts.map((p,j) => j%2===1 ? <strong key={j} style={{ color:C.ink, fontWeight:600 }}>{p}</strong> : p)}
    </p>;
  });
}

/* ── Scanning line AI card ── */
function ScanCard({ children, scanning }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 20px", boxShadow:`0 2px 12px ${C.shadow}`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${C.terra}, transparent)` }}/>
      {scanning && (
        <div style={{ position:"absolute", left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${C.terra}80, transparent)`, animation:"scanDown 1.8s ease-in-out infinite", pointerEvents:"none", zIndex:10 }}/>
      )}
      {children}
    </div>
  );
}

/* ── Bell send button ── */
function BellButton({ disabled, onClick, loading }) {
  const [ring, setRing] = useState(false);
  function handleClick() {
    if (disabled) return;
    setRing(true); setTimeout(() => setRing(false), 400); onClick();
  }
  return (
    <button onClick={handleClick} disabled={disabled} style={{
      width:42, height:42, borderRadius:"50%", border:"none", flexShrink:0,
      background: disabled ? C.bgDeep : `linear-gradient(135deg, ${C.terra}, ${C.terraDim})`,
      color: disabled ? C.inkFaint : C.surface,
      fontSize:"1.1rem", cursor: disabled?"not-allowed":"pointer",
      boxShadow: disabled ? "none" : `0 4px 16px ${C.terraGlow}`,
      transform: ring ? "scale(0.88)" : "scale(1)",
      transition:`transform 200ms ${EASE}, background 150ms ease`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {loading ? <div style={{ width:13,height:13,border:`2px solid rgba(255,255,255,0.4)`,borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/> : "🔔"}
    </button>
  );
}

const SUGGESTIONS = [
  "What is the leave entitlement?",
  "How do I raise a grievance?",
  "Remote work guidelines?",
  "Performance review process?",
  "What are the working hours?",
];

const TOPICS = ["Leave & Absence","Remote Work","Grievances","Performance","Benefits","Disciplinary","Data Privacy"];

export default function PolicyPal() {
  const [docText, setDocText]     = useState("");
  const [docName, setDocName]     = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [docIsPdf, setDocIsPdf]   = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);
  const [focused, setFocused]     = useState(false);
  const [scanning, setScanning]   = useState(false);
  const chatEndRef   = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  async function handleFile(file) {
    if (!file) return;
    setDocName(file.name); setMessages([]);
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = e => { setDocBase64(e.target.result.split(",")[1]); setDocIsPdf(true); setDocText("__pdf__"); };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => { setDocText(e.target.result); setDocBase64(""); setDocIsPdf(false); };
      reader.readAsText(file);
    }
  }

  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || !docText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const newMessages = [...messages, { role:"user", content:q }];
    setMessages(newMessages);
    setLoading(true); setScanning(true); setError("");
    try {
      let body;
      if (docIsPdf) {
        const userMessages = newMessages.map((m, i) => {
          if (i === 0) return { role:"user", content:[{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:docBase64 }}, { type:"text", text:m.content }]};
          return { role:m.role, content:m.content };
        });
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000, system:"You are PolicyPal, a precise HR policy assistant. Answer questions based strictly on the uploaded policy document. Be clear and direct.", messages:userMessages });
      } else {
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000, system:`You are PolicyPal, a precise HR policy assistant. Answer based strictly on the policy document below.\n\nPOLICY DOCUMENT:\n${docText}`, messages:newMessages.map(m => ({ role:m.role, content:m.content })) });
      }
      const res = await fetch("/api/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true", "anthropic-beta":"pdfs-2024-09-25" },
        body,
      });
      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); setScanning(false); return; }
      const data = await res.json();
      const reply = data.content?.map(i => i.text||"").join("")||"";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    } catch(e) { setError(e.message); }
    setLoading(false); setScanning(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; overflow:hidden; }
        html { -webkit-font-smoothing:antialiased; }
        body { background:${C.bg}; }
        ::selection { background:${C.terraTrace}; color:${C.terra}; }
        ::placeholder { color:${C.inkFaint}; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:2px; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes msgIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        @keyframes scanDown { 0%{top:0;opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes inkDot  { 0%,100%{opacity:0.3;transform:scale(0.75)} 50%{opacity:1;transform:scale(1)} }
        @keyframes shimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }

        .sug-btn:hover { background:${C.terraTrace} !important; border-color:${C.terra}50 !important; color:${C.terra} !important; }
        button { transition:all 150ms ease; cursor:pointer; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:C.sans, overflow:"hidden" }}>

        {/* ══ SAGE SIDEBAR ══ */}
        <div style={{ width:300, flexShrink:0, background:C.sage, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>

          {/* Subtle dot pattern */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.06,
            backgroundImage:`radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize:"24px 24px",
          }}/>

          {/* Terracotta top rule */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${C.terra}, ${C.terraBright}, transparent)`, boxShadow:`0 0 12px ${C.terraGlow}` }}/>

          {/* Brand */}
          <div style={{ padding:"28px 24px 22px", borderBottom:`1px solid rgba(255,255,255,0.1)`, position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg, ${C.terra}, ${C.terraDim})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 20px ${C.terraGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`, flexShrink:0 }}>
                <span style={{ fontSize:16, fontWeight:700, fontStyle:"italic", color:"white", fontFamily:C.serif }}>P</span>
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:700, fontStyle:"italic", color:"rgba(255,255,255,0.95)", fontFamily:C.serif, lineHeight:1 }}>PolicyPal</div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.35)", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:C.mono, marginTop:3 }}>by Divyah · The Concierge</div>
              </div>
            </div>
            <div style={{ height:1, background:"rgba(255,255,255,0.12)", marginBottom:16 }}/>
            <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1.3rem", color:"rgba(255,255,255,0.85)", lineHeight:1.28, margin:"0 0 6px" }}>Stop reading policies.</p>
            <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1.3rem", fontWeight:700, color:C.terraBright, lineHeight:1.28, margin:"0 0 14px" }}>Start asking them.</p>
            <p style={{ fontFamily:C.mono, fontSize:"0.68rem", color:"rgba(255,255,255,0.35)", lineHeight:1.85 }}>Your HR team can't answer at 11pm.<br/>We can.</p>
          </div>

          {/* Content */}
          <div style={{ padding:"18px 24px", flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>
            {!docText ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }}/>
                  <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", fontFamily:C.mono }}>Policy Areas</span>
                  <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }}/>
                </div>
                {TOPICS.map((t,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(255,255,255,0.07)`, animation:`slideIn 400ms ${EASE} ${i*50}ms both` }}>
                    <div style={{ width:3, height:3, borderRadius:"50%", background:C.terraBright, opacity:0.6 }}/>
                    <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)", fontFamily:C.mono }}>{t}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ padding:"11px 14px", background:"rgba(255,255,255,0.06)", border:`1px solid rgba(255,255,255,0.12)`, borderRadius:8, marginBottom:12, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:C.terra }}/>
                  <div style={{ fontSize:8, color:C.terraBright, letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:C.mono, marginBottom:4 }}>Document loaded</div>
                  <div style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.75)", fontFamily:C.mono }}>{docName.slice(0,26)}{docName.length>26?"…":""}</div>
                </div>
                <button onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }}
                  style={{ background:"transparent", border:`1px solid rgba(255,255,255,0.12)`, borderRadius:6, color:"rgba(255,255,255,0.3)", fontSize:8, padding:"7px 14px", fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase", alignSelf:"flex-start", marginBottom:16 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`${C.terra}60`; e.currentTarget.style.color=C.terraBright; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; e.currentTarget.style.color="rgba(255,255,255,0.3)"; }}
                >← Change</button>

                <div style={{ marginTop:"auto" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }}/>
                    <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", fontFamily:C.mono }}>Quick Ask</span>
                    <div style={{ height:1, flex:1, background:"rgba(255,255,255,0.1)" }}/>
                  </div>
                  {SUGGESTIONS.map((s,i) => (
                    <button key={i} className="sug-btn" onClick={() => sendMessage(s)}
                      style={{ display:"block", width:"100%", background:"transparent", border:`1px solid rgba(255,255,255,0.08)`, borderRadius:6, padding:"9px 12px", fontSize:"0.67rem", color:"rgba(255,255,255,0.3)", textAlign:"left", fontFamily:C.mono, marginBottom:5, lineHeight:1.4, animation:`slideIn 350ms ${EASE} ${i*50}ms both` }}
                      onMouseDown={e => { e.currentTarget.style.transform="scale(0.97)"; }}
                      onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                    >{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Terra bottom rule */}
          <div style={{ height:2, background:`linear-gradient(90deg, transparent, ${C.terra}80)` }}/>
        </div>

        {/* ══ MAIN PANEL ══ */}
        <div style={{ flex:1, background:C.bg, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>

          {/* Subtle warm texture */}
          <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, opacity:0.3,
            backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          }}/>

          {!docText ? (
            /* ── UPLOAD ── */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 48px", position:"relative", zIndex:1 }}>

              {/* Watermark */}
              <div style={{ position:"absolute", fontSize:130, fontWeight:700, fontStyle:"italic", fontFamily:C.serif, color:`rgba(196,98,45,0.04)`, userSelect:"none", pointerEvents:"none", letterSpacing:"-4px", lineHeight:1, top:"50%", left:"50%", transform:"translate(-50%,-50%)", whiteSpace:"nowrap" }}>PolicyPal</div>

              <div style={{ textAlign:"center", marginBottom:40, animation:`fadeUp 500ms ${EASE} both`, position:"relative" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14, marginBottom:20 }}>
                  <div style={{ height:1, width:40, background:C.terra }}/>
                  <span style={{ fontSize:8, letterSpacing:"0.24em", textTransform:"uppercase", color:C.terra, fontFamily:C.mono, fontWeight:700 }}>HR Policy Intelligence</span>
                  <div style={{ height:1, width:40, background:C.terra }}/>
                </div>
                <h1 style={{ fontFamily:C.serif, fontStyle:"italic", fontWeight:700, fontSize:56, color:C.ink, margin:"0 0 6px", letterSpacing:"-2px", lineHeight:1.0 }}>Upload your policy.</h1>
                <h1 style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:56, color:C.terra, margin:"0 0 22px", letterSpacing:"-2px", lineHeight:1.0 }}>Ask anything.</h1>
                <p style={{ fontSize:14, color:C.inkLight, fontFamily:C.sans, lineHeight:1.85, maxWidth:400, margin:"0 auto", fontWeight:400 }}>Your HR team can't answer at 11pm. PolicyPal can — instantly, from your own document.</p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width:"100%", maxWidth:500, position:"relative",
                  border:`1.5px dashed ${dragOver ? C.terra : C.borderDark}`,
                  borderRadius:16, padding:"48px 44px",
                  textAlign:"center", cursor:"pointer",
                  background: dragOver ? C.terraFaint : C.surface,
                  boxShadow: dragOver ? `0 0 0 4px ${C.terraTrace}, 0 8px 32px ${C.terraGlow}` : `0 4px 24px ${C.shadow}`,
                  transition:`all 250ms ${EASE}`,
                  animation:`fadeUp 500ms ${EASE} 80ms both`,
                }}
              >
                {/* Corner brackets */}
                {[{top:12,left:12},{top:12,right:12},{bottom:12,left:12},{bottom:12,right:12}].map((pos,i)=>(
                  <div key={i} style={{ position:"absolute", ...pos, width:16, height:16,
                    borderTop:    pos.top!==undefined    ? `1.5px solid ${dragOver?C.terra:C.borderDark}` : "none",
                    borderBottom: pos.bottom!==undefined ? `1.5px solid ${dragOver?C.terra:C.borderDark}` : "none",
                    borderLeft:   pos.left!==undefined   ? `1.5px solid ${dragOver?C.terra:C.borderDark}` : "none",
                    borderRight:  pos.right!==undefined  ? `1.5px solid ${dragOver?C.terra:C.borderDark}` : "none",
                    transition:`border-color 250ms ease`,
                  }}/>
                ))}

                {/* Upload icon */}
                <div style={{ width:56, height:56, borderRadius:14, background:dragOver?C.terraTrace:C.bgDeep, border:`1px solid ${dragOver?C.terra:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", transition:`all 250ms ${EASE}`, boxShadow:dragOver?`0 0 20px ${C.terraGlow}`:"none" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragOver?C.terra:C.inkMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"stroke 250ms ease" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>

                <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1.2rem", color:dragOver?C.terra:C.ink, marginBottom:8, transition:`color 250ms ease` }}>
                  {dragOver?"Release to upload":"Drop your document here"}
                </p>
                <p style={{ fontFamily:C.mono, fontSize:"0.7rem", color:C.inkMute, marginBottom:24, lineHeight:1.75 }}>PDF or TXT · drag & drop or click to browse</p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:dragOver?`linear-gradient(135deg,${C.terra},${C.terraDim})`:C.sage, color:"white", borderRadius:10, padding:"11px 28px", fontSize:"0.7rem", fontFamily:C.mono, letterSpacing:"0.16em", textTransform:"uppercase", boxShadow:dragOver?`0 4px 16px ${C.terraGlow}`:`0 6px 20px rgba(61,107,79,0.35)`, transition:`all 250ms ${EASE}`, fontWeight:600 }}>
                  Browse Files
                </div>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
              </div>
            </div>

          ) : (
            /* ── CHAT ── */
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>

              {/* Header */}
              <div style={{ padding:"13px 36px", background:C.surface, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0, boxShadow:`0 1px 8px ${C.shadow}` }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:C.terra, animation:"pulse 2.5s ease-in-out infinite", boxShadow:`0 0 8px ${C.terra}` }}/>
                <span style={{ fontSize:"0.7rem", color:C.inkMute, fontFamily:C.mono, letterSpacing:"0.06em" }}>
                  Active session · <span style={{ color:C.inkMid }}>{docName}</span>
                </span>
                <div style={{ marginLeft:"auto", fontSize:8, color:C.inkFaint, fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase" }}>
                  {messages.filter(m=>m.role==="user").length} {messages.filter(m=>m.role==="user").length===1?"query":"queries"}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"28px 40px", display:"flex", flexDirection:"column", gap:20 }}>

                {messages.length === 0 && (
                  <div style={{ animation:`fadeUp 400ms ${EASE} both` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, ${C.terra}60, transparent)` }}/>
                      <span style={{ fontSize:9, fontFamily:C.mono, color:C.terra, letterSpacing:"0.18em", textTransform:"uppercase" }}>At your service</span>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, transparent, ${C.terra}60)` }}/>
                    </div>
                    <ScanCard scanning={false}>
                      <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1.05rem", color:C.ink, marginBottom:8 }}>Good day. I'm PolicyPal.</p>
                      <p style={{ fontFamily:C.sans, fontSize:"0.82rem", color:C.inkLight, lineHeight:1.85 }}>I've reviewed your policy document. Ask me anything — or use the quick questions on the left.</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:14 }}>
                        {SUGGESTIONS.map((s,i) => (
                          <button key={i} className="sug-btn" onClick={() => sendMessage(s)}
                            style={{ padding:"5px 12px", border:`1px solid ${C.border}`, borderRadius:20, fontSize:"0.68rem", fontFamily:C.sans, color:C.inkMute, background:"transparent", cursor:"pointer", animation:`fadeUp 400ms ${EASE} ${i*60}ms both` }}
                            onMouseDown={e => { e.currentTarget.style.transform="scale(0.96)"; }}
                            onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                          >{s}</button>
                        ))}
                      </div>
                    </ScanCard>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:12, alignItems:"flex-end", animation:`msgIn 350ms ${EASE} both` }}>
                    {m.role==="assistant" && (
                      <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.terra},${C.terraDim})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", fontFamily:C.serif, fontWeight:700, fontStyle:"italic", boxShadow:`0 2px 8px ${C.terraGlow}`, marginBottom:2 }}>P</div>
                    )}
                    <div style={{
                      maxWidth:"72%",
                      ...(m.role==="user" ? {
                        background:C.sage,
                        border:`1px solid rgba(255,255,255,0.1)`,
                        borderRadius:"16px 16px 4px 16px",
                        padding:"13px 17px",
                        boxShadow:`0 4px 16px rgba(61,107,79,0.25)`,
                      } : {
                        background:C.surface,
                        border:`1px solid ${C.border}`,
                        borderRadius:"16px 16px 16px 4px",
                        padding:"16px 18px",
                        boxShadow:`0 2px 12px ${C.shadow}`,
                        position:"relative", overflow:"hidden",
                      })
                    }}>
                      {m.role==="assistant" && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${C.terra}80, transparent)` }}/>}
                      {m.role==="user"
                        ? <p style={{ fontSize:"0.83rem", color:"rgba(255,255,255,0.92)", margin:0, lineHeight:1.72, fontFamily:C.sans }}>{m.content}</p>
                        : <div>{renderMsg(m.content)}</div>
                      }
                    </div>
                  </div>
                ))}

                {/* Loading with scan animation */}
                {loading && (
                  <div style={{ display:"flex", gap:12, alignItems:"flex-end", animation:`msgIn 300ms ${EASE} both` }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.terra},${C.terraDim})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", fontFamily:C.serif, fontWeight:700, fontStyle:"italic", animation:"shimmer 1.5s ease-in-out infinite" }}>P</div>
                    <ScanCard scanning={scanning}>
                      <div style={{ display:"flex", gap:7, alignItems:"center", padding:"4px 0" }}>
                        {[0,1,2].map(j => <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.terra, animation:`inkDot 1.4s ease-in-out ${j*220}ms infinite` }}/>)}
                        <span style={{ fontSize:10, color:C.inkFaint, fontFamily:C.mono, marginLeft:6 }}>Scanning policy…</span>
                      </div>
                    </ScanCard>
                  </div>
                )}

                {error && <div style={{ background:"rgba(196,98,45,0.06)", border:`1px solid ${C.terra}25`, borderRadius:10, padding:"10px 14px", fontSize:11, color:C.terra, fontFamily:C.mono }}>{error}</div>}
                <div ref={chatEndRef}/>
              </div>

              {/* Terra rule */}
              <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.terra}40, transparent)`, flexShrink:0 }}/>

              {/* Input */}
              <div style={{ padding:"14px 40px 22px", background:C.surface, flexShrink:0, borderTop:`1px solid ${C.border}` }}>
                <div style={{
                  display:"flex", gap:12, alignItems:"flex-end",
                  background: focused
                    ? `repeating-linear-gradient(transparent, transparent 27px, ${C.bgDeep} 27px, ${C.bgDeep} 28px)`
                    : C.bg,
                  backgroundPosition:"0 8px",
                  border:`1.5px solid ${focused?C.terra:C.border}`,
                  borderRadius:14, padding:"12px 12px 12px 20px",
                  boxShadow: focused ? `0 0 0 3px ${C.terraTrace}, 0 4px 16px ${C.shadow}` : `0 2px 8px ${C.shadow}`,
                  transition:`all 200ms ${EASE}`,
                }}>
                  <span style={{ fontSize:"0.9rem", flexShrink:0, paddingBottom:4, opacity:0.35, userSelect:"none" }}>✒</span>
                  <textarea
                    ref={textareaRef}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ flex:1, background:"transparent", border:"none", color:C.ink, fontFamily:C.sans, fontSize:"0.84rem", resize:"none", lineHeight:1.7, maxHeight:120, outline:"none", padding:"2px 0", caretColor:C.terra, fontStyle:focused?"italic":"normal" }}
                    placeholder="Ask about any policy..."
                    value={input}
                    rows={1}
                    onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                    onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                  />
                  <BellButton disabled={!input.trim()||loading} loading={loading} onClick={sendMessage}/>
                </div>
                <p style={{ fontSize:"0.6rem", color:C.inkFaint, textAlign:"center", marginTop:10, fontFamily:C.mono, letterSpacing:"0.1em" }}>
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}