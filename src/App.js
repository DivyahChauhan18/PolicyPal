import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   POLICYPAL — Platinum Terminal v3
   
   New features in this version:
   - 7 distinct tabs: Ask / Summary / Gaps / Rate / Plain English / Compare / Export
   - Policy gap detector
   - Policy rating (completeness, clarity, legal coverage)
   - Plain English clause rewriter
   - Compare mode (upload second doc / labour law PDF)
   - Export chat as formatted HTML/PDF
   
   Same aesthetic: Platinum Terminal, Swiss watch motion,
   sweep hand, ticker numbers, layout morph, panel scan.
═══════════════════════════════════════════════════════════ */

const C = {
  void:"#0E0E10",surface:"#1C1C20",raised:"#252530",high:"#2E2E3A",panel:"#1A1A22",
  gold:"#C8A96E",goldDim:"rgba(200,169,110,0.45)",goldFaint:"rgba(200,169,110,0.12)",
  goldTrace:"rgba(200,169,110,0.06)",steel:"#8892A4",steelDim:"rgba(136,146,164,0.45)",
  steelFaint:"rgba(136,146,164,0.12)",border:"rgba(58,58,74,0.9)",
  borderMid:"rgba(136,146,164,0.25)",borderHigh:"rgba(200,169,110,0.45)",
  ink:"#F8F8F8",inkOff:"rgba(248,248,248,0.88)",inkMid:"rgba(248,248,248,0.58)",
  inkDim:"rgba(248,248,248,0.32)",inkFaint:"rgba(248,248,248,0.12)",inkTrace:"rgba(248,248,248,0.05)",
  positive:"#4CAF76",positivePale:"rgba(76,175,118,0.10)",
  negative:"#E05555",negativePale:"rgba(224,85,85,0.10)",
  warn:"#C8A96E",warnPale:"rgba(200,169,110,0.10)",
  display:"'Syne', system-ui, sans-serif",
  body:"'Inter', system-ui, sans-serif",
  mono:"'JetBrains Mono', monospace",
};

const SP = {
  mech:  { type:"spring", stiffness:600, damping:40, mass:0.8 },
  smooth:{ type:"spring", stiffness:280, damping:32, mass:1 },
  press: { type:"spring", stiffness:600, damping:36, mass:0.8 },
  tick:  { type:"spring", stiffness:800, damping:45 },
  number:{ type:"spring", stiffness:120, damping:20, mass:1.4 },
};

const TABS = [
  { id:"ask",     label:"Ask",          icon:"?" },
  { id:"summary", label:"Summary",      icon:"≡" },
  { id:"gaps",    label:"Gaps",         icon:"△" },
  { id:"rate",    label:"Rate",         icon:"◉" },
  { id:"plain",   label:"Plain English",icon:"A" },
  { id:"compare", label:"Compare",      icon:"⇌" },
  { id:"export",  label:"Export",       icon:"↓" },
];

/* ── SweepHand ── */
function SweepHand({ loading }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const angleRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = 48; canvas.width = SIZE; canvas.height = SIZE;
    const cx = SIZE/2, cy = SIZE/2, r = SIZE/2-4;
    const draw = () => {
      ctx.clearRect(0,0,SIZE,SIZE);
      const speed = loading ? 0.04 : 0.008;
      angleRef.current += speed;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.strokeStyle="rgba(58,58,74,0.9)"; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,r-6,0,Math.PI*2);
      ctx.strokeStyle="rgba(58,58,74,0.6)"; ctx.lineWidth=0.5; ctx.stroke();
      for(let i=0;i<12;i++){
        const a=(i/12)*Math.PI*2;
        const x1=cx+(r-2)*Math.cos(a),y1=cy+(r-2)*Math.sin(a);
        const x2=cx+(r-(i%3===0?6:4))*Math.cos(a),y2=cy+(r-(i%3===0?6:4))*Math.sin(a);
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
        ctx.strokeStyle=i%3===0?"rgba(200,169,110,0.6)":"rgba(58,58,74,0.9)";
        ctx.lineWidth=i%3===0?1.5:0.75;ctx.stroke();
      }
      const hx=cx+(r-8)*Math.cos(angleRef.current-Math.PI/2);
      const hy=cy+(r-8)*Math.sin(angleRef.current-Math.PI/2);
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(hx,hy);
      ctx.strokeStyle=loading?C.gold:"rgba(200,169,110,0.75)";
      ctx.lineWidth=loading?1.5:1;ctx.lineCap="round";ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy,2,0,Math.PI*2);ctx.fillStyle=C.gold;ctx.fill();
      frameRef.current=requestAnimationFrame(draw);
    };
    frameRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(frameRef.current);
  },[loading]);
  return <canvas ref={canvasRef} style={{width:48,height:48}}/>;
}

/* ── TickerNumber ── */
function TickerNumber({ value, style={} }) {
  const mv=useMotionValue(0);
  const spring=useSpring(mv,{stiffness:80,damping:18,mass:1.6});
  const [display,setDisplay]=useState(0);
  useEffect(()=>{mv.set(value);},[value,mv]);
  useEffect(()=>{const u=spring.on("change",v=>setDisplay(Math.round(v)));return u;},[spring]);
  return <span style={style}>{display}</span>;
}

/* ── LiveTimestamp ── */
function LiveTimestamp({ createdAt }) {
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{
    const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-createdAt)/1000)),1000);
    return()=>clearInterval(iv);
  },[createdAt]);
  const fmt=s=>s<60?`${s}s ago`:s<3600?`${Math.floor(s/60)}m ago`:`${Math.floor(s/3600)}h ago`;
  return <span style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.08em"}}>{fmt(elapsed)}</span>;
}

/* ── SignalBar ── */
function SignalBar({ active }) {
  const [fill,setFill]=useState(0);
  const dirRef=useRef(1);
  useEffect(()=>{
    const speed=active?4:0.8;
    const iv=setInterval(()=>{
      setFill(f=>{const next=f+dirRef.current*speed;if(next>=100){dirRef.current=-1;return 100;}if(next<=0){dirRef.current=1;return 0;}return next;});
    },30);
    return()=>clearInterval(iv);
  },[active]);
  return(
    <div style={{width:80,height:2,background:C.border,borderRadius:1,overflow:"hidden"}}>
      <motion.div animate={{width:`${fill}%`}} transition={{duration:0.03}}
        style={{height:"100%",background:active?C.gold:C.steel,borderRadius:1,opacity:active?1:0.5}}/>
    </div>
  );
}

/* ── PanelScan ── */
function PanelScan({ scanning }) {
  return(
    <AnimatePresence>
      {scanning&&(
        <motion.div initial={{scaleX:0,opacity:1}} animate={{scaleX:1,opacity:0}} exit={{opacity:0}}
          transition={{duration:0.32,ease:[0.4,0,0.6,1]}}
          style={{position:"absolute",bottom:0,left:0,right:0,height:1,background:C.gold,
            originX:0,transformBox:"fill-box",pointerEvents:"none",zIndex:10}}/>
      )}
    </AnimatePresence>
  );
}

/* ── Typewriter ── */
function Typewriter({ text, onComplete, searchTerm="" }) {
  const [displayed,setDisplayed]=useState("");
  const [done,setDone]=useState(false);
  const [cursorOn,setCursorOn]=useState(true);
  const indexRef=useRef(0);
  useEffect(()=>{
    indexRef.current=0;setDisplayed("");setDone(false);
    const iv=setInterval(()=>{
      if(indexRef.current<text.length){const c=Math.floor(Math.random()*3)+1;indexRef.current=Math.min(indexRef.current+c,text.length);setDisplayed(text.slice(0,indexRef.current));}
      else{clearInterval(iv);setDone(true);onComplete&&onComplete();}
    },12);
    return()=>clearInterval(iv);
  },[text,onComplete]);
  useEffect(()=>{if(done)return;const b=setInterval(()=>setCursorOn(v=>!v),530);return()=>clearInterval(b);},[done]);
  return(
    <span style={{fontFamily:C.body,fontSize:"0.82rem",color:C.inkMid,lineHeight:1.8}}>
      <HighlightedText text={displayed} searchTerm={searchTerm}/>
      {!done&&<span style={{display:"inline-block",width:2,height:"1em",background:C.gold,marginLeft:1,verticalAlign:"text-bottom",opacity:cursorOn?1:0}}/>}
    </span>
  );
}

