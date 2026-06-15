import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   POLICYPAL — Copper & Void
   Industrial Cosmic. A Victorian brass observatory
   floating in deep space. Copper pipes carry data.
   Gears turn slowly behind glass. The policy document
   arrives by pneumatic tube.
   
   Palette:
   - #0A0500  scorched void — dark brown-black
   - #130A02  furnace surface
   - #1E1005  raised brass panel
   - #2A1608  high panel
   - #FF6B35  electric copper — the ONE hot accent
   - #B8860B  aged brass — secondary warm
   - #8B4513  mahogany — deep mid-tone
   - #F5DEB3  wheat — warm ink (never cold white)
   - #FFD580  pale gold — data highlights
   
   Signature elements:
   1. GEAR CANVAS — two interlocked gears turn slowly
      behind everything. Copper on void. One large,
      one small, meshed. Speed: 1 rotation per 20s.
      GPU canvas, composited layer.
   2. PRESSURE GAUGE LOGO — an SVG arc gauge around
      the P. Needle twitches to a new random "pressure"
      reading each time a message is sent.
   3. STEAM VENT — on message send, particle puffs
      fire upward from the input using canvas.
   
   All motion from previous version kept and re-toned:
   - Message bubbles float continuously after arrival
   - Sidebar items sway independently
   - Welcome card hangs with rotation
   - Doc badge pendulum swings
   - Nebula orbs drift on multi-point paths
   - Send button heartbeat pulse
   - Input breathing ring on focus
   - Dramatic meteor entrances (y:-28)
   - Shooting star on send (now copper-toned)
═══════════════════════════════════════════════════════════ */

const C = {
  void:         "#0A0500",
  furnace:      "#130A02",
  surface:      "#1E1005",
  raised:       "#2A1608",
  high:         "#36200A",
  copper:       "#FF6B35",
  copperBright: "#FF8555",
  copperDeep:   "#D4521A",
  copperGlow:   "rgba(255,107,53,0.32)",
  copperTrace:  "rgba(255,107,53,0.12)",
  copperFaint:  "rgba(255,107,53,0.05)",
  brass:        "#B8860B",
  brassGlow:    "rgba(184,134,11,0.28)",
  brassTrace:   "rgba(184,134,11,0.10)",
  mahogany:     "#8B4513",
  wheat:        "#F5DEB3",
  wheatOff:     "rgba(245,222,179,0.88)",
  wheatMid:     "rgba(245,222,179,0.58)",
  wheatDim:     "rgba(245,222,179,0.32)",
  wheatFaint:   "rgba(245,222,179,0.14)",
  wheatTrace:   "rgba(245,222,179,0.06)",
  gold:         "#FFD580",
  goldGlow:     "rgba(255,213,128,0.22)",
  glass:        "rgba(255,107,53,0.04)",
  glassMid:     "rgba(255,107,53,0.07)",
  glassHigh:    "rgba(255,107,53,0.11)",
  border:       "rgba(184,134,11,0.22)",
  borderMid:    "rgba(184,134,11,0.38)",
  borderHigh:   "rgba(255,107,53,0.55)",
  display:      "'Syne', system-ui, sans-serif",
  mono:         "'JetBrains Mono', monospace",
};

const SP = {
  gravity: { type:"spring", stiffness:240, damping:22, mass:1.6 },
  snap:    { type:"spring", stiffness:500, damping:32 },
  press:   { type:"spring", stiffness:600, damping:36, mass:0.8 },
  orbit:   { duration:20, repeat:Infinity, ease:"linear" },
  sway:    { duration:4, repeat:Infinity, ease:"easeInOut", repeatType:"mirror" },
};

