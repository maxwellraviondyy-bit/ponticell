"use client";
import { useState, useRef, useEffect } from "react";

const G = {
  blue: "#1565C0", blueLight: "#1E88E5", blueDark: "#0D47A1",
  white: "#FFFFFF", gray: "#64748B", grayLight: "#F1F5F9",
  border: "#E2E8F0", text: "#0F172A", green: "#16A34A",
};

const SUGGESTIONS = [
  "HP Samsung budget 3 juta?",
  "Rekomendasi HP gaming RAM 8GB",
  "Ada iPhone second murah?",
  "HP kamera bagus harga terjangkau?",
];

// Ekstrak link WA dari teks pesan
function extractWaLink(text) {
  const match = text.match(/wa\.me\/(\d+)(\?text=[^\s)]+)?/);
  if (!match) return null;
  return "https://" + match[0];
}

// Render pesan dengan tombol WA jika ada link
function MessageBubble({ content, isUser, waNumber }) {
  const waLink = !isUser ? extractWaLink(content) : null;
  // Bersihkan teks dari URL wa.me agar tidak dobel tampil
  const cleanText = content.replace(/👉\s*https?:\/\/wa\.me\/\S+/g, "").replace(/https?:\/\/wa\.me\/\S+/g, "").trim();

  return (
    <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? `linear-gradient(135deg, ${G.blue}, ${G.blueLight})` : G.grayLight,
        color: isUser ? G.white : G.text,
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {cleanText}
      </div>
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#25D366",
            color: G.white,
            padding: "9px 14px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "inherit",
            boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: 16 }}>💬</span>
          Chat WhatsApp Sekarang
          <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.85 }}>→</span>
        </a>
      )}
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Halo! 👋 Saya asisten PontiCell. Tanya saya soal HP atau Tablet yang kamu cari!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [botName, setBotName] = useState("Asisten PontiCell");
  const [waNumber, setWaNumber] = useState("6283808484969");
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [open, messages]);

  // Load bot greeting on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__init__", history: [] }),
    }).then(r => r.json()).then(data => {
      if (data.botName) setBotName(data.botName);
      if (data.waNumber) setWaNumber(data.waNumber);
      const greeting = data.greeting || `Halo! 👋 Saya ${data.botName || "Asisten PontiCell"}. Mau cari HP apa hari ini?`;
      setMessages([{ role: "assistant", content: greeting }]);
    }).catch(() => {});
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: history.slice(0, -1) }),
      });
      const data = await res.json();
      if (data.botName) setBotName(data.botName);
      if (data.waNumber) setWaNumber(data.waNumber);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Silakan coba lagi." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={{ position: "fixed", bottom: 88, right: 20, width: 345, maxWidth: "calc(100vw - 32px)", height: 500, background: G.white, borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: `1px solid ${G.border}`, display: "flex", flexDirection: "column", zIndex: 999, overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${G.blueDark}, ${G.blue})`, padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: G.white }}>{botName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: "#4ADE80", borderRadius: "50%", display: "inline-block" }} />
                  Siap bantu closing 24/7
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
                title="Chat WA Langsung"
                style={{ background: "#25D366", border: "none", color: G.white, borderRadius: 20, padding: "5px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                💬 WA
              </a>
              <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: G.white, borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                {m.role === "assistant" && (
                  <div style={{ width: 28, height: 28, background: G.blueLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🤖</div>
                )}
                <MessageBubble content={m.content} isUser={m.role === "user"} waNumber={waNumber} />
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ width: 28, height: 28, background: G.blueLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
                <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: G.grayLight, display: "flex", gap: 4, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, background: G.gray, borderRadius: "50%", animation: `bounce 1s infinite ${i*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions - show only at start */}
          {messages.length === 1 && (
            <div style={{ padding: "0 10px 6px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ padding: "5px 10px", background: G.white, border: `1px solid ${G.blue}`, borderRadius: 14, fontSize: 11, color: G.blue, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "8px 10px 10px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 6, flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ketik budget atau kebutuhan HP kamu..."
              style={{ flex: 1, padding: "10px 14px", background: G.grayLight, border: `1px solid ${G.border}`, borderRadius: 20, fontSize: 13, fontFamily: "inherit", outline: "none", color: G.text }}
            />
            <button onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, background: input.trim() && !loading ? `linear-gradient(135deg, ${G.blue}, ${G.blueLight})` : G.grayLight, border: "none", borderRadius: "50%", color: input.trim() && !loading ? G.white : G.gray, cursor: input.trim() && !loading ? "pointer" : "not-allowed", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div style={{ position: "fixed", bottom: 24, right: 20, display: "flex", alignItems: "center", gap: 10, zIndex: 1000, flexDirection: "row-reverse" }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${G.blue}, ${G.blueLight})`, border: "none", borderRadius: "50%", cursor: "pointer", boxShadow: "0 8px 24px rgba(21,101,192,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, transition: "transform 0.2s", animation: open ? "none" : "chatPulse 2s infinite", position: "relative" }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
          {open ? "✕" : "🤖"}
          {!open && unread > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, background: "#EF4444", color: G.white, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>{unread}</span>
          )}
        </button>
        {!open && (
          <div onClick={() => setOpen(true)} style={{ background: G.white, borderRadius: 20, padding: "10px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", cursor: "pointer", animation: "fadeInLeft 0.5s ease", border: `1px solid ${G.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: G.text, whiteSpace: "nowrap" }}>Cari HP? Tanya dulu! 🔥</div>
            <div style={{ fontSize: 11, color: G.blue, fontWeight: 600 }}>Dapat rekomendasi langsung!</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes chatPulse {
          0% { box-shadow: 0 0 0 0 rgba(21,101,192,0.5), 0 8px 24px rgba(21,101,192,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(21,101,192,0), 0 8px 24px rgba(21,101,192,0.4); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(21,101,192,0), 0 8px 24px rgba(21,101,192,0.4); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
