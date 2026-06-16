import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   POLICYPAL — Platinum Terminal
   
   Reference: Bloomberg Pro + Patek Philippe + Vercel Pro.
   The interface that costs money because every detail
   is considered. Nothing is accidental. Everything moves
   with mechanical precision.
   
   Palette — Platinum & Obsidian:
   - #0E0E10  near-black, cool blue-grey undertone
   - #1C1C20  surface — dark steel
   - #252530  raised — lifted panel
   - #2E2E3A  high panel
   - #C8A96E  champagne gold — THE accent, used sparingly
   - #8892A4  steel blue-grey — mid tone
   - #F8F8F8  near-white ink
   - #3A3A4A  border steel
   
   Motion — Swiss watch mechanism:
   1. SWEEP HAND CANVAS — a thin precision line rotates
      continuously in the header. Speed increases when
      a query is processing. The terminal is alive.
   2. TICKER NUMBERS — stat numbers count up from 0
      on mount with spring physics. Premium feel.
   3. LAYOUT MORPH — when document loads, the sidebar
      expands and panels slide into new positions.
      The dashboard reconfigures. One deliberate moment.
   4. LIVE TIMESTAMPS — each message shows "0s ago",
      "1s ago", "2s ago"... ticking up in real time.
   5. SIGNAL BAR — a horizontal bar in the header
      that fills and empties like a data stream.
   6. PANEL SCAN — when you send a message, a thin
      gold line sweeps across the input from left to
      right before firing. Mechanical, not cosmic.
   7. HOVER LIFT — cards lift 2px with border highlight
      on hover. Everything responds to presence.
   8. PRESSURE INDICATOR — query count shown as a
      live bar that grows with each message.
   
   All features from previous builds:
   - Typewriter responses
   - Follow-up suggestions  
   - Copy button
   - Document summary
   - Search/highlight
   - No glow. Hard edges. Precise.
═══════════════════════════════════════════════════════════ */

const C = {
  void:         "#0E0E10",
  surface:      "#1C1C20",
  raised:       "#252530",
  high:         "#2E2E3A",
  panel:        "#1A1A22",
  gold:         "#C8A96E",
  goldDim:      "rgba(200,169,110,0.45)",
  goldFaint:    "rgba(200,169,110,0.12)",
  goldTrace:    "rgba(200,169,110,0.06)",
  steel:        "#8892A4",
  steelDim:     "rgba(136,146,164,0.45)",
  steelFaint:   "rgba(136,146,164,0.12)",
  border:       "rgba(58,58,74,0.9)",
  borderMid:    "rgba(136,146,164,0.25)",
  borderHigh:   "rgba(200,169,110,0.45)",
  ink:          "#F8F8F8",
  inkOff:       "rgba(248,248,248,0.88)",
  inkMid:       "rgba(248,248,248,0.58)",
  inkDim:       "rgba(248,248,248,0.32)",
  inkFaint:     "rgba(248,248,248,0.12)",
  inkTrace:     "rgba(248,248,248,0.05)",
  positive:     "#4CAF76",
  positivePale: "rgba(76,175,118,0.10)",
  negative:     "#E05555",
  negativePale: "rgba(224,85,85,0.10)",
  neutral:      "#C8A96E",
  display:      "'Syne', system-ui, sans-serif",
  body:         "'Inter', system-ui, sans-serif",
  mono:         "'JetBrains Mono', monospace",
};

const SP = {
  // Mechanical — precise, no bounce
  mech:    { type:"spring", stiffness:600, damping:40, mass:0.8 },
  // Smooth — panel transitions
  smooth:  { type:"spring", stiffness:280, damping:32, mass:1 },
  // Press — tactile
  press:   { type:"spring", stiffness:600, damping:36, mass:0.8 },
  // Tick — instant settle, like a watch hand
  tick:    { type:"spring", stiffness:800, damping:45 },
  // Number — weighted count
  number:  { type:"spring", stiffness:120, damping:20, mass:1.4 },
};

/* ══════════════════════════════════════════════════════════
   SWEEP HAND CANVAS — signature element
   A thin precision line rotates in the header corner.
   Slow: 8s/rotation at idle.
   Fast: 1s/rotation when loading.
   The terminal is always alive.
══════════════════════════════════════════════════════════ */
function SweepHand({ loading }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = 48;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 4;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      const speed = loading ? 0.04 : 0.008;
      angleRef.current += speed;

      // Track rings
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(58,58,74,0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(58,58,74,0.6)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Tick marks
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const x1 = cx + (r - 2) * Math.cos(a);
        const y1 = cy + (r - 2) * Math.sin(a);
        const x2 = cx + (r - (i % 3 === 0 ? 6 : 4)) * Math.cos(a);
        const y2 = cy + (r - (i % 3 === 0 ? 6 : 4)) * Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 3 === 0 ? "rgba(200,169,110,0.6)" : "rgba(58,58,74,0.9)";
        ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.75;
        ctx.stroke();
      }

      // Sweep hand
      const hx = cx + (r - 8) * Math.cos(angleRef.current - Math.PI / 2);
      const hy = cy + (r - 8) * Math.sin(angleRef.current - Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = loading ? C.gold : "rgba(200,169,110,0.75)";
      ctx.lineWidth = loading ? 1.5 : 1;
      ctx.lineCap = "round";
      ctx.stroke();

      // Center pin
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = C.gold;
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [loading]);

  return <canvas ref={canvasRef} style={{ width:48, height:48 }}/>;
}

