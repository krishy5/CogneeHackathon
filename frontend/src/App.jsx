import { useState, useEffect } from "react"
import Dashboard from "./pages/Dashboard"
import Chat from "./pages/Chat"
import StyleDNA from "./pages/StyleDNA"
import Inspiration from "./pages/Inspiration"
import MemoryGraph from "./pages/MemoryGraph"
import AuthPage from "./pages/AuthPage"
import { getSession, saveSession, clearSession, fetchProjects, persistProjects, BACKEND } from "./auth"

function AuthModal({ mode: initialMode, onAuth, onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError(""); setLoading(true)
    try {
      const res = await fetch(mode === "login" ? `${BACKEND}/auth/login` : `${BACKEND}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      })
      const text = await res.text()
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch { throw new Error("Backend unavailable, please try again") }
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
      onAuth(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "36px 40px", width: "100%", maxWidth: "400px", boxShadow: "0 24px 60px rgba(0,0,0,0.15)", border: "1px solid #eef0f3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mode === "register" && <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={iStyle} onFocus={e => e.target.style.borderColor="#8b5cf6"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={iStyle} onFocus={e => e.target.style.borderColor="#8b5cf6"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={iStyle} onFocus={e => e.target.style.borderColor="#8b5cf6"} onBlur={e => e.target.style.borderColor="#e2e8f0"} />
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc2626" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? "#e2e8f0" : "linear-gradient(135deg,#8b5cf6,#6366f1)", color: loading ? "#94a3b8" : "#fff", border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", marginTop: "4px" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          {mode === "login" ? "No account? " : "Have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }} style={{ background: "none", border: "none", color: "#8b5cf6", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}
const iStyle = { padding: "11px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#1e293b", outline: "none", transition: "border-color 0.15s", background: "#fafafa", width: "100%", boxSizing: "border-box" }

const SEED_PROJECTS = [
  { id: "proj_001", name: "Luminary App", description: "Meditation & sleep tracker", color: "#8b5cf6" },
  { id: "proj_002", name: "Forge Design System", description: "B2B SaaS component library", color: "#f59e0b" },
  { id: "proj_003", name: "Nova Brand", description: "Fintech startup identity", color: "#10b981" },
]

export default function App() {
  const [session, setSession] = useState(getSession)
  const [showAuth, setShowAuth] = useState(null) // null | "login" | "register"
  const [page, setPage] = useState("dashboard")
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  // Load projects from backend on login/refresh
  useEffect(() => {
    if (!session) return
    fetchProjects().then(serverProjects => {
      setProjects(serverProjects || [])
    })
  }, [session])

  const handleAuth = (data) => {
    saveSession(data)
    setSession(data)
    setShowAuth(null)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setProjects([])
    setPage("dashboard")
  }

  const updateProjectsList = (newList) => {
    setProjects(newList)
    persistProjects(newList)
  }

  const handleNavigate = (pageName, projectId = null) => {
    setPage(pageName)
    if (projectId) setActiveProjectId(projectId)
  }

  if (!session) return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#f4f5f7", color: "#1e293b", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar — guest mode */}
      <div style={{ width: "250px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px 18px", boxSizing: "border-box", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#09090b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "12px", height: "12px", border: "2px solid #fff", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "#09090b", fontFamily: "'Outfit', sans-serif" }}>StudioMind</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "12px", padding: "16px" }}>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>Sign in to save your projects, chats, and memory across sessions.</p>
          <button onClick={() => setShowAuth("login")} style={{ width: "100%", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff", border: "none", borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "13.5px", cursor: "pointer", marginBottom: "8px" }}>Sign In</button>
          <button onClick={() => setShowAuth("register")} style={{ width: "100%", background: "#fff", color: "#6366f1", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", fontWeight: "700", fontSize: "13.5px", cursor: "pointer" }}>Create Account</button>
        </div>
      </div>
      {/* Main — guest dashboard */}
      <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Dashboard projects={SEED_PROJECTS} onOpenProject={() => setShowAuth("login")} onViewDNA={() => setShowAuth("login")} onUpdateProjects={() => setShowAuth("login")} />
      </div>
      {/* Auth modal */}
      {showAuth && <AuthModal mode={showAuth} onAuth={handleAuth} onClose={() => setShowAuth(null)} />}
    </div>
  )

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#f4f5f7", color: "#1e293b", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: "250px", background: "#f9fafb", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", padding: "24px 18px", boxSizing: "border-box", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px", paddingLeft: "4px" }}>
          <div style={{ width: "32px", height: "32px", backgroundColor: "#09090b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
            onClick={() => handleNavigate("dashboard")}>
            <div style={{ width: "12px", height: "12px", border: "2px solid #ffffff", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "#09090b", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.01em" }}>StudioMind</span>
        </div>

        {/* User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "800", color: "#fff", flexShrink: 0 }}>
            {session.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", fontFamily: "'Outfit', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.name}</div>
            <div style={{ fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.email}</div>
          </div>
          <button onClick={handleLogout} title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", borderRadius: "6px", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search canvas..."
            style={{ width: "100%", boxSizing: "border-box", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 12px 10px 32px", fontSize: "13px", color: "#1e293b", outline: "none" }} />
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", color: "#94a3b8", pointerEvents: "none" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
        </div>

        {/* Nav */}
        <div style={{ marginBottom: "28px" }}>
          <span style={sidebarHeaderStyle}>General</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
            {[
              { id: "dashboard", label: "Dashboard", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
              { id: "dna", label: "Style DNA", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m10 16 1 1"/><path d="m2 9 20 6"/></svg> },
              { id: "memory-graph", label: "Memory Graph", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v3l-5.5 7"/><path d="M12 10l5.5 7"/></svg> },
              { id: "inspiration", label: "Inspiration", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg> }
            ].map(item => {
              const isActive = page === item.id
              return (
                <div key={item.id} onClick={() => handleNavigate(item.id)} style={{ ...sidebarItemStyle, backgroundColor: isActive ? "#ffffff" : "transparent", color: isActive ? "#1e293b" : "#64748b", fontWeight: isActive ? "700" : "500", boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.03)" : "none", border: isActive ? "1px solid #e5e7eb" : "1px solid transparent" }}>
                  <span style={{ marginRight: "10px", display: "flex", alignItems: "center", color: isActive ? "#8b5cf6" : "#94a3b8" }}>{item.icon}</span>
                  {item.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Projects */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <span style={sidebarHeaderStyle}>Private Space</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
            {filteredProjects.map(proj => {
              const isActive = page === "chat" && activeProjectId === proj.id
              return (
                <div key={proj.id} onClick={() => handleNavigate("chat", proj.id)} style={{ ...sidebarItemStyle, backgroundColor: isActive ? "#ffffff" : "transparent", color: isActive ? "#1e293b" : "#64748b", fontWeight: isActive ? "700" : "500", boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.03)" : "none", border: isActive ? "1px solid #e5e7eb" : "1px solid transparent" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: proj.color, marginRight: "12px", flexShrink: 0, boxShadow: `0 0 6px ${proj.color}` }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{proj.name}</span>
                </div>
              )
            })}
            {filteredProjects.length === 0 && (
              <div style={{ fontSize: "12px", color: "#94a3b8", padding: "8px 12px", fontStyle: "italic" }}>No canvas found</div>
            )}
          </div>
        </div>

        {/* Memory badge */}
        <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "12px", padding: "12px 14px", marginTop: "16px" }}>
          <span style={{ fontSize: "11px", color: "#6366f1", fontWeight: "700", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Memory Sync</span>
          <span style={{ fontSize: "11.5px", color: "#64748b", lineHeight: "1.4", display: "block" }}>Cognee namespace: {session.user_id}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {page === "dashboard" && <Dashboard projects={projects} onOpenProject={id => handleNavigate("chat", id)} onViewDNA={() => handleNavigate("dna")} onUpdateProjects={updateProjectsList} />}
        {page === "chat" && <Chat projectId={activeProjectId} userId={session.user_id} onBack={() => handleNavigate("dashboard")} onInspiration={() => handleNavigate("inspiration")} />}
        {page === "dna" && <StyleDNA userId={session.user_id} projects={projects} onBack={() => handleNavigate("dashboard")} />}
        {page === "memory-graph" && <MemoryGraph projects={projects} onBack={() => handleNavigate("dashboard")} />}
        {page === "inspiration" && <Inspiration projectId={activeProjectId || projects[0]?.id} onBack={() => handleNavigate(activeProjectId ? "chat" : "dashboard")} />}
      </div>
    </div>
  )
}

const sidebarHeaderStyle = { fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.08em", display: "block", paddingLeft: "10px" }
const sidebarItemStyle = { display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: "10px", fontSize: "13.5px", cursor: "pointer", transition: "all 0.15s ease-in-out", boxSizing: "border-box" }