/* ══════════════════════════════════════════════════════════
   GEAR CANVAS — signature element #1
   
   Two interlocked brass gears turn slowly behind everything.
   Large gear: 20s/rotation. Small gear: 8s (gear ratio 2.5).
   Copper-toned teeth, aged brass fill, void background.
   Steam particles drift upward from the gear center.
   On steamVent() call: burst of particles from input.
══════════════════════════════════════════════════════════ */
function GearCanvas({ steamRef }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const particlesRef = useRef([]);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Steam vent trigger
    if (steamRef) {
      steamRef.current = (fx, fy) => {
        for (let i = 0; i < 18; i++) {
          particlesRef.current.push({
            x: fx + (Math.random() - 0.5) * 30,
            y: fy,
            vx: (Math.random() - 0.5) * 2.5,
            vy: -(Math.random() * 4 + 2),
            life: 1,
            r: Math.random() * 6 + 3,
            type: "steam",
          });
        }
        // Shooting streak
        particlesRef.current.push({
          x: fx, y: fy,
          vx: (Math.random() - 0.4) * 6,
          vy: -(Math.random() * 7 + 8),
          life: 1, r: 0, len: 60, type: "streak",
        });
      };
    }

    function drawGear(cx, cy, outerR, innerR, teeth, angle, fillColor, strokeColor, alpha) {
      const toothAngle = (Math.PI * 2) / teeth;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Gear body
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a1 = i * toothAngle - toothAngle * 0.2;
        const a2 = i * toothAngle + toothAngle * 0.2;
        const a3 = i * toothAngle + toothAngle * 0.5 - toothAngle * 0.2;
        const a4 = i * toothAngle + toothAngle * 0.5 + toothAngle * 0.2;
        ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
        ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
        ctx.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
        ctx.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hub circle
      ctx.beginPath();
      ctx.arc(0, 0, innerR * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();

      // Spokes
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * innerR * 0.38, Math.sin(a) * innerR * 0.38);
        ctx.lineTo(Math.cos(a) * innerR * 0.78, Math.sin(a) * innerR * 0.78);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width, H = canvas.height;
      angleRef.current += 0.0015; // ~20s full rotation

      // Large gear — bottom right
      const lg = { cx: W * 0.82, cy: H * 0.78, r: 180, inner: 145, teeth: 24 };
      drawGear(lg.cx, lg.cy, lg.r, lg.inner, lg.teeth, angleRef.current,
        "rgba(26,16,5,0.85)", "rgba(184,134,11,0.30)", 0.9);

      // Small gear — meshed with large, counter-rotating
      // gear ratio = lg.teeth / sg.teeth
      const sgTeeth = 10;
      const ratio = lg.teeth / sgTeeth;
      const meshDist = lg.inner + 65;
      const sgAngle = -angleRef.current * ratio + Math.PI / sgTeeth;
      drawGear(
        lg.cx - meshDist * 0.7, lg.cy - meshDist * 0.6,
        68, 52, sgTeeth, sgAngle,
        "rgba(20,12,3,0.85)", "rgba(255,107,53,0.25)", 0.85
      );

      // Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        if (p.type === "steam") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * p.life);
          grad.addColorStop(0, `rgba(255,107,53,${p.life * 0.35})`);
          grad.addColorStop(0.5, `rgba(184,134,11,${p.life * 0.15})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.fill();
          p.x += p.vx; p.y += p.vy;
          p.vy -= 0.06; // steam rises
          p.vx *= 0.98;
          p.life -= 0.022;
          p.r += 0.4; // expands
        } else if (p.type === "streak") {
          const g = ctx.createLinearGradient(p.x, p.y,
            p.x - p.vx * (p.len / 7), p.y - p.vy * (p.len / 7));
          g.addColorStop(0, `rgba(255,107,53,${p.life})`);
          g.addColorStop(0.5, `rgba(184,134,11,${p.life * 0.45})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * (p.len / 7), p.y - p.vy * (p.len / 7));
          ctx.strokeStyle = g;
          ctx.lineWidth = 2.5 * p.life;
          ctx.stroke();
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.1;
          p.life -= 0.04;
        }
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [steamRef]);

  return (
    <canvas ref={canvasRef}
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:0.9 }}/>
  );
}

/* ══════════════════════════════════════════════════════════
   PRESSURE GAUGE LOGO — signature element #2
   
   An SVG arc gauge (180°) wraps the P logo.
   Needle starts at ~40% pressure.
   On messageCount change: needle springs to a new
   reading. Communicates: the system is under pressure,
   processing your query.
══════════════════════════════════════════════════════════ */
function PressureGauge({ pressure = 40 }) {
  // pressure: 0-100
  const R = 22, cx = 27, cy = 27;
  const circ = Math.PI * R; // half circle
  const dashOffset = circ * (1 - pressure / 100);
  const needleAngle = (pressure / 100) * 180 - 90; // -90 to +90 deg
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = cx + (R - 4) * Math.sin(needleRad);
  const ny = cy - (R - 4) * Math.cos(needleRad);

  return (
    <div style={{ position:"relative", width:54, height:54, flexShrink:0 }}>
      {/* Logo orb */}
      <div style={{ position:"absolute", inset:7, borderRadius:"50%",
        background:`radial-gradient(circle at 38% 32%, ${C.copperBright}45, ${C.copper}22, transparent 70%)`,
        border:`1px solid ${C.copper}55`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 0 20px ${C.copperGlow}, 0 0 48px ${C.copperTrace}, inset 0 1px 0 rgba(255,255,255,0.12)` }}>
        <span style={{ fontSize:15, fontWeight:800, color:C.gold,
          fontFamily:C.display, textShadow:`0 0 12px ${C.brass}` }}>P</span>
      </div>

      {/* Gauge arc */}
      <svg width="54" height="54" viewBox="0 0 54 54"
        style={{ position:"absolute", inset:0, overflow:"visible" }}>
        {/* Track */}
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke={`${C.brass}25`} strokeWidth="2.5"
          strokeLinecap="round"/>
        {/* Fill */}
        <motion.path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke={C.copper} strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type:"spring", stiffness:120, damping:18, mass:1.5 }}
          style={{ filter:`drop-shadow(0 0 4px ${C.copper})` }}/>
        {/* Needle */}
        <motion.line
          x1={cx} y1={cy}
          animate={{ x2: nx, y2: ny }}
          transition={{ type:"spring", stiffness:120, damping:18, mass:1.5 }}
          stroke={C.copper} strokeWidth="1.5" strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 3px ${C.copper})` }}/>
        {/* Center pin */}
        <circle cx={cx} cy={cy} r="2.5" fill={C.brass}
          style={{ filter:`drop-shadow(0 0 4px ${C.brass})` }}/>
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(v => {
          const a = ((v / 100) * 180 - 90) * Math.PI / 180;
          const x1 = cx + (R + 2) * Math.sin(a);
          const y1 = cy - (R + 2) * Math.cos(a);
          const x2 = cx + (R + 5) * Math.sin(a);
          const y2 = cy - (R + 5) * Math.cos(a);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={`${C.brass}50`} strokeWidth="1"/>;
        })}
      </svg>
    </div>
  );
}