/* ══════════════════════════════════════════════════════════
   TICKER NUMBER — counts up from 0 to value on mount
   Uses spring physics. Feels weighted and real.
══════════════════════════════════════════════════════════ */
function TickerNumber({ value, style={} }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness:80, damping:18, mass:1.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { mv.set(value); }, [value, mv]);
  useEffect(() => {
    const unsub = spring.on("change", v => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  return <span style={style}>{display}</span>;
}

/* ══════════════════════════════════════════════════════════
   LIVE TIMESTAMP — ticks up in real time
   "0s ago" → "1s ago" → "2s ago"...
   Shows the terminal is live.
══════════════════════════════════════════════════════════ */
function LiveTimestamp({ createdAt }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - createdAt) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  const fmt = s => {
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  return (
    <span style={{ fontFamily:C.mono, fontSize:9, color:C.steel,
      letterSpacing:"0.08em" }}>{fmt(elapsed)}</span>
  );
}

/* ══════════════════════════════════════════════════════════
   SIGNAL BAR — horizontal data stream indicator
   Fills and empties continuously. Speeds up on load.
══════════════════════════════════════════════════════════ */
function SignalBar({ active }) {
  const [fill, setFill] = useState(0);
  const dirRef = useRef(1);

  useEffect(() => {
    const speed = active ? 4 : 0.8;
    const iv = setInterval(() => {
      setFill(f => {
        const next = f + dirRef.current * speed;
        if (next >= 100) { dirRef.current = -1; return 100; }
        if (next <= 0) { dirRef.current = 1; return 0; }
        return next;
      });
    }, 30);
    return () => clearInterval(iv);
  }, [active]);

  return (
    <div style={{ width:80, height:2, background:C.border, borderRadius:1, overflow:"hidden" }}>
      <motion.div
        animate={{ width:`${fill}%` }}
        transition={{ duration:0.03 }}
        style={{ height:"100%", background:active ? C.gold : C.steel,
          borderRadius:1, opacity:active ? 1 : 0.5 }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PANEL SCAN — gold line sweeps input on send
   Left to right over 300ms. Precise. Mechanical.
══════════════════════════════════════════════════════════ */
function PanelScan({ scanning }) {
  return (
    <AnimatePresence>
      {scanning && (
        <motion.div
          initial={{ scaleX:0, opacity:1 }}
          animate={{ scaleX:1, opacity:0 }}
          exit={{ opacity:0 }}
          transition={{ duration:0.32, ease:[0.4, 0, 0.6, 1] }}
          style={{ position:"absolute", bottom:0, left:0, right:0, height:1,
            background:C.gold, originX:0, transformBox:"fill-box",
            pointerEvents:"none", zIndex:10 }}/>
      )}
    </AnimatePresence>
  );
}

/* ── Typewriter ── */
function Typewriter({ text, onComplete, searchTerm="" }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0; setDisplayed(""); setDone(false);
    const iv = setInterval(() => {
      if (indexRef.current < text.length) {
        const c = Math.floor(Math.random()*3)+1;
        indexRef.current = Math.min(indexRef.current+c, text.length);
        setDisplayed(text.slice(0, indexRef.current));
      } else { clearInterval(iv); setDone(true); onComplete&&onComplete(); }
    }, 12);
    return () => clearInterval(iv);
  }, [text, onComplete]);

  useEffect(() => {
    if (done) return;
    const b = setInterval(() => setCursorOn(v=>!v), 530);
    return () => clearInterval(b);
  }, [done]);

  return (
    <span style={{ fontFamily:C.body, fontSize:"0.82rem", color:C.inkMid, lineHeight:1.8 }}>
      <HighlightedText text={displayed} searchTerm={searchTerm}/>
      {!done && <span style={{ display:"inline-block", width:2, height:"1em",
        background:C.gold, marginLeft:1, verticalAlign:"text-bottom",
        opacity:cursorOn?1:0 }}/>}
    </span>
  );
}

/* ── Highlight ── */
function HighlightedText({ text, searchTerm, style={} }) {
  if (!searchTerm||!text) return <span style={style}>{text}</span>;
  const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi"));
  return (
    <span style={style}>
      {parts.map((p,i) => p.toLowerCase()===searchTerm.toLowerCase()
        ? <mark key={i} style={{ background:"rgba(200,169,110,0.22)", color:C.gold,
            borderRadius:2, padding:"0 1px" }}>{p}</mark>
        : p)}
    </span>
  );
}

/* ── Copy button ── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.button initial={{ opacity:0 }} whileHover={{ opacity:1 }}
      whileTap={{ scale:0.95, transition:SP.press }}
      onClick={e=>{ e.stopPropagation(); navigator.clipboard.writeText(text);
        setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
      style={{ position:"absolute", top:8, right:8, background:"transparent",
        border:`1px solid ${copied?C.goldDim:C.border}`, borderRadius:4,
        padding:"3px 8px", cursor:"pointer", display:"flex", alignItems:"center", gap:4,
        fontFamily:C.mono, fontSize:9, color:copied?C.gold:C.inkDim,
        letterSpacing:"0.08em", transition:"all 150ms" }}>
      {copied ? "✓ Copied" : "Copy"}
    </motion.button>
  );
}

/* ── Wave dots ── */
function WaveDots() {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
      {[0,1,2].map(i=>(
        <motion.div key={i}
          animate={{ scaleY:[1,1.8,1], opacity:[0.5,1,0.5] }}
          transition={{ duration:0.9, delay:i*0.15, repeat:Infinity, ease:"easeInOut" }}
          style={{ width:2, height:12, background:C.gold, borderRadius:1 }}/>
      ))}
    </div>
  );
}

/* ── Message renderer ── */
function renderMsg(text, searchTerm="") {
  return text.split('\n').map((line,i) => {
    if (/^#{1,3}\s/.test(line)) return (
      <p key={i} style={{ fontFamily:C.display, fontWeight:700, color:C.gold,
        margin:"14px 0 5px", fontSize:"0.88rem", letterSpacing:"0.04em" }}>
        <HighlightedText text={line.replace(/^#{1,3}\s/,"")} searchTerm={searchTerm}/>
      </p>
    );
    if (line.startsWith('- ')||line.startsWith('* ')) {
      const pts = line.slice(2).split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ display:"flex", gap:10, margin:"4px 0" }}>
          <span style={{ color:C.gold, flexShrink:0, fontSize:10, marginTop:4, opacity:0.7 }}>▸</span>
          <span style={{ fontSize:"0.8rem", color:C.inkOff, lineHeight:1.75, fontFamily:C.body }}>
            {pts.map((p,j) => j%2===1
              ? <strong key={j} style={{ color:C.ink, fontWeight:600 }}>{p}</strong>
              : <HighlightedText key={j} text={p} searchTerm={searchTerm}/>)}
          </span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} style={{ height:6 }}/>;
    if (line.match(/^---+$/)) return (
      <div key={i} style={{ height:1, background:C.border, margin:"8px 0" }}/>
    );
    const pts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin:"3px 0", lineHeight:1.8, fontSize:"0.8rem",
        color:C.inkMid, fontFamily:C.body }}>
        {pts.map((p,j) => j%2===1
          ? <strong key={j} style={{ color:C.inkOff, fontWeight:600 }}>{p}</strong>
          : <HighlightedText key={j} text={p} searchTerm={searchTerm}/>)}
      </p>
    );
  });
}

