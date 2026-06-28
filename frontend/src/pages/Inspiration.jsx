import { useState, useEffect } from "react"
import { ingestURL } from "../api"
import { SvgIcons } from "../icons"

export default function Inspiration({ projectId, onBack }) {
  const [url, setUrl] = useState("")
  const [ingested, setIngested] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined" && projectId) {
      const stored = localStorage.getItem(`studiomind_urls_${projectId}`)
      if (stored) { try { setIngested(JSON.parse(stored)) } catch (_) { setIngested([]) } }
    }
  }, [projectId])

  const handleIngest = async () => {
    if (!url.trim() || loading) return
    const targetUrl = url.trim()
    setLoading(true)
    setStatus(null)
    try {
      await ingestURL(targetUrl, projectId)
      const newIngest = { url: targetUrl, time: new Date().toLocaleTimeString(), date: new Date().toLocaleDateString() }
      const updatedList = [newIngest, ...ingested]
      setIngested(updatedList)
      if (typeof window !== "undefined") localStorage.setItem(`studiomind_urls_${projectId}`, JSON.stringify(updatedList))
      setUrl("")
      setStatus({ type: "success", text: "Reference ingested! Pattern vector added to memory namespace." })
    } catch (err) {
      setStatus({ type: "error", text: "Failed to ingest URL. Please check connectivity." })
    } finally {
      setLoading(false)
    }
  }

  const domainColors = {
    "dribbble.com": "#ea4c89", "behance.net": "#1769ff", "pinterest.com": "#e60023",
    "figma.com": "#f24e1e", "default": "#6366f1"
  }

  const getDomainColor = (domain) => {
    for (const [key, color] of Object.entries(domainColors)) {
      if (domain.includes(key)) return color
    }
    return domainColors.default
  }

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
        <SvgIcons.ArrowLeft size={16}/> Back to Chat
      </button>

      {/* Header */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
        borderRadius: "20px", padding: "36px", marginBottom: "32px",
        boxShadow: "var(--shadow-sm)", display: "flex", gap: "24px", alignItems: "center"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px", flexShrink: 0,
          background: "var(--bg-input)", color: "#ec4899",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <SvgIcons.Image size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", fontFamily: "'Outfit', sans-serif", margin: "0 0 8px", color: "var(--text-primary)" }}>
            Inspiration Library
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "14.5px", lineHeight: "1.6", maxWidth: "600px" }}>
            Paste Dribbble, Behance, or any layout URL. Cognee will extract style metadata and add them as memory graph coordinates for Gemini.
          </p>
        </div>
      </div>

      {/* Ingest panel */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
        borderRadius: "16px", padding: "28px", marginBottom: "24px", boxShadow: "var(--shadow-sm)"
      }}>
        <label style={{
          fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase",
          fontWeight: "700", letterSpacing: "0.08em", display: "block", marginBottom: "16px"
        }}>Ingest Reference URL</label>

        <div style={{ display: "flex", gap: "12px" }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIngest()}
            placeholder="https://dribbble.com/shots/..."
            style={{
              flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-medium)",
              borderRadius: "12px", padding: "14px 18px", color: "var(--text-primary)",
              fontSize: "14px", outline: "none", fontFamily: "'Inter', sans-serif", transition: "all 0.2s"
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent-indigo)"; e.currentTarget.style.background = "var(--bg-surface)" }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.background = "var(--bg-input)" }}
          />
          <button onClick={handleIngest} disabled={loading || !url.trim()} style={{
            background: loading || !url.trim() ? "var(--border-medium)" : "var(--accent-indigo)",
            color: loading || !url.trim() ? "var(--text-muted)" : "#fff",
            border: "none", borderRadius: "12px", padding: "0 24px",
            cursor: loading || !url.trim() ? "not-allowed" : "pointer",
            fontWeight: "600", fontSize: "14px", transition: "all 0.2s", whiteSpace: "nowrap",
            boxShadow: loading || !url.trim() ? "none" : "0 4px 12px rgba(99,102,241,0.25)"
          }}
            onMouseEnter={e => { if (!loading && url.trim()) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.3)" } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = !loading && url.trim() ? "0 4px 12px rgba(99,102,241,0.25)" : "none" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                Ingesting...
              </span>
            ) : "Index Design"}
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div style={{
          padding: "16px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: "500",
          marginBottom: "24px",
          background: status.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: status.type === "success" ? "#16a34a" : "#dc2626",
          border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          display: "flex", alignItems: "center", gap: "10px", animation: "fadeSlideUp 0.3s ease-out"
        }}>
          {status.type === "success" ? <SvgIcons.Check size={18} /> : <SvgIcons.X size={18} />} {status.text}
        </div>
      )}

      {/* Ingested list */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-medium)",
        borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Ingested Assets
          </h3>
          <span style={{
            fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600",
            background: "var(--bg-input)", borderRadius: "6px", padding: "4px 10px"
          }}>{ingested.length} indexed</span>
        </div>

        {ingested.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "64px 24px",
            border: "1px dashed var(--border-strong)", borderRadius: "12px"
          }}>
            <div style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <SvgIcons.Image size={40} />
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>No references yet</div>
            <div style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Paste a Dribbble or Behance link above to expand your memory context.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {ingested.map((item, i) => {
              let domain = "external"
              try { domain = new URL(item.url).hostname } catch (_) {}
              const dColor = getDomainColor(domain)

              return (
                <div key={i} style={{
                  background: "var(--bg-input)", border: "1px solid var(--border-medium)",
                  borderLeft: `3px solid ${dColor}`, borderRadius: "10px", padding: "16px 20px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
                  transition: "all 0.2s", animation: "fadeSlideUp 0.3s ease-out"
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-surface)"; e.currentTarget.style.boxShadow = "var(--shadow-md)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-input)"; e.currentTarget.style.boxShadow = "none" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: "10px", color: dColor, fontWeight: "700",
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px"
                    }}>{domain}</div>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{
                      fontSize: "13.5px", color: "var(--text-primary)", textDecoration: "none",
                      wordBreak: "break-all", lineHeight: "1.5", fontWeight: "500",
                      transition: "color 0.15s", display: "block"
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--accent-indigo)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--text-primary)"}>
                      {item.url}
                    </a>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>{item.time}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{item.date}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
