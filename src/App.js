import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   DESIGN: Bioluminescent Deep Sea
   — Deep navy void, electric teal + violet glow
   — Floating particle orbs, breathing sidebar gradient
   — Sonar ping upload, bloom message animation
   — Syne display + JetBrains Mono
   — Everything glows, pulses, breathes
   ═══════════════════════════════════════════════════════════ */

const C = {
  void:        "#020B18",
  deep:        "#030F20",
  abyss:       "#051528",
  surface:     "#0A2040",
  glass:       "rgba(0,212,200,0.04)",
  glassMid:    "rgba(0,212,200,0.07)",
  glassHigh:   "rgba(0,212,200,0.12)",
  border:      "rgba(0,212,200,0.12)",
  borderMid:   "rgba(0,212,200,0.22)",
  borderHigh:  "rgba(0,212,200,0.40)",
  teal:        "#00D4C8",
  tealDim:     "#00A89E",
  tealGlow:    "rgba(0,212,200,0.25)",
  tealTrace:   "rgba(0,212,200,0.08)",
  tealFaint:   "rgba(0,212,200,0.04)",
  violet:      "#8B5CF6",
  violetDim:   "#6D3FD4",
  violetGlow:  "rgba(139,92,246,0.25)",
  violetTrace: "rgba(139,92,246,0.10)",
  ice:         "#FFFFFF",
  iceOff:      "rgba(255,255,255,0.88)",
  iceMid:      "rgba(255,255,255,0.55)",
  iceDim:      "rgba(255,255,255,0.30)",
  iceFaint:    "rgba(255,255,255,0.12)",
  iceTrace:    "rgba(255,255,255,0.06)",
  display:     "'Syne', system-ui, sans-serif",
  body:        "'JetBrains Mono', monospace",
  sans:        "'Plus Jakarta Sans', system-ui, sans-serif",
};

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/* ── Message renderer ── */
function renderMsg(text) {
  return text.split('\n').map((line, i) => {
    const stripped = line.replace(/^#{1,3}\s/, '');
    if (/^#{1,3}\s/.test(line)) return (
      <p key={i} style={{ fontFamily:C.display, fontWeight:700, color:C.teal, margin:"14px 0 6px", fontSize:"0.9rem", letterSpacing:"0.04em" }}>{stripped}</p>
    );
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) return (
      <p key={i} style={{ fontSize:"0.6rem", fontWeight:700, color:C.teal, margin:"12px 0 5px", letterSpacing:"0.22em", textTransform:"uppercase", fontFamily:C.body }}>{line.slice(2,-2)}</p>
    );
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const pts = line.slice(2).split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ display:"flex", gap:10, margin:"5px 0" }}>
          <span style={{ color:C.teal, flexShrink:0, fontSize:"0.5rem", marginTop:6, filter:`drop-shadow(0 0 4px ${C.teal})` }}>◆</span>
          <span style={{ fontSize:"0.8rem", color:C.iceOff, lineHeight:1.78, fontFamily:C.body }}>
            {pts.map((p,j) => j%2===1 ? <strong key={j} style={{ color:C.ice, fontWeight:600 }}>{p}</strong> : p)}
          </span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} style={{ height:7 }}/>;
    if (line.match(/^---+$/)) return <div key={i} style={{ height:1, background:`linear-gradient(90deg, ${C.teal}40, transparent)`, margin:"10px 0" }}/>;
    const pts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin:"4px 0", lineHeight:1.82, fontSize:"0.8rem", color:C.iceMid, fontFamily:C.body }}>
        {pts.map((p,j) => j%2===1 ? <strong key={j} style={{ color:C.iceOff, fontWeight:600 }}>{p}</strong> : p)}
      </p>
    );
  });
}

