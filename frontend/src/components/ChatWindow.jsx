import { useState, useRef, useEffect } from "react"
import { SvgIcons } from "../icons"

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function renderMarkdown(text) {
  const lines = text.split("\n")
  const elements = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      elements.push(<div key={key++} style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)", marginTop: "16px", marginBottom: "6px" }}>{inline(line.slice(4))}</div>)
      continue
    }
    if (line.startsWith("## ")) {
      elements.push(<div key={key++} style={{ fontSize: "14.5px", fontWeight: "800", color: "var(--text-primary)", marginTop: "20px", marginBottom: "8px" }}>{inline(line.slice(3))}</div>)
      continue
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          <span style={{ color: "var(--accent-indigo)", flexShrink: 0, marginTop: "1px" }}>•</span>
          <span>{inline(line.slice(2))}</span>
        </div>
      )
      continue
    }
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/)
    if (numberedMatch) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          <span style={{ color: "var(--accent-indigo)", fontWeight: "600", flexShrink: 0, minWidth: "16px" }}>{numberedMatch[1]}.</span>
          <span>{inline(numberedMatch[2])}</span>
        </div>
      )
      continue
    }
    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: "10px" }} />)
      continue
    }
    elements.push(<div key={key++} style={{ marginTop: "6px", lineHeight: "1.65" }}>{inline(line)}</div>)
  }
  return elements
}

