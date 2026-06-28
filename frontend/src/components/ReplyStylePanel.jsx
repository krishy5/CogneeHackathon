import { useState } from "react"
import { getReplyStyle, setReplyStyle } from "../api"
import { SvgIcons } from "../icons"

const OPTIONS = {
  tone: {
    label: "Tone",
    icon: <SvgIcons.Message size={16} />,
    choices: [
      { value: "professional", label: "Professional", desc: "Polished & precise" },
      { value: "creative",     label: "Creative",     desc: "Bold & inspiring" },
      { value: "casual",       label: "Casual",       desc: "Friendly & relaxed" },
      { value: "technical",    label: "Technical",    desc: "Exact & detailed" },
    ],
  },
  format: {
    label: "Format",
    icon: <SvgIcons.Grid size={16} />,
    choices: [
      { value: "mixed",   label: "Mixed",    desc: "Prose + bullets" },
      { value: "bullets", label: "Bullets",  desc: "Lists & structure" },
      { value: "prose",   label: "Prose",    desc: "Flowing paragraphs" },
    ],
  },
  detail: {
    label: "Detail",
    icon: <SvgIcons.Search size={16} />,
    choices: [
      { value: "concise",  label: "Concise",  desc: "Short & direct" },
      { value: "balanced", label: "Balanced", desc: "Actionable depth" },
      { value: "detailed", label: "Detailed", desc: "In-depth & thorough" },
    ],
  },
  focus: {
    label: "Focus Area",
    icon: <SvgIcons.Sparkles size={16} />,
    choices: [
      { value: "all",        label: "All Design",  desc: "Full-spectrum advice" },
      { value: "ui-ux",      label: "UI/UX",       desc: "Interaction & flows" },
      { value: "typography", label: "Typography",  desc: "Fonts & text scales" },
      { value: "colors",     label: "Colors",      desc: "Palettes & contrast" },
      { value: "layout",     label: "Layout",      desc: "Grids & spacing" },
    ],
  },
}

export default function ReplyStylePanel({ onClose }) {
  const [style, setStyle] = useState(getReplyStyle())
  const [saved, setSaved] = useState(false)

  const updateStyle = (key, value) => {
    setStyle(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    setReplyStyle(style)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose?.() }, 900)
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200
    }} onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div style={{
        background: "#ffffff", width: "560px", maxHeight: "90vh",
        borderRadius: "20px", boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        border: "1px solid #e2e8f0", overflow: "hidden",
        display: "flex", flexDirection: "column",
        animation: "fadeSlideUp 0.25s cubic-bezier(0.4,0,0.2,1)"
      }}>

        {/* Header */}
        <div style={{
          padding: "24px 28px 20px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
              }}><SvgIcons.Sparkles size={18} /></div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
                AI Reply Style
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
              Customize how StudioMind communicates. These preferences are injected into every message.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px",
            width: "32px", height: "32px", cursor: "pointer", color: "#64748b",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "all 0.15s"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b" }}>
            <SvgIcons.X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "28px" }}>
          {Object.entries(OPTIONS).map(([key, section]) => (
            <div key={key}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ color: "#6366f1" }}>{section.icon}</span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {section.label}
                </span>
              </div>

              {/* Choices */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {section.choices.map(choice => {
                  const isActive = style[key] === choice.value
                  return (
                    <button key={choice.value} onClick={() => updateStyle(key, choice.value)} style={{
                      background: isActive ? "#eef2ff" : "#f8fafc",
                      border: `1.5px solid ${isActive ? "#6366f1" : "#e2e8f0"}`,
                      borderRadius: "12px", padding: "12px 16px",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      minWidth: "120px", flex: "1 1 auto",
                      boxShadow: isActive ? "0 0 0 3px rgba(99,102,241,0.1)" : "none"
                    }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "#a5b4fc"; e.currentTarget.style.background = "#f5f3ff" } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc" } }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        {isActive && (
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: "13.5px", fontWeight: "700", color: isActive ? "#4f46e5" : "#1e293b" }}>
                          {choice.label}
                        </span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: isActive ? "#6366f1" : "#94a3b8", fontWeight: "500" }}>
                        {choice.desc}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Preview */}
          <div style={{
            background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px",
            padding: "16px 18px"
          }}>
            <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
              Current Style Preview
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {Object.entries(style).map(([key, val]) => (
                <span key={key} style={{
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: "20px", padding: "4px 12px",
                  fontSize: "12px", color: "#4f46e5", fontWeight: "600"
                }}>
                  {key}: <strong>{val}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "18px 28px", borderTop: "1px solid #f1f5f9",
          display: "flex", justifyContent: "flex-end", gap: "12px",
          background: "#fafafa"
        }}>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #e2e8f0", color: "#64748b",
            borderRadius: "10px", padding: "10px 20px", cursor: "pointer",
            fontWeight: "600", fontSize: "13.5px", transition: "all 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            background: saved ? "#10b981" : "#6366f1",
            color: "#fff", border: "none", borderRadius: "10px",
            padding: "10px 28px", cursor: "pointer", fontWeight: "700",
            fontSize: "13.5px", transition: "all 0.2s",
            boxShadow: saved ? "0 4px 12px rgba(16,185,129,0.3)" : "0 4px 12px rgba(99,102,241,0.3)",
            display: "flex", alignItems: "center", gap: "8px"
          }}>
            {saved ? <><SvgIcons.Check size={16} /> Saved!</> : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  )
}
