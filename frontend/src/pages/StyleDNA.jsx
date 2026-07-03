import { useState, useEffect } from "react"
import { getDNA, forgetMemory } from "../api"
import { SvgIcons } from "../icons"

export default function StyleDNA({ userId, onBack, projects }) {
  const [dna, setDna] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeNodes, setActiveNodes] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    getDNA(userId)
      .then(data => {
        const raw = data.dna || ""
        setDna(raw)
        const parsed = raw
          .split("\n")
          .filter(l => l.trim())
          .map((line, i) => {
            const idx = line.indexOf(":")
            if (idx > 0) {
              return { id: `node_${i}`, title: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() }
            }
            return { id: `node_${i}`, title: "Pattern Node", text: line.trim() }
          })
        setActiveNodes(parsed)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await forgetMemory(id, projects?.[0]?.id || userId)
      setActiveNodes(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const COLORS = ["#8b5cf6", "#f97316", "#10b981", "#06b6d4", "#ec4899", "#f59e0b"]

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px", background: "#f4f5f7" }}>
      <button onClick={onBack} style={{
        background: "transparent", border: "none", color: "#64748b",
        cursor: "pointer", marginBottom: "24px", fontSize: "13.5px",
        fontWeight: "600", display: "flex", alignItems: "center",
        gap: "6px", padding: "6px 12px", borderRadius: "8px"
      }}>← Dashboard Overview</button>

      <div style={{
        background: "#ffffff", border: "1px solid #eef0f3", borderRadius: "16px",
        padding: "32px", marginBottom: "28px", boxShadow: "0 4px 20px -8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px" }}>🧠</span>
          <h1 style={{ fontSize: "26px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", margin: 0, color: "#0f172a" }}>
            What AI Knows About You
          </h1>
        </div>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14.5px", lineHeight: "1.6" }}>
          Live synthesis from your <strong>Cognee Knowledge Graph</strong>. Every chat enriches this. Click <strong>Forget</strong> to remove any node.
        </p>
      </div>

      {loading && (
        <div style={{ color: "#64748b", fontSize: "14px", textAlign: "center", padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={spinnerStyle} />
          <span>Running memify() across Cognee Graph...</span>
        </div>
      )}

      {error && (
        <div style={{ color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", padding: "16px 20px", borderRadius: "12px", fontSize: "14px" }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && activeNodes.length === 0 && (
        <div style={{ color: "#64748b", background: "#ffffff", border: "1px solid #eef0f3", borderRadius: "16px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔬</div>
          <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>No Data Yet</h3>
          <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.5" }}>Start chatting to populate your memory graph.</p>
        </div>
      )}

      {activeNodes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {activeNodes.map((section, idx) => {
            const accent = COLORS[idx % COLORS.length]
            const isDeleting = deletingId === section.id
            return (
              <div key={section.id} style={{
                background: "#ffffff", border: "1px solid #eef0f3", borderRadius: "16px",
                padding: "24px 28px", borderLeft: `4px solid ${accent}`,
                boxShadow: "0 4px 20px -8px rgba(0,0,0,0.03)",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                opacity: isDeleting ? 0.5 : 1, transition: "opacity 0.2s"
              }}>
                <div style={{ flex: 1, marginRight: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ background: `${accent}15`, padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Graph Node
                    </div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
                      {section.title}
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "13.5px", lineHeight: "1.6", color: "#475569" }}>{section.text}</p>
                </div>
                <button
                  onClick={() => handleDelete(section.id)}
                  disabled={isDeleting}
                  style={{
                    background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2",
                    padding: "8px 12px", borderRadius: "8px", cursor: isDeleting ? "wait" : "pointer",
                    fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px",
                    flexShrink: 0
                  }}
                >
                  <SvgIcons.X size={14} />
                  {isDeleting ? "Forgetting..." : "Forget"}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const spinnerStyle = {
  width: "20px", height: "20px", border: "2px solid rgba(0,0,0,0.05)",
  borderTop: "2px solid #8b5cf6", borderRadius: "50%", animation: "spin 1s linear infinite"
}
