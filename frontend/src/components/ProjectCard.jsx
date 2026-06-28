import { useState, useEffect } from "react"
import { SvgIcons } from "../icons"

export default function ProjectCard({ project, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [memoryCount, setMemoryCount] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const memories = localStorage.getItem(`studiomind_memories_${project.id}`)
      if (memories) {
        try { setMemoryCount(JSON.parse(memories).length) } catch (_) { setMemoryCount(2) }
      } else {
        setMemoryCount(project.id === "proj_001" || project.id === "proj_002" ? 2 : 0)
      }
    }
  }, [project.id])

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${hovered ? project.color + '40' : 'var(--border-medium)'}`,
        borderRadius: "16px", padding: "24px",
        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative", overflow: "hidden",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "var(--shadow-xl)" : "var(--shadow-sm)"
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "4px",
          background: project.color, animation: "fadeIn 0.2s ease-out"
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: `${project.color}15`, color: project.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", fontWeight: "800", fontFamily: "'Outfit', sans-serif"
        }}>
          {project.name.charAt(0)}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
              style={{
                background: "transparent", border: "1px solid var(--border-medium)", 
                borderRadius: "8px", width: "28px", height: "28px", 
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5" }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-medium)" }}
            >
              <SvgIcons.X size={14} />
            </button>
          )}
          <span style={{
            fontSize: "11px", fontWeight: "700", padding: "4px 10px",
            borderRadius: "20px", background: "#f0fdf4",
            color: "#16a34a", border: "1px solid #bbf7d0",
            textTransform: "uppercase", letterSpacing: "0.05em"
          }}>Active</span>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", color: "var(--text-primary)" }}>
        {project.name}
      </h3>
      <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5", minHeight: "40px" }}>
        {project.description}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
        {/* Avatar stack */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {[
            { label: "SW", bg: "#f97316" },
            { label: <SvgIcons.Sparkles size={12}/>, bg: "#6366f1" },
          ].map((item, idx) => (
            <div key={idx} style={{
              width: "26px", height: "26px", borderRadius: "50%",
              background: item.bg, border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "9px", fontWeight: "700", color: "#fff",
              marginLeft: idx > 0 ? "-8px" : 0, zIndex: 2 - idx,
              boxShadow: "var(--shadow-sm)"
            }}>{item.label}</div>
          ))}
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginLeft: "8px" }}>+1</span>
        </div>

        {/* Memory count */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
          <SvgIcons.Brain size={16} />
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {memoryCount} nodes
          </span>
        </div>
      </div>
    </div>
  )
}