/* ── HighlightedText ── */
function HighlightedText({ text, searchTerm, style={} }) {
  if(!searchTerm||!text) return <span style={style}>{text}</span>;
  const parts=text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi"));
  return(
    <span style={style}>
      {parts.map((p,i)=>p.toLowerCase()===searchTerm.toLowerCase()
        ?<mark key={i} style={{background:"rgba(200,169,110,0.22)",color:C.gold,borderRadius:2,padding:"0 1px"}}>{p}</mark>
        :p)}
    </span>
  );
}

/* ── CopyBtn ── */
function CopyBtn({ text }) {
  const [copied,setCopied]=useState(false);
  return(
    <motion.button initial={{opacity:0}} whileHover={{opacity:1}} whileTap={{scale:0.95,transition:SP.press}}
      onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
      style={{position:"absolute",top:8,right:8,background:"transparent",
        border:`1px solid ${copied?C.goldDim:C.border}`,borderRadius:4,padding:"3px 8px",
        cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:C.mono,fontSize:9,
        color:copied?C.gold:C.inkDim,letterSpacing:"0.08em",transition:"all 150ms"}}>
      {copied?"✓ Copied":"Copy"}
    </motion.button>
  );
}

/* ── WaveDots ── */
function WaveDots() {
  return(
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      {[0,1,2].map(i=>(
        <motion.div key={i} animate={{scaleY:[1,1.8,1],opacity:[0.5,1,0.5]}}
          transition={{duration:0.9,delay:i*0.15,repeat:Infinity,ease:"easeInOut"}}
          style={{width:2,height:12,background:C.gold,borderRadius:1}}/>
      ))}
    </div>
  );
}

/* ── renderMsg ── */
function renderMsg(text, searchTerm="") {
  return text.split('\n').map((line,i)=>{
    if(/^#{1,3}\s/.test(line)) return(
      <p key={i} style={{fontFamily:C.display,fontWeight:700,color:C.gold,margin:"14px 0 5px",fontSize:"0.88rem",letterSpacing:"0.04em"}}>
        <HighlightedText text={line.replace(/^#{1,3}\s/,"")} searchTerm={searchTerm}/>
      </p>
    );
    if(line.startsWith('- ')||line.startsWith('* ')){
      const pts=line.slice(2).split(/\*\*(.*?)\*\*/g);
      return(
        <div key={i} style={{display:"flex",gap:10,margin:"4px 0"}}>
          <span style={{color:C.gold,flexShrink:0,fontSize:10,marginTop:4,opacity:0.7}}>▸</span>
          <span style={{fontSize:"0.8rem",color:C.inkOff,lineHeight:1.75,fontFamily:C.body}}>
            {pts.map((p,j)=>j%2===1?<strong key={j} style={{color:C.ink,fontWeight:600}}>{p}</strong>:<HighlightedText key={j} text={p} searchTerm={searchTerm}/>)}
          </span>
        </div>
      );
    }
    if(!line.trim()) return <div key={i} style={{height:6}}/>;
    if(line.match(/^---+$/)) return <div key={i} style={{height:1,background:C.border,margin:"8px 0"}}/>;
    const pts=line.split(/\*\*(.*?)\*\*/g);
    return(
      <p key={i} style={{margin:"3px 0",lineHeight:1.8,fontSize:"0.8rem",color:C.inkMid,fontFamily:C.body}}>
        {pts.map((p,j)=>j%2===1?<strong key={j} style={{color:C.inkOff,fontWeight:600}}>{p}</strong>:<HighlightedText key={j} text={p} searchTerm={searchTerm}/>)}
      </p>
    );
  });
}

/* ── ScoreBar ── */
function ScoreBar({ score, label }) {
  const col = score>=75?C.positive:score>=50?C.warn:C.negative;
  return(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:C.mono,fontSize:10,color:col,fontWeight:600}}>{score}/100</span>
      </div>
      <div style={{height:2,background:C.border,borderRadius:1,overflow:"hidden"}}>
        <motion.div initial={{scaleX:0}} animate={{scaleX:score/100}} transition={{...SP.smooth,delay:0.1}}
          style={{height:"100%",background:col,borderRadius:1,originX:0,transformBox:"fill-box"}}/>
      </div>
    </div>
  );
}

const SUGGESTIONS=["What is the leave entitlement?","How do I raise a grievance?","Remote work guidelines?","Performance review process?","What are the working hours?"];
const TOPICS=["Leave & Absence","Remote Work","Grievances","Performance","Benefits","Disciplinary","Data Privacy"];

const POLICY_SECTIONS = [
  "Leave & Absence Policy",
  "Grievance Procedure",
  "Code of Conduct",
  "Performance Review Process",
  "Remote Work Policy",
  "Termination & Exit Process",
  "Anti-Harassment Policy",
  "Data Privacy & Confidentiality",
  "Disciplinary Procedure",
  "Benefits & Compensation",
  "Working Hours & Overtime",
  "Onboarding Procedure",
];

