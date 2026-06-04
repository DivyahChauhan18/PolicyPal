import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#f5f0e8",
  surface: "#faf6ee",
  card: "#ffffff",
  topbar: "#1a0808",
  border: "#d8ccb8",
  borderDark: "#b8a890",
  red: "#8b1a1a",
  redMid: "#a82020",
  redSoft: "rgba(139,26,26,0.08)",
  redBorder: "rgba(139,26,26,0.25)",
  black: "#111008",
  text: "#1a1208",
  textSub: "#3a2e20",
  muted: "#8a7860",
  mutedLight: "#b0a080",
  font: "'Cormorant Garant', Georgia, serif",
  mono: "'DM Mono', monospace",
};

export default function PolicyPal() {
  const [docText, setDocText] = useState("");
  const [docName, setDocName] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [docIsPdf, setDocIsPdf] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleFile(file) {
    if (!file) return;
    setDocName(file.name);
    setMessages([]);
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocBase64(e.target.result.split(",")[1]);
        setDocIsPdf(true);
        setDocText("__pdf__");
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { setDocText(e.target.result); setDocBase64(""); setDocIsPdf(false); };
      reader.readAsText(file);
    }
  }

  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || !docText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);
    setError("");

    try {
      let body;
      if (docIsPdf) {
        const userMessages = newMessages.map((m, i) => {
          if (i === 0) return { role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: docBase64 } }, { type: "text", text: m.content }] };
          return { role: m.role, content: m.content };
        });
        body = JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: "You are PolicyPal, a precise and authoritative HR policy assistant. Answer questions based strictly on the uploaded policy document. Be clear and direct. Use bullet points where helpful. If something isn't in the document, say so.", messages: userMessages });
      } else {
        body = JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: `You are PolicyPal, a precise and authoritative HR policy assistant. Answer questions based strictly on the policy document below. Be clear and direct. Use bullet points where helpful.\n\nPOLICY DOCUMENT:\n${docText}`, messages: newMessages.map(m => ({ role: m.role, content: m.content })) });
      }

      const res = await fetch("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "anthropic-beta": "pdfs-2024-09-25" },
        body,
      });

      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      const reply = data.content?.map(i => i.text || "").join("") || "";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function renderMessage(text) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <p key={i} style={{ fontFamily: C.font, fontWeight: 700, fontStyle: "italic", color: C.red, margin: "10px 0 4px", fontSize: "1rem" }}>{line.replace('# ', '')}</p>;
      if (line.startsWith('## ')) return <p key={i} style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, margin: "8px 0 3px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: C.mono }}>{line.replace('## ', '')}</p>;
      if (line.startsWith('- ')) {
        const parts = line.replace('- ', '').split(/\*\*(.*?)\*\*/g);
        return <div key={i} style={{ display: "flex", gap: 10, margin: "4px 0", alignItems: "flex-start" }}><span style={{ color: C.red, flexShrink: 0, marginTop: 2, fontSize: "0.7rem" }}>◆</span><span style={{ fontSize: "0.82rem", color: C.textSub, lineHeight: 1.65 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.text }}>{p}</strong> : p)}</span></div>;
      }
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} style={{ margin: "2px 0", lineHeight: 1.75, fontSize: "0.82rem", color: C.textSub }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.text }}>{p}</strong> : p)}</p>;
    });
  }

  const SUGGESTIONS = [
    "What is the leave entitlement?",
    "How do I raise a grievance?",
    "What are the remote work guidelines?",
    "Explain the performance review process",
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:0.15}50%{opacity:0.8}}
        .msg{animation:fadeUp 0.3s ease forwards}
        .dot{animation:blink 1.4s ease infinite}
        .dot:nth-child(2){animation-delay:0.25s}
        .dot:nth-child(3){animation-delay:0.5s}
        .sug:hover{background:${C.redSoft}!important;border-color:${C.red}!important;color:${C.red}!important}
        textarea:focus{outline:none;border-color:${C.red}!important;box-shadow:0 0 0 3px ${C.redSoft}!important}
        .upload-zone:hover{border-color:${C.red}!important}
        button:hover{opacity:0.85}
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: C.font, display: "flex", flexDirection: "column" }}>

        {/* Topbar */}
        <div style={{ background: C.topbar, padding: "0 36px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${C.red}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, fontStyle: "italic", color: "#f5f0e8", margin: 0, fontFamily: C.font, letterSpacing: "0.01em" }}>PolicyPal</h1>
            <span style={{ fontSize: 9, color: "rgba(245,240,232,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: C.mono }}>by Divyah</span>
          </div>
          {docName && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, border: `1px solid rgba(139,26,26,0.5)`, borderRadius: 3, padding: "4px 12px", background: "rgba(139,26,26,0.15)" }}>
                <span style={{ fontSize: 9, color: "#c84040", fontFamily: C.mono, letterSpacing: "0.1em" }}>◆</span>
                <span style={{ fontSize: 11, color: "#e0b0b0", fontFamily: C.mono }}>{docName.slice(0, 24)}{docName.length > 24 ? "…" : ""}</span>
              </div>
              <button onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "4px 12px", cursor: "pointer", fontFamily: C.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Change
              </button>
            </div>
          )}
        </div>

        {!docText ? (
          /* Upload screen */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 48 }}>

            {/* Hero */}
            <div style={{ textAlign: "center", maxWidth: 520 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: C.red, fontFamily: C.mono, margin: "0 0 16px" }}>HR Intelligence · PolicyPal</p>
              <h2 style={{ fontSize: 50, fontWeight: 400, fontStyle: "italic", color: C.text, margin: "0 0 16px", lineHeight: 1.05, letterSpacing: "-0.01em" }}>
                Stop reading policies.<br /><span style={{ color: C.red }}>Start asking them.</span>
              </h2>
              <div style={{ width: 48, height: 2, background: C.red, margin: "0 auto 20px" }} />
              <p style={{ fontSize: 15, color: C.text, lineHeight: 1.8, margin: "0 0 8px", fontFamily: C.font, fontStyle: "italic", fontWeight: 600 }}>Your HR team can't answer at 11pm. We can.</p>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, margin: 0, fontFamily: C.mono }}>Upload any policy document and get instant answers.</p>
            </div>

            {/* Upload zone */}
            <div
              className="upload-zone"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ width: "100%", maxWidth: 480, border: `1.5px dashed ${dragOver ? C.red : C.red}`, borderRadius: 4, padding: "48px 40px", textAlign: "center", cursor: "pointer", background: dragOver ? C.redSoft : C.surface, transition: "all 0.2s", boxShadow: `inset 0 0 0 4px ${C.redSoft}` }}
            >
              <p style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.muted, fontFamily: C.mono, margin: "0 0 14px" }}>Drop document here</p>
              <p style={{ fontSize: 28, fontStyle: "italic", color: C.text, fontFamily: C.font, margin: "0 0 6px" }}>PDF or TXT</p>
              <p style={{ fontSize: 11, color: C.mutedLight, fontFamily: C.mono, margin: "0 0 24px" }}>drag & drop or click to browse</p>
              <div style={{ display: "inline-block", background: C.topbar, color: "#f5f0e8", borderRadius: 2, padding: "10px 28px", fontSize: 10, fontFamily: C.mono, letterSpacing: "0.14em", textTransform: "uppercase", borderBottom: `2px solid ${C.red}` }}>Browse Files</div>
              <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            {/* Suggestion pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 480 }}>
              {SUGGESTIONS.map((s, i) => (
                <div key={i} style={{ border: `1px solid ${C.redBorder}`, borderRadius: 2, padding: "5px 14px", fontSize: 11, color: C.red, fontFamily: C.mono, letterSpacing: "0.04em", background: C.redSoft }}>{s}</div>
              ))}
            </div>
          </div>
        ) : (
          /* Chat screen */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 760, width: "100%", margin: "0 auto", padding: "0 24px" }}>

            <div style={{ flex: 1, overflowY: "auto", padding: "32px 0 12px", display: "flex", flexDirection: "column", gap: 20 }}>

              {messages.length === 0 && (
                <div className="msg" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}`, borderRadius: 4, padding: "24px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.redBorder}` }}>
                    <span style={{ fontSize: 10, color: C.red, fontFamily: C.mono, letterSpacing: "0.14em", fontWeight: 700 }}>◆ POLICYPAL</span>
                    <span style={{ fontSize: 10, color: C.mutedLight, fontFamily: C.mono }}>Document loaded · ready to answer</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.7, margin: "0 0 16px", fontFamily: C.mono }}>I've read your policy document. Here are some questions to get you started:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} className="sug" onClick={() => sendMessage(s)} style={{ background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 3, padding: "10px 14px", fontSize: 12, color: C.red, cursor: "pointer", textAlign: "left", fontFamily: C.mono, transition: "all 0.15s", lineHeight: 1.4 }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className="msg">
                  {m.role === "user" ? (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ maxWidth: "72%", padding: "12px 16px", background: C.topbar, borderRadius: "4px 4px 0 4px", borderBottom: `2px solid ${C.red}` }}>
                        <p style={{ fontSize: 13, color: "#f5f0e8", margin: 0, lineHeight: 1.65, fontFamily: C.mono }}>{m.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, border: `1px solid ${C.red}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <span style={{ fontSize: 8, color: C.red }}>◆</span>
                      </div>
                      <div style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px 4px 4px 0", padding: "14px 18px" }}>
                        {renderMessage(m.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, border: `1px solid ${C.red}`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 8, color: C.red }}>◆</span>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "4px 4px 4px 0", padding: "14px 18px", display: "flex", gap: 6, alignItems: "center" }}>
                    {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: C.red }} />)}
                  </div>
                </div>
              )}

              {error && <div style={{ background: "#fdf0f0", border: `1px solid ${C.red}`, borderRadius: 3, padding: "10px 14px", fontSize: 11, color: C.red, fontFamily: C.mono }}>{error}</div>}
              <div ref={chatEndRef} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: C.borderDark, margin: "0 -24px" }} />

            {/* Input */}
            <div style={{ padding: "16px 0 24px", position: "sticky", bottom: 0, background: C.bg }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: C.surface, border: `1px solid ${C.borderDark}`, borderRadius: 4, padding: "10px 10px 10px 16px" }}>
                <textarea
                  ref={textareaRef}
                  style={{ flex: 1, background: "transparent", border: "none", color: C.text, fontFamily: C.mono, fontSize: 13, resize: "none", lineHeight: 1.6, maxHeight: 120, outline: "none", padding: "2px 0" }}
                  placeholder="Ask about any policy..."
                  value={input}
                  rows={1}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button
                  disabled={!input.trim() || loading}
                  onClick={() => sendMessage()}
                  style={{ width: 36, height: 36, borderRadius: 3, background: !input.trim() || loading ? C.border : C.topbar, border: !input.trim() || loading ? "none" : `2px solid ${C.red}`, cursor: !input.trim() || loading ? "not-allowed" : "pointer", color: !input.trim() || loading ? C.muted : "#f5f0e8", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", fontFamily: C.mono }}>
                  ↑
                </button>
              </div>
              <p style={{ fontSize: 9, color: C.mutedLight, textAlign: "center", marginTop: 8, fontFamily: C.mono, letterSpacing: "0.08em" }}>ENTER TO SEND · SHIFT+ENTER FOR NEW LINE</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}