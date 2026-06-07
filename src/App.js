import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════
   DESIGN: The Concierge
   — Luxury hotel concierge desk aesthetic
   — Sage linen background, cream card, gold hairlines
   — Centered single-column layout (NOT split panel)
   — Bodoni Moda display + Lato body
   — Hotel notepad input, luggage tag upload, concierge bell send
   — Handwritten-note user messages, formal concierge replies
   ═══════════════════════════════════════════════════════════ */

const C = {
  // Bold dark hunter green background
  linen:       "#1B3A2D",
  linenDeep:   "#152E23",
  linenDark:   "#0F2219",
  // Warm glowing ivory card
  cream:       "#FDF8F0",
  creamDeep:   "#F7EFE2",
  white:       "#FFFFFF",
  // Electric amber — used surgically
  gold:        "#F59E0B",
  goldDim:     "#D97706",
  goldBright:  "#FCD34D",
  goldGlow:    "rgba(245,158,11,0.25)",
  goldTrace:   "rgba(245,158,11,0.08)",
  goldLine:    "rgba(245,158,11,0.35)",
  // Botanical green accents
  sage:        "#166534",
  sageMid:     "#15803D",
  sagePale:    "rgba(22,101,52,0.12)",
  // Ink on card
  ink:         "#1A1208",
  inkMid:      "#3A2E1C",
  inkLight:    "#6A5E48",
  inkMute:     "#9A8E78",
  inkFaint:    "#C8BCA8",
  border:      "#E8E0D0",
  borderDark:  "#D4C8B4",
  shadow:      "rgba(27,58,45,0.20)",
  shadowDeep:  "rgba(27,58,45,0.40)",
  serif:       "'Bodoni Moda', Georgia, serif",
  body:        "'Lato', system-ui, sans-serif",
  mono:        "'DM Mono', monospace",
};

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";

/* ── Message renderer ── */
function renderMsg(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <p key={i} style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", color:C.sage, margin:"12px 0 4px", fontSize:"1rem" }}>{line.slice(4)}</p>;
    if (line.startsWith('## '))  return <p key={i} style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", color:C.sage, margin:"12px 0 4px", fontSize:"1rem" }}>{line.slice(3)}</p>;
    if (line.startsWith('# '))   return <p key={i} style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", color:C.sage, margin:"12px 0 4px", fontSize:"1rem" }}>{line.slice(2)}</p>;
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) return <p key={i} style={{ fontSize:"0.6rem", fontWeight:700, color:C.gold, margin:"10px 0 4px", letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:C.mono }}>{line.slice(2,-2)}</p>;
    if (line.startsWith('- ') || line.startsWith('* '))  {
      const pts = line.slice(2).split(/\*\*(.*?)\*\*/g);
      return <div key={i} style={{ display:"flex", gap:10, margin:"5px 0", paddingLeft:12, borderLeft:`2px solid ${C.goldLine}` }}>
        <span style={{ fontSize:"0.82rem", color:C.inkMid, lineHeight:1.78, fontFamily:C.body }}>
          {pts.map((p,j) => j%2===1?<strong key={j} style={{ color:C.ink, fontWeight:600 }}>{p}</strong>:p)}
        </span>
      </div>;
    }
    if (!line.trim()) return <div key={i} style={{ height:7 }}/>;
    const pts = line.split(/\*\*(.*?)\*\*/g);
    return <p key={i} style={{ margin:"4px 0", lineHeight:1.82, fontSize:"0.84rem", color:C.inkMid, fontFamily:C.body }}>
      {pts.map((p,j) => j%2===1?<strong key={j} style={{ color:C.ink, fontWeight:600 }}>{p}</strong>:p)}
    </p>;
  });
}