export default function PolicyPal() {
  const [docText,setDocText]=useState("");
  const [docName,setDocName]=useState("");
  const [docBase64,setDocBase64]=useState("");
  const [docIsPdf,setDocIsPdf]=useState(false);
  const [docLoaded,setDocLoaded]=useState(false);
  // Chat
  const [messages,setMessages]=useState([]);
  const [msgTimes,setMsgTimes]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [focused,setFocused]=useState(false);
  const [scanning,setScanning]=useState(false);
  const [searchTerm,setSearchTerm]=useState("");
  const [searchFocused,setSearchFocused]=useState(false);
  const [typingDone,setTypingDone]=useState({});
  const [followUps,setFollowUps]=useState({});
  // Tabs
  const [activeTab,setActiveTab]=useState("ask");
  // Summary
  const [docSummary,setDocSummary]=useState(null);
  const [summaryLoading,setSummaryLoading]=useState(false);
  // Gaps
  const [gapResult,setGapResult]=useState(null);
  const [gapLoading,setGapLoading]=useState(false);
  // Rate
  const [rateResult,setRateResult]=useState(null);
  const [rateLoading,setRateLoading]=useState(false);
  // Plain English
  const [clauseInput,setClauseInput]=useState("");
  const [clauseOutput,setClauseOutput]=useState("");
  const [clauseLoading,setClauseLoading]=useState(false);
  // Compare
  const [doc2Text,setDoc2Text]=useState("");
  const [doc2Name,setDoc2Name]=useState("");
  const [doc2Base64,setDoc2Base64]=useState("");
  const [doc2IsPdf,setDoc2IsPdf]=useState(false);
  const [compareResult,setCompareResult]=useState(null);
  const [compareLoading,setCompareLoading]=useState(false);

  const chatEndRef=useRef(null);
  const fileInputRef=useRef(null);
  const file2InputRef=useRef(null);
  const textareaRef=useRef(null);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  const headers = {
    "Content-Type":"application/json",
    "x-api-key":process.env.REACT_APP_API_KEY,
    "anthropic-version":"2023-06-01",
    "anthropic-dangerous-direct-browser-access":"true",
    "anthropic-beta":"pdfs-2024-09-25",
  };

  async function callClaude(system, userContent, maxTokens=800) {
    const res = await fetch("/api/v1/messages", {
      method:"POST", headers,
      body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:maxTokens,
        system, messages:[{ role:"user", content:userContent }] }),
    });
    const data = await res.json();
    return data.content?.map(i=>i.text||"").join("")||"";
  }

  async function callClaudeWithDoc(system, textPrompt, base64, isPdf, maxTokens=1000) {
    let messages;
    if (isPdf) {
      messages = [{ role:"user", content:[
        { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 }},
        { type:"text", text:textPrompt }
      ]}];
    } else {
      messages = [{ role:"user", content:`${textPrompt}\n\nDOCUMENT:\n${base64.slice(0,5000)}` }];
    }
    const res = await fetch("/api/v1/messages", {
      method:"POST", headers,
      body:JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:maxTokens, system, messages }),
    });
    const data = await res.json();
    return data.content?.map(i=>i.text||"").join("")||"";
  }

  function parseJSON(raw) {
    try {
      const stripped=raw.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
      const match=stripped.match(/[[{][\s\S]*[\]}]/);
      if(match) return JSON.parse(match[0]);
    } catch {}
    return null;
  }

  async function handleFile(file, setters) {
    if(!file) return;
    const { setName, setText, setBase64, setIsPdf } = setters;
    setName(file.name);
    if(file.type==="application/pdf") {
      const r=new FileReader();
      r.onload=e=>{const b=e.target.result.split(",")[1];setBase64(b);setIsPdf(true);setText("__pdf__");};
      r.readAsDataURL(file);
    } else {
      const r=new FileReader();
      r.onload=e=>{setText(e.target.result);setBase64(e.target.result);setIsPdf(false);};
      r.readAsText(file);
    }
  }

  async function loadPrimaryDoc(file) {
    if(!file) return;
    setDocName(file.name);
    setMessages([]); setMsgTimes([]); setDocSummary(null);
    setTypingDone({}); setFollowUps({});
    setGapResult(null); setRateResult(null); setCompareResult(null);
    setClauseOutput(""); setDoc2Text(""); setDoc2Name("");
    if(file.type==="application/pdf") {
      const r=new FileReader();
      r.onload=async e=>{
        const b=e.target.result.split(",")[1];
        setDocBase64(b); setDocIsPdf(true); setDocText("__pdf__"); setDocLoaded(true);
        await generateSummary("__pdf__",true,b);
      };
      r.readAsDataURL(file);
    } else {
      const r=new FileReader();
      r.onload=async e=>{
        const t=e.target.result;
        setDocText(t); setDocBase64(t); setDocIsPdf(false); setDocLoaded(true);
        await generateSummary(t,false,t);
      };
      r.readAsText(file);
    }
  }

  async function generateSummary(text,isPdf,base64) {
    setSummaryLoading(true);
    try {
      const raw=await callClaudeWithDoc(
        "Return ONLY JSON: {summary: string (2 sentences), topics: string[] (4-5 items)}. No markdown.",
        "Summarise this HR policy document. JSON only.",
        base64, isPdf, 400
      );
      const parsed=parseJSON(raw);
      if(parsed) setDocSummary(parsed);
    } catch {}
    setSummaryLoading(false);
  }

  async function runGapDetector() {
    if(!docLoaded||gapLoading) return;
    setGapLoading(true); setGapResult(null);
    try {
      const sections=POLICY_SECTIONS.join(", ");
      const raw=await callClaudeWithDoc(
        `You are an HR policy expert. Analyse this policy document and return ONLY JSON. No markdown.
Return: {"present": string[], "missing": string[], "partial": string[], "overallCompleteness": number (0-100), "recommendation": string}
Check for these sections: ${sections}
present = clearly covered, missing = not mentioned at all, partial = mentioned but incomplete`,
        "Analyse this policy for completeness. Return JSON only.",
        docBase64, docIsPdf, 800
      );
      const parsed=parseJSON(raw);
      if(parsed) setGapResult(parsed);
    } catch {}
    setGapLoading(false);
  }

  async function runRating() {
    if(!docLoaded||rateLoading) return;
    setRateLoading(true); setRateResult(null);
    try {
      const raw=await callClaudeWithDoc(
        `You are an HR policy expert. Rate this policy document and return ONLY JSON. No markdown.
Return: {"completeness": number (0-100), "clarity": number (0-100), "legalCoverage": number (0-100), "overall": number (0-100), "verdict": string (1 sentence), "strengths": string[] (3 items), "improvements": string[] (3 items)}`,
        "Rate this HR policy document. Return JSON only.",
        docBase64, docIsPdf, 800
      );
      const parsed=parseJSON(raw);
      if(parsed) setRateResult(parsed);
    } catch {}
    setRateLoading(false);
  }

  async function runPlainEnglish() {
    if(!clauseInput.trim()||clauseLoading) return;
    setClauseLoading(true); setClauseOutput("");
    try {
      const text=await callClaude(
        "You are an HR plain language expert. Rewrite the given clause in simple, clear English that any employee can understand. Keep it accurate but accessible. Return only the rewritten text, nothing else.",
        `Rewrite this clause in plain English:\n\n${clauseInput}`,
        400
      );
      setClauseOutput(text);
    } catch {}
    setClauseLoading(false);
  }

  async function runCompare() {
    if(!docLoaded||!doc2Text||compareLoading) return;
    setCompareLoading(true); setCompareResult(null);
    try {
      let system = `You are an HR policy expert. Compare two documents and return ONLY JSON. No markdown.
Return: {"conflicts": string[], "gaps": string[], "alignments": string[], "recommendation": string, "riskLevel": "low"|"medium"|"high", "summary": string}
conflicts = where the company policy contradicts the reference document
gaps = what the reference document requires that the company policy doesn't address
alignments = where they match well`;
      let userContent;
      if(docIsPdf && doc2IsPdf) {
        userContent=[
          {type:"document",source:{type:"base64",media_type:"application/pdf",data:docBase64}},
          {type:"document",source:{type:"base64",media_type:"application/pdf",data:doc2Base64}},
          {type:"text",text:"Compare Document 1 (company policy) against Document 2 (reference/labour law). Return JSON only."}
        ];
      } else if(docIsPdf) {
        userContent=[
          {type:"document",source:{type:"base64",media_type:"application/pdf",data:docBase64}},
          {type:"text",text:`Compare this company policy (Document 1) against this reference document (Document 2):\n\n${doc2Text.slice(0,4000)}\n\nReturn JSON only.`}
        ];
      } else {
        userContent=`Compare these two documents and return JSON only.\n\nDOCUMENT 1 (company policy):\n${docText.slice(0,3000)}\n\nDOCUMENT 2 (reference/labour law):\n${doc2Text.slice(0,3000)}`;
      }
      const res=await fetch("/api/v1/messages",{method:"POST",headers,
        body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,system,
          messages:[{role:"user",content:userContent}]})});
      const data=await res.json();
      const raw=data.content?.map(i=>i.text||"").join("")||"";
      const parsed=parseJSON(raw);
      if(parsed) setCompareResult(parsed);
    } catch {}
    setCompareLoading(false);
  }

  async function generateFollowUps(answer,msgIndex) {
    try {
      const raw=await callClaude(
        "Return ONLY a JSON array of 3 short follow-up questions (max 8 words). No markdown.",
        `Suggest 3 follow-ups:\n\n${answer.slice(0,500)}`
      );
      const parsed=parseJSON(raw);
      if(parsed) setFollowUps(p=>({...p,[msgIndex]:parsed}));
    } catch {}
  }

  async function sendMessage(text) {
    const q=(text||input).trim();
    if(!q||!docText||loading) return;
    setInput("");
    if(textareaRef.current) textareaRef.current.style.height="auto";
    setScanning(true);
    await new Promise(r=>setTimeout(r,320));
    setScanning(false);
    const now=Date.now();
    const newMessages=[...messages,{role:"user",content:q}];
    const newTimes=[...msgTimes,now];
    setMessages(newMessages); setMsgTimes(newTimes);
    setLoading(true); setError("");
    try {
      let body;
      if(docIsPdf) {
        const um=newMessages.map((m,i)=>{
          if(i===0) return{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:docBase64}},{type:"text",text:m.content}]};
          return{role:m.role,content:m.content};
        });
        body=JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,system:"You are PolicyPal, a precise HR policy assistant. Answer based strictly on the uploaded document. Be clear and direct.",messages:um});
      } else {
        body=JSON.stringify({model:"claude-sonnet-4-5",max_tokens:1000,system:`You are PolicyPal, a precise HR policy assistant.\n\nPOLICY DOCUMENT:\n${docText}`,messages:newMessages.map(m=>({role:m.role,content:m.content}))});
      }
      const res=await fetch("/api/v1/messages",{method:"POST",headers,body});
      if(!res.ok){setError(`Error ${res.status}`);setLoading(false);return;}
      const data=await res.json();
      const reply=data.content?.map(i=>i.text||"").join("")||"";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
      setMsgTimes(prev=>[...prev,Date.now()]);
    } catch(e){setError(e.message);}
    setLoading(false);
  }

  const onTypingComplete=useCallback((idx,content)=>{
    setTypingDone(p=>({...p,[idx]:true}));
    generateFollowUps(content,idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function exportChat() {
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>PolicyPal Export — ${docName}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:48px auto;color:#1a1a1a;line-height:1.8}h1{font-size:24px;margin-bottom:8px}p.meta{color:#666;font-size:13px;margin-bottom:32px}hr{border:none;border-top:1px solid #ddd;margin:24px 0}.role{font-family:monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;margin-bottom:6px}.content{font-size:14px;white-space:pre-wrap}</style></head><body><h1>PolicyPal — ${docName}</h1><p class="meta">Exported ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>${messages.map(m=>`<div><div class="role">${m.role}</div><div class="content">${m.content.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div></div><hr/>`).join("")}</body></html>`;
    const win=window.open("","_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(()=>win.print(),500);
  }

  const queryCount=messages.filter(m=>m.role==="user").length;
  const listV={hidden:{},show:{transition:{staggerChildren:0.04,delayChildren:0.06}}};
  const itemV={hidden:{opacity:0,y:-8},show:{opacity:1,y:0,transition:SP.smooth}};

  const riskColor=(level)=>level==="low"?C.positive:level==="high"?C.negative:C.warn;

  return(
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
        @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}canvas{display:none;}}
      `}</style>

      <div style={{display:"flex",height:"100vh",fontFamily:C.body,overflow:"hidden",background:C.void}}>

        {/* ══ SIDEBAR ══ */}
        <motion.div animate={{width:docLoaded?320:280}} transition={SP.smooth}
          style={{flexShrink:0,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          <div style={{height:2,background:`linear-gradient(90deg,${C.gold},rgba(200,169,110,0.3),transparent)`}}/>

          {/* Brand */}
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{...SP.smooth,delay:0.05}}
            style={{padding:"20px 22px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:C.ink,fontFamily:C.display,letterSpacing:"0.04em",lineHeight:1}}>PolicyPal</div>
              <div style={{fontSize:8,color:C.steel,letterSpacing:"0.18em",textTransform:"uppercase",fontFamily:C.mono,marginTop:4}}>Platinum Terminal · by Divyah</div>
            </div>
            <SweepHand loading={loading||gapLoading||rateLoading||clauseLoading||compareLoading}/>
          </motion.div>

          {/* Stats */}
          <div style={{padding:"12px 22px",borderBottom:`1px solid ${C.border}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[{label:"Queries",value:queryCount},{label:"Loaded",value:docLoaded?1:0},{label:"Tabs",value:TABS.length}].map(({label,value})=>(
              <div key={label}>
                <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
                <TickerNumber value={value} style={{fontFamily:C.mono,fontSize:18,fontWeight:600,color:C.ink,letterSpacing:"-0.5px",lineHeight:1}}/>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div style={{padding:"16px 22px 14px",borderBottom:`1px solid ${C.border}`}}>
            <p style={{fontFamily:C.display,fontWeight:700,fontSize:"1rem",color:C.inkOff,lineHeight:1.4,margin:"0 0 4px"}}>Stop reading policies.</p>
            <p style={{fontFamily:C.display,fontWeight:700,fontSize:"1rem",color:C.gold,lineHeight:1.4,margin:"0 0 10px"}}>Start asking them.</p>
            <SignalBar active={loading||gapLoading||rateLoading||clauseLoading||compareLoading}/>
          </div>

          {/* Sidebar content */}
          <div style={{flex:1,padding:"14px 22px",display:"flex",flexDirection:"column",overflow:"hidden auto"}}>
            <AnimatePresence mode="wait">
              {!docLoaded ? (
                <motion.div key="topics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}>
                  <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:12}}>Policy Sectors</div>
                  <motion.div variants={listV} initial="hidden" animate="show">
                    {TOPICS.map((t,i)=>(
                      <motion.div key={i} variants={itemV} whileHover={{x:3,transition:SP.tick}}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"default"}}>
                        <div style={{width:4,height:4,borderRadius:1,background:C.steel,flexShrink:0,opacity:0.6}}/>
                        <span style={{fontSize:"0.72rem",color:C.inkDim,fontFamily:C.body,transition:"color 150ms"}}>{t}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key="loaded" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
                  style={{display:"flex",flexDirection:"column"}}>
                  {/* Doc badge */}
                  <motion.div initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={SP.smooth}
                    style={{padding:"10px 14px",background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,marginBottom:10,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Active Document</div>
                    <div style={{fontSize:"0.72rem",color:C.inkOff,fontFamily:C.mono,marginBottom:4}}>{docName.slice(0,28)}{docName.length>28?"…":""}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:C.positive,flexShrink:0}}/>
                      <span style={{fontFamily:C.mono,fontSize:8,color:C.positive,letterSpacing:"0.08em"}}>INDEXED</span>
                    </div>
                  </motion.div>

                  <motion.button whileHover={{borderColor:C.borderMid,color:C.ink,x:1,transition:SP.tick}} whileTap={{scale:0.97,transition:SP.press}}
                    onClick={()=>{setDocText("");setDocName("");setDocBase64("");setDocIsPdf(false);setMessages([]);setMsgTimes([]);setDocSummary(null);setTypingDone({});setFollowUps({});setDocLoaded(false);setGapResult(null);setRateResult(null);setCompareResult(null);setClauseOutput("");setDoc2Text("");setDoc2Name("");setActiveTab("ask");}}
                    style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,color:C.inkDim,fontSize:8,padding:"6px 12px",fontFamily:C.mono,letterSpacing:"0.14em",textTransform:"uppercase",alignSelf:"flex-start",marginBottom:14,display:"block",cursor:"pointer",transition:"all 150ms"}}>
                    ← Unload
                  </motion.button>

                  {/* Quick queries */}
                  <div style={{marginTop:"auto"}}>
                    <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10}}>Quick Queries</div>
                    <motion.div variants={listV} initial="hidden" animate="show">
                      {SUGGESTIONS.map((s,i)=>(
                        <motion.button key={i} variants={itemV}
                          whileHover={{borderColor:C.borderMid,color:C.ink,background:C.raised,x:2,transition:SP.tick}}
                          whileTap={{scale:0.98,transition:SP.press}}
                          onClick={()=>{setActiveTab("ask");sendMessage(s);}}
                          style={{display:"block",width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:5,padding:"8px 12px",fontSize:"0.67rem",color:C.inkDim,textAlign:"left",fontFamily:C.body,marginBottom:5,lineHeight:1.4,cursor:"pointer",transition:"all 120ms"}}>
                          {s}
                        </motion.button>
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{height:1,background:C.border}}/>
        </motion.div>

        {/* ══ MAIN PANEL ══ */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <AnimatePresence mode="wait">
            {!docLoaded ? (
              /* ── UPLOAD ── */
              <motion.div key="upload" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}
                style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 48px"}}>
                <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{...SP.smooth,delay:0.08}}
                  style={{textAlign:"center",marginBottom:48,maxWidth:560}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:1.8,repeat:Infinity,ease:"easeInOut"}}
                        style={{width:5,height:5,borderRadius:"50%",background:C.positive}}/>
                      <span style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase"}}>System Online</span>
                    </div>
                    <div style={{width:1,height:12,background:C.border}}/>
                    <span style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase"}}>PolicyPal Terminal v3</span>
                    <div style={{width:1,height:12,background:C.border}}/>
                    <SignalBar active={false}/>
                  </div>
                  <h1 style={{fontFamily:C.display,fontWeight:800,fontSize:52,color:C.ink,margin:"0 0 4px",letterSpacing:"-1.5px",lineHeight:0.95}}>Upload your policy.</h1>
                  <h1 style={{fontFamily:C.display,fontWeight:800,fontSize:52,color:C.gold,margin:"0 0 20px",letterSpacing:"-1.5px",lineHeight:0.95}}>Ask anything.</h1>
                  <p style={{fontSize:14,color:C.inkDim,fontFamily:C.body,lineHeight:1.8,margin:"0 auto",maxWidth:360}}>
                    Your HR team can't answer at 11pm.<br/>
                    <span style={{color:C.inkMid}}>The terminal operates around the clock.</span>
                  </p>
                </motion.div>

                {/* Drop zone */}
                <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{...SP.smooth,delay:0.16}}
                  whileHover={{borderColor:C.borderMid,transition:SP.tick}}
                  style={{width:"100%",maxWidth:520,borderRadius:8,padding:"48px 44px",textAlign:"center",cursor:"pointer",
                    background:dragOver?C.raised:C.surface,border:`1px solid ${dragOver?C.borderHigh:C.border}`,
                    position:"relative",overflow:"hidden",transition:"background 150ms,border-color 150ms"}}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);loadPrimaryDoc(e.dataTransfer.files[0]);}}
                  onClick={()=>fileInputRef.current?.click()}>
                  {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i)=>(
                    <div key={i} style={{position:"absolute",top:r===0?12:"auto",bottom:r===1?12:"auto",left:c===0?12:"auto",right:c===1?12:"auto",width:12,height:12,
                      borderTop:r===0?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",borderLeft:c===0?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",
                      borderBottom:r===1?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",borderRight:c===1?`1px solid ${dragOver?C.gold:C.borderMid}`:"none",transition:"border-color 150ms"}}/>
                  ))}
                  <motion.div animate={{y:dragOver?-4:0}} transition={SP.mech}
                    style={{width:52,height:52,borderRadius:6,background:C.raised,border:`1px solid ${dragOver?C.borderHigh:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",transition:"border-color 150ms"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragOver?C.gold:C.steel} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:"stroke 150ms"}}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </motion.div>
                  <p style={{fontFamily:C.display,fontWeight:700,fontSize:"1.1rem",color:dragOver?C.gold:C.inkOff,marginBottom:6,transition:"color 150ms"}}>{dragOver?"Release to load":"Load document"}</p>
                  <p style={{fontFamily:C.mono,fontSize:"0.68rem",color:C.inkDim,marginBottom:22,lineHeight:1.7}}>PDF or TXT · drag & drop or click to browse</p>
                  <motion.div whileHover={{scale:1.02,borderColor:C.borderMid,transition:SP.tick}} whileTap={{scale:0.97,transition:SP.press}}
                    style={{display:"inline-flex",alignItems:"center",gap:8,background:"transparent",color:dragOver?C.gold:C.inkMid,borderRadius:5,padding:"10px 24px",fontSize:"0.7rem",fontFamily:C.mono,letterSpacing:"0.14em",textTransform:"uppercase",border:`1px solid ${dragOver?C.borderHigh:C.border}`,fontWeight:500,transition:"all 150ms",cursor:"pointer"}}>
                    Browse Files
                  </motion.div>
                  <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{display:"none"}} onChange={e=>loadPrimaryDoc(e.target.files[0])}/>
                </motion.div>
              </motion.div>

            ) : (
              /* ── TABBED INTERFACE ══ */
              <motion.div key="tabs" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.18}}
                style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

                {/* Tab bar */}
                <div style={{background:C.void,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                  {/* Doc name row */}
                  <div style={{padding:"8px 28px",display:"flex",alignItems:"center",gap:14,borderBottom:`1px solid ${C.border}`}}>
                    <motion.div animate={{opacity:[1,0.4,1],scale:[1,1.15,1]}} transition={{duration:2,repeat:Infinity,ease:"easeInOut"}}
                      style={{width:6,height:6,borderRadius:"50%",background:C.positive,flexShrink:0}}/>
                    <span style={{fontSize:"0.7rem",color:C.inkOff,fontFamily:C.mono,letterSpacing:"0.06em"}}>{docName}</span>
                    {/* Pressure bar */}
                    <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
                      <span style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>Load</span>
                      <div style={{width:60,height:3,background:C.border,borderRadius:2,overflow:"hidden"}}>
                        <motion.div animate={{width:`${Math.min(queryCount*15,100)}%`}} transition={SP.smooth}
                          style={{height:"100%",background:C.gold,borderRadius:2}}/>
                      </div>
                    </div>
                    <TickerNumber value={queryCount} style={{fontFamily:C.mono,fontSize:11,color:C.gold}}/>&nbsp;
                    <span style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>queries</span>
                  </div>

                  {/* Tabs */}
                  <div style={{display:"flex",padding:"0 28px",gap:0,overflowX:"auto"}}>
                    {TABS.map(tab=>(
                      <motion.button key={tab.id}
                        whileTap={{scale:0.97,transition:SP.press}}
                        onClick={()=>{
                          setActiveTab(tab.id);
                          if(tab.id==="gaps"&&!gapResult&&!gapLoading) runGapDetector();
                          if(tab.id==="rate"&&!rateResult&&!rateLoading) runRating();
                        }}
                        style={{padding:"10px 16px",background:"transparent",border:"none",
                          borderBottom:`2px solid ${activeTab===tab.id?C.gold:"transparent"}`,
                          fontFamily:C.mono,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
                          color:activeTab===tab.id?C.gold:C.inkDim,cursor:"pointer",
                          whiteSpace:"nowrap",transition:"color 150ms,border-color 150ms",flexShrink:0}}>
                        <span style={{marginRight:6,opacity:0.7}}>{tab.icon}</span>{tab.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                  <AnimatePresence mode="wait">

                    {/* ── ASK ── */}
                    {activeTab==="ask"&&(
                      <motion.div key="ask" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

                        {/* Search bar */}
                        <div style={{padding:"8px 28px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                          <motion.div animate={{borderColor:searchFocused?C.borderMid:C.border}} transition={{duration:0.15}}
                            style={{flex:1,display:"flex",alignItems:"center",gap:8,background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,padding:"5px 11px",maxWidth:320,marginLeft:"auto"}}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <circle cx="5" cy="5" r="3.5" stroke={searchFocused?C.gold:C.steel} strokeWidth="1"/>
                              <path d="M8 8l2.5 2.5" stroke={searchFocused?C.gold:C.steel} strokeWidth="1" strokeLinecap="round"/>
                            </svg>
                            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                              onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)}
                              placeholder="Search conversation..."
                              style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:C.mono,fontSize:"0.7rem",color:C.ink,caretColor:C.gold}}/>
                            {searchTerm&&<button onClick={()=>setSearchTerm("")} style={{background:"transparent",border:"none",color:C.inkDim,cursor:"pointer",fontSize:10,padding:0}}>✕</button>}
                          </motion.div>
                        </div>

                        {/* Messages */}
                        <div style={{flex:1,overflowY:"auto",padding:"20px 32px",display:"flex",flexDirection:"column",gap:14}}>
                          {messages.length===0&&(
                            <motion.div initial={{opacity:0,y:-14,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={SP.smooth}
                              style={{border:`1px solid ${C.border}`,borderRadius:8,padding:"20px 22px",background:C.surface,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,${C.gold},rgba(200,169,110,0.3),transparent)`}}/>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                              <p style={{fontFamily:C.display,fontWeight:700,fontSize:"0.95rem",color:C.ink,marginBottom:7}}>Terminal ready. Document indexed.</p>
                              <p style={{fontFamily:C.body,fontSize:"0.75rem",color:C.inkDim,lineHeight:1.8,marginBottom:14}}>Ask me anything — I respond from the source. Or use the tabs above to analyse your policy.</p>
                              <motion.div variants={listV} initial="hidden" animate="show" style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {SUGGESTIONS.map((s,i)=>(
                                  <motion.button key={i} variants={itemV}
                                    whileHover={{borderColor:C.borderMid,color:C.gold,background:C.raised,transition:SP.tick}}
                                    whileTap={{scale:0.97,transition:SP.press}}
                                    onClick={()=>sendMessage(s)}
                                    style={{padding:"5px 12px",border:`1px solid ${C.border}`,borderRadius:4,fontSize:"0.65rem",fontFamily:C.mono,color:C.inkDim,background:"transparent",cursor:"pointer",letterSpacing:"0.04em",transition:"all 120ms"}}>
                                    {s}
                                  </motion.button>
                                ))}
                              </motion.div>
                            </motion.div>
                          )}

                          {messages.map((m,i)=>{
                            const isUser=m.role==="user";
                            const isLastAssistant=!isUser&&i===messages.length-1&&!typingDone[i];
                            return(
                              <motion.div key={i} initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={SP.smooth}
                                style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",gap:10,alignItems:"flex-end"}}>
                                {!isUser&&(<div style={{width:24,height:24,borderRadius:4,flexShrink:0,background:C.raised,border:`1px solid ${C.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.gold,fontFamily:C.display,fontWeight:800,marginBottom:2}}>P</div>)}
                                <motion.div whileHover={{y:-2,borderColor:C.borderMid,transition:SP.tick}}
                                  style={{maxWidth:"74%",padding:"12px 15px",borderRadius:isUser?"8px 8px 3px 8px":"8px 8px 8px 3px",position:"relative",transition:"border-color 150ms",
                                    ...(isUser?{background:C.raised,border:`1px solid ${C.borderMid}`}
                                      :{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.gold}`})}}>
                                  {!isUser&&<div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,rgba(200,169,110,0.4),transparent)`}}/>}
                                  {isUser?(
                                    <p style={{fontSize:"0.82rem",color:C.ink,margin:0,lineHeight:1.72,fontFamily:C.body}}><HighlightedText text={m.content} searchTerm={searchTerm}/></p>
                                  ):isLastAssistant?(
                                    <Typewriter text={m.content} searchTerm={searchTerm} onComplete={()=>onTypingComplete(i,m.content)}/>
                                  ):(
                                    <div>{renderMsg(m.content,searchTerm)}</div>
                                  )}
                                  {msgTimes[i]&&<div style={{marginTop:6,display:"flex",justifyContent:isUser?"flex-end":"flex-start"}}><LiveTimestamp createdAt={msgTimes[i]}/></div>}
                                  {!isUser&&typingDone[i]&&<CopyBtn text={m.content}/>}
                                </motion.div>
                              </motion.div>
                            );
                          })}

                          {Object.entries(followUps).map(([idx,suggestions])=>{
                            if(parseInt(idx)!==messages.length-1) return null;
                            return(
                              <motion.div key={`fu-${idx}`} initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{...SP.smooth,delay:0.2}} style={{paddingLeft:34}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:7}}>Continue querying</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                  {suggestions.map((s,i)=>(
                                    <motion.button key={i} initial={{opacity:0,scale:0.94}} animate={{opacity:1,scale:1}} transition={{...SP.smooth,delay:i*0.08}}
                                      whileHover={{borderColor:C.borderMid,color:C.gold,background:C.raised,transition:SP.tick}}
                                      whileTap={{scale:0.97,transition:SP.press}}
                                      onClick={()=>sendMessage(s)}
                                      style={{padding:"5px 13px",border:`1px solid ${C.border}`,borderRadius:4,fontSize:"0.67rem",fontFamily:C.mono,color:C.inkDim,background:"transparent",cursor:"pointer",letterSpacing:"0.04em",transition:"all 120ms"}}>
                                      {s}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}

                          {loading&&(
                            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={SP.smooth} style={{display:"flex",gap:10,alignItems:"flex-end"}}>
                              <div style={{width:24,height:24,borderRadius:4,flexShrink:0,background:C.raised,border:`1px solid ${C.borderMid}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.gold,fontFamily:C.display,fontWeight:800}}>P</div>
                              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.gold}`,borderRadius:"8px 8px 8px 3px",padding:"14px 18px"}}><WaveDots/></div>
                            </motion.div>
                          )}
                          <AnimatePresence>
                            {error&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={SP.smooth}
                              style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:11,color:C.negative,fontFamily:C.mono}}>{error}</motion.div>)}
                          </AnimatePresence>
                          <div ref={chatEndRef}/>
                        </div>

                        {/* Input */}
                        <div style={{padding:"12px 32px 16px",background:C.void,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
                          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                            <motion.div animate={{borderColor:focused?C.borderMid:C.border}} transition={{duration:0.15}}
                              style={{flex:1,display:"flex",gap:8,alignItems:"flex-end",background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 10px 10px 16px",position:"relative",overflow:"hidden"}}>
                              <PanelScan scanning={scanning}/>
                              <textarea ref={textareaRef} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
                                style={{flex:1,background:"transparent",border:"none",color:C.ink,fontFamily:C.body,fontSize:"0.82rem",resize:"none",lineHeight:1.7,maxHeight:120,outline:"none",padding:"2px 0",caretColor:C.gold}}
                                placeholder="Query the terminal..." value={input} rows={1}
                                onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}
                                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}/>
                              <motion.button disabled={!input.trim()||loading}
                                whileHover={!input.trim()||loading?{}:{scale:1.05,borderColor:C.goldDim,transition:SP.tick}}
                                whileTap={!input.trim()||loading?{}:{scale:0.93,transition:SP.press}}
                                onClick={()=>sendMessage()}
                                style={{width:36,height:36,borderRadius:6,flexShrink:0,background:!input.trim()||loading?C.raised:C.gold,border:`1px solid ${!input.trim()||loading?C.border:C.gold}`,cursor:!input.trim()||loading?"not-allowed":"pointer",color:!input.trim()||loading?C.inkDim:C.void,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",fontWeight:700,transition:"all 150ms"}}>↑</motion.button>
                            </motion.div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:7}}>
                            <p style={{fontSize:"0.58rem",color:C.inkFaint,fontFamily:C.mono,letterSpacing:"0.1em"}}>Enter to send · Shift+Enter for new line</p>
                            <SignalBar active={loading}/>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── SUMMARY ── */}
                    {activeTab==="summary"&&(
                      <motion.div key="summary" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Document Brief</div>
                        {summaryLoading&&(
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                              style={{width:12,height:12,border:`1.5px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%"}}/>
                            <span style={{fontFamily:C.mono,fontSize:11,color:C.gold,letterSpacing:"0.1em"}}>Reading document…</span>
                          </div>
                        )}
                        {docSummary&&!summaryLoading&&(
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={SP.smooth}>
                            <div style={{padding:"20px 24px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,marginBottom:16,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                              <p style={{fontFamily:C.body,fontSize:14,color:C.inkOff,lineHeight:1.8}}>{docSummary.summary}</p>
                            </div>
                            <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>Topics Detected</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                              {(docSummary.topics||[]).map((t,i)=>(
                                <motion.span key={i} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{...SP.tick,delay:i*0.06}}
                                  style={{fontSize:"0.65rem",fontFamily:C.mono,padding:"4px 12px",borderRadius:4,background:C.goldTrace,border:`1px solid ${C.border}`,color:C.gold,letterSpacing:"0.08em"}}>
                                  {t}
                                </motion.span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* ── GAPS ── */}
                    {activeTab==="gaps"&&(
                      <motion.div key="gaps" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Policy Gap Detector</div>
                        {gapLoading&&(
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                              style={{width:12,height:12,border:`1.5px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%"}}/>
                            <span style={{fontFamily:C.mono,fontSize:11,color:C.gold,letterSpacing:"0.1em"}}>Scanning for gaps…</span>
                          </div>
                        )}
                        {gapResult&&!gapLoading&&(
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={SP.smooth} style={{display:"flex",flexDirection:"column",gap:12}}>
                            {/* Completeness score */}
                            <div style={{padding:"18px 22px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:gapResult.overallCompleteness>=75?C.positive:gapResult.overallCompleteness>=50?C.warn:C.negative}}/>
                              <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Overall Completeness</div>
                              <ScoreBar score={gapResult.overallCompleteness} label="Completeness"/>
                              <p style={{fontFamily:C.body,fontSize:13,color:C.inkMid,lineHeight:1.7,marginTop:10}}>{gapResult.recommendation}</p>
                            </div>

                            {/* Missing */}
                            {gapResult.missing?.length>0&&(
                              <div style={{padding:"16px 20px",background:C.surface,border:`1px solid rgba(224,85,85,0.25)`,borderRadius:8}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.negative,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Missing Sections ({gapResult.missing.length})</div>
                                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                  {gapResult.missing.map((s,i)=>(
                                    <motion.div key={i} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{...SP.smooth,delay:i*0.04}}
                                      style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.negativePale,borderRadius:4}}>
                                      <div style={{width:4,height:4,borderRadius:"50%",background:C.negative,flexShrink:0}}/>
                                      <span style={{fontFamily:C.body,fontSize:12,color:C.inkOff}}>{s}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Partial */}
                            {gapResult.partial?.length>0&&(
                              <div style={{padding:"16px 20px",background:C.surface,border:`1px solid rgba(200,169,110,0.25)`,borderRadius:8}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.warn,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Incomplete Sections ({gapResult.partial.length})</div>
                                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                  {gapResult.partial.map((s,i)=>(
                                    <motion.div key={i} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{...SP.smooth,delay:i*0.04}}
                                      style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.warnPale,borderRadius:4}}>
                                      <div style={{width:4,height:4,borderRadius:"50%",background:C.warn,flexShrink:0}}/>
                                      <span style={{fontFamily:C.body,fontSize:12,color:C.inkOff}}>{s}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Present */}
                            {gapResult.present?.length>0&&(
                              <div style={{padding:"16px 20px",background:C.surface,border:`1px solid rgba(76,175,118,0.25)`,borderRadius:8}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.positive,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Present ({gapResult.present.length})</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                  {gapResult.present.map((s,i)=>(
                                    <span key={i} style={{fontSize:"0.65rem",fontFamily:C.mono,padding:"3px 10px",borderRadius:3,background:C.positivePale,border:`1px solid rgba(76,175,118,0.25)`,color:C.positive}}>✓ {s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                        {!gapLoading&&!gapResult&&(
                          <motion.button whileTap={{scale:0.97,transition:SP.press}} onClick={runGapDetector}
                            style={{padding:"12px 28px",background:C.gold,border:"none",borderRadius:6,color:C.void,fontFamily:C.mono,fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                            Run Gap Detector →
                          </motion.button>
                        )}
                      </motion.div>
                    )}

                    {/* ── RATE ── */}
                    {activeTab==="rate"&&(
                      <motion.div key="rate" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>Policy Rating</div>
                        {rateLoading&&(
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                              style={{width:12,height:12,border:`1.5px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%"}}/>
                            <span style={{fontFamily:C.mono,fontSize:11,color:C.gold,letterSpacing:"0.1em"}}>Rating policy…</span>
                          </div>
                        )}
                        {rateResult&&!rateLoading&&(
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={SP.smooth} style={{display:"flex",flexDirection:"column",gap:12}}>
                            {/* Overall score */}
                            <div style={{padding:"22px 26px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:rateResult.overall>=75?C.positive:rateResult.overall>=50?C.warn:C.negative}}/>
                              <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:8}}>
                                <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
                                  style={{fontFamily:C.display,fontSize:52,fontWeight:700,color:rateResult.overall>=75?C.positive:rateResult.overall>=50?C.warn:C.negative,lineHeight:1,letterSpacing:"-2px"}}>
                                  {rateResult.overall}
                                </motion.span>
                                <span style={{fontFamily:C.mono,fontSize:13,color:C.inkDim,marginBottom:8}}>/100</span>
                              </div>
                              <p style={{fontFamily:C.body,fontSize:13,color:C.inkMid,lineHeight:1.7}}>{rateResult.verdict}</p>
                            </div>

                            {/* Sub scores */}
                            <div style={{padding:"18px 22px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,display:"flex",flexDirection:"column",gap:12}}>
                              <ScoreBar score={rateResult.completeness} label="Completeness"/>
                              <ScoreBar score={rateResult.clarity} label="Clarity"/>
                              <ScoreBar score={rateResult.legalCoverage} label="Legal Coverage"/>
                            </div>

                            {/* Strengths / Improvements */}
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                              <div style={{padding:"16px 20px",background:C.surface,border:`1px solid rgba(76,175,118,0.25)`,borderRadius:8}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.positive,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Strengths</div>
                                {(rateResult.strengths||[]).map((s,i)=>(
                                  <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                                    <span style={{color:C.positive,flexShrink:0,fontSize:10,marginTop:2}}>▸</span>
                                    <span style={{fontFamily:C.body,fontSize:12,color:C.inkMid,lineHeight:1.65}}>{s}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{padding:"16px 20px",background:C.surface,border:`1px solid rgba(200,169,110,0.25)`,borderRadius:8}}>
                                <div style={{fontFamily:C.mono,fontSize:8,color:C.warn,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Improvements</div>
                                {(rateResult.improvements||[]).map((s,i)=>(
                                  <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                                    <span style={{color:C.warn,flexShrink:0,fontSize:10,marginTop:2}}>▸</span>
                                    <span style={{fontFamily:C.body,fontSize:12,color:C.inkMid,lineHeight:1.65}}>{s}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                        {!rateLoading&&!rateResult&&(
                          <motion.button whileTap={{scale:0.97,transition:SP.press}} onClick={runRating}
                            style={{padding:"12px 28px",background:C.gold,border:"none",borderRadius:6,color:C.void,fontFamily:C.mono,fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                            Rate This Policy →
                          </motion.button>
                        )}
                      </motion.div>
                    )}

                    {/* ── PLAIN ENGLISH ── */}
                    {activeTab==="plain"&&(
                      <motion.div key="plain" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>Plain English Translator</div>
                        <p style={{fontFamily:C.body,fontSize:13,color:C.inkDim,lineHeight:1.7,marginBottom:20}}>Paste any clause from your policy. Get a plain-language rewrite any employee can understand.</p>

                        <div style={{marginBottom:12}}>
                          <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>Original Clause</div>
                          <motion.div animate={{borderColor:clauseInput.length>0?C.borderMid:C.border}} transition={{duration:0.15}}
                            style={{border:`1px solid ${C.border}`,borderRadius:6,background:C.surface,overflow:"hidden"}}>
                            <textarea value={clauseInput} onChange={e=>setClauseInput(e.target.value)}
                              placeholder="Paste the policy clause here..."
                              style={{width:"100%",background:"transparent",border:"none",color:C.inkOff,fontFamily:C.mono,fontSize:"0.8rem",padding:"14px 16px",resize:"vertical",lineHeight:1.8,minHeight:120,caretColor:C.gold,outline:"none",boxSizing:"border-box"}}/>
                          </motion.div>
                        </div>

                        <motion.button disabled={!clauseInput.trim()||clauseLoading}
                          whileHover={!clauseInput.trim()||clauseLoading?{}:{scale:1.01,transition:SP.tick}}
                          whileTap={!clauseInput.trim()||clauseLoading?{}:{scale:0.97,transition:SP.press}}
                          onClick={runPlainEnglish}
                          style={{padding:"10px 24px",background:!clauseInput.trim()||clauseLoading?C.raised:C.gold,border:"none",borderRadius:6,color:!clauseInput.trim()||clauseLoading?C.inkDim:C.void,fontFamily:C.mono,fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",cursor:!clauseInput.trim()||clauseLoading?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:8,marginBottom:16}}>
                          {clauseLoading?(<><motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}} style={{width:11,height:11,border:`2px solid rgba(0,0,0,0.2)`,borderTopColor:C.void,borderRadius:"50%"}}/>Translating…</>):"Translate →"}
                        </motion.button>

                        <AnimatePresence>
                          {clauseOutput&&(
                            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                              style={{padding:"18px 22px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,position:"relative",overflow:"hidden"}}>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                              <div style={{fontFamily:C.mono,fontSize:8,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Plain English Version</div>
                              <p style={{fontFamily:C.body,fontSize:14,color:C.inkOff,lineHeight:1.85}}>{clauseOutput}</p>
                              <motion.button initial={{opacity:0}} whileHover={{opacity:1}} whileTap={{scale:0.95}}
                                onClick={()=>navigator.clipboard.writeText(clauseOutput)}
                                style={{position:"absolute",top:12,right:12,background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 10px",cursor:"pointer",fontFamily:C.mono,fontSize:9,color:C.inkDim,letterSpacing:"0.08em"}}>
                                Copy
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* ── COMPARE ── */}
                    {activeTab==="compare"&&(
                      <motion.div key="compare" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>Document Comparison</div>
                        <p style={{fontFamily:C.body,fontSize:13,color:C.inkDim,lineHeight:1.7,marginBottom:20}}>
                          Upload a reference document — a labour law PDF, a standard policy template, or an older version of the same policy. PolicyPal will cross-reference it against your loaded document.
                          <br/><br/>
                          <span style={{fontFamily:C.mono,fontSize:10,color:C.warn,letterSpacing:"0.08em"}}>⚠ Not legal advice. Always verify with a qualified professional.</span>
                        </p>

                        {/* Doc 1 summary */}
                        <div style={{padding:"10px 14px",background:C.raised,border:`1px solid ${C.border}`,borderRadius:6,marginBottom:12,position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                          <div style={{fontFamily:C.mono,fontSize:8,color:C.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3}}>Document 1 (loaded)</div>
                          <div style={{fontFamily:C.mono,fontSize:11,color:C.inkOff}}>{docName}</div>
                        </div>

                        {/* Doc 2 upload */}
                        {!doc2Text ? (
                          <motion.div whileHover={{borderColor:C.borderMid,transition:SP.tick}}
                            style={{padding:"24px",border:`1px solid ${C.border}`,borderRadius:6,background:C.surface,textAlign:"center",cursor:"pointer",marginBottom:16,transition:"border-color 150ms"}}
                            onClick={()=>file2InputRef.current?.click()}>
                            <p style={{fontFamily:C.mono,fontSize:10,color:C.inkDim,letterSpacing:"0.1em",marginBottom:6}}>Upload Reference Document</p>
                            <p style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.08em"}}>Labour law PDF, standard template, or any reference document</p>
                            <input ref={file2InputRef} type="file" accept=".txt,.md,.pdf" style={{display:"none"}}
                              onChange={e=>handleFile(e.target.files[0],{setName:setDoc2Name,setText:setDoc2Text,setBase64:setDoc2Base64,setIsPdf:setDoc2IsPdf})}/>
                          </motion.div>
                        ) : (
                          <div style={{padding:"10px 14px",background:C.raised,border:`1px solid ${C.borderMid}`,borderRadius:6,marginBottom:12,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <div>
                              <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.steel}}/>
                              <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:3}}>Document 2 (reference)</div>
                              <div style={{fontFamily:C.mono,fontSize:11,color:C.inkOff}}>{doc2Name}</div>
                            </div>
                            <button onClick={()=>{setDoc2Text("");setDoc2Name("");setDoc2Base64("");setDoc2IsPdf(false);setCompareResult(null);}}
                              style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:4,color:C.inkDim,fontSize:8,padding:"4px 10px",fontFamily:C.mono,letterSpacing:"0.1em",cursor:"pointer"}}>Remove</button>
                          </div>
                        )}

                        {doc2Text&&(
                          <motion.button disabled={compareLoading} whileTap={{scale:0.97,transition:SP.press}} onClick={runCompare}
                            style={{padding:"10px 24px",background:compareLoading?C.raised:C.gold,border:"none",borderRadius:6,color:compareLoading?C.inkDim:C.void,fontFamily:C.mono,fontSize:10,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",cursor:compareLoading?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:8,marginBottom:16}}>
                            {compareLoading?(<><motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}} style={{width:11,height:11,border:`2px solid rgba(0,0,0,0.2)`,borderTopColor:C.void,borderRadius:"50%"}}/>Comparing…</>):"Run Comparison →"}
                          </motion.button>
                        )}

                        <AnimatePresence>
                          {compareResult&&(
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={SP.smooth} style={{display:"flex",flexDirection:"column",gap:10}}>
                              {/* Risk level */}
                              <div style={{padding:"14px 18px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                <div>
                                  <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Compliance Risk</div>
                                  <div style={{fontFamily:C.display,fontSize:22,fontWeight:700,color:riskColor(compareResult.riskLevel),letterSpacing:"-0.5px",textTransform:"capitalize"}}>{compareResult.riskLevel}</div>
                                </div>
                                <p style={{fontFamily:C.body,fontSize:13,color:C.inkMid,lineHeight:1.7,maxWidth:340}}>{compareResult.summary}</p>
                              </div>

                              {[
                                {label:"Conflicts",items:compareResult.conflicts,color:C.negative,pale:C.negativePale,borderCol:"rgba(224,85,85,0.25)"},
                                {label:"Gaps",items:compareResult.gaps,color:C.warn,pale:C.warnPale,borderCol:"rgba(200,169,110,0.25)"},
                                {label:"Alignments",items:compareResult.alignments,color:C.positive,pale:C.positivePale,borderCol:"rgba(76,175,118,0.25)"},
                              ].map(({label,items,color,pale,borderCol})=>items?.length>0&&(
                                <div key={label} style={{padding:"16px 20px",background:C.surface,border:`1px solid ${borderCol}`,borderRadius:8}}>
                                  <div style={{fontFamily:C.mono,fontSize:8,color,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>{label} ({items.length})</div>
                                  {items.map((s,i)=>(
                                    <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                                      <span style={{color,flexShrink:0,fontSize:10,marginTop:2}}>▸</span>
                                      <span style={{fontFamily:C.body,fontSize:12,color:C.inkMid,lineHeight:1.65}}>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}

                              {compareResult.recommendation&&(
                                <div style={{padding:"14px 18px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,position:"relative",overflow:"hidden"}}>
                                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:2,background:C.gold}}/>
                                  <div style={{fontFamily:C.mono,fontSize:8,color:C.gold,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>Recommendation</div>
                                  <p style={{fontFamily:C.body,fontSize:13,color:C.inkOff,lineHeight:1.7}}>{compareResult.recommendation}</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* ── EXPORT ── */}
                    {activeTab==="export"&&(
                      <motion.div key="export" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={SP.smooth}
                        style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
                        <div style={{fontFamily:C.mono,fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>Export</div>
                        <p style={{fontFamily:C.body,fontSize:13,color:C.inkDim,lineHeight:1.7,marginBottom:24}}>Download your full conversation as a formatted document for records or sharing.</p>

                        {messages.length===0 ? (
                          <p style={{fontFamily:C.mono,fontSize:11,color:C.steel,letterSpacing:"0.08em"}}>No messages yet. Ask questions first to generate a conversation to export.</p>
                        ) : (
                          <motion.div style={{display:"flex",flexDirection:"column",gap:10}}>
                            {/* Preview */}
                            <div style={{padding:"16px 20px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8}}>
                              <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10}}>Conversation Summary</div>
                              <div style={{display:"flex",gap:24}}>
                                <div>
                                  <div style={{fontFamily:C.mono,fontSize:20,fontWeight:600,color:C.ink}}>{queryCount}</div>
                                  <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>Queries</div>
                                </div>
                                <div>
                                  <div style={{fontFamily:C.mono,fontSize:20,fontWeight:600,color:C.ink}}>{messages.filter(m=>m.role==="assistant").length}</div>
                                  <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>Responses</div>
                                </div>
                                <div>
                                  <div style={{fontFamily:C.mono,fontSize:20,fontWeight:600,color:C.ink,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{docName.slice(0,16)}{docName.length>16?"…":""}</div>
                                  <div style={{fontFamily:C.mono,fontSize:8,color:C.steel,letterSpacing:"0.1em",textTransform:"uppercase"}}>Document</div>
                                </div>
                              </div>
                            </div>

                            <motion.button whileTap={{scale:0.97,transition:SP.press}} onClick={exportChat}
                              style={{padding:"14px 32px",background:C.gold,border:"none",borderRadius:6,color:C.void,fontFamily:C.mono,fontSize:10,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",alignSelf:"flex-start",display:"inline-flex",alignItems:"center",gap:8}}>
                              Download / Print PDF →
                            </motion.button>

                            <p style={{fontFamily:C.mono,fontSize:9,color:C.steel,letterSpacing:"0.06em"}}>Opens a print dialog — save as PDF from your browser.</p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}