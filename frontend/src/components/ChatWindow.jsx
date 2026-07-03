import { useState, useRef, useEffect } from "react"

function inlineFormat(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:12.5px;font-family:monospace;color:#6366f1">$1</code>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
}

function renderMarkdown(text) {
  return text.split("\n").map((line, i) => {
    if (/^[•\-\*] /.test(line)) {
      const content = line.replace(/^[•\-\*] /, "")
      return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
          <span style={{ color: "#8b5cf6", flexShrink: 0, marginTop: "1px" }}>•</span>
          <span dangerouslySetInnerHTML={{ __html: inlineFormat(content) }} />
        </div>
      )
    }
    if (/^#{1,3} /.test(line)) {
      const content = line.replace(/^#{1,3} /, "")
      return <div key={i} style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a", margin: "12px 0 4px" }} dangerouslySetInnerHTML={{ __html: inlineFormat(content) }} />
    }
    if (/^━+$/.test(line.trim())) return <hr key={i} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />
    if (!line.trim()) return <div key={i} style={{ height: "6px" }} />
    return <div key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
  })
}

export default function ChatWindow({
  projectId,
  messages,
  loading,
  error,
  input,
  setInput,
  handleSend,
  handleFeedback,
  onInspiration,
  onBack
}) {
  const [feedbackState, setFeedbackState] = useState({})
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const clickFeedback = (index, type, content) => {
    setFeedbackState(prev => ({ ...prev, [index]: prev[index] === type ? null : type }))
    handleFeedback(type, content)
  }

  const getProjectName = () => {
    if (projectId === "proj_001") return "Luminary App"
    if (projectId === "proj_002") return "Forge Design System"
    if (projectId === "proj_003") return "Nova Brand"
    return projectId || "Design Workspace"
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f4f5f7", height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* Top Bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "13.5px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#0f172a"; e.currentTarget.style.background = "#f1f5f9" }}
            onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Dashboard
          </button>
          <div style={{ width: "1px", height: "20px", backgroundColor: "#e2e8f0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px", display: "flex" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>{getProjectName()}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onInspiration} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#475569", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#cbd5e1" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e2e8f0" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Inspiration
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/chat/${projectId}`
              navigator.clipboard.writeText(url).then(() => {
                const btn = document.getElementById("share-btn")
                if (btn) { btn.textContent = "✓ Copied!"; setTimeout(() => { btn.textContent = "Share" }, 2000) }
              })
            }}
            id="share-btn"
            style={{ background: "#09090b", color: "#ffffff", border: "none", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share
          </button>
        </div>
      </div>



      {/* Messages Stream — flex:1 + minHeight:0 fixes truncation */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {messages.map((msg, i) => {
          const isUser = msg.role === "user"
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", animation: "fadeSlideIn 0.3s ease-out forwards" }}>
              <div style={{
                maxWidth: "78%",
                background: isUser ? "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" : "#ffffff",
                border: isUser ? "none" : "1px solid #eef0f3",
                borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                padding: "14px 18px",
                fontSize: "14px",
                lineHeight: "1.65",
                color: isUser ? "#ffffff" : "#334155",
                boxShadow: isUser ? "0 4px 15px rgba(139,92,246,0.2)" : "0 4px 20px rgba(0,0,0,0.03)",
              }}>
                {isUser ? msg.content : renderMarkdown(msg.content)}
              </div>

              {!isUser && i > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", paddingLeft: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>StudioMind · Cognee Memory</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["thumbsup", "thumbsdown"].map(type => (
                      <button key={type} onClick={() => clickFeedback(i, type, msg.content)} style={{
                        background: feedbackState[i] === type ? (type === "thumbsup" ? "#ecfdf5" : "#fef2f2") : "transparent",
                        border: `1px solid ${feedbackState[i] === type ? (type === "thumbsup" ? "#10b981" : "#ef4444") : "#e2e8f0"}`,
                        color: feedbackState[i] === type ? (type === "thumbsup" ? "#10b981" : "#ef4444") : "#94a3b8",
                        borderRadius: "8px", padding: "3px 8px", cursor: "pointer", fontSize: "12px", transition: "all 0.15s"
                      }}>
                        {type === "thumbsup" ? "👍" : "👎"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "4px" }}>
            <div style={spinnerStyle} />
            <span style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>StudioMind is recalling memory graph...</span>
          </div>
        )}

        {error && (
          <div style={{ color: "#ef4444", fontSize: "13.5px", padding: "12px 18px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", maxWidth: "90%" }}>
            ⚠️ {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div style={{ padding: "20px 32px", borderTop: "1px solid #e5e7eb", background: "#ffffff", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Cognee Memory Session · {getProjectName()}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask your design partner... (memory-aware)"
            disabled={loading}
            style={{ flex: 1, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px 18px", color: "#1e293b", fontSize: "13.5px", outline: "none", transition: "all 0.2s" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.1)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none" }}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{
            background: loading || !input.trim() ? "#e2e8f0" : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            color: loading || !input.trim() ? "#94a3b8" : "#ffffff",
            border: "none", borderRadius: "12px", padding: "14px 28px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "13.5px", fontWeight: "600", transition: "all 0.2s"
          }}
            onMouseEnter={e => { if (!loading && input.trim()) { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(139,92,246,0.2)" } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes rotateSpinner { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  )
}

const spinnerStyle = {
  width: "16px", height: "16px",
  border: "2px solid rgba(0,0,0,0.05)",
  borderTop: "2px solid #8b5cf6",
  borderRadius: "50%",
  animation: "rotateSpinner 1s linear infinite",
  flexShrink: 0
}