/* ── Concierge bell button ── */
function BellButton({ disabled, onClick, loading }) {
  const [ring, setRing] = useState(false);
  function handleClick() {
    if (disabled) return;
    setRing(true);
    setTimeout(() => setRing(false), 400);
    onClick();
  }
  return (
    <button onClick={handleClick} disabled={disabled}
      style={{
        width:48, height:48, borderRadius:"50%", border:"none", flexShrink:0,
        background: disabled ? C.linenDeep : `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
        color: disabled ? C.inkFaint : C.white,
        fontSize:"1.3rem", cursor: disabled?"not-allowed":"pointer",
        boxShadow: disabled ? "none" : `0 4px 20px ${C.goldGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transform: ring ? "scale(0.88)" : "scale(1)",
        transition:`transform 200ms ${EASE}, background 150ms ease, box-shadow 150ms ease`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}
    >
      {loading
        ? <div style={{ width:14,height:14,border:`2px solid rgba(255,255,255,0.4)`,borderTopColor:"white",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
        : "🔔"}
    </button>
  );
}

/* ── Luggage tag SVG ── */
function LuggageTag({ hover }) {
  return (
    <svg width={90} height={120} viewBox="0 0 90 120" style={{ margin:"0 auto 24px", display:"block", transition:`transform 300ms ${EASE}`, transform:hover?"scale(1.05) rotate(-3deg)":"scale(1) rotate(0deg)" }}>
      <defs>
        <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hover?"#E8C870":"#D4B86A"}/>
          <stop offset="100%" stopColor={hover?"#C4A35A":"#9A7A38"}/>
        </linearGradient>
      </defs>
      {/* Tag body */}
      <rect x={5} y={20} width={80} height={95} rx={6} fill="url(#tagGrad)" opacity={hover?0.95:0.75}/>
      {/* Tag hole top */}
      <circle cx={45} cy={20} r={7} fill={C.linen}/>
      <circle cx={45} cy={20} r={4} fill={C.linenDeep}/>
      {/* String */}
      <line x1={45} y1={2} x2={45} y2={13} stroke={C.goldDim} strokeWidth={2} strokeLinecap="round"/>
      {/* Inner border */}
      <rect x={10} y={25} width={70} height={85} rx={3} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1}/>
      {/* P monogram */}
      <text x={45} y={72} textAnchor="middle" fill="rgba(255,255,255,0.95)" style={{ fontSize:28, fontFamily:C.serif, fontWeight:700, fontStyle:"italic" }}>P</text>
      {/* Bottom text */}
      <text x={45} y={100} textAnchor="middle" fill="rgba(255,255,255,0.6)" style={{ fontSize:7, fontFamily:C.mono, letterSpacing:"0.2em" }}>POLICY PAL</text>
    </svg>
  );
}

const SUGGESTIONS = [
  "What is the leave entitlement?",
  "How do I raise a grievance?",
  "Remote work guidelines?",
  "Performance review process?",
  "What are the working hours?",
];

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
  const [tagHover, setTagHover]   = useState(false);
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
          if (i === 0) return { role:"user", content:[{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:docBase64 } }, { type:"text", text:m.content }] };
          return { role:m.role, content:m.content };
        });
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000, system:"You are PolicyPal, a concierge-style HR policy assistant. Answer questions based strictly on the uploaded policy document. Be clear, warm, and precise — like a professional hotel concierge.", messages:userMessages });
      } else {
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000, system:`You are PolicyPal, a concierge-style HR policy assistant. Answer based strictly on the policy document below. Be clear, warm, and precise.\n\nPOLICY DOCUMENT:\n${docText}`, messages:newMessages.map(m => ({ role:m.role, content:m.content })) });
      }
      const res = await fetch("/api/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_API_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true", "anthropic-beta":"pdfs-2024-09-25" },
        body,
      });
      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      const reply = data.content?.map(i => i.text||"").join("")||"";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,700;0,6..96,900;1,6..96,400;1,6..96,700&family=Lato:ital,wght@0,300;0,400;0,700;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; }
        html { -webkit-font-smoothing:antialiased; }
        body { background:${C.linen}; overflow:hidden; }
        ::selection { background:${C.goldTrace}; color:${C.gold}; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:${C.linenDark}; border-radius:2px; }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes inkDot   { 0%,100%{opacity:0.3;transform:scale(0.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes lineGrow { from{width:0} to{width:100%} }
        @keyframes sway     { 0%,100%{transform:rotate(-1deg)} 50%{transform:rotate(1deg)} }

        .sug-pill:hover { background:${C.goldTrace} !important; border-color:${C.gold} !important; color:${C.gold} !important; }
        button { transition:all 150ms ease; }
      `}</style>

      {/* Full page linen background with subtle noise */}
      <div style={{ height:"100vh", background:`radial-gradient(ellipse at 20% 10%, #2D5A42 0%, #1B3A2D 40%, #0F2219 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>

        {/* Linen noise texture */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.4,
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}/>

        {/* Ambient sage orb */}
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)`, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"-5%", left:"-5%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle, rgba(45,90,66,0.6) 0%, transparent 70%)`, pointerEvents:"none" }}/>

        {/* THE CARD — hotel terminal */}
        <div style={{
          width:"100%", maxWidth:700,
          height:"calc(100vh - 32px)",
          background:C.cream,
          border:`1px solid ${C.border}`,
          borderRadius:4,
          boxShadow:`0 24px 80px rgba(10,28,20,0.6), 0 4px 16px rgba(10,28,20,0.4), inset 0 1px 0 rgba(255,255,255,0.9)`,
          display:"flex", flexDirection:"column",
          overflow:"hidden", position:"relative",
          animation:`fadeUp 600ms ${EASE} both`,
        }}>

          {/* Gold top hairline */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${C.gold}, ${C.goldBright}, ${C.gold}, transparent)`, zIndex:10 }}/>

          {/* HEADER */}
          <div style={{ padding:"22px 32px 18px", borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.creamDeep, position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                {/* Gold seal */}
                <div style={{ width:42, height:42, borderRadius:"50%", background:`linear-gradient(135deg, ${C.gold}, ${C.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px ${C.goldGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`, flexShrink:0 }}>
                  <span style={{ fontSize:16, fontWeight:700, fontStyle:"italic", color:C.white, fontFamily:C.serif }}>P</span>
                </div>
                <div>
                  <h1 style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", fontSize:22, color:C.ink, lineHeight:1, letterSpacing:"-0.5px" }}>PolicyPal</h1>
                  <p style={{ fontSize:9, color:C.inkMute, fontFamily:C.mono, letterSpacing:"0.18em", textTransform:"uppercase", marginTop:3 }}>The Concierge · by Divyah</p>
                </div>
              </div>

              {docText && (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.sage, animation:"pulse 2.5s ease-in-out infinite", boxShadow:`0 0 8px ${C.sage}` }}/>
                  <span style={{ fontSize:10, fontFamily:C.mono, color:C.inkLight, letterSpacing:"0.06em" }}>{docName.slice(0,24)}{docName.length>24?"…":""}</span>
                  <button onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }}
                    style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.inkMute, fontSize:8, padding:"4px 10px", fontFamily:C.mono, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold; e.currentTarget.style.color=C.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.inkMute; }}
                  >Change</button>
                </div>
              )}
            </div>

            {/* Gold rule */}
            <div style={{ height:1, background:`linear-gradient(90deg, ${C.gold}60, ${C.goldLine}, transparent)`, marginTop:16 }}/>
          </div>

          {!docText ? (
            /* ══ UPLOAD SCREEN ══ */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 40px", overflow:"auto" }}>

              {/* Watermark */}
              <div style={{ position:"absolute", fontSize:110, fontWeight:700, fontStyle:"italic", fontFamily:C.serif, color:`rgba(196,163,90,0.05)`, userSelect:"none", pointerEvents:"none", letterSpacing:"-4px", lineHeight:1 }}>Concierge</div>

              <div style={{ position:"relative", textAlign:"center", animation:`fadeUp 500ms ${EASE} both` }}>
                <LuggageTag hover={tagHover}/>

                <h2 style={{ fontFamily:C.serif, fontWeight:700, fontStyle:"italic", fontSize:36, color:C.ink, margin:"0 0 8px", letterSpacing:"-1px", lineHeight:1.05 }}>
                  Good evening.<br/>How may I assist?
                </h2>
                <p style={{ fontSize:13, color:C.inkLight, fontFamily:C.body, lineHeight:1.85, maxWidth:360, margin:"0 auto 32px", fontWeight:300 }}>
                  Upload your HR policy document and I shall answer any question — promptly, precisely, at any hour.
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setTagHover(true)}
                  onMouseLeave={() => setTagHover(false)}
                  style={{
                    border:`1.5px dashed ${dragOver||tagHover?C.gold:C.borderDark}`,
                    borderRadius:8, padding:"28px 40px",
                    cursor:"pointer", textAlign:"center",
                    background:dragOver?C.goldTrace:C.white,
                    boxShadow:dragOver||tagHover?`0 8px 32px ${C.goldGlow}, 0 0 0 4px rgba(196,163,90,0.06)`:`0 2px 12px ${C.shadow}`,
                    transition:`all 250ms ${EASE}`,
                    marginBottom:24,
                  }}
                >
                  <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1.1rem", color:dragOver||tagHover?C.gold:C.ink, marginBottom:6, transition:`color 200ms ease` }}>
                    {dragOver?"Release to present document":"Present your document"}
                  </p>
                  <p style={{ fontFamily:C.body, fontSize:"0.72rem", color:C.inkMute, marginBottom:18, fontWeight:300 }}>PDF or plain text · drag & drop or browse</p>
                  <div style={{ display:"inline-block", background:dragOver||tagHover?`linear-gradient(135deg,${C.gold},${C.goldDim})`:C.ink, color:C.white, borderRadius:6, padding:"10px 28px", fontSize:"0.72rem", fontFamily:C.mono, letterSpacing:"0.16em", textTransform:"uppercase", boxShadow:dragOver||tagHover?`0 4px 16px ${C.goldGlow}`:`0 4px 12px ${C.shadowDeep}`, transition:`all 250ms ${EASE}`, fontWeight:500 }}>Browse Files</div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
                </div>

                {/* Quick questions preview */}
                <div>
                  <p style={{ fontSize:9, color:C.inkFaint, fontFamily:C.mono, letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:12 }}>Common Enquiries</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                    {SUGGESTIONS.map((s,i) => (
                      <span key={i} style={{ padding:"5px 12px", border:`1px solid ${C.border}`, borderRadius:20, fontSize:"0.68rem", fontFamily:C.body, color:C.inkMute, fontWeight:300 }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : (
            /* ══ CHAT ══ */
            <>
              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"24px 32px", display:"flex", flexDirection:"column", gap:24 }}>

                {/* Welcome */}
                {messages.length === 0 && (
                  <div style={{ animation:`fadeIn 500ms ${EASE} both` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, ${C.gold}60, transparent)` }}/>
                      <span style={{ fontSize:9, fontFamily:C.mono, color:C.gold, letterSpacing:"0.18em", textTransform:"uppercase" }}>At your service</span>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, transparent, ${C.gold}60)` }}/>
                    </div>
                    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px", boxShadow:`0 2px 12px ${C.shadow}`, position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(180deg, ${C.gold}, ${C.goldDim})` }}/>
                      <p style={{ fontFamily:C.serif, fontStyle:"italic", fontSize:"1rem", color:C.ink, marginBottom:8 }}>Good day. I'm PolicyPal.</p>
                      <p style={{ fontFamily:C.body, fontSize:"0.82rem", color:C.inkLight, lineHeight:1.85, fontWeight:300 }}>I have reviewed your policy document and am at your service. Please ask me anything — or select one of the common enquiries below.</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:14 }}>
                        {SUGGESTIONS.map((s,i) => (
                          <button key={i} className="sug-pill" onClick={() => sendMessage(s)}
                            style={{ padding:"5px 12px", border:`1px solid ${C.border}`, borderRadius:20, fontSize:"0.68rem", fontFamily:C.body, color:C.inkMute, background:"transparent", cursor:"pointer", fontWeight:300, animation:`fadeIn 400ms ${EASE} ${i*60}ms both` }}
                            onMouseDown={e => { e.currentTarget.style.transform="scale(0.96)"; }}
                            onMouseUp={e => { e.currentTarget.style.transform="scale(1)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((m, i) => (
                  <div key={i} style={{ animation:`msgIn 350ms ${EASE} both` }}>
                    {m.role === "user" ? (
                      /* Guest request — right aligned, like a notepad tear-off */
                      <div style={{ display:"flex", justifyContent:"flex-end" }}>
                        <div style={{ maxWidth:"68%", position:"relative" }}>
                          {/* Notepad lines effect */}
                          <div style={{
                            background:`#1B3A2D`,
                            borderRadius:"12px 12px 4px 12px",
                            padding:"14px 16px",
                            border:`1px solid rgba(245,158,11,0.25)`,
                            boxShadow:`0 4px 16px rgba(10,28,20,0.3)`,
                            backgroundImage:`repeating-linear-gradient(transparent, transparent 27px, rgba(255,255,255,0.05) 27px, rgba(255,255,255,0.05) 28px)`,
                            backgroundPosition:"0 8px",
                          }}>
                            <p style={{ fontSize:"0.84rem", color:"rgba(253,248,240,0.9)", margin:0, lineHeight:1.72, fontFamily:C.body, fontStyle:"italic" }}>{m.content}</p>
                          </div>
                          <div style={{ position:"absolute", bottom:-5, right:0, width:0, height:0, borderLeft:"8px solid transparent", borderTop:`8px solid ${C.border}` }}/>
                        </div>
                      </div>
                    ) : (
                      /* Concierge reply — left, formal card */
                      <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:C.white, fontFamily:C.serif, fontWeight:700, fontStyle:"italic", boxShadow:`0 2px 8px ${C.goldGlow}`, marginTop:2 }}>P</div>
                        <div style={{ flex:1, background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px 12px 12px 4px", padding:"16px 18px", boxShadow:`0 2px 12px ${C.shadow}`, position:"relative", overflow:"hidden" }}>
                          <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg, ${C.gold}80, transparent)` }}/>
                          {renderMsg(m.content)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading */}
                {loading && (
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start", animation:`msgIn 300ms ${EASE} both` }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:C.white, fontFamily:C.serif, fontWeight:700, fontStyle:"italic", animation:"pulse 1.5s ease-in-out infinite" }}>P</div>
                    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:"12px 12px 12px 4px", padding:"14px 18px", display:"flex", gap:6, alignItems:"center", boxShadow:`0 2px 8px ${C.shadow}` }}>
                      {[0,1,2].map(j => <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.gold, animation:`inkDot 1.4s ease-in-out ${j*220}ms infinite` }}/>)}
                    </div>
                  </div>
                )}

                {error && <div style={{ background:"rgba(139,32,32,0.06)", border:"1px solid rgba(139,32,32,0.15)", borderRadius:8, padding:"10px 14px", fontSize:11, color:"#8B2020", fontFamily:C.mono }}>{error}</div>}
                <div ref={chatEndRef}/>
              </div>

              {/* Gold rule before input */}
              <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${C.gold}50, transparent)` }}/>

              {/* INPUT — hotel notepad style */}
              <div style={{ padding:"16px 32px 20px", background:C.creamDeep, flexShrink:0 }}>
                <div style={{
                  display:"flex", gap:12, alignItems:"flex-end",
                  background: focused
                    ? `repeating-linear-gradient(transparent, transparent 27px, ${C.border} 27px, ${C.border} 28px)`
                    : C.white,
                  backgroundPosition:"0 8px",
                  border:`1px solid ${focused?C.gold:C.border}`,
                  borderRadius:12, padding:"12px 12px 12px 18px",
                  boxShadow: focused ? `0 0 0 3px ${C.goldTrace}, 0 4px 16px ${C.shadow}` : `0 2px 8px ${C.shadow}`,
                  transition:`all 200ms ${EASE}`,
                }}>
                  <textarea
                    ref={textareaRef}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ flex:1, background:"transparent", border:"none", color:C.ink, fontFamily:C.body, fontSize:"0.84rem", resize:"none", lineHeight:1.72, maxHeight:120, outline:"none", padding:"2px 0", caretColor:C.gold, fontStyle:focused?"italic":"normal" }}
                    placeholder="How may I assist you today?"
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
            </>
          )}
        </div>

        {/* Bottom tagline */}
        <p style={{ marginTop:14, fontSize:10, color:"rgba(253,248,240,0.3)", fontFamily:C.body, letterSpacing:"0.06em", fontStyle:"italic", animation:`fadeIn 800ms ${EASE} 400ms both` }}>
          Your HR team can't answer at 11pm. PolicyPal can.
        </p>
      </div>
    </>
  );
}