const SUGGESTIONS = [
  "What is the leave entitlement?",
  "How do I raise a grievance?",
  "Remote work guidelines?",
  "Performance review process?",
  "What are the working hours?",
];

const TOPICS = ["Leave & Absence","Remote Work","Grievances",
  "Performance","Benefits","Disciplinary","Data Privacy"];

export default function PolicyPal() {
  const [docText, setDocText]       = useState("");
  const [docName, setDocName]       = useState("");
  const [docBase64, setDocBase64]   = useState("");
  const [docIsPdf, setDocIsPdf]     = useState(false);
  const [docSummary, setDocSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [messages, setMessages]     = useState([]);
  const [msgTimes, setMsgTimes]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [dragOver, setDragOver]     = useState(false);
  const [focused, setFocused]       = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [typingDone, setTypingDone] = useState({});
  const [followUps, setFollowUps]   = useState({});
  const [docLoaded, setDocLoaded]   = useState(false);

  const chatEndRef   = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function generateSummary(text, isPdf, base64) {
    setSummaryLoading(true);
    try {
      let body;
      if (isPdf) {
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:400,
          system:"Return ONLY JSON: {summary: string (2 sentences max), topics: string[] (4-5 items)}. No markdown.",
          messages:[{ role:"user", content:[
            { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 }},
            { type:"text", text:"Summarise. JSON only." }
          ]}]});
      } else {
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:400,
          system:"Return ONLY JSON: {summary: string (2 sentences max), topics: string[] (4-5 items)}. No markdown.",
          messages:[{ role:"user", content:`Summarise.\n\n${text.slice(0,4000)}` }]});
      }
      const res = await fetch("/api/v1/messages", { method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_API_KEY,
          "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true",
          "anthropic-beta":"pdfs-2024-09-25" }, body });
      const data = await res.json();
      const raw = data.content?.map(i=>i.text||"").join("")||"";
      const match = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim().match(/\{[\s\S]*\}/);
      if (match) { try { setDocSummary(JSON.parse(match[0])); } catch {} }
    } catch {}
    setSummaryLoading(false);
  }

  async function handleFile(file) {
    if (!file) return;
    setDocName(file.name); setMessages([]); setMsgTimes([]);
    setDocSummary(null); setTypingDone({}); setFollowUps({});
    if (file.type==="application/pdf") {
      const r = new FileReader();
      r.onload = e => {
        const b = e.target.result.split(",")[1];
        setDocBase64(b); setDocIsPdf(true); setDocText("__pdf__");
        setDocLoaded(true);
        generateSummary("", true, b);
      };
      r.readAsDataURL(file);
    } else {
      const r = new FileReader();
      r.onload = e => {
        const t = e.target.result;
        setDocText(t); setDocBase64(""); setDocIsPdf(false);
        setDocLoaded(true);
        generateSummary(t, false, "");
      };
      r.readAsText(file);
    }
  }

  async function generateFollowUps(answer, msgIndex) {
    try {
      const res = await fetch("/api/v1/messages", { method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_API_KEY,
          "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:200,
          system:"Return ONLY a JSON array of 3 short follow-up questions (max 8 words). No markdown.",
          messages:[{ role:"user", content:`Suggest 3 follow-ups:\n\n${answer.slice(0,500)}` }] }) });
      const data = await res.json();
      const raw = data.content?.map(i=>i.text||"").join("")||"";
      const match = raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim().match(/\[[\s\S]*\]/);
      if (match) { try { setFollowUps(p=>({...p,[msgIndex]:JSON.parse(match[0])})); } catch {} }
    } catch {}
  }

  async function sendMessage(text) {
    const q = (text||input).trim();
    if (!q||!docText||loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height="auto";

    // Panel scan
    setScanning(true);
    await new Promise(r => setTimeout(r, 320));
    setScanning(false);

    const now = Date.now();
    const newMessages = [...messages, { role:"user", content:q }];
    const newTimes = [...msgTimes, now];
    setMessages(newMessages); setMsgTimes(newTimes);
    setLoading(true); setError("");

    try {
      let body;
      if (docIsPdf) {
        const um = newMessages.map((m,i) => {
          if (i===0) return { role:"user", content:[
            { type:"document", source:{ type:"base64", media_type:"application/pdf", data:docBase64 }},
            { type:"text", text:m.content }
          ]};
          return { role:m.role, content:m.content };
        });
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000,
          system:"You are PolicyPal, a precise HR policy assistant. Answer based strictly on the uploaded document. Be clear and direct.",
          messages:um });
      } else {
        body = JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1000,
          system:`You are PolicyPal, a precise HR policy assistant.\n\nPOLICY DOCUMENT:\n${docText}`,
          messages:newMessages.map(m=>({ role:m.role, content:m.content })) });
      }
      const res = await fetch("/api/v1/messages", { method:"POST",
        headers:{ "Content-Type":"application/json", "x-api-key":process.env.REACT_APP_API_KEY,
          "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true",
          "anthropic-beta":"pdfs-2024-09-25" }, body });
      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      const reply = data.content?.map(i=>i.text||"").join("")||"";
      setMessages(prev => [...prev, { role:"assistant", content:reply }]);
      setMsgTimes(prev => [...prev, Date.now()]);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  const onTypingComplete = useCallback((idx, content) => {
    setTypingDone(p=>({...p,[idx]:true}));
    generateFollowUps(content, idx);
  }, []);

  const queryCount = messages.filter(m=>m.role==="user").length;

  const listV = { hidden:{}, show:{ transition:{ staggerChildren:0.04, delayChildren:0.06 } } };
  const itemV = { hidden:{ opacity:0, y:-8 }, show:{ opacity:1, y:0, transition:SP.smooth } };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;overflow:hidden;}
        html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
        body{background:${C.void};}
        ::selection{background:rgba(200,169,110,0.20);color:${C.gold};}
        ::placeholder{color:${C.inkFaint};font-family:'JetBrains Mono',monospace;font-size:0.78rem;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:${C.raised};}
        input,textarea{color:${C.ink};}
        @media(prefers-reduced-motion:reduce){
          *{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}
          canvas{display:none;}
        }
      `}</style>

      <div style={{ display:"flex", height:"100vh", fontFamily:C.body,
        overflow:"hidden", background:C.void, position:"relative", zIndex:1 }}>

        {/* ══ SIDEBAR — morphs on doc load ══ */}
        <motion.div
          animate={{ width: docLoaded ? 320 : 280 }}
          transition={SP.smooth}
          style={{ flexShrink:0, background:C.surface,
            borderRight:`1px solid ${C.border}`, display:"flex",
            flexDirection:"column", overflow:"hidden" }}>

          {/* Gold top stripe */}
          <div style={{ height:2, background:`linear-gradient(90deg, ${C.gold}, rgba(200,169,110,0.3), transparent)` }}/>

          {/* Brand header */}
          <motion.div
            initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
            transition={{ ...SP.smooth, delay:0.05 }}
            style={{ padding:"20px 22px 18px", borderBottom:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink, fontFamily:C.display,
                letterSpacing:"0.04em", lineHeight:1 }}>PolicyPal</div>
              <div style={{ fontSize:8, color:C.steel, letterSpacing:"0.18em",
                textTransform:"uppercase", fontFamily:C.mono, marginTop:4 }}>
                Platinum Terminal · by Divyah
              </div>
            </div>
            {/* Sweep hand */}
            <SweepHand loading={loading}/>
          </motion.div>

          {/* Stats strip — ticker numbers */}
          <div style={{ padding:"12px 22px", borderBottom:`1px solid ${C.border}`,
            display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"Queries", value:queryCount },
              { label:"Loaded", value:docLoaded?1:0 },
              { label:"Uptime", value:Math.floor(Date.now()/1000%999) },
            ].map(({ label, value }, i) => (
              <div key={label}>
                <div style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                  letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:3 }}>
                  {label}
                </div>
                <TickerNumber value={value}
                  style={{ fontFamily:C.mono, fontSize:18, fontWeight:600,
                    color:C.ink, letterSpacing:"-0.5px", lineHeight:1 }}/>
              </div>
            ))}
          </div>

          {/* Branding text */}
          <div style={{ padding:"16px 22px 14px", borderBottom:`1px solid ${C.border}` }}>
            <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1rem",
              color:C.inkOff, lineHeight:1.4, margin:"0 0 4px" }}>Stop reading policies.</p>
            <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1rem",
              color:C.gold, lineHeight:1.4, margin:"0 0 10px" }}>Start asking them.</p>
            <SignalBar active={loading}/>
          </div>

          {/* Content area */}
          <div style={{ flex:1, padding:"14px 22px", display:"flex",
            flexDirection:"column", overflow:"hidden auto" }}>
            <AnimatePresence mode="wait">
              {!docText ? (
                <motion.div key="topics"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.18 }}>
                  <div style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                    letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:12 }}>
                    Policy Sectors
                  </div>
                  <motion.div variants={listV} initial="hidden" animate="show">
                    {TOPICS.map((t,i) => (
                      <motion.div key={i} variants={itemV}
                        whileHover={{ x:3, transition:SP.tick }}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                          borderBottom:`1px solid ${C.border}`, cursor:"default" }}>
                        <div style={{ width:4, height:4, borderRadius:1,
                          background:C.steel, flexShrink:0, opacity:0.6 }}/>
                        <span style={{ fontSize:"0.72rem", color:C.inkDim,
                          fontFamily:C.body, transition:"color 150ms" }}>{t}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="loaded"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.2 }}
                  style={{ display:"flex", flexDirection:"column" }}>

                  {/* Doc card — slides in */}
                  <motion.div
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={SP.smooth}
                    style={{ padding:"10px 14px", background:C.raised,
                      border:`1px solid ${C.border}`, borderRadius:6,
                      marginBottom:10, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", left:0, top:0, bottom:0,
                      width:2, background:C.gold }}/>
                    <div style={{ fontFamily:C.mono, fontSize:8, color:C.gold,
                      letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>
                      Active Document
                    </div>
                    <div style={{ fontSize:"0.72rem", color:C.inkOff,
                      fontFamily:C.mono, marginBottom:4 }}>
                      {docName.slice(0,28)}{docName.length>28?"…":""}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:5, height:5, borderRadius:"50%",
                        background:C.positive, flexShrink:0 }}/>
                      <span style={{ fontFamily:C.mono, fontSize:8,
                        color:C.positive, letterSpacing:"0.08em" }}>INDEXED</span>
                    </div>
                  </motion.div>

                  {/* Summary */}
                  <AnimatePresence>
                    {summaryLoading && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        style={{ marginBottom:10, padding:"10px 12px", background:C.raised,
                          border:`1px solid ${C.border}`, borderRadius:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <motion.div animate={{ rotate:360 }}
                            transition={{ duration:1, repeat:Infinity, ease:"linear" }}
                            style={{ width:10, height:10, border:`1.5px solid ${C.border}`,
                              borderTopColor:C.gold, borderRadius:"50%" }}/>
                          <span style={{ fontFamily:C.mono, fontSize:9,
                            color:C.gold, letterSpacing:"0.1em" }}>Analysing document…</span>
                        </div>
                      </motion.div>
                    )}
                    {docSummary && !summaryLoading && (
                      <motion.div
                        initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                        exit={{ opacity:0 }} transition={SP.smooth}
                        style={{ marginBottom:10, padding:"10px 14px", background:C.raised,
                          border:`1px solid ${C.border}`, borderRadius:6 }}>
                        <div style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:7 }}>
                          Document Brief
                        </div>
                        <p style={{ fontSize:"0.68rem", color:C.inkMid, fontFamily:C.body,
                          lineHeight:1.65, marginBottom:10 }}>
                          {docSummary.summary}
                        </p>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {(docSummary.topics||[]).map((t,i) => (
                            <motion.span key={i}
                              initial={{ opacity:0, scale:0.9 }}
                              animate={{ opacity:1, scale:1 }}
                              transition={{ ...SP.tick, delay:i*0.06 }}
                              style={{ fontSize:"0.6rem", fontFamily:C.mono,
                                padding:"2px 8px", borderRadius:3,
                                background:C.goldTrace, border:`1px solid ${C.border}`,
                                color:C.gold, letterSpacing:"0.06em" }}>
                              {t}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ borderColor:C.borderMid, color:C.ink, x:1, transition:SP.tick }}
                    whileTap={{ scale:0.97, transition:SP.press }}
                    onClick={()=>{setDocText("");setDocName("");setDocBase64("");setDocIsPdf(false);setMessages([]);setMsgTimes([]);setDocSummary(null);setTypingDone({});setFollowUps({});setDocLoaded(false);}}
                    style={{ background:"transparent", border:`1px solid ${C.border}`,
                      borderRadius:4, color:C.inkDim, fontSize:8, padding:"6px 12px",
                      fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase",
                      alignSelf:"flex-start", marginBottom:14, display:"block",
                      cursor:"pointer", transition:"all 150ms" }}>
                    ← Unload
                  </motion.button>

                  {/* Quick queries */}
                  <div style={{ marginTop:"auto" }}>
                    <div style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                      letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:10 }}>
                      Quick Queries
                    </div>
                    <motion.div variants={listV} initial="hidden" animate="show">
                      {SUGGESTIONS.map((s,i) => (
                        <motion.button key={i} variants={itemV}
                          whileHover={{ borderColor:C.borderMid, color:C.ink,
                            background:C.raised, x:2, transition:SP.tick }}
                          whileTap={{ scale:0.98, transition:SP.press }}
                          onClick={()=>sendMessage(s)}
                          style={{ display:"block", width:"100%", background:"transparent",
                            border:`1px solid ${C.border}`, borderRadius:5, padding:"8px 12px",
                            fontSize:"0.67rem", color:C.inkDim, textAlign:"left",
                            fontFamily:C.body, marginBottom:5, lineHeight:1.4,
                            cursor:"pointer", transition:"all 120ms" }}>
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height:1, background:C.border }}/>
        </motion.div>

        {/* ══ MAIN PANEL ══ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <AnimatePresence mode="wait">
            {!docText ? (
              /* ── UPLOAD ── */
              <motion.div key="upload"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.2 }}
                style={{ flex:1, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", padding:"60px 48px" }}>

                <motion.div
                  initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
                  transition={{ ...SP.smooth, delay:0.08 }}
                  style={{ textAlign:"center", marginBottom:48, maxWidth:560 }}>

                  {/* Live data strip above headline */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:20, marginBottom:24 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <motion.div animate={{ opacity:[1,0.3,1] }}
                        transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
                        style={{ width:5, height:5, borderRadius:"50%", background:C.positive }}/>
                      <span style={{ fontFamily:C.mono, fontSize:9, color:C.steel,
                        letterSpacing:"0.14em", textTransform:"uppercase" }}>System Online</span>
                    </div>
                    <div style={{ width:1, height:12, background:C.border }}/>
                    <span style={{ fontFamily:C.mono, fontSize:9, color:C.steel,
                      letterSpacing:"0.14em", textTransform:"uppercase" }}>
                      PolicyPal Terminal v2
                    </span>
                    <div style={{ width:1, height:12, background:C.border }}/>
                    <SignalBar active={false}/>
                  </div>

                  <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:52,
                    color:C.ink, margin:"0 0 4px", letterSpacing:"-1.5px", lineHeight:0.95 }}>
                    Upload your policy.
                  </h1>
                  <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:52,
                    color:C.gold, margin:"0 0 20px", letterSpacing:"-1.5px", lineHeight:0.95 }}>
                    Ask anything.
                  </h1>
                  <p style={{ fontSize:14, color:C.inkDim, fontFamily:C.body,
                    lineHeight:1.8, margin:"0 auto", maxWidth:360 }}>
                    Your HR team can't answer at 11pm.<br/>
                    <span style={{ color:C.inkMid }}>The terminal operates around the clock.</span>
                  </p>
                </motion.div>

                {/* Drop zone */}
                <motion.div
                  initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                  transition={{ ...SP.smooth, delay:0.16 }}
                  whileHover={{ borderColor:C.borderMid, transition:SP.tick }}
                  style={{ width:"100%", maxWidth:520, borderRadius:8,
                    padding:"48px 44px", textAlign:"center", cursor:"pointer",
                    background:dragOver ? C.raised : C.surface,
                    border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                    position:"relative", overflow:"hidden",
                    transition:"background 150ms, border-color 150ms" }}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                  onClick={()=>fileInputRef.current?.click()}>

                  {/* Corner accents */}
                  {[[0,0,0],[0,1,90],[1,0,270],[1,1,180]].map(([r,c,rot],i)=>(
                    <div key={i} style={{
                      position:"absolute",
                      top: r===0?12:"auto", bottom: r===1?12:"auto",
                      left: c===0?12:"auto", right: c===1?12:"auto",
                      width:12, height:12,
                      borderTop: r===0?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",
                      borderLeft: c===0?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",
                      borderBottom: r===1?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",
                      borderRight: c===1?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",
                      transition:"border-color 150ms",
                    }}/>
                  ))}

                  <motion.div animate={{ y:dragOver?-4:0 }} transition={SP.mech}
                    style={{ width:52, height:52, borderRadius:6, background:C.raised,
                      border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 18px", transition:"border-color 150ms" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={dragOver?C.gold:C.steel} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition:"stroke 150ms" }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </motion.div>

                  <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1.1rem",
                    color:dragOver?C.gold:C.inkOff, marginBottom:6, transition:"color 150ms" }}>
                    {dragOver ? "Release to load document" : "Load document"}
                  </p>
                  <p style={{ fontFamily:C.mono, fontSize:"0.68rem", color:C.inkDim,
                    marginBottom:22, lineHeight:1.7 }}>
                    PDF or TXT · drag & drop or click to browse
                  </p>

                  <motion.div
                    whileHover={{ scale:1.02, borderColor:C.borderMid, transition:SP.tick }}
                    whileTap={{ scale:0.97, transition:SP.press }}
                    style={{ display:"inline-flex", alignItems:"center", gap:8,
                      background:"transparent", color:dragOver?C.gold:C.inkMid,
                      borderRadius:5, padding:"10px 24px", fontSize:"0.7rem",
                      fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase",
                      border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                      fontWeight:500, transition:"all 150ms", cursor:"pointer" }}>
                    Browse Files
                  </motion.div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf"
                    style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
                </motion.div>
              </motion.div>

            ) : (
              /* ── CHAT ── */
              <motion.div key="chat"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.18 }}
                style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {/* Header bar */}
                <div style={{ padding:"10px 28px", background:C.void,
                  borderBottom:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <motion.div animate={{ opacity:[1,0.4,1], scale:[1,1.15,1] }}
                      transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}
                      style={{ width:6, height:6, borderRadius:"50%",
                        background:C.positive, flexShrink:0 }}/>
                    <span style={{ fontSize:"0.7rem", color:C.inkDim,
                      fontFamily:C.mono, letterSpacing:"0.06em" }}>
                      <span style={{ color:C.inkOff }}>{docName}</span>
                    </span>
                  </div>

                  {/* Pressure bar — grows with queries */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                      letterSpacing:"0.1em", textTransform:"uppercase" }}>Load</span>
                    <div style={{ width:60, height:3, background:C.border, borderRadius:2, overflow:"hidden" }}>
                      <motion.div
                        animate={{ width:`${Math.min(queryCount*15, 100)}%` }}
                        transition={SP.smooth}
                        style={{ height:"100%", background:C.gold, borderRadius:2 }}/>
                    </div>
                  </div>

                  {/* Search */}
                  <motion.div
                    animate={{ borderColor:searchFocused?C.borderMid:C.border }}
                    transition={{ duration:0.15 }}
                    style={{ flex:1, display:"flex", alignItems:"center", gap:8,
                      background:C.surface, border:`1px solid ${C.border}`,
                      borderRadius:5, padding:"5px 11px", maxWidth:300, marginLeft:"auto" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <circle cx="5" cy="5" r="3.5"
                        stroke={searchFocused?C.gold:C.steel} strokeWidth="1"/>
                      <path d="M8 8l2.5 2.5"
                        stroke={searchFocused?C.gold:C.steel} strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                      onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                      placeholder="Search conversation..."
                      style={{ flex:1, background:"transparent", border:"none", outline:"none",
                        fontFamily:C.mono, fontSize:"0.7rem", color:C.ink, caretColor:C.gold }}/>
                    {searchTerm && (
                      <button onClick={()=>setSearchTerm("")}
                        style={{ background:"transparent", border:"none",
                          color:C.inkDim, cursor:"pointer", fontSize:10, padding:0 }}>✕</button>
                    )}
                  </motion.div>

                  <div style={{ fontFamily:C.mono, fontSize:8, color:C.steel,
                    letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0 }}>
                    <TickerNumber value={queryCount}
                      style={{ fontFamily:C.mono, fontSize:11, color:C.gold }}/> queries
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"20px 32px",
                  display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Welcome */}
                  {messages.length===0 && (
                    <motion.div
                      initial={{ opacity:0, y:-14, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={SP.smooth}
                      style={{ border:`1px solid ${C.border}`, borderRadius:8,
                        padding:"20px 22px", background:C.surface,
                        position:"relative", overflow:"hidden" }}>
                      {/* Gold top rule */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                        background:`linear-gradient(90deg,${C.gold},rgba(200,169,110,0.3),transparent)` }}/>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2,
                        background:C.gold }}/>
                      <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"0.95rem",
                        color:C.ink, marginBottom:7 }}>
                        Terminal ready. Document indexed.
                      </p>
                      <p style={{ fontFamily:C.body, fontSize:"0.75rem", color:C.inkDim,
                        lineHeight:1.8, marginBottom:14 }}>
                        I've read your document in full.{" "}
                        <span style={{ color:C.inkOff }}>Ask me anything — I respond from the source.</span>
                      </p>
                      <motion.div variants={listV} initial="hidden" animate="show"
                        style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {SUGGESTIONS.map((s,i) => (
                          <motion.button key={i} variants={itemV}
                            whileHover={{ borderColor:C.borderMid, color:C.gold,
                              background:C.raised, transition:SP.tick }}
                            whileTap={{ scale:0.97, transition:SP.press }}
                            onClick={()=>sendMessage(s)}
                            style={{ padding:"5px 12px", border:`1px solid ${C.border}`,
                              borderRadius:4, fontSize:"0.65rem", fontFamily:C.mono,
                              color:C.inkDim, background:"transparent", cursor:"pointer",
                              letterSpacing:"0.04em", transition:"all 120ms" }}>
                            {s}
                          </motion.button>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Messages */}
                  {messages.map((m, i) => {
                    const isUser = m.role==="user";
                    const isLastAssistant = !isUser && i===messages.length-1 && !typingDone[i];
                    return (
                      <motion.div key={i}
                        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
                        transition={SP.smooth}
                        style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start",
                          gap:10, alignItems:"flex-end" }}>
                        {!isUser && (
                          <div style={{ width:24, height:24, borderRadius:4, flexShrink:0,
                            background:C.raised, border:`1px solid ${C.borderMid}`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:9, color:C.gold, fontFamily:C.display,
                            fontWeight:800, marginBottom:2 }}>P</div>
                        )}
                        <motion.div
                          whileHover={{ y:-2, borderColor:C.borderMid, transition:SP.tick }}
                          style={{
                            maxWidth:"74%", padding:"12px 15px",
                            borderRadius:isUser?"8px 8px 3px 8px":"8px 8px 8px 3px",
                            position:"relative", transition:"border-color 150ms",
                            ...(isUser ? {
                              background:C.raised,
                              border:`1px solid ${C.borderMid}`,
                            } : {
                              background:C.surface,
                              border:`1px solid ${C.border}`,
                              borderLeft:`2px solid ${C.gold}`,
                            })
                          }}>
                          {!isUser && (
                            <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                              background:`linear-gradient(90deg,rgba(200,169,110,0.4),transparent)` }}/>
                          )}
                          {isUser ? (
                            <p style={{ fontSize:"0.82rem", color:C.ink, margin:0,
                              lineHeight:1.72, fontFamily:C.body }}>
                              <HighlightedText text={m.content} searchTerm={searchTerm}/>
                            </p>
                          ) : isLastAssistant ? (
                            <Typewriter text={m.content} searchTerm={searchTerm}
                              onComplete={()=>onTypingComplete(i, m.content)}/>
                          ) : (
                            <div>{renderMsg(m.content, searchTerm)}</div>
                          )}
                          {/* Live timestamp */}
                          {msgTimes[i] && (
                            <div style={{ marginTop:6, display:"flex",
                              justifyContent:isUser?"flex-end":"flex-start" }}>
                              <LiveTimestamp createdAt={msgTimes[i]}/>
                            </div>
                          )}
                          {!isUser && typingDone[i] && <CopyBtn text={m.content}/>}
                        </motion.div>
                      </motion.div>
                    );
                  })}

                  {/* Follow-up suggestions */}
                  {Object.entries(followUps).map(([idx, suggestions]) => {
                    if (parseInt(idx)!==messages.length-1) return null;
                    return (
                      <motion.div key={`fu-${idx}`}
                        initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                        transition={{ ...SP.smooth, delay:0.2 }}
                        style={{ paddingLeft:34 }}>
                        <div style={{ fontFamily:C.mono, fontSize:8, color:C.gold,
                          letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:7 }}>
                          Continue querying
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {suggestions.map((s,i) => (
                            <motion.button key={i}
                              initial={{ opacity:0, scale:0.94 }}
                              animate={{ opacity:1, scale:1 }}
                              transition={{ ...SP.smooth, delay:i*0.08 }}
                              whileHover={{ borderColor:C.borderMid, color:C.gold,
                                background:C.raised, transition:SP.tick }}
                              whileTap={{ scale:0.97, transition:SP.press }}
                              onClick={()=>sendMessage(s)}
                              style={{ padding:"5px 13px", border:`1px solid ${C.border}`,
                                borderRadius:4, fontSize:"0.67rem", fontFamily:C.mono,
                                color:C.inkDim, background:"transparent", cursor:"pointer",
                                letterSpacing:"0.04em", transition:"all 120ms" }}>
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Loading */}
                  {loading && (
                    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                      transition={SP.smooth}
                      style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
                      <div style={{ width:24, height:24, borderRadius:4, flexShrink:0,
                        background:C.raised, border:`1px solid ${C.borderMid}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:9, color:C.gold, fontFamily:C.display, fontWeight:800 }}>P</div>
                      <div style={{ background:C.surface, border:`1px solid ${C.border}`,
                        borderLeft:`2px solid ${C.gold}`,
                        borderRadius:"8px 8px 8px 3px", padding:"14px 18px" }}>
                        <WaveDots/>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                        exit={{ opacity:0 }} transition={SP.smooth}
                        style={{ background:C.raised, border:`1px solid ${C.border}`,
                          borderRadius:6, padding:"8px 12px", fontSize:11,
                          color:C.negative, fontFamily:C.mono }}>{error}</motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef}/>
                </div>

                {/* Input */}
                <div style={{ padding:"12px 32px 16px", background:C.void,
                  borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                    <motion.div
                      animate={{ borderColor:focused?C.borderMid:C.border }}
                      transition={{ duration:0.15 }}
                      style={{ flex:1, display:"flex", gap:8, alignItems:"flex-end",
                        background:C.surface, border:`1px solid ${C.border}`,
                        borderRadius:7, padding:"10px 10px 10px 16px",
                        position:"relative", overflow:"hidden" }}>
                      {/* Panel scan line */}
                      <PanelScan scanning={scanning}/>

                      <textarea ref={textareaRef}
                        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                        style={{ flex:1, background:"transparent", border:"none",
                          color:C.ink, fontFamily:C.body, fontSize:"0.82rem",
                          resize:"none", lineHeight:1.7, maxHeight:120,
                          outline:"none", padding:"2px 0", caretColor:C.gold }}
                        placeholder="Query the terminal..."
                        value={input} rows={1}
                        onChange={e=>{
                          setInput(e.target.value);
                          e.target.style.height="auto";
                          e.target.style.height=e.target.scrollHeight+"px";
                        }}
                        onKeyDown={e=>{
                          if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}
                        }}/>

                      <motion.button
                        disabled={!input.trim()||loading}
                        whileHover={!input.trim()||loading ? {} : {
                          scale:1.05, borderColor:C.goldDim, transition:SP.tick }}
                        whileTap={!input.trim()||loading ? {} : {
                          scale:0.93, transition:SP.press }}
                        onClick={()=>sendMessage()}
                        style={{ width:36, height:36, borderRadius:6, flexShrink:0,
                          background:!input.trim()||loading ? C.raised : C.gold,
                          border:`1px solid ${!input.trim()||loading?C.border:C.gold}`,
                          cursor:!input.trim()||loading?"not-allowed":"pointer",
                          color:!input.trim()||loading?C.inkDim:C.void,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"1rem", fontWeight:700, transition:"all 150ms" }}>
                        ↑
                      </motion.button>
                    </motion.div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginTop:7 }}>
                    <p style={{ fontSize:"0.58rem", color:C.inkFaint, fontFamily:C.mono,
                      letterSpacing:"0.1em" }}>Enter to send · Shift+Enter for new line</p>
                    <SignalBar active={loading}/>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}