/* ── Warm star field particles — just a few, copper-toned ── */
function StarField() {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    starsRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.006 + 0.002,
      drift: (Math.random() - 0.5) * 0.04,
      warm: Math.random() > 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      starsRef.current.forEach(s => {
        s.phase += s.speed;
        s.x += s.drift;
        if (s.x > canvas.width) s.x = 0;
        if (s.x < 0) s.x = canvas.width;
        const t = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.warm
          ? `rgba(255,200,150,${t * 0.7})`
          : `rgba(245,222,179,${t * 0.65})`;
        ctx.fill();
        if (s.r > 1.2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(184,134,11,${t * 0.06})`;
          ctx.fill();
        }
      });
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef}
    style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, opacity:0.8 }}/>;
}

/* ── Nebula orbs — copper/brass toned ── */
function NebulaOrb({ size, top, left, color, duration, delay, opacity=0.45 }) {
  return (
    <motion.div
      animate={{ x:[0,16,-9,7,0], y:[0,-20,-7,-14,0] }}
      transition={{ duration, delay, repeat:Infinity, ease:"easeInOut" }}
      style={{ position:"absolute", width:size, height:size, borderRadius:"50%",
        background:`radial-gradient(circle at 38% 38%, ${color}45, ${color}14 55%, transparent 75%)`,
        top, left, pointerEvents:"none",
        filter:`blur(${size/5}px)`, opacity }}/>
  );
}

/* ── Message renderer ── */
function renderMsg(text) {
  return text.split('\n').map((line, i) => {
    const stripped = line.replace(/^#{1,3}\s/, '');
    if (/^#{1,3}\s/.test(line)) return (
      <p key={i} style={{ fontFamily:C.display, fontWeight:700, color:C.copper,
        margin:"14px 0 6px", fontSize:"0.88rem", letterSpacing:"0.04em" }}>{stripped}</p>
    );
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) return (
      <p key={i} style={{ fontSize:"0.6rem", fontWeight:700, color:C.gold,
        margin:"12px 0 5px", letterSpacing:"0.22em", textTransform:"uppercase",
        fontFamily:C.mono }}>{line.slice(2,-2)}</p>
    );
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const pts = line.slice(2).split(/\*\*(.*?)\*\*/g);
      return (
        <div key={i} style={{ display:"flex", gap:10, margin:"5px 0" }}>
          <span style={{ color:C.copper, flexShrink:0, fontSize:"0.5rem", marginTop:6,
            filter:`drop-shadow(0 0 4px ${C.copper})` }}>◆</span>
          <span style={{ fontSize:"0.8rem", color:C.wheatOff, lineHeight:1.78, fontFamily:C.mono }}>
            {pts.map((p,j) => j%2===1
              ? <strong key={j} style={{ color:C.gold, fontWeight:600 }}>{p}</strong> : p)}
          </span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} style={{ height:7 }}/>;
    if (line.match(/^---+$/)) return (
      <div key={i} style={{ height:1,
        background:`linear-gradient(90deg, ${C.copper}40, ${C.brass}30, transparent)`,
        margin:"10px 0" }}/>
    );
    const pts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin:"4px 0", lineHeight:1.82, fontSize:"0.8rem",
        color:C.wheatMid, fontFamily:C.mono }}>
        {pts.map((p,j) => j%2===1
          ? <strong key={j} style={{ color:C.wheatOff, fontWeight:600 }}>{p}</strong> : p)}
      </p>
    );
  });
}

/* ══════════════════════════════════════════════════════════
   MESSAGE BUBBLE — meteor entrance + continuous float
══════════════════════════════════════════════════════════ */
function MessageBubble({ msg, index }) {
  const isUser = msg.role === "user";
  const floatDelay = (index * 0.35) % 3.5;
  return (
    <motion.div
      initial={{ opacity:0, y:-28, scale:0.93 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={SP.gravity}
      style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start",
        gap:12, alignItems:"flex-end" }}>
      {!isUser && (
        <motion.div
          initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }}
          transition={{ ...SP.gravity, delay:0.12 }}
          style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
            background:`radial-gradient(circle at 38% 32%, ${C.copperBright}48, ${C.copper}20)`,
            border:`1px solid ${C.copper}50`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, color:C.gold, fontFamily:C.display, fontWeight:800,
            boxShadow:`0 0 14px ${C.copperGlow}`, marginBottom:2 }}>P</motion.div>
      )}
      {/* Continuous float after arrival */}
      <motion.div
        animate={{
          y:[0, isUser?-2.5:-3, 0, isUser?-1.5:-2, 0],
          x:[0, isUser?1.5:-1.5, 0.5, isUser?1:-1, 0],
        }}
        transition={{ duration:isUser?6:7, delay:floatDelay,
          repeat:Infinity, ease:"easeInOut" }}>
        <div style={{
          maxWidth:"72%", padding:"14px 18px",
          borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",
          backdropFilter:"blur(20px)",
          ...(isUser?{
            background:`linear-gradient(135deg, ${C.copper}22, ${C.surface}88)`,
            border:`1px solid ${C.borderMid}`,
            boxShadow:`0 10px 36px rgba(255,107,53,0.15), inset 0 1px 0 ${C.wheatTrace}`,
          }:{
            background:C.glass,
            border:`1px solid ${C.border}`,
            borderLeft:`2px solid ${C.copper}`,
            boxShadow:`0 10px 36px rgba(0,0,0,0.45), -6px 0 22px ${C.copperFaint},
              inset 0 1px 0 ${C.wheatTrace}`,
            position:"relative", overflow:"hidden",
          })
        }}>
          {!isUser&&(
            <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
              background:`linear-gradient(90deg, ${C.copper}55, ${C.brass}30, transparent)` }}/>
          )}
          {isUser
            ?<p style={{ fontSize:"0.82rem", color:C.wheat, margin:0,
                lineHeight:1.72, fontFamily:C.mono }}>{msg.content}</p>
            :<div>{renderMsg(msg.content)}</div>
          }
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Wave dots ── */
function WaveDots() {
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      {[0,1,2].map(i=>(
        <motion.div key={i}
          animate={{ y:[0,-6,0], opacity:[0.4,1,0.4] }}
          transition={{ duration:1.5, delay:i*0.22, repeat:Infinity, ease:"easeInOut" }}
          style={{ width:5, height:5, borderRadius:"50%", background:C.copper,
            boxShadow:`0 0 8px ${C.copper}` }}/>
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  "What is the leave entitlement?",
  "How do I raise a grievance?",
  "Remote work guidelines?",
  "Performance review process?",
  "What are the working hours?",
];

const TOPICS = [
  "Leave & Absence","Remote Work","Grievances",
  "Performance","Benefits","Disciplinary","Data Privacy"
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
  const [focused, setFocused]     = useState(false);
  const [pressure, setPressure]   = useState(38);
  const chatEndRef   = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);
  const steamRef     = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function handleFile(file) {
    if (!file) return;
    setDocName(file.name); setMessages([]);
    if (file.type==="application/pdf") {
      const r=new FileReader();
      r.onload=e=>{setDocBase64(e.target.result.split(",")[1]);setDocIsPdf(true);setDocText("__pdf__");};
      r.readAsDataURL(file);
    } else {
      const r=new FileReader();
      r.onload=e=>{setDocText(e.target.result);setDocBase64("");setDocIsPdf(false);};
      r.readAsText(file);
    }
  }

  async function sendMessage(text) {
    const q=(text||input).trim();
    if (!q||!docText||loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height="auto";

    // Steam vent + pressure spike
    if (steamRef.current && textareaRef.current) {
      const rect=textareaRef.current.getBoundingClientRect();
      steamRef.current(rect.left+rect.width/2, rect.top);
    }
    setPressure(60+Math.random()*35);
    setTimeout(()=>setPressure(30+Math.random()*25), 2500);

    const newMessages=[...messages,{role:"user",content:q}];
    setMessages(newMessages);
    setLoading(true); setError("");

    try {
      let body;
      if (docIsPdf) {
        const userMessages=newMessages.map((m,i)=>{
          if(i===0) return{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:docBase64}},
            {type:"text",text:m.content}
          ]};
          return{role:m.role,content:m.content};
        });
        body=JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,
          system:"You are PolicyPal, a precise HR policy assistant. Answer questions based strictly on the uploaded policy document. Be clear and direct.",
          messages:userMessages});
      } else {
        body=JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,
          system:`You are PolicyPal, a precise HR policy assistant. Answer based strictly on the policy document below.\n\nPOLICY DOCUMENT:\n${docText}`,
          messages:newMessages.map(m=>({role:m.role,content:m.content}))});
      }
      const res=await fetch("/api/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json",
          "x-api-key":process.env.REACT_APP_API_KEY,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true",
          "anthropic-beta":"pdfs-2024-09-25"},
        body,
      });
      if(!res.ok){setError(`Error ${res.status}`);setLoading(false);return;}
      const data=await res.json();
      const reply=data.content?.map(i=>i.text||"").join("")||"";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
      setPressure(20+Math.random()*20);
    } catch(e){setError(e.message);}
    setLoading(false);
  }

  const listV={hidden:{},show:{transition:{staggerChildren:0.06,delayChildren:0.1}}};
  const dropItem={hidden:{opacity:0,y:-14,scale:0.93},show:{opacity:1,y:0,scale:1,transition:SP.gravity}};
  const slideItem={hidden:{opacity:0,x:-10},show:{opacity:1,x:0,transition:SP.gravity}};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;overflow:hidden;}
        html{-webkit-font-smoothing:antialiased;}
        body{background:${C.void};}
        ::selection{background:${C.copperTrace};color:${C.copper};}
        ::placeholder{color:${C.wheatFaint};font-family:'JetBrains Mono',monospace;font-size:0.8rem;}
        ::-webkit-scrollbar{width:2px;}
        ::-webkit-scrollbar-thumb{background:${C.brassTrace};border-radius:2px;}
        input,textarea{color:${C.wheat};}
        .chip:hover{background:${C.copperTrace} !important;border-color:${C.borderMid} !important;color:${C.copper} !important;}
        @media(prefers-reduced-motion:reduce){
          *{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}
          canvas{display:none;}
        }
      `}</style>

      {/* GEAR CANVAS + STEAM */}
      <GearCanvas steamRef={steamRef}/>

      {/* WARM STAR FIELD */}
      <StarField/>

      {/* NEBULA ORBS — copper/brass tones */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <NebulaOrb size={480} top="-15%" left="55%"  color={C.copper} duration={18} delay={0}   opacity={0.35}/>
        <NebulaOrb size={380} top="60%"  left="-8%"  color={C.brass}  duration={22} delay={2.5} opacity={0.28}/>
        <NebulaOrb size={300} top="20%"  left="70%"  color={C.brass}  duration={15} delay={1.2} opacity={0.30}/>
        <NebulaOrb size={250} top="72%"  left="42%"  color={C.copper} duration={25} delay={4}   opacity={0.18}/>
        <NebulaOrb size={200} top="5%"   left="10%"  color={C.gold}   duration={19} delay={0.6} opacity={0.14}/>
        <NebulaOrb size={160} top="40%"  left="30%"  color={C.brass}  duration={16} delay={3.2} opacity={0.16}/>
      </div>

      <div style={{ display:"flex", height:"100vh", fontFamily:C.mono,
        overflow:"hidden", position:"relative", zIndex:1 }}>

        {/* ══ SIDEBAR ══ */}
        <motion.div
          initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }}
          transition={{ ...SP.gravity, delay:0.05 }}
          style={{ width:292, flexShrink:0,
            background:`linear-gradient(170deg, ${C.furnace}F2 0%, ${C.surface}E5 55%, ${C.void}F8 100%)`,
            borderRight:`1px solid ${C.border}`, backdropFilter:"blur(32px)",
            display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>

          {/* Top copper glow line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
            background:`linear-gradient(90deg, transparent, ${C.copper}70, ${C.brass}45, transparent)`,
            boxShadow:`0 0 20px ${C.copper}` }}/>
          <div style={{ position:"absolute", top:0, right:0, width:1, height:"100%",
            background:`linear-gradient(180deg, ${C.copper}18, transparent 35%, ${C.brass}12 75%, transparent)`,
            pointerEvents:"none" }}/>

          {/* Brand */}
          <motion.div
            initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
            transition={{ ...SP.gravity, delay:0.12 }}
            style={{ padding:"28px 24px 22px", borderBottom:`1px solid ${C.border}`,
              position:"relative", zIndex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
              <PressureGauge pressure={pressure}/>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:C.wheat, fontFamily:C.display,
                  lineHeight:1, letterSpacing:"0.02em" }}>PolicyPal</div>
                <div style={{ fontSize:8, color:C.wheatDim, letterSpacing:"0.18em",
                  textTransform:"uppercase", fontFamily:C.mono, marginTop:4 }}>
                  by Divyah · Brass Observatory
                </div>
              </div>
            </div>
            <div style={{ height:1,
              background:`linear-gradient(90deg, ${C.copper}45, ${C.brass}28, transparent)`,
              marginBottom:18 }}/>
            <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1.15rem",
              color:C.wheatOff, lineHeight:1.35, margin:"0 0 6px" }}>
              Stop reading policies.
            </p>
            <p style={{ fontFamily:C.display, fontWeight:800, fontSize:"1.15rem",
              color:C.copper, lineHeight:1.35, margin:"0 0 14px",
              textShadow:`0 0 20px ${C.copper}` }}>
              Start asking them.
            </p>
            <p style={{ fontFamily:C.mono, fontSize:"0.68rem", color:C.wheatDim, lineHeight:1.9 }}>
              Your HR team can't answer at 11pm.<br/>
              <span style={{ color:C.gold }}>We can.</span>
            </p>
          </motion.div>

          {/* Sidebar content */}
          <div style={{ padding:"18px 24px", flex:1, display:"flex",
            flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>
            <AnimatePresence mode="wait">
              {!docText ? (
                <motion.div key="topics"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.18 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                    <div style={{ height:1, flex:1, background:`linear-gradient(90deg, ${C.border}, transparent)` }}/>
                    <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase",
                      color:C.wheatDim, fontFamily:C.mono }}>Sectors</span>
                    <div style={{ height:1, flex:1, background:`linear-gradient(90deg, transparent, ${C.border})` }}/>
                  </div>
                  <motion.div variants={listV} initial="hidden" animate="show">
                    {TOPICS.map((t,i)=>(
                      <motion.div key={i} variants={slideItem}
                        animate={{ x:[0,i%2===0?2:-2,0] }}
                        transition={{ ...SP.sway, duration:4+i*0.4, delay:i*0.28 }}
                        style={{ display:"flex", alignItems:"center", gap:10,
                          padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
                        <motion.div
                          animate={{ opacity:[0.5,1,0.5] }}
                          transition={{ duration:2.5+i*0.3, repeat:Infinity, ease:"easeInOut", delay:i*0.4 }}
                          style={{ width:3, height:3, borderRadius:"50%", background:C.copper,
                            boxShadow:`0 0 5px ${C.copper}`, flexShrink:0 }}/>
                        <span style={{ fontSize:"0.7rem", color:C.wheatDim, fontFamily:C.mono }}>{t}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="loaded"
                  initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  transition={{ duration:0.18 }}
                  style={{ display:"flex", flexDirection:"column", height:"100%" }}>
                  {/* Doc badge — pendulum sway */}
                  <motion.div
                    initial={{ opacity:0, y:-16, scale:0.93 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    transition={SP.gravity}
                    style={{ marginBottom:12 }}>
                    <motion.div
                      animate={{ rotate:[-0.8,0.8,-0.8], y:[0,-1,0] }}
                      transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }}
                      style={{ padding:"12px 14px", background:C.glass,
                        border:`1px solid ${C.border}`, borderRadius:10,
                        position:"relative", overflow:"hidden", backdropFilter:"blur(12px)" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2,
                        background:`linear-gradient(180deg,${C.copper},${C.brass})`,
                        borderRadius:"10px 0 0 10px" }}/>
                      <div style={{ fontSize:8, color:C.copper, letterSpacing:"0.14em",
                        textTransform:"uppercase", fontFamily:C.mono, marginBottom:4 }}>
                        Tube received
                      </div>
                      <div style={{ fontSize:"0.7rem", color:C.wheatOff, fontFamily:C.mono }}>
                        {docName.slice(0,26)}{docName.length>26?"…":""}
                      </div>
                    </motion.div>
                  </motion.div>

                  <motion.button
                    whileTap={{ scale:0.97, transition:SP.press }}
                    onClick={()=>{setDocText("");setDocName("");setDocBase64("");setDocIsPdf(false);setMessages([]);setPressure(38);}}
                    style={{ background:"transparent", border:`1px solid ${C.border}`,
                      borderRadius:6, color:C.wheatDim, fontSize:8, padding:"7px 14px",
                      fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase",
                      alignSelf:"flex-start", marginBottom:20, display:"block",
                      transition:"border-color 150ms ease, color 150ms ease" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.copper;e.currentTarget.style.color=C.copper;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.wheatDim;}}>
                    ← Eject
                  </motion.button>

                  <div style={{ marginTop:"auto" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, ${C.border}, transparent)` }}/>
                      <span style={{ fontSize:8, letterSpacing:"0.2em", textTransform:"uppercase",
                        color:C.wheatDim, fontFamily:C.mono }}>Quick queries</span>
                      <div style={{ height:1, flex:1, background:`linear-gradient(90deg, transparent, ${C.border})` }}/>
                    </div>
                    <motion.div variants={listV} initial="hidden" animate="show">
                      {SUGGESTIONS.map((s,i)=>(
                        <motion.button key={i} variants={dropItem} className="chip"
                          whileTap={{ scale:0.97, transition:SP.press }}
                          onClick={()=>sendMessage(s)}
                          style={{ display:"block", width:"100%", background:C.glass,
                            border:`1px solid ${C.border}`, borderRadius:8,
                            padding:"9px 12px", fontSize:"0.67rem", color:C.wheatDim,
                            textAlign:"left", fontFamily:C.mono, marginBottom:5,
                            lineHeight:1.4, backdropFilter:"blur(8px)",
                            transition:"background 150ms, border-color 150ms, color 150ms" }}>
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ height:1,
            background:`linear-gradient(90deg, transparent, ${C.brass}50, ${C.copper}22, transparent)` }}/>
        </motion.div>

        {/* ══ MAIN PANEL ══ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          overflow:"hidden", position:"relative", zIndex:1 }}>
          <AnimatePresence mode="wait">
            {!docText ? (
              /* ── UPLOAD ── */
              <motion.div key="upload"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.2 }}
                style={{ flex:1, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", padding:"60px 48px" }}>

                <motion.div
                  initial={{ opacity:0, y:-32, scale:0.93 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ ...SP.gravity, delay:0.1 }}
                  style={{ textAlign:"center", marginBottom:52 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    gap:16, marginBottom:22 }}>
                    <motion.div animate={{ scaleX:[1,1.4,1] }}
                      transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut" }}
                      style={{ height:1, width:52, background:C.copper, opacity:0.55,
                        boxShadow:`0 0 8px ${C.copper}`, originX:1 }}/>
                    <span style={{ fontSize:9, letterSpacing:"0.28em", textTransform:"uppercase",
                      color:C.copper, fontFamily:C.mono, fontWeight:600,
                      textShadow:`0 0 14px ${C.copper}` }}>Brass Observatory</span>
                    <motion.div animate={{ scaleX:[1,1.4,1] }}
                      transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut", delay:0.5 }}
                      style={{ height:1, width:52, background:C.copper, opacity:0.55,
                        boxShadow:`0 0 8px ${C.copper}`, originX:0 }}/>
                  </div>
                  <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:56,
                    color:C.wheat, margin:"0 0 4px", letterSpacing:"-2px", lineHeight:0.95 }}>
                    Upload your policy.
                  </h1>
                  <h1 style={{ fontFamily:C.display, fontWeight:800, fontSize:56,
                    color:C.copper, margin:"0 0 24px", letterSpacing:"-2px", lineHeight:0.95,
                    textShadow:`0 0 36px ${C.copper}` }}>
                    Ask anything.
                  </h1>
                  <p style={{ fontSize:14, color:C.wheatDim, fontFamily:C.mono, lineHeight:1.85,
                    maxWidth:400, margin:"0 auto" }}>
                    Your HR team can't answer at 11pm.<br/>
                    <span style={{ color:C.gold }}>We transmit across any hour.</span>
                  </p>
                </motion.div>

                {/* Drop zone */}
                <motion.div
                  initial={{ opacity:0, y:-20, scale:0.95 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  transition={{ ...SP.gravity, delay:0.22 }}
                  style={{ width:"100%", maxWidth:520, position:"relative",
                    borderRadius:20, padding:"56px 48px", textAlign:"center",
                    cursor:"pointer", overflow:"visible",
                    background:dragOver?C.glassMid:C.glass,
                    backdropFilter:"blur(24px)",
                    border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                    boxShadow:dragOver
                      ?`0 0 56px ${C.copperGlow}, 0 0 110px ${C.copperTrace}, inset 0 1px 0 ${C.wheatTrace}`
                      :`0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 ${C.wheatTrace}`,
                    transition:"background 200ms, border-color 200ms, box-shadow 200ms" }}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                  onClick={()=>fileInputRef.current?.click()}>

                  {/* Orbital rings */}
                  <motion.div animate={{ rotate:360 }} transition={{ duration:25, repeat:Infinity, ease:"linear" }}
                    style={{ position:"absolute", inset:-22, pointerEvents:"none" }}>
                    <svg width="100%" height="100%" viewBox="0 0 564 284"
                      style={{ position:"absolute", inset:0, opacity:dragOver?0.42:0.13 }}>
                      <ellipse cx="282" cy="142" rx="258" ry="60"
                        fill="none" stroke={C.copper} strokeWidth="0.8" strokeDasharray="4 14"/>
                    </svg>
                  </motion.div>
                  <motion.div animate={{ rotate:-360 }} transition={{ duration:38, repeat:Infinity, ease:"linear" }}
                    style={{ position:"absolute", inset:-34, pointerEvents:"none" }}>
                    <svg width="100%" height="100%" viewBox="0 0 588 308"
                      style={{ position:"absolute", inset:0, opacity:dragOver?0.28:0.07 }}>
                      <ellipse cx="294" cy="154" rx="275" ry="72"
                        fill="none" stroke={C.brass} strokeWidth="0.8" strokeDasharray="2 18"/>
                    </svg>
                  </motion.div>

                  <motion.div animate={{ y:dragOver?-5:0 }} transition={SP.snap}
                    style={{ width:64, height:64, borderRadius:16, background:C.glass,
                      backdropFilter:"blur(12px)",
                      border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      margin:"0 auto 22px",
                      boxShadow:dragOver?`0 0 32px ${C.copperGlow}`:`0 0 12px rgba(0,0,0,0.35)`,
                      transition:"box-shadow 200ms, border-color 200ms" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke={dragOver?C.copper:C.wheatDim} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ filter:dragOver?`drop-shadow(0 0 8px ${C.copper})`:"none",
                        transition:"all 200ms ease" }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </motion.div>

                  <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1.2rem",
                    color:dragOver?C.copper:C.wheatOff, marginBottom:8,
                    textShadow:dragOver?`0 0 18px ${C.copper}`:"none",
                    transition:"color 200ms, text-shadow 200ms" }}>
                    {dragOver?"Release to transmit":"Insert pneumatic tube"}
                  </p>
                  <p style={{ fontFamily:C.mono, fontSize:"0.7rem", color:C.wheatDim,
                    marginBottom:28, lineHeight:1.75 }}>
                    PDF or TXT · drag & drop or click to browse
                  </p>

                  <motion.div
                    whileHover={{ scale:1.03, transition:SP.snap }}
                    whileTap={{ scale:0.97, transition:SP.press }}
                    style={{ display:"inline-flex", alignItems:"center", gap:8,
                      background:dragOver
                        ?`linear-gradient(135deg,${C.copper},${C.brass})`
                        :`linear-gradient(135deg,${C.copper}16,${C.brass}12)`,
                      color:dragOver?C.void:C.copper, borderRadius:10,
                      padding:"13px 32px", fontSize:"0.7rem", fontFamily:C.mono,
                      letterSpacing:"0.16em", textTransform:"uppercase",
                      border:`1px solid ${dragOver?C.copper:C.borderMid}`,
                      boxShadow:dragOver?`0 0 28px ${C.copperGlow}`:`0 0 14px ${C.copperTrace}`,
                      fontWeight:600, transition:"all 200ms ease" }}>
                    Send by Tube
                  </motion.div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf"
                    style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])}/>
                </motion.div>
              </motion.div>

            ) : (
              /* ── CHAT ── */
              <motion.div key="chat"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.2 }}
                style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                {/* Header */}
                <motion.div
                  initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                  transition={{ ...SP.gravity, delay:0.06 }}
                  style={{ padding:"12px 36px", background:`rgba(10,5,0,0.92)`,
                    backdropFilter:"blur(28px)", borderBottom:`1px solid ${C.border}`,
                    display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                  <motion.div
                    animate={{ scale:[1,1.4,1], opacity:[1,0.4,1] }}
                    transition={{ duration:2.2, repeat:Infinity, ease:"easeInOut" }}
                    style={{ width:7, height:7, borderRadius:"50%", background:C.copper,
                      boxShadow:`0 0 12px ${C.copper}` }}/>
                  <span style={{ fontSize:"0.7rem", color:C.wheatDim, fontFamily:C.mono,
                    letterSpacing:"0.06em" }}>
                    Pressurised · <span style={{ color:C.wheatOff }}>{docName}</span>
                  </span>
                  <div style={{ marginLeft:"auto", fontSize:8, color:C.wheatFaint,
                    fontFamily:C.mono, letterSpacing:"0.14em", textTransform:"uppercase" }}>
                    {messages.filter(m=>m.role==="user").length} transmissions
                  </div>
                </motion.div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:"auto", padding:"28px 40px",
                  display:"flex", flexDirection:"column", gap:20 }}>

                  {/* Welcome — hanging with rotation sway */}
                  {messages.length===0 && (
                    <motion.div
                      initial={{ opacity:0, y:-22, scale:0.93 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={SP.gravity}>
                      <motion.div
                        animate={{ rotate:[-0.6,0.6,-0.6], y:[0,-2,0] }}
                        transition={{ duration:6, repeat:Infinity, ease:"easeInOut" }}
                        style={{ border:`1px solid ${C.border}`, borderRadius:18,
                          padding:"24px 26px", background:C.glass,
                          backdropFilter:"blur(20px)", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
                          background:`linear-gradient(90deg,${C.copper}60,${C.brass}40,transparent)` }}/>
                        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:2,
                          background:`linear-gradient(180deg,${C.copper},${C.brass})` }}/>
                        {/* Gear decoration */}
                        <div style={{ position:"absolute", right:16, top:12, opacity:0.12 }}>
                          <svg width="52" height="52" viewBox="0 0 52 52">
                            <circle cx="26" cy="26" r="18" fill="none"
                              stroke={C.brass} strokeWidth="1.5" strokeDasharray="3 6"/>
                            <circle cx="26" cy="26" r="8" fill="none"
                              stroke={C.copper} strokeWidth="1"/>
                            <circle cx="26" cy="26" r="3" fill={C.brass}/>
                          </svg>
                        </div>
                        <p style={{ fontFamily:C.display, fontWeight:700, fontSize:"1rem",
                          color:C.wheat, marginBottom:8 }}>
                          Transmission received. I'm PolicyPal.
                        </p>
                        <p style={{ fontFamily:C.mono, fontSize:"0.75rem", color:C.wheatDim,
                          lineHeight:1.85, marginBottom:16 }}>
                          Document indexed and pressurised. Send any query —{" "}
                          <span style={{ color:C.gold }}>I answer from your policy, not from memory.</span>
                        </p>
                        <motion.div
                          variants={listV} initial="hidden" animate="show"
                          style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {SUGGESTIONS.map((s,i)=>(
                            <motion.button key={i} variants={dropItem} className="chip"
                              whileTap={{ scale:0.96, transition:SP.press }}
                              onClick={()=>sendMessage(s)}
                              style={{ padding:"5px 12px", border:`1px solid ${C.border}`,
                                borderRadius:20, fontSize:"0.66rem", fontFamily:C.mono,
                                color:C.wheatDim, background:C.glass, cursor:"pointer",
                                backdropFilter:"blur(8px)",
                                transition:"background 150ms, border-color 150ms, color 150ms" }}>
                              {s}
                            </motion.button>
                          ))}
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}

                  {messages.map((m,i)=><MessageBubble key={i} msg={m} index={i}/>)}

                  {loading&&(
                    <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
                      transition={SP.gravity}
                      style={{ display:"flex", gap:12, alignItems:"flex-end" }}>
                      <motion.div animate={{ opacity:[1,0.4,1] }}
                        transition={{ duration:1.5, repeat:Infinity, ease:"easeInOut" }}
                        style={{ width:28, height:28, borderRadius:"50%", flexShrink:0,
                          background:`radial-gradient(circle at 38% 32%, ${C.copperBright}48, ${C.copper}20)`,
                          border:`1px solid ${C.copper}50`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10, color:C.gold, fontFamily:C.display, fontWeight:800 }}>P</motion.div>
                      <div style={{ background:C.glass, backdropFilter:"blur(16px)",
                        border:`1px solid ${C.border}`, borderLeft:`2px solid ${C.copper}`,
                        borderRadius:"16px 16px 16px 4px", padding:"16px 22px" }}>
                        <WaveDots/>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {error&&(
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0 }} transition={SP.gravity}
                        style={{ background:C.glass, border:`1px solid ${C.brass}50`,
                          borderRadius:10, padding:"10px 14px", fontSize:11,
                          color:C.gold, fontFamily:C.mono, backdropFilter:"blur(12px)" }}>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef}/>
                </div>

                {/* Input */}
                <div style={{ padding:"14px 40px 22px",
                  background:`rgba(10,5,0,0.93)`, backdropFilter:"blur(28px)",
                  borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-end",
                    position:"relative" }}>

                    {/* Breathing copper ring */}
                    <AnimatePresence>
                      {focused&&(
                        <motion.div
                          initial={{ opacity:0, scale:0.97 }}
                          animate={{ opacity:[0.16,0.48,0.16], scale:1 }}
                          exit={{ opacity:0, scale:0.97 }}
                          transition={{
                            opacity:{ duration:2.8, repeat:Infinity, ease:"easeInOut" },
                            scale:SP.snap,
                          }}
                          style={{ position:"absolute", inset:-3, borderRadius:19,
                            border:`1px solid ${C.copper}`,
                            boxShadow:`0 0 22px ${C.copperGlow}`, pointerEvents:"none", zIndex:0 }}/>
                      )}
                    </AnimatePresence>

                    <motion.div
                      animate={{
                        borderColor:focused?C.borderHigh:C.border,
                        boxShadow:focused
                          ?`0 0 0 1px ${C.copperTrace}, 0 0 30px ${C.copperTrace}`
                          :`0 8px 32px rgba(0,0,0,0.55)`,
                      }}
                      transition={{ duration:0.2 }}
                      style={{ flex:1, display:"flex", gap:12, alignItems:"flex-end",
                        background:C.glassMid, backdropFilter:"blur(16px)",
                        border:`1px solid ${C.border}`, borderRadius:16,
                        padding:"12px 12px 12px 20px", position:"relative", zIndex:1 }}>
                      <textarea ref={textareaRef}
                        onFocus={()=>setFocused(true)}
                        onBlur={()=>setFocused(false)}
                        style={{ flex:1, background:"transparent", border:"none",
                          color:C.wheat, fontFamily:C.mono, fontSize:"0.82rem",
                          resize:"none", lineHeight:1.7, maxHeight:120,
                          outline:"none", padding:"2px 0", caretColor:C.copper }}
                        placeholder="Send your query by tube..."
                        value={input} rows={1}
                        onChange={e=>{
                          setInput(e.target.value);
                          e.target.style.height="auto";
                          e.target.style.height=e.target.scrollHeight+"px";
                        }}
                        onKeyDown={e=>{
                          if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}
                        }}/>

                      {/* Send button — heartbeat */}
                      <motion.button
                        disabled={!input.trim()||loading}
                        whileHover={!input.trim()||loading?{}:{ scale:1.08, transition:SP.snap }}
                        whileTap={!input.trim()||loading?{}:{ scale:0.9, transition:SP.press }}
                        animate={input.trim()&&!loading?{
                          scale:[1,1.06,1,1.03,1],
                          boxShadow:[
                            `0 0 10px ${C.copperGlow}`,
                            `0 0 26px ${C.copperGlow}`,
                            `0 0 10px ${C.copperGlow}`,
                            `0 0 18px ${C.copperGlow}`,
                            `0 0 10px ${C.copperGlow}`,
                          ],
                        }:{ scale:1, boxShadow:"none" }}
                        transition={{ duration:2.4, repeat:Infinity, ease:"easeInOut" }}
                        onClick={()=>sendMessage()}
                        style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                          background:!input.trim()||loading
                            ?C.glass
                            :`linear-gradient(135deg,${C.copper},${C.brass})`,
                          border:`1px solid ${!input.trim()||loading?C.border:C.copper}`,
                          cursor:!input.trim()||loading?"not-allowed":"pointer",
                          color:!input.trim()||loading?C.wheatDim:C.void,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:"1rem", fontWeight:800, fontFamily:C.display }}>
                        ↑
                      </motion.button>
                    </motion.div>
                  </div>
                  <p style={{ fontSize:"0.6rem", color:C.wheatFaint, textAlign:"center",
                    marginTop:10, fontFamily:C.mono, letterSpacing:"0.1em" }}>
                    Enter to transmit · Shift+Enter for new line
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}