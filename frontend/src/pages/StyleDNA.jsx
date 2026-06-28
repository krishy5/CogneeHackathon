import { useState, useEffect } from "react"
import { getDNA } from "../api"
import { SvgIcons } from "../icons"

export default function StyleDNA({ userId, onBack }) {
  const [dna, setDna] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDNA(userId)
      .then(data => setDna(data.dna))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  const sections = dna
    ? dna.split("\n").filter(l => l.trim()).map((line, i) => {
        const parts = line.split(":")
        if (parts.length > 1) return { id: i, title: parts[0].trim(), text: parts.slice(1).join(":").trim() }
        return { id: i, title: "Pattern Node", text: line }
      })
    : []

  const accentColors = ["#6366f1", "#f97316", "#10b981", "#06b6d4", "#ec4899", "#8b5cf6"]

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px", background: "var(--bg-canvas)" }}>

      {/* Back */}
      <button onClick={onBack} style={{
        background: "transparent", border: "none", color: "var(--text-secondary)",
        cursor: "pointer", marginBottom: "28px", fontSize: "13.5px", fontWeight: "600",
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 12px", borderRadius: "8px", transition: "all 0.15s"
      }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-input)" }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "transparent" }}>
        <SvgIcons.ArrowLeft size={16}/> Dashboard
      </button>

      {/* Header */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
        borderRadius: "20px", padding: "36px", marginBottom: "32px",
        boxShadow: "var(--shadow-sm)", display: "flex", gap: "24px", alignItems: "center"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px", flexShrink: 0,
          background: "var(--bg-input)", color: "var(--accent-indigo)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <SvgIcons.Dna size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", fontFamily: "'Outfit', sans-serif", margin: "0 0 8px", color: "var(--text-primary)" }}>
            Creative Style DNA
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "14.5px", lineHeight: "1.6", maxWidth: "600px" }}>
            This report compiles design guidelines that Cognee has indexed from your active conversations and references across all workspaces.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "16px" }}>
          <div style={{
            width: "40px", height: "40px", border: "3px solid var(--border-medium)", borderTop: "3px solid var(--accent-indigo)",
            borderRadius: "50%", animation: "spin 1s linear infinite"
          }} />
          <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontWeight: "500" }}>Analyzing cross-project memory graph...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "12px", padding: "16px 20px", color: "#dc2626", fontSize: "14px",
          display: "flex", alignItems: "center", gap: "10px"
        }}><SvgIcons.X size={18}/> Error reading memory database: {error}</div>
      )}

      {/* Empty */}
      {!loading && !error && sections.length === 0 && (
        <div style={{
          background: "var(--bg-surface)", border: "1px dashed var(--border-strong)",
          borderRadius: "20px", padding: "64px 40px", textAlign: "center"
        }}>
          <div style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <SvgIcons.Search size={48} />
          </div>
          <h3 style={{ margin: "0 0 10px", color: "var(--text-primary)", fontSize: "18px", fontWeight: "800", fontFamily: "'Outfit', sans-serif" }}>
            No DNA Fingerprint Yet
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.7", maxWidth: "400px", margin: "0 auto" }}>
            Start chatting with StudioMind and add inspiration links to build your style DNA fingerprint.
          </p>
        </div>
      )}

      {/* DNA Sections */}
      {sections.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeSlideUp 0.4s ease-out" }}>
          {sections.map((section, idx) => {
            const color = accentColors[idx % accentColors.length]
            return (
              <div key={section.id} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
                borderLeft: `4px solid ${color}`, borderRadius: "16px", padding: "24px",
                boxShadow: "var(--shadow-sm)", transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)" }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)" }}>
                <div style={{
                  fontSize: "10.5px", color, fontWeight: "800", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px"
                }}>
                  <SvgIcons.Check size={14} /> {section.title}
                </div>
                <p style={{ margin: 0, fontSize: "14.5px", lineHeight: "1.7", color: "var(--text-primary)" }}>{section.text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
