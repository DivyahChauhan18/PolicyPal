import { useState, useRef, useEffect } from "react";

const C = {
  left: "#1a0a0a",
  leftBorder: "#3a1010",
  right: "#f7f3ec",
  card: "#ffffff",
  border: "#e0d8c8",
  borderDark: "#c8b898",
  red: "#8b1a1a",
  redLight: "#b02020",
  redSoft: "rgba(139,26,26,0.08)",
  redBorder: "rgba(139,26,26,0.25)",
  text: "#1a1208",
  textSub: "#3a2e20",
  muted: "#8a7860",
  cream: "#f7f3ec",
  creamDark: "#ede6d8",
  white: "#ffffff",
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
      reader.onload = (e) => { setDocBase64(e.target.result.split(",")[1]); setDocIsPdf(true); setDocText("__pdf__"); };
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
        body = JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: "You are PolicyPal, a precise HR policy assistant. Answer questions based strictly on the uploaded policy document. Be clear and direct. Use bullet points where helpful.", messages: userMessages });
      } else {
        body = JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system: `You are PolicyPal, a precise HR policy assistant. Answer based strictly on the policy document below.\n\nPOLICY DOCUMENT:\n${docText}`, messages: newMessages.map(m => ({ role: m.role, content: m.content })) });
      }
      const res = await fetch("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true", "anthropic-beta": "pdfs-2024-09-25" },
        body,
      });
      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.map(i => i.text || "").join("") || "" }]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function renderMessage(text) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) return <p key={i} style={{ fontFamily: C.font, fontWeight: 700, fontStyle: "italic", color: C.red, margin: "10px 0 4px", fontSize: "1.05rem" }}>{line.replace('# ', '')}</p>;
      if (line.startsWith('## ')) return <p key={i} style={{ fontSize: "0.65rem", fontWeight: 700, color: C.muted, margin: "8px 0 3px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: C.mono }}>{line.replace('## ', '')}</p>;
      if (line.startsWith('- ')) {
        const parts = line.replace('- ', '').split(/\*\*(.*?)\*\*/g);
        return <div key={i} style={{ display: "flex", gap: 10, margin: "4px 0" }}><span style={{ color: C.red, flexShrink: 0, fontSize: "0.6rem", marginTop: 4 }}>◆</span><span style={{ fontSize: "0.82rem", color: C.textSub, lineHeight: 1.65, fontFamily: C.mono }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.text }}>{p}</strong> : p)}</span></div>;
      }
      if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={i} style={{ margin: "2px 0", lineHeight: 1.75, fontSize: "0.82rem", color: C.textSub, fontFamily: C.mono }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.text }}>{p}</strong> : p)}</p>;
    });
  }

  const SUGGESTIONS = [
    "What is the leave entitlement?",
    "How do I raise a grievance?",
    "Remote work guidelines?",
    "Performance review process?",
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:${C.borderDark};border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:0.15}50%{opacity:1}}
        .msg{animation:fadeUp 0.25s ease forwards}
        .dot{animation:blink 1.4s ease infinite}
        .dot:nth-child(2){animation-delay:0.25s}
        .dot:nth-child(3){animation-delay:0.5s}
        .sug:hover{background:${C.redSoft}!important;border-color:${C.red}!important;color:${C.red}!important}
        textarea:focus{outline:none;border-color:${C.red}!important;box-shadow:0 0 0 3px ${C.redSoft}!important}
        .upload-zone:hover{border-color:${C.red}!important}
        button:hover{opacity:0.85}
      `}</style>

      <div style={{ display: "flex", height: "100vh", fontFamily: C.font, overflow: "hidden" }}>

        {/* LEFT PANEL — dark crimson */}
        <div style={{ width: 340, flexShrink: 0, background: C.left, borderRight: `1px solid ${C.leftBorder}`, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

          {/* Decorative red line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.red}, transparent)` }} />

          {/* Brand */}
          <div style={{ padding: "32px 32px 28px", borderBottom: `1px solid ${C.leftBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, border: `1.5px solid ${C.red}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: "0.9rem" }}>◈</div>
              <div>
                <h1 style={{ fontFamily: C.font, fontSize: "1.3rem", fontWeight: 700, fontStyle: "italic", color: "#f5f0e8", margin: 0 }}>PolicyPal</h1>
                <p style={{ fontSize: "0.58rem", color: "rgba(245,240,232,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: C.mono, marginTop: 2 }}>by Divyah</p>
              </div>
            </div>
            <h2 style={{ fontFamily: C.font, fontSize: "1.6rem", fontWeight: 400, fontStyle: "italic", color: "rgba(245,240,232,0.85)", lineHeight: 1.3, margin: "0 0 10px" }}>
              Stop reading<br />policies.
            </h2>
            <div style={{ width: 32, height: 2, background: C.red, marginBottom: 10 }} />
            <h2 style={{ fontFamily: C.font, fontSize: "1.6rem", fontWeight: 700, color: "#f5f0e8", lineHeight: 1.3, margin: "0 0 16px" }}>
              Start asking<br />them.
            </h2>
            <p style={{ fontFamily: C.mono, fontSize: "0.72rem", color: "rgba(245,240,232,0.4)", lineHeight: 1.8, fontWeight: 300 }}>Your HR team can't answer at 11pm.<br />We can.</p>
          </div>

          {/* Document status */}
          <div style={{ padding: "24px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {!docText ? (
              <>
                <p style={{ fontSize: "0.62rem", color: "rgba(245,240,232,0.3)", letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: C.mono }}>No document loaded</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Leave & Absence", "Remote Work", "Grievances", "Performance", "Benefits"].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.leftBorder}` }}>
                      <span style={{ fontSize: "0.55rem", color: C.red }}>◆</span>
                      <span style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.35)", fontFamily: C.mono }}>{t}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 6 }}>
                  <span style={{ fontSize: "0.65rem", color: C.red }}>◆</span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(245,240,232,0.7)", fontFamily: C.mono, flex: 1 }}>{docName.slice(0, 26)}{docName.length > 26 ? "…" : ""}</span>
                </div>
                <p style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.3)", fontFamily: C.mono, letterSpacing: "0.06em" }}>Document loaded · ready to answer</p>
                <button onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }} style={{ background: "transparent", border: `1px solid ${C.leftBorder}`, borderRadius: 4, color: "rgba(245,240,232,0.35)", fontSize: "0.65rem", padding: "6px 14px", cursor: "pointer", fontFamily: C.mono, letterSpacing: "0.1em", textTransform: "uppercase", alignSelf: "flex-start", marginTop: 4 }}>
                  ← Change Document
                </button>
                <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.leftBorder}` }}>
                  <p style={{ fontSize: "0.6rem", color: "rgba(245,240,232,0.25)", fontFamily: C.mono, letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>Quick questions</p>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="sug" onClick={() => sendMessage(s)} style={{ display: "block", width: "100%", background: "transparent", border: `1px solid ${C.leftBorder}`, borderRadius: 4, padding: "8px 12px", fontSize: "0.7rem", color: "rgba(245,240,232,0.4)", cursor: "pointer", textAlign: "left", fontFamily: C.mono, transition: "all 0.15s", marginBottom: 6, lineHeight: 1.4 }}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bottom red accent */}
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${C.red})` }} />
        </div>

        {/* RIGHT PANEL — cream */}
        <div style={{ flex: 1, background: C.right, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {!docText ? (
            /* Upload screen */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <div
                className="upload-zone"
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", maxWidth: 460, background: C.card, border: `1.5px dashed ${dragOver ? C.red : C.borderDark}`, borderRadius: 12, padding: "52px 40px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 24px rgba(26,8,8,0.06)" }}
              >
                <div style={{ width: 56, height: 56, border: `1.5px solid ${C.redBorder}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.red, fontSize: "1.3rem", background: C.redSoft }}>◈</div>
                <p style={{ fontFamily: C.font, fontStyle: "italic", fontSize: "1.4rem", color: C.text, marginBottom: 6 }}>Upload your policy document</p>
                <p style={{ fontFamily: C.mono, fontSize: "0.72rem", color: C.muted, marginBottom: 24, lineHeight: 1.7, fontWeight: 300 }}>PDF or TXT · drag & drop or click to browse</p>
                <div style={{ display: "inline-block", background: C.left, color: "#f5f0e8", borderRadius: 6, padding: "10px 28px", fontSize: "0.72rem", fontFamily: C.mono, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: `2px solid ${C.red}` }}>Browse Files</div>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              </div>
              <p style={{ marginTop: 20, fontSize: "0.7rem", color: C.muted, fontFamily: C.mono, letterSpacing: "0.08em" }}>Supports PDF and plain text files</p>
            </div>
          ) : (
            /* Chat */
            <>
              {/* Chat header */}
              <div style={{ padding: "16px 32px", borderBottom: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, boxShadow: `0 0 6px ${C.red}` }} />
                <span style={{ fontSize: "0.72rem", color: C.muted, fontFamily: C.mono, letterSpacing: "0.08em" }}>Conversation active · {docName}</span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

                {messages.length === 0 && (
                  <div className="msg" style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.red}`, borderRadius: 8, padding: "20px 24px" }}>
                    <p style={{ fontFamily: C.font, fontStyle: "italic", fontSize: "1.05rem", color: C.text, marginBottom: 8 }}>Good day. I'm PolicyPal.</p>
                    <p style={{ fontFamily: C.mono, fontSize: "0.75rem", color: C.muted, lineHeight: 1.7, fontWeight: 300 }}>I've read your policy document. Ask me anything — or use the quick questions on the left.</p>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className="msg" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
                    {m.role === "assistant" && (
                      <div style={{ width: 26, height: 26, border: `1.5px solid ${C.red}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: "0.6rem", flexShrink: 0 }}>◈</div>
                    )}
                    <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? C.left : C.card, border: m.role === "user" ? `2px solid ${C.red}` : `1px solid ${C.border}`, fontFamily: C.mono, fontWeight: 300 }}>
                      {m.role === "user"
                        ? <p style={{ fontSize: "0.82rem", color: "#f5f0e8", margin: 0, lineHeight: 1.65 }}>{m.content}</p>
                        : renderMessage(m.content)
                      }
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ width: 26, height: 26, border: `1.5px solid ${C.red}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: "0.6rem", flexShrink: 0 }}>◈</div>
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px 14px 14px 4px", padding: "12px 16px", display: "flex", gap: 5 }}>
                      {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 5, height: 5, borderRadius: "50%", background: C.red }} />)}
                    </div>
                  </div>
                )}

                {error && <div style={{ background: C.redSoft, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "10px 14px", fontSize: "0.72rem", color: C.red, fontFamily: C.mono }}>{error}</div>}
                <div ref={chatEndRef} />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: C.border }} />

              {/* Input */}
              <div style={{ padding: "16px 32px 20px", background: C.right }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 10px 10px 16px", boxShadow: "0 2px 8px rgba(26,8,8,0.04)" }}>
                  <textarea
                    ref={textareaRef}
                    style={{ flex: 1, background: "transparent", border: "none", color: C.text, fontFamily: C.mono, fontSize: "0.82rem", resize: "none", lineHeight: 1.6, maxHeight: 120, outline: "none", padding: "2px 0", fontWeight: 300 }}
                    placeholder="Ask about any policy..."
                    value={input}
                    rows={1}
                    onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  />
                  <button
                    disabled={!input.trim() || loading}
                    onClick={() => sendMessage()}
                    style={{ width: 36, height: 36, borderRadius: 8, background: !input.trim() || loading ? C.creamDark : C.left, border: !input.trim() || loading ? "none" : `2px solid ${C.red}`, cursor: !input.trim() || loading ? "not-allowed" : "pointer", color: !input.trim() || loading ? C.muted : "#f5f0e8", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    ↑
                  </button>
                </div>
                <p style={{ fontSize: "0.6rem", color: C.muted, textAlign: "center", marginTop: 8, fontFamily: C.mono, letterSpacing: "0.08em" }}>Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}