function inline(text) {
  const parts = []
  let remaining = text
  let k = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/)
    const codeMatch = remaining.match(/^(.*?)`(.+?)`/)
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/)

    const matches = [
      boldMatch && { type: "bold", index: boldMatch[1].length, match: boldMatch },
      codeMatch && { type: "code", index: codeMatch[1].length, match: codeMatch },
      italicMatch && { type: "italic", index: italicMatch[1].length, match: italicMatch },
    ].filter(Boolean).sort((a, b) => a.index - b.index)

    if (matches.length === 0) {
      parts.push(<span key={k++}>{remaining}</span>)
      break
    }

    const first = matches[0]
    const [full, before, content] = first.match

    if (before) parts.push(<span key={k++}>{before}</span>)

    if (first.type === "bold") {
      parts.push(<strong key={k++} style={{ color: "var(--text-primary)", fontWeight: "700" }}>{content}</strong>)
    } else if (first.type === "code") {
      parts.push(
        <code key={k++} style={{
          background: "var(--bg-input)", border: "1px solid var(--border-medium)",
          borderRadius: "6px", padding: "2px 6px", fontSize: "12.5px",
          fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)"
        }}>{content}</code>
      )
    } else if (first.type === "italic") {
      parts.push(<em key={k++} style={{ fontStyle: "italic" }}>{content}</em>)
    }

    remaining = remaining.slice(full.length)
  }
  return parts
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingLeft: "4px", marginBottom: "16px", animation: "fadeIn 0.3s ease-out" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "10px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", flexShrink: 0, animation: "pulseSync 2s infinite"
      }}><SvgIcons.Sparkles size={16} /></div>
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
        borderRadius: "16px 16px 16px 4px",
        padding: "14px 20px", display: "flex", flexDirection: "column", gap: "8px",
        boxShadow: "var(--shadow-sm)", minWidth: "180px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-indigo)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Querying Mem0 Graph
          </div>
          <div style={{ display: "flex", gap: "3px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-indigo)",
                animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`
              }} />
            ))}
          </div>
        </div>
        
        {/* Animated Graph / Equalizer */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "18px", opacity: 0.8 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => {
            const delay = Math.random() * 1.5;
            const dur = 0.5 + Math.random() * 0.8;
            return (
              <div key={i} style={{
                width: "4px", borderRadius: "2px",
                background: `linear-gradient(to top, var(--accent-indigo), var(--accent-violet))`,
                animation: `floatUp ${dur}s ease-in-out ${delay}s infinite alternate`,
                height: `${20 + Math.random() * 80}%`
              }} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ChatWindow ──────────────────────────────────────────────────────────

export default function ChatWindow({
  projectId,
  projects = [],
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

  const project = projects.find(p => p.id === projectId)
  const projectName = project?.name || "Design Workspace"
  const projectColor = project?.color || "#6366f1"

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg-canvas)", height: "100%" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        padding: "0 32px", borderBottom: "1px solid var(--border-medium)",
        background: "var(--bg-surface)", height: "68px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 5
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} style={{
            background: "transparent", border: "none", color: "var(--text-secondary)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            padding: "8px", borderRadius: "8px", transition: "all 0.15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-input)" }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent" }}>
            <SvgIcons.ArrowLeft size={18} />
          </button>
          <div style={{ width: "1px", height: "24px", background: "var(--border-medium)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "10px",
              background: `var(--bg-input)`, border: `1px solid var(--border-medium)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: projectColor
            }}><SvgIcons.Message size={16} /></div>
            <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
              {projectName}
            </span>
          </div>
        </div>

        <button onClick={onInspiration} style={{
          background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
          color: "var(--text-secondary)", borderRadius: "10px", padding: "9px 16px",
          cursor: "pointer", fontSize: "13px", fontWeight: "600",
          display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s",
          boxShadow: "var(--shadow-sm)"
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--border-strong)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-medium)" }}>
          <SvgIcons.Image size={16} /> Inspiration Refs
        </button>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "40px 48px",
        display: "flex", flexDirection: "column", gap: "24px"
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeSlideUp 0.4s ease-out" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "20px", margin: "0 auto 24px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
              boxShadow: "0 12px 30px rgba(99,102,241,0.25)"
            }}><SvgIcons.Sparkles size={36} /></div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif", marginBottom: "12px" }}>
              StudioMind is ready
            </div>
            <div style={{ fontSize: "14.5px", color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto", lineHeight: "1.6" }}>
              Start by describing your project aesthetic, typography goals, or color preferences. I remember context across your workspace.
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === "user"
          return (
            <div key={i} style={{
              display: "flex", flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-start", gap: "16px", animation: "fadeSlideUp 0.3s ease-out forwards"
            }}>
              {!isUser && (
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", marginTop: "4px"
                }}><SvgIcons.Sparkles size={16} /></div>
              )}
              {isUser && (
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
                  background: "var(--bg-input)", border: "1px solid var(--border-medium)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-muted)", marginTop: "4px"
                }}><SvgIcons.User size={16} /></div>
              )}

              <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: "8px", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: isUser ? "var(--accent-indigo)" : "var(--bg-surface)",
                  border: isUser ? "none" : "1px solid var(--border-medium)",
                  borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  padding: "16px 20px", fontSize: "14px", lineHeight: "1.6",
                  color: isUser ? "#fff" : "var(--text-secondary)",
                  boxShadow: isUser ? "0 8px 20px rgba(99,102,241,0.25)" : "var(--shadow-sm)"
                }}>
                  {isUser ? msg.content : renderMarkdown(msg.content)}
                </div>

                {!isUser && i > 0 && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["thumbsup", "thumbsdown"].map(type => {
                      const active = feedbackState[i] === type
                      const isUp = type === "thumbsup"
                      return (
                        <button key={type} onClick={() => clickFeedback(i, type, msg.content)}
                          style={{
                            background: active ? (isUp ? "#f0fdf4" : "#fef2f2") : "var(--bg-surface)",
                            border: `1px solid ${active ? (isUp ? "#bbf7d0" : "#fecaca") : "var(--border-medium)"}`,
                            color: active ? (isUp ? "#16a34a" : "#dc2626") : "var(--text-muted)",
                            borderRadius: "8px", padding: "6px 10px", cursor: "pointer", transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { if(!active) e.currentTarget.style.background = "var(--bg-input)" }}
                          onMouseLeave={e => { if(!active) e.currentTarget.style.background = "var(--bg-surface)" }}>
                          {isUp ? <SvgIcons.ThumbsUp size={14} /> : <SvgIcons.ThumbsDown size={14} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {loading && <TypingIndicator />}
        {error && (
          <div style={{
            color: "#dc2626", fontSize: "13px", padding: "16px 20px",
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px",
            display: "flex", gap: "10px", alignItems: "center"
          }}>
            <SvgIcons.X size={16} /> <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={{ padding: "24px 48px", background: "var(--bg-surface)", borderTop: "1px solid var(--border-medium)" }}>
        <div style={{
          display: "flex", gap: "12px", alignItems: "flex-end",
          background: "var(--bg-input)", border: "1px solid var(--border-strong)",
          borderRadius: "16px", padding: "12px 12px 12px 20px",
          transition: "all 0.2s"
        }} id="input-wrapper">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Describe your design vision..."
            disabled={loading}
            rows={1}
            onFocus={() => { const w = document.getElementById("input-wrapper"); if(w) { w.style.borderColor = "var(--accent-indigo)"; w.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15)" } }}
            onBlur={() => { const w = document.getElementById("input-wrapper"); if(w) { w.style.borderColor = "var(--border-strong)"; w.style.boxShadow = "none" } }}
            style={{
              flex: 1, background: "transparent", border: "none", color: "var(--text-primary)",
              fontSize: "14.5px", outline: "none", resize: "none", lineHeight: "1.6",
              padding: "6px 0", maxHeight: "140px", overflowY: "auto", fontFamily: "'Inter', sans-serif"
            }}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{
            background: loading || !input.trim() ? "var(--border-medium)" : "var(--accent-indigo)",
            color: loading || !input.trim() ? "var(--text-muted)" : "#fff",
            border: "none", borderRadius: "12px", width: "44px", height: "44px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "all 0.2s", boxShadow: loading || !input.trim() ? "none" : "0 4px 12px rgba(99,102,241,0.3)"
          }}>
            <SvgIcons.Send size={18} />
          </button>
        </div>
        <div style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
          Powered by Google Gemini · Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
