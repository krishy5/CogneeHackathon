import { useState, useEffect } from "react"
import Chat from "./pages/Chat"
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import StyleDNA from "./pages/StyleDNA"
import Inspiration from "./pages/Inspiration"
import ReplyStylePanel from "./components/ReplyStylePanel"
import { getGeminiApiKey, setGeminiApiKey, getReplyStyle, initializeMemory } from "./api"
import { SvgIcons } from "./icons"

export default function App() {
  const [activeScreen, setActiveScreen] = useState("dashboard")
  const [activeProject, setActiveProject] = useState(null)
  const [projects, setProjects] = useState([
    { id: "proj_001", name: "Luminary App", description: "Meditation tracker UI", color: "#6366f1" },
    { id: "proj_002", name: "Forge Design System", description: "B2B SaaS components", color: "#ec4899" },
    { id: "proj_003", name: "StudioMind Brand", description: "Marketing site assets", color: "#8b5cf6" },
  ])
  const [showSettings, setShowSettings] = useState(false)
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("")
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [currentStyle, setCurrentStyle] = useState(getReplyStyle())

  useEffect(() => {
    setApiKeyInput(getGeminiApiKey())
    // Seed Mem0 with account context on first visit
    initializeMemory(projects, { name: "Sarah Wiliam", role: "Creative Director" })
  }, [])

  const saveSettings = () => {
    setGeminiApiKey(apiKeyInput.trim())
    setShowSettings(false)
  }

  const handleStyleSave = () => {
    setCurrentStyle(getReplyStyle())
    setShowStylePanel(false)
  }

  const openProject = (id) => { 
    setActiveProject(id)
    try {
      localStorage.setItem('studiomind_last_active_project', id)
      localStorage.setItem(`studiomind_last_active_time_${id}`, Date.now().toString())
    } catch (_) {}
    navigateTo("chat") 
  }

  const handleDeleteProject = (id) => {
    setProjectToDelete(id)
    setConfirmDeleteInput("")
  }

  const confirmDelete = () => {
    if (confirmDeleteInput.trim().toLowerCase() !== "confirm") return
    
    setProjects(prev => prev.filter(p => p.id !== projectToDelete))
    if (activeProject === projectToDelete) {
      setActiveProject(projects.find(p => p.id !== projectToDelete)?.id || null)
    }
    setProjectToDelete(null)
  }

  const navigateTo = (screen) => setActiveScreen(screen)

  const hasKey = getGeminiApiKey().length > 10 && !getGeminiApiKey().startsWith("PLACEHOLDER")

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      background: "var(--bg-canvas)", fontFamily: "'Inter', sans-serif",
      color: "var(--text-primary)", overflow: "hidden"
    }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: "260px", background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-medium)",
        display: "flex", flexDirection: "column",
        padding: "24px 20px", flexShrink: 0, zIndex: 10
      }}>
        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", paddingLeft: "8px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff"
          }}>
            <SvgIcons.Sparkles size={20} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
            StudioMind
          </span>
        </div>

        {/* NAV */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[
            { id: "dashboard", label: "Workspace", icon: <SvgIcons.Grid size={18} /> },
            { id: "analytics", label: "Activity Graph", icon: <SvgIcons.Activity size={18} /> },
            { id: "dna", label: "Style DNA", icon: <SvgIcons.Dna size={18} /> },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveProject(null); navigateTo(item.id) }} style={{
              background: activeScreen === item.id && !activeProject ? "var(--bg-input)" : "transparent",
              color: activeScreen === item.id && !activeProject ? "var(--text-primary)" : "var(--text-secondary)",
              border: "none", borderRadius: "8px", padding: "10px 12px",
              display: "flex", alignItems: "center", gap: "12px",
              cursor: "pointer", fontSize: "13.5px", fontWeight: "600",
              transition: "all 0.15s", textAlign: "left"
            }}
              onMouseEnter={e => { if (activeScreen !== item.id || activeProject) e.currentTarget.style.background = "var(--bg-input)" }}
              onMouseLeave={e => { if (activeScreen !== item.id || activeProject) e.currentTarget.style.background = "transparent" }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* PROJECTS SECTION */}
        <div style={{ marginTop: "32px", flex: 1, overflowY: "auto" }}>
          <div style={{
            fontSize: "11px", fontWeight: "700", color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: "12px", paddingLeft: "12px"
          }}>
            Recent Projects
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {projects.map(proj => {
              const isActive = activeProject === proj.id && activeScreen !== "dna"
              return (
                <button key={proj.id} onClick={() => openProject(proj.id)} style={{
                  background: isActive ? "var(--bg-input)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none", borderRadius: "8px", padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: "12px",
                  cursor: "pointer", fontSize: "13.5px", fontWeight: "500",
                  transition: "all 0.15s", textAlign: "left"
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-input)" }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}>
                  <span style={{
                    width: "10px", height: "10px", borderRadius: "50%",
                    backgroundColor: proj.color, flexShrink: 0
                  }} />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {proj.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* SETTINGS & USER */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-medium)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          
          <button onClick={() => setShowStylePanel(true)} style={{
            background: "transparent", color: "var(--text-secondary)",
            border: "none", borderRadius: "8px", padding: "10px 12px",
            display: "flex", alignItems: "center", gap: "12px",
            cursor: "pointer", fontSize: "13.5px", fontWeight: "600",
            transition: "all 0.15s", textAlign: "left", width: "100%"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-input)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <SvgIcons.Sparkles size={18} />
            AI Reply Style
            <span style={{
              marginLeft: "auto", fontSize: "10px", fontWeight: "700",
              background: "#eef2ff", color: "#6366f1",
              borderRadius: "5px", padding: "2px 7px",
              textTransform: "uppercase"
            }}>{currentStyle.tone}</span>
          </button>



          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", marginTop: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <SvgIcons.User size={18} />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>Sarah Wiliam</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Creative Director</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {activeScreen === "dashboard" && <Dashboard projects={projects} onOpenProject={openProject} onDeleteProject={handleDeleteProject} onViewDNA={() => navigateTo("dna")} onUpdateProjects={setProjects} />}
        {activeScreen === "analytics" && <Analytics projects={projects} onBack={() => navigateTo("dashboard")} />}
        {activeScreen === "chat" && <Chat projectId={activeProject} projects={projects} onBack={() => navigateTo("dashboard")} onInspiration={() => navigateTo("inspiration")} />}
        {activeScreen === "dna" && <StyleDNA userId="user_001" onBack={() => navigateTo("dashboard")} />}
        {activeScreen === "inspiration" && <Inspiration projectId={activeProject} onBack={() => navigateTo("chat")} />}
      </div>

      {/* ── SETTINGS MODAL ── */}
      {showSettings && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100
        }}>
          <div style={{
            background: "var(--bg-surface)", width: "420px", borderRadius: "16px",
            boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-medium)",
            padding: "32px", animation: "fadeSlideUp 0.2s ease-out"
          }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "800", fontFamily: "'Outfit', sans-serif" }}>Gemini AI Settings</h2>
            <p style={{ margin: "0 0 24px", color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5" }}>
              StudioMind requires a Google Gemini API key to power the AI design partner. Without it, the app runs in mock mode.
            </p>

            <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Google Gemini API Key
            </label>
            <div style={{ display: "flex", alignItems: "center", background: "var(--bg-input)", border: "1px solid var(--border-medium)", borderRadius: "10px", padding: "10px 14px", gap: "10px", marginBottom: "24px" }}>
              <SvgIcons.Key size={18} color="var(--text-muted)" />
              <input 
                type="password"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  border: "none", background: "transparent", outline: "none",
                  width: "100%", fontSize: "14px", color: "var(--text-primary)",
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setShowSettings(false)} style={{
                padding: "10px 18px", borderRadius: "10px", border: "1px solid var(--border-medium)",
                background: "transparent", color: "var(--text-secondary)", cursor: "pointer",
                fontWeight: "600", fontSize: "13.5px"
              }}>Cancel</button>
              <button onClick={saveSettings} style={{
                padding: "10px 24px", borderRadius: "10px", border: "none",
                background: "var(--accent-indigo)", color: "#fff", cursor: "pointer",
                fontWeight: "600", fontSize: "13.5px", boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
              }}>Save & Apply</button>
            </div>
          </div>
        </div>
      )}
      {/* ── REPLY STYLE PANEL ── */}
      {showStylePanel && (
        <ReplyStylePanel onClose={handleStyleSave} />
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {projectToDelete && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200
        }}>
          <div style={{
            background: "var(--bg-surface)", width: "380px", borderRadius: "16px",
            boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-medium)",
            padding: "32px", animation: "fadeSlideUp 0.2s ease-out"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SvgIcons.X size={20} />
              </div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", fontFamily: "'Outfit', sans-serif" }}>Delete Project</h2>
            </div>
            
            <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5" }}>
              Are you sure? This will remove the project from your workspace. Type <strong>confirm</strong> to proceed.
            </p>

            <input 
              value={confirmDeleteInput}
              onChange={e => setConfirmDeleteInput(e.target.value)}
              placeholder="Type 'confirm'..."
              style={{
                width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-medium)",
                borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "var(--text-primary)",
                outline: "none", marginBottom: "24px"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => setProjectToDelete(null)} style={{
                padding: "10px 18px", borderRadius: "10px", border: "1px solid var(--border-medium)",
                background: "transparent", color: "var(--text-secondary)", cursor: "pointer",
                fontWeight: "600", fontSize: "13.5px"
              }}>Cancel</button>
              <button 
                onClick={confirmDelete}
                disabled={confirmDeleteInput.trim().toLowerCase() !== "confirm"}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "none",
                  background: confirmDeleteInput.trim().toLowerCase() === "confirm" ? "#dc2626" : "var(--border-medium)",
                  color: confirmDeleteInput.trim().toLowerCase() === "confirm" ? "#fff" : "var(--text-muted)",
                  cursor: confirmDeleteInput.trim().toLowerCase() === "confirm" ? "pointer" : "not-allowed",
                  fontWeight: "600", fontSize: "13.5px", transition: "all 0.2s"
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