/* ── Floating orb ── */
function Orb({ size, top, left, color, duration, delay }) {
  return (
    <div style={{
      position:"absolute", width:size, height:size, borderRadius:"50%",
      background:`radial-gradient(circle at 35% 35%, ${color}40, ${color}10 50%, transparent 70%)`,
      top, left, pointerEvents:"none",
      animation:`float ${duration}s ease-in-out ${delay}s infinite`,
      filter:`blur(${size/8}px)`,
    }}/>
  );
}

/* ── Sonar ping ── */
function SonarPing({ active }) {
  if (!active) return null;
  return (
    <>
      {[0,1,2].map(i => (
        <div key={i} style={{
          position:"absolute", inset:-20, borderRadius:"50%",
          border:`1px solid ${C.teal}`,
          animation:`sonar 2s ease-out ${i*0.6}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}
    </>
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
  const [newMsgIdx, setNewMsgIdx] = useState(-1);
  const [focused, setFocused]     = useState(false);
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
    setLoading(true); setError("");
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
      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      const reply = data.content?.map(i => i.text||"").join("")||"";
      setMessages(prev => { const next=[...prev,{role:"assistant",content:reply}]; setNewMsgIdx(next.length-1); return next; });
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; overflow:hidden; }
        html { -webkit-font-smoothing:antialiased; }
        body { background:${C.void}; }
        ::selection { background:${C.tealTrace}; color:${C.teal}; }
        ::placeholder { color:${C.iceFaint}; font-family:'JetBrains Mono',monospace; }
        ::-webkit-scrollbar { width:2px; }
        ::-webkit-scrollbar-thumb { background:${C.tealTrace}; border-radius:2px; }

        @keyframes float {
          0%,100% { transform:translateY(0) translateX(0); }
          25%      { transform:translateY(-20px) translateX(10px); }
          50%      { transform:translateY(-8px) translateX(-8px); }
          75%      { transform:translateY(-16px) translateX(6px); }
        }
        @keyframes breathe {
          0%,100% { background:linear-gradient(160deg, #030F20 0%, #0A1A40 50%, #0D0830 100%); }
          50%     { background:linear-gradient(160deg, #050A20 0%, #0D1850 50%, #12063A 100%); }
        }
        @keyframes sonar {
          0%   { transform:scale(1); opacity:0.8; }
          100% { transform:scale(2.5); opacity:0; }
        }
        @keyframes bloom {
          0%   { opacity:0; transform:scale(0.92); filter:blur(4px); }
          60%  { filter:blur(0); }
          100% { opacity:1; transform:scale(1); filter:blur(0); }
        }
        @keyframes wave0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes wave1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes wave2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes tealPulse { 0%,100%{box-shadow:0 0 8px ${C.tealGlow}} 50%{box-shadow:0 0 24px ${C.tealGlow},0 0 48px ${C.tealTrace}} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .sug-btn:hover { background:${C.tealTrace} !important; border-color:${C.borderMid} !important; color:${C.teal} !important; }
        .bloom { animation: bloom 500ms ${EASE} both; }
        button { transition:all 150ms ease; cursor:pointer; }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:C.sans, overflow:"hidden", background:C.void, position:"relative" }}>

        {/* ══ FLOATING ORBS ══ */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <Orb size={400} top="-10%" left="60%"  color={C.teal}   duration={12} delay={0}/>
          <Orb size={300} top="60%"  left="-5%"  color={C.violet} duration={15} delay={2}/>
          <Orb size={250} top="30%"  left="75%"  color={C.violet} duration={10} delay={1}/>
          <Orb size={200} top="80%"  left="50%"  color={C.teal}   duration={18} delay={3}/>
          <Orb size={180} top="10%"  left="20%"  color={C.teal}   duration={14} delay={0.5}/>
          <Orb size={150} top="50%"  left="40%"  color={C.violet} duration={11} delay={4}/>
        </div>

        {/* ══ SIDEBAR ══ */}
        <div style={{
          width:290, flexShrink:0,
          background:`linear-gradient(160deg, ${C.deep} 0%, ${C.abyss} 50%, #0A0520 100%)`,
          borderRight:`1px solid ${C.border}`,
          display:"flex", flexDirection:"column",
          position:"relative", overflow:"hidden", zIndex:1,
          animation:"breathe 6s ease-in-out infinite",
        }}>
          {/* Teal top glow line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, transparent, ${C.teal}, transparent)`, boxShadow:`0 0 20px ${C.teal}`, zIndex:2 }}/>

          {/* Sidebar inner glow */}
          <div style={{ position:"absolute", top:0, right:0, width:1, height:"100%", background:`linear-gradient(180deg, ${C.teal}30, transparent 40%, ${C.violet}20 80%, transparent)`, pointerEvents:"none" }}/>

          {/* Brand */}
          <div style={{ padding:"28px 24px 22px", borderBottom:`1px solid ${C.border}`, position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
              {/* Glowing logo orb */}
              <div style={{
                width:40, height:40, borderRadius:12,
                background:`linear-gradient(135deg, ${C.teal}30, ${C.violet}20)`,
                border:`1px solid ${C.teal}60`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 20px ${C.tealGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                animation:"tealPulse 3s ease-in-out infinite", flexShrink:0,
              }}>
                <span style={{ fontSize:16, fontWeight:800, color:C.teal, fontFamily:C.display, textShadow:`0 0 12px ${C.teal}` }}>P</span>
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:C.ice, fontFamily:C.display, lineHeight:1, letterSpacing:"0.02em" }}>PolicyPal</div>
                <div style={{ fontSize:8, color:C.iceDim, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:C.body, marginTop:3 }}>by Divyah · AI Policy Assistant</div>
              </div>
            </div>

            <div style={{ height:1, background:`linear-gradient(90deg, ${C.teal}60, ${C.violet}40, transparent)`, marginBottom:16 }}/>

            <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1.2rem", color:C.iceOff, lineHeight:1.3, margin:"0 0 6px" }}>Stop reading policies.</p>
            <p style={{ fontFamily:C.display, fontWeight:800, fontSize:"1.2rem", color:C.teal, lineHeight:1.3, margin:"0 0 14px", textShadow:`0 0 20px ${C.teal}` }}>Start asking them.</p>
            <p style={{ fontFamily:C.body, fontSize:"0.68rem", color:C.iceDim, lineHeight:1.85 }}>Your HR team can't answer at 11pm.<br/>We can.</p>
          </div>

          {/* Content */}
          <div style={{ padding:"18px 24px", flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>
            {!docText ? (
              <>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ height:1, flex:1, background:C.border }}/>
                  <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:C.iceDim, fontFamily:C.body }}>Policy Areas</span>
                  <div style={{ height:1, flex:1, background:C.border }}/>
                </div>
                {TOPICS.map((t,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}`, animation:`slideIn 400ms ${EASE} ${i*50}ms both` }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:C.teal, boxShadow:`0 0 6px ${C.teal}`, flexShrink:0 }}/>
                    <span style={{ fontSize:"0.7rem", color:C.iceDim, fontFamily:C.body }}>{t}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ padding:"11px 14px", background:C.tealFaint, border:`1px solid ${C.border}`, borderRadius:10, marginBottom:12, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:`linear-gradient(180deg,${C.teal},${C.violet})`, borderRadius:"10px 0 0 10px" }}/>
                  <div style={{ fontSize:8, color:C.teal, letterSpacing:"0.14em", textTransform:"uppercase", fontFamily:C.body, marginBottom:4 }}>Document loaded</div>
                  <div style={{ fontSize:"0.7rem", color:C.iceOff, fontFamily:C.body }}>{docName.slice(0,26)}{docName.length>26?"…":""}</div>
                </div>

                <button onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }}
                  style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:6, color:C.iceDim, fontSize:8, padding:"7px 14px", fontFamily:C.body, letterSpacing:"0.14em", textTransform:"uppercase", alignSelf:"flex-start", marginBottom:16 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=C.teal; e.currentTarget.style.color=C.teal; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.iceDim; }}
                >← Change</button>

                <div style={{ marginTop:"auto" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <div style={{ height:1, flex:1, background:C.border }}/>
                    <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase", color:C.iceDim, fontFamily:C.body }}>Quick Ask</span>
                    <div style={{ height:1, flex:1, background:C.border }}/>
                  </div>
                  {SUGGESTIONS.map((s,i) => (
                    <button key={i} className="sug-btn" onClick={() => sendMessage(s)}
                      style={{ display:"block", width:"100%", background:"transparent", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", fontSize:"0.67rem", color:C.iceDim, textAlign:"left", fontFamily:C.body, marginBottom:5, lineHeight:1.4, animation:`slideIn 350ms ${EASE} ${i*50}ms both` }}
                      onMouseDown={e => { e.currentTarget.style.transform="scale(0.97)"; }}
                      onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                    >{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Violet bottom rule */}
          <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.violet}80)` }}/>
        </div>

        {/* ══ MAIN PANEL ══ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>

          {!docText ? (
            /* ── UPLOAD ── */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 48px" }}>

              {/* Big display text */}
              <div style={{ textAlign:"center", marginBottom:48, animation:`fadeUp 600ms ${EASE} both` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:20 }}>
                  <div style={{ height:1, width:48, background:`linear-gradient(90deg, transparent, ${C.teal})`, boxShadow:`0 0 8px ${C.teal}` }}/>
                  <span style={{ fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase", color:C.teal, fontFamily:C.body, fontWeight:600, textShadow:`0 0 12px ${C.teal}` }}>HR Policy Intelligence</span>
                  <div style={{ height:1, width:48, background:`linear-gradient(90deg, ${C.teal}, transparent)`, boxShadow:`0 0 8px ${C.teal}` }}/>
                </div>
                <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:60, color:C.ice, margin:"0 0 4px", letterSpacing:"-2px", lineHeight:0.95 }}>Upload your policy.</h1>
                <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:60, color:C.teal, margin:"0 0 22px", letterSpacing:"-2px", lineHeight:0.95, textShadow:`0 0 40px ${C.teal}` }}>Ask anything.</h1>
                <p style={{ fontSize:14, color:C.iceDim, fontFamily:C.body, lineHeight:1.85, maxWidth:400, margin:"0 auto" }}>Your HR team can't answer at 11pm.<br/>PolicyPal can — instantly.</p>
              </div>

              {/* Drop zone with sonar */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width:"100%", maxWidth:520, position:"relative",
                  border:`1px solid ${dragOver?C.teal:C.border}`,
                  borderRadius:20, padding:"52px 44px",
                  textAlign:"center", cursor:"pointer",
                  background:dragOver?C.tealFaint:C.glass,
                  backdropFilter:"blur(20px)",
                  boxShadow: dragOver ? `0 0 60px ${C.tealGlow}, 0 0 120px ${C.tealTrace}, inset 0 1px 0 ${C.teal}20` : `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 ${C.iceTrace}`,
                  transition:`all 280ms ${EASE}`,
                  animation:`fadeUp 600ms ${EASE} 100ms both`,
                  overflow:"visible",
                }}
              >
                <SonarPing active={dragOver}/>

                {/* Upload icon */}
                <div style={{ width:64, height:64, borderRadius:16, background:C.glass, border:`1px solid ${dragOver?C.teal:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:dragOver?`0 0 24px ${C.tealGlow}`:"none", transition:`all 280ms ${EASE}` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver?C.teal:C.iceDim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition:"stroke 280ms ease", filter:dragOver?`drop-shadow(0 0 6px ${C.teal})`:"none" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>

                <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1.2rem", color:dragOver?C.teal:C.iceOff, marginBottom:8, transition:`color 280ms ease`, textShadow:dragOver?`0 0 20px ${C.teal}`:"none" }}>
                  {dragOver?"Release to upload":"Drop your document"}
                </p>
                <p style={{ fontFamily:C.body, fontSize:"0.7rem", color:C.iceDim, marginBottom:26, lineHeight:1.75 }}>PDF or TXT · drag & drop or click to browse</p>

                <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:dragOver?`linear-gradient(135deg,${C.teal},${C.tealDim})`:`linear-gradient(135deg,${C.teal}20,${C.violet}20)`, color:dragOver?C.void:C.teal, borderRadius:10, padding:"12px 28px", fontSize:"0.7rem", fontFamily:C.body, letterSpacing:"0.16em", textTransform:"uppercase", border:`1px solid ${dragOver?C.teal:C.borderMid}`, boxShadow:dragOver?`0 0 24px ${C.tealGlow}`:`0 0 12px ${C.tealTrace}`, transition:`all 280ms ${EASE}`, fontWeight:600 }}>
                  Browse Files
                </div>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
              </div>
            </div>

          ) : (
            /* ── CHAT ── */
            <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

              {/* Header */}
              <div style={{ padding:"13px 36px", background:"rgba(2,11,24,0.85)", backdropFilter:"blur(24px)", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:C.teal, animation:"pulse 2s ease-in-out infinite", boxShadow:`0 0 12px ${C.teal}` }}/>
                <span style={{ fontSize:"0.7rem", color:C.iceDim, fontFamily:C.body, letterSpacing:"0.06em" }}>
                  Active · <span style={{ color:C.iceOff }}>{docName}</span>
                </span>
                <div style={{ marginLeft:"auto", fontSize:8, color:C.iceFaint, fontFamily:C.body, letterSpacing:"0.14em", textTransform:"uppercase" }}>
                  {messages.filter(m=>m.role==="user").length} queries
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"28px 40px", display:"flex", flexDirection:"column", gap:20 }}>

                {/* Welcome */}
                {messages.length === 0 && (
                  <div className="bloom" style={{ border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", background:C.glass, backdropFilter:"blur(16px)", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${C.teal}80, ${C.violet}60, transparent)` }}/>
                    <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2, background:`linear-gradient(180deg,${C.teal},${C.violet})` }}/>
                    <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1rem", color:C.ice, marginBottom:8 }}>Good day. I'm PolicyPal.</p>
                    <p style={{ fontFamily:C.body, fontSize:"0.75rem", color:C.iceDim, lineHeight:1.85 }}>I've reviewed your policy document. Ask me anything — or use the quick questions on the left.</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:14 }}>
                      {SUGGESTIONS.map((s,i) => (
                        <button key={i} className="sug-btn" onClick={() => sendMessage(s)}
                          style={{ padding:"5px 12px", border:`1px solid ${C.border}`, borderRadius:20, fontSize:"0.66rem", fontFamily:C.body, color:C.iceDim, background:"transparent", cursor:"pointer", animation:`fadeUp 400ms ${EASE} ${i*60}ms both` }}
                          onMouseDown={e => { e.currentTarget.style.transform="scale(0.96)"; }}
                          onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((m, i) => (
                  <div key={i} className={i===newMsgIdx?"bloom":""} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", gap:12, alignItems:"flex-end" }}>
                    {m.role==="assistant" && (
                      <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.teal}30,${C.violet}20)`, border:`1px solid ${C.teal}60`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:C.teal, fontFamily:C.display, fontWeight:800, boxShadow:`0 0 12px ${C.tealGlow}`, marginBottom:2 }}>P</div>
                    )}
                    <div style={{
                      maxWidth:"72%", padding:"14px 18px",
                      borderRadius: m.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      ...(m.role==="user" ? {
                        background:`linear-gradient(135deg, ${C.violet}40, ${C.violetDim}30)`,
                        border:`1px solid ${C.violet}40`,
                        boxShadow:`0 4px 20px ${C.violetGlow}`,
                      } : {
                        background:C.glass,
                        backdropFilter:"blur(16px)",
                        border:`1px solid ${C.border}`,
                        borderLeft:`2px solid ${C.teal}`,
                        boxShadow:`0 2px 20px rgba(0,0,0,0.3), -8px 0 24px ${C.tealFaint}`,
                        position:"relative", overflow:"hidden",
                      })
                    }}>
                      {m.role==="assistant" && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${C.teal}60, transparent)` }}/>}
                      {m.role==="user"
                        ? <p style={{ fontSize:"0.82rem", color:C.ice, margin:0, lineHeight:1.72, fontFamily:C.body }}>{m.content}</p>
                        : <div>{renderMsg(m.content)}</div>
                      }
                    </div>
                  </div>
                ))}

                {/* Wave typing indicator */}
                {loading && (
                  <div style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,${C.teal}30,${C.violet}20)`, border:`1px solid ${C.teal}60`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:C.teal, fontFamily:C.display, fontWeight:800, animation:"pulse 1.5s ease-in-out infinite" }}>P</div>
                    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.border}`, borderRadius:"16px 16px 16px 4px", padding:"16px 20px", display:"flex", gap:6, alignItems:"center" }}>
                      {[0,1,2].map(j => (
                        <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.teal, boxShadow:`0 0 8px ${C.teal}`, animation:`wave${j} 1.2s ease-in-out ${j*0.2}s infinite` }}/>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div style={{ background:"rgba(139,92,246,0.08)", border:`1px solid ${C.violet}40`, borderRadius:10, padding:"10px 14px", fontSize:11, color:C.violet, fontFamily:C.body }}>{error}</div>}
                <div ref={chatEndRef}/>
              </div>

              {/* Input */}
              <div style={{ padding:"14px 40px 22px", background:"rgba(2,11,24,0.9)", backdropFilter:"blur(24px)", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                <div style={{
                  display:"flex", gap:12, alignItems:"flex-end",
                  background:C.glassMid, backdropFilter:"blur(12px)",
                  border:`1px solid ${focused?C.teal:C.border}`,
                  borderRadius:16, padding:"12px 12px 12px 20px",
                  boxShadow: focused ? `0 0 0 3px ${C.tealTrace}, 0 0 24px ${C.tealTrace}` : `0 4px 20px rgba(0,0,0,0.3)`,
                  transition:`all 200ms ${EASE}`,
                }}>
                  <textarea
                    ref={textareaRef}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ flex:1, background:"transparent", border:"none", color:C.ice, fontFamily:C.body, fontSize:"0.82rem", resize:"none", lineHeight:1.7, maxHeight:120, outline:"none", padding:"2px 0", caretColor:C.teal }}
                    placeholder="Ask about any policy..."
                    value={input}
                    rows={1}
                    onChange={e => { setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                    onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }}
                  />
                  <button
                    disabled={!input.trim()||loading}
                    onClick={() => sendMessage()}
                    style={{
                      width:40, height:40, borderRadius:12, flexShrink:0,
                      background: !input.trim()||loading ? C.glass : `linear-gradient(135deg,${C.teal},${C.tealDim})`,
                      border:`1px solid ${!input.trim()||loading?C.border:C.teal}`,
                      cursor: !input.trim()||loading ? "not-allowed" : "pointer",
                      color: !input.trim()||loading ? C.iceDim : C.void,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"1rem", fontWeight:700,
                      boxShadow: !input.trim()||loading ? "none" : `0 0 20px ${C.tealGlow}`,
                    }}
                    onMouseDown={e => { if(input.trim()&&!loading) e.currentTarget.style.transform="scale(0.92)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                  >↑</button>
                </div>
                <p style={{ fontSize:"0.6rem", color:C.iceFaint, textAlign:"center", marginTop:10, fontFamily:C.body, letterSpacing:"0.1em" }}>
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