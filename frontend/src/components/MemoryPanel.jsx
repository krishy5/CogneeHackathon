import { useState, useEffect } from "react"
import { getAllMemories } from "../api"
import { SvgIcons } from "../icons"

export default function MemoryPanel({ memory, totalMemories = 0 }) {
  const [allMems, setAllMems] = useState([])
  const [loadingAll, setLoadingAll] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [tab, setTab] = useState("recalled") // "recalled" | "all"

  // Lines recalled for this specific message
  const recalledLines = memory ? memory.split("\n").filter(l => l.trim()) : []
  const borderColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6"]

  const loadAllMemories = async () => {
    if (loadingAll) return
    setLoadingAll(true)
    try {
      const mems = await getAllMemories()
      setAllMems(mems)
    } catch (_) {}
    setLoadingAll(false)
  }

  useEffect(() => {
    if (tab === "all" && allMems.length === 0) loadAllMemories()
  }, [tab])

  const displayLines = tab === "all" ? allMems : recalledLines
  const isEmpty = displayLines.length === 0

  return (
    <div style={{
      width: "290px", background: "#ffffff",
      borderLeft: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column",
      boxSizing: "border-box", height: "100%", flexShrink: 0
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding: "20px 18px 0", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "8px",
              background: "#eef2ff", color: "#6366f1",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}><SvgIcons.Brain size={16} /></div>
            <span style={{ fontSize: "11.5px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Memory
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", animation: "pulseSync 2s infinite" }} />
            <span style={{ fontSize: "10px", color: "#10b981", fontWeight: "700", textTransform: "uppercase" }}>Mem0</span>
          </div>
        </div>

        {/* Total count banner */}
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: "10px", padding: "10px 14px", marginBottom: "14px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
              Total Memories
            </div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
              {totalMemories > 0 ? totalMemories : allMems.length > 0 ? allMems.length : "∞"}
            </div>
          </div>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "rgba(255,255,255,0.2)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}><SvgIcons.Brain size={18} /></div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "0" }}>
          {[
            { id: "recalled", label: "Recalled", count: recalledLines.length },
            { id: "all", label: "All Memories", count: totalMemories || allMems.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, background: tab === t.id ? "#6366f1" : "transparent",
              border: `1px solid ${tab === t.id ? "#6366f1" : "#e2e8f0"}`,
              borderRadius: "8px 8px 0 0", padding: "8px 6px",
              cursor: "pointer", transition: "all 0.15s",
              fontSize: "11px", fontWeight: "700",
              color: tab === t.id ? "#fff" : "#64748b",
              borderBottom: "none",
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{
                  marginLeft: "5px", background: tab === t.id ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  color: tab === t.id ? "#fff" : "#64748b",
                  borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: "800"
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MEMORY LIST ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 20px" }}>

        {tab === "all" && loadingAll && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", flexDirection: "column", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid #e2e8f0", borderTop: "2px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Loading all memories...</span>
          </div>
        )}

        {!loadingAll && isEmpty && (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "#f8fafc", border: "1px dashed #cbd5e1",
              color: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}><SvgIcons.Brain size={24} /></div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "6px" }}>
              {tab === "recalled" ? "Nothing recalled yet" : "No memories stored"}
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.6" }}>
              {tab === "recalled"
                ? "Send a message — the AI will recall relevant memories here."
                : "Start chatting to build your permanent memory graph."}
            </div>
          </div>
        )}

        {!loadingAll && !isEmpty && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayLines.map((line, i) => {
              const accentColor = borderColors[i % borderColors.length]
              const isUser = line.startsWith("[user]:")
              const isAssistant = line.startsWith("[assistant]:")
              const displayText = line
                .replace(/^\[user\]:\s*/i, "")
                .replace(/^\[assistant\]:\s*/i, "")
                .replace(/^\[M\d+\]\s*/, "")

              return (
                <div key={i} style={{
                  background: "#f8fafc", border: "1px solid #f1f5f9",
                  borderLeft: `3px solid ${accentColor}`, borderRadius: "8px",
                  padding: "10px 12px", fontSize: "12px", color: "#475569", lineHeight: "1.55",
                  transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#ffffff"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.boxShadow = "none" }}>
                  <div style={{
                    fontSize: "9px", fontWeight: "800", textTransform: "uppercase",
                    letterSpacing: "0.06em", marginBottom: "5px",
                    display: "flex", alignItems: "center", gap: "5px",
                    color: accentColor
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentColor, display: "inline-block" }} />
                    {tab === "all" ? `mem_${String(i + 1).padStart(3, "0")}` : `recalled_${i + 1}`}
                    {isUser && <span style={{ color: "#94a3b8", marginLeft: "4px" }}>· you</span>}
                    {isAssistant && <span style={{ color: "#94a3b8", marginLeft: "4px" }}>· ai</span>}
                  </div>
                  <div style={{
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>{displayText}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        padding: "12px 14px", borderTop: "1px solid #f1f5f9", background: "#fafafa",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", textAlign: "center" }}>
          Powered by <strong style={{ color: "#6366f1" }}>Mem0</strong> · Permanent hybrid memory
        </div>
      </div>
    </div>
  )
}
