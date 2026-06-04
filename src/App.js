import { useState, useRef, useEffect } from "react";

const C = {
  bg: "#f8f5f0",
  surface: "#ffffff",
  surfaceAlt: "#faf8f4",
  border: "#e5ddd0",
  borderLight: "#ede8df",
  gold: "#a07840",
  goldLight: "#c49a5a",
  goldFaint: "#f5ede0",
  text: "#1c1812",
  textSoft: "#4a4035",
  muted: "#8c7e6e",
  mutedLight: "#b0a494",
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleFile(file) {
    if (!file) return;
    setDocName(file.name);
    setMessages([]);

    if (file.type === "application/pdf") {
      // Convert PDF to base64 and let Claude handle extraction
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1];
        setDocBase64(base64);
        setDocIsPdf(true);
        setDocText("__pdf__"); // signal that we have a PDF
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocText(e.target.result);
        setDocBase64("");
        setDocIsPdf(false);
      };
      reader.readAsText(file);
    }
  }

  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q || !docText || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: q }];
    setMessages(newMessages);
    setLoading(true);
    setError("");

    try {
      let body;

      if (docIsPdf) {
        // Send PDF as base64 document to Claude
        const userMessages = newMessages.map((m, i) => {
          if (i === 0) {
            // First message includes the PDF
            return {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: docBase64,
                  },
                },
                { type: "text", text: m.content },
              ],
            };
          }
          return { role: m.role, content: m.content };
        });

        body = JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: "You are PolicyPal, an elegant and knowledgeable HR assistant. You have been given an HR policy document. Answer employee and HR questions clearly, warmly, and precisely. If something isn't covered in the document, say so gracefully. Keep responses concise but complete.",
          messages: userMessages,
        });
      } else {
        // Plain text document
        body = JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: `You are PolicyPal, an elegant and knowledgeable HR assistant. You have been given an HR policy document. Answer employee and HR questions clearly, warmly, and precisely. If something isn't covered in the document, say so gracefully. Keep responses concise but complete.\n\nHR POLICY DOCUMENT:\n${docText}`,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        });
      }

      const res = await fetch("/api/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "anthropic-beta": "pdfs-2024-09-25",
        },
        body,
      });

      if (!res.ok) { setError(`Error ${res.status}`); setLoading(false); return; }
      const data = await res.json();
      const reply = data.content?.map((i) => i.text || "").join("") || "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const SUGGESTIONS = [
    "What is the annual leave entitlement?",
    "How do I raise a grievance?",
    "What are the remote work guidelines?",
    "Explain the performance review process",
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${C.bg}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.25;transform:scale(0.75)}50%{opacity:0.8;transform:scale(1)}}
        .msg{animation:fadeUp 0.3s ease forwards}
        .dot{animation:pulse 1.5s ease infinite}
        .dot:nth-child(2){animation-delay:0.2s}
        .dot:nth-child(3){animation-delay:0.4s}
        .sug:hover{background:${C.goldFaint}!important;border-color:${C.goldLight}!important;color:${C.gold}!important}
        .send-btn:hover:not(:disabled){background:${C.text}!important}
        textarea:focus{border-color:${C.goldLight}!important;outline:none}
        .drop-zone:hover{border-color:${C.goldLight}!important}
        .change-btn:hover{color:${C.gold}!important}
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
        <div style={{ height: "2px", background: `linear-gradient(90deg, ${C.bg}, ${C.goldLight}, ${C.bg})` }} />

        <header style={{ background: C.surface, borderBottom: `1px solid ${C.borderLight}`, padding: "1.1rem 2.5rem" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "38px", height: "38px", border: `1.5px solid ${C.gold}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "1rem", flexShrink: 0 }}>◈</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.25rem", fontWeight: "700", color: C.text, letterSpacing: "0.01em" }}>PolicyPal</h1>
              <p style={{ fontSize: "0.65rem", color: C.mutedLight, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "1px" }}>HR Policy Assistant · by Divyah</p>
            </div>
            {docName && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.72rem", color: C.gold, fontWeight: "500" }}>{docName.slice(0, 22)}{docName.length > 22 ? "…" : ""}</span>
                <button className="change-btn" onClick={() => { setDocText(""); setDocName(""); setDocBase64(""); setDocIsPdf(false); setMessages([]); }} style={{ background: "none", border: "none", color: C.muted, fontSize: "0.7rem", cursor: "pointer", letterSpacing: "0.08em", textDecoration: "underline", textUnderlineOffset: "3px", transition: "color 0.2s" }}>change</button>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, maxWidth: "700px", width: "100%", margin: "0 auto", padding: "2rem 1.5rem 0", display: "flex", flexDirection: "column" }}>
          {!docText ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2.5rem", paddingBottom: "5rem" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.65rem", color: C.gold, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "1.25rem" }}>HR Intelligence</p>
                <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "2.4rem", fontWeight: "700", color: C.text, lineHeight: 1.2, marginBottom: "1.25rem" }}>
                  Your policies,<br /><em style={{ color: C.gold, fontWeight: "400" }}>answered simply.</em>
                </h2>
                <div style={{ width: "40px", height: "1px", background: C.goldLight, margin: "0 auto 1.25rem" }} />
                <p style={{ fontSize: "0.85rem", color: C.muted, lineHeight: 1.8, maxWidth: "380px", fontWeight: "300" }}>
                  Upload any HR policy document (PDF or TXT). Ask questions in plain language. Get precise answers instantly.
                </p>
              </div>

              <div
                className="drop-zone"
                style={{ width: "100%", maxWidth: "460px", background: C.surface, border: `1.5px dashed ${dragOver ? C.goldLight : C.border}`, borderRadius: "16px", padding: "3rem 2.5rem", textAlign: "center", cursor: "pointer", transition: "all 0.25s" }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              >
                <div style={{ width: "52px", height: "52px", border: `1.5px solid ${C.border}`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: C.gold, fontSize: "1.4rem" }}>◈</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1.05rem", color: C.text, marginBottom: "0.5rem" }}>Drop your document here</div>
                <div style={{ fontSize: "0.75rem", color: C.muted, marginBottom: "1.75rem", lineHeight: 1.7, fontWeight: "300" }}>PDF or TXT · drag & drop or browse</div>
                <button style={{ background: C.text, color: C.surface, border: "none", borderRadius: "8px", padding: "0.7rem 1.75rem", fontSize: "0.73rem", fontWeight: "500", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>Choose File</button>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
                {["Leave", "Remote Work", "Grievances", "Benefits", "Performance"].map((t, i) => (
                  <span key={i} style={{ border: `1px solid ${C.borderLight}`, borderRadius: "20px", padding: "0.3rem 0.85rem", fontSize: "0.68rem", color: C.mutedLight, letterSpacing: "0.08em" }}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ flex: 1, overflowY: "auto", paddingBottom: "1rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {messages.length === 0 && (
                  <div className="msg" style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: "16px", padding: "1.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.25rem" }}>
                      <div style={{ width: "36px", height: "36px", border: `1.5px solid ${C.gold}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "0.9rem", flexShrink: 0 }}>◈</div>
                      <div>
                        <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1rem", color: C.text }}>Good day. I'm PolicyPal.</div>
                        <div style={{ fontSize: "0.68rem", color: C.mutedLight, marginTop: "2px", letterSpacing: "0.05em" }}>Document loaded — ask me anything</div>
                      </div>
                    </div>
                    <div style={{ height: "1px", background: C.borderLight, marginBottom: "1.25rem" }} />
                    <p style={{ fontSize: "0.8rem", color: C.muted, lineHeight: 1.8, marginBottom: "1.1rem", fontWeight: "300" }}>I've read your policy document carefully. Here are some things people typically ask:</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {SUGGESTIONS.map((s, i) => (
                        <button key={i} className="sug" onClick={() => sendMessage(s)} style={{ background: C.surfaceAlt, border: `1px solid ${C.borderLight}`, borderRadius: "8px", padding: "0.7rem 0.9rem", fontSize: "0.73rem", color: C.muted, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s", lineHeight: 1.45 }}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className="msg" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: "0.6rem", alignItems: "flex-end" }}>
                    {m.role === "assistant" && (
                      <div style={{ width: "28px", height: "28px", border: `1.5px solid ${C.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "0.65rem", flexShrink: 0 }}>◈</div>
                    )}
                    <div style={{ maxWidth: "74%", padding: "0.9rem 1.2rem", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? C.text : C.surface, color: m.role === "user" ? C.bg : C.textSoft, fontSize: "0.82rem", lineHeight: "1.7", border: m.role === "user" ? "none" : `1px solid ${C.borderLight}`, whiteSpace: "pre-wrap", fontWeight: "300" }}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem" }}>
                    <div style={{ width: "28px", height: "28px", border: `1.5px solid ${C.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: "0.65rem", flexShrink: 0 }}>◈</div>
                    <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: "16px 16px 16px 4px", padding: "0.9rem 1.1rem", display: "flex", gap: "5px", alignItems: "center" }}>
                      {[0,1,2].map(i => <div key={i} className="dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.goldLight }} />)}
                    </div>
                  </div>
                )}

                {error && <div style={{ background: "#fdf0f0", border: "1px solid #e8c8c8", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.75rem", color: "#a05050" }}>{error}</div>}
                <div ref={chatEndRef} />
              </div>

              <div style={{ height: "1px", background: `linear-gradient(90deg, ${C.bg}, ${C.border}, ${C.bg})`, margin: "0 -1.5rem" }} />

              <div style={{ background: C.surface, padding: "1rem 0 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", position: "sticky", bottom: 0, marginLeft: "-1.5rem", marginRight: "-1.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", borderTop: `1px solid ${C.borderLight}` }}>
                <textarea
                  style={{ flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "0.8rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", color: C.text, resize: "none", lineHeight: "1.5", maxHeight: "120px", transition: "border-color 0.2s", fontWeight: "300" }}
                  placeholder="Ask about any policy..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                />
                <button
                  className="send-btn"
                  disabled={!input.trim() || loading}
                  onClick={() => sendMessage()}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", background: !input.trim() || loading ? C.borderLight : C.text, border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer", color: !input.trim() || loading ? C.muted : C.surface, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                  ↑
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}