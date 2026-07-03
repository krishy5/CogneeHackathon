import { useState, useEffect } from "react"
import ProjectCard from "../components/ProjectCard"

export default function Dashboard({ projects, onOpenProject, onViewDNA, onUpdateProjects }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newColor, setNewColor] = useState("#8b5cf6")
  const [activeTab, setActiveTab] = useState("Overview") // Overview | Board | List
  const [diagramTab, setDiagramTab] = useState("Diagram") // Diagram | Flow Chart | Map
  const [selectedNodeProject, setSelectedNodeProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)  // { id, name }
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [commentInput, setCommentInput] = useState("")
  const [activities, setActivities] = useState([
    "Sarah Wiliam synced memory namespace 'project_proj_001'",
    "StudioMind AI indexed Dribbble reference URL for Luminary App",
    "Compiled new Style DNA profile for user_demo_001"
  ])

  const colorChoices = ["#8b5cf6", "#f97316", "#10b981", "#06b6d4", "#ec4899", "#ef4444"]

  // Derive active node project (fallback to first project)
  const nodeProject = selectedNodeProject
    ? projects.find(p => p.id === selectedNodeProject) || projects[0]
    : projects[0]

  const handleDeleteProject = () => {
    if (!deleteTarget || deleteConfirmText !== deleteTarget.name) return
    const updated = projects.filter(p => p.id !== deleteTarget.id)
    onUpdateProjects(updated)
    if (typeof window !== "undefined") {
      localStorage.removeItem(`studiomind_memories_${deleteTarget.id}`)
    }
    setDeleteTarget(null)
    setDeleteConfirmText("")
  }

  const createProject = () => {
    if (!newName.trim()) return
    const newProj = {
      id: `proj_${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Creative workspace and style boards",
      color: newColor
    }
    const updated = [...projects, newProj]
    onUpdateProjects(updated)

    // Seed memory for the new project
    if (typeof window !== "undefined") {
      localStorage.setItem(`studiomind_memories_${newProj.id}`, JSON.stringify([
        `Project ${newProj.name} created.`,
        "Memory namespace initialized."
      ]))
    }

    setNewName("")
    setNewDesc("")
    setNewColor("#8b5cf6")
    setShowCreate(false)
  }

  const handleAddComment = () => {
    if (!commentInput.trim()) return
    setActivities(prev => [commentInput.trim(), ...prev])
    setCommentInput("")
  }

  // Count total memory nodes
  const [totalNodes, setTotalNodes] = useState(6)
  useEffect(() => {
    if (typeof window !== "undefined") {
      let count = 0
      projects.forEach(p => {
        const mems = localStorage.getItem(`studiomind_memories_${p.id}`)
        if (mems) {
          try {
            count += JSON.parse(mems).length
          } catch (_) {}
        } else {
          count += 2 // seed fallback
        }
      })
      setTotalNodes(count)
    }
  }, [projects])

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: "24px 40px",
      background: "#f4f5f7"
    }}>
      
      {/* 1. TOP HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "28px",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "16px"
      }}>
        {/* Left Side: Navigation Tabs */}
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "Overview", label: "Overview", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { id: "Board", label: "Board", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
            { id: "List", label: "List", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
          ].map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: isActive ? "#ffffff" : "transparent",
                  border: isActive ? "1px solid #e5e7eb" : "1px solid transparent",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: isActive ? "#0f172a" : "#64748b",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.03)" : "none",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px"
                }}
              >
                {tab.icon}{tab.label}
              </button>
            )
          })}
        </div>

        {/* Right Side: Header actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button 
            onClick={onViewDNA} 
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#475569",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "7px"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m10 16 1 1"/><path d="m2 9 20 6"/></svg>
            Style DNA
          </button>
          
          <button 
            onClick={() => setShowCreate(true)} 
            style={{
              background: "#09090b",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "7px"
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Canvas
          </button>
        </div>
      </div>

      {/* BOARD VIEW */}
      {activeTab === "Board" && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { label: "Planning", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", items: projects.slice(0, 1) },
              { label: "In Progress", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", items: projects.slice(1, 3) },
              { label: "Done", color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", items: [] }
            ].map(col => (
              <div key={col.label} style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div style={{ padding: "14px 18px", background: col.bg, borderBottom: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: col.color, background: `${col.color}20`, padding: "2px 8px", borderRadius: "20px" }}>{col.items.length}</span>
                </div>
                <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: "200px" }}>
                  {col.items.map(proj => (
                    <div key={proj.id} onClick={() => onOpenProject(proj.id)}
                      style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px", cursor: "pointer", borderLeft: `3px solid ${proj.color}`, transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{proj.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748b", marginBottom: "10px", lineHeight: "1.4" }}>{proj.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: proj.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: "700" }}>{proj.name[0]}</div>
                        <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600" }}>Open →</span>
                      </div>
                    </div>
                  ))}
                  {col.items.length === 0 && (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: "12px", fontStyle: "italic" }}>No canvases</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {activeTab === "List" && (
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden", marginBottom: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 130px 90px 80px", padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
            {["Canvas", "Description", "Status", "Memory", ""].map(h => (
              <span key={h} style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>
          {projects.map((proj, i) => {
            const statuses = ["Planning", "In Progress", "In Progress"]
            const statusColors = { "In Progress": ["#8b5cf6", "#f5f3ff"], "Planning": ["#f59e0b", "#fffbeb"], "Done": ["#10b981", "#ecfdf5"] }
            const status = statuses[i] || "Planning"
            const [sc, sbg] = statusColors[status]
            return (
              <div key={proj.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 3fr 130px 90px 80px", padding: "14px 20px", borderBottom: "1px solid #f1f5f9", alignItems: "center", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: proj.color, flexShrink: 0, boxShadow: `0 0 6px ${proj.color}` }} />
                  <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>{proj.name}</span>
                </div>
                <span style={{ fontSize: "12.5px", color: "#64748b", paddingRight: "12px" }}>{proj.description}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: sc, background: sbg, padding: "4px 10px", borderRadius: "20px", width: "fit-content" }}>{status}</span>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>2 nodes</span>
                <button onClick={() => onOpenProject(proj.id)} style={{ background: "#09090b", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Open</button>
              </div>
            )
          })}
          {projects.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>No canvases yet.</div>
          )}
        </div>
      )}

      {activeTab === "Overview" && <>

      {/* Inline project creator block */}
      {showCreate && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
          animation: "slideDown 0.2s ease-out"
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700" }}>New Canvas</h3>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Canvas name..."
              style={inputStyle}
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Brief description..."
              style={{ ...inputStyle, flex: 2 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {colorChoices.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: c,
                    border: newColor === c ? "2px solid #000" : "none",
                    cursor: "pointer"
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={createProject} disabled={!newName.trim()} style={primaryBtn}>Create</button>
              <button onClick={() => setShowCreate(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DYNAMIC WORKSPACE BOARD (Inspired by the Rinko Project Flowchart area) */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.04)",
        marginBottom: "28px",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Board Header Section */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "16px",
          marginBottom: "24px"
        }}>
          {/* Diagrams Tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            {["Diagram", "Flow Chart", "Map"].map(t => {
              const isActive = diagramTab === t
              return (
                <button
                  key={t}
                  onClick={() => setDiagramTab(t)}
                  style={{
                    background: isActive ? "#f1f5f9" : "transparent",
                    border: isActive ? "1px solid #e2e8f0" : "1px solid transparent",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    color: isActive ? "#0f172a" : "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {t === "Diagram" ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></svg>Diagram</>
                  ) : t === "Flow Chart" ? (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z"/><path d="M17 15a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-2z"/><path d="M5 15a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H5z"/><path d="M12 7v4"/><path d="M6 13v2"/><path d="M18 13v2"/><path d="M9 11h6"/></svg>Flow Chart</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v3l-5.5 7"/><path d="M12 10l5.5 7"/></svg>Node Map</>
                  )}
                </button>
              )
            })}
          </div>

          {/* Project selector for node map */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>
            <select
              value={selectedNodeProject || (projects[0]?.id ?? "")}
              onChange={e => setSelectedNodeProject(e.target.value)}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
                cursor: "pointer",
                outline: "none"
              }}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── DIAGRAM TAB ── */}
        {diagramTab === "Diagram" && (
          <div style={{ position: "relative", height: "260px", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 700 260" preserveAspectRatio="xMidYMid meet">
              {/* connector lines */}
              <line x1="350" y1="60" x2="350" y2="100" stroke="#cbd5e1" strokeWidth="1.5"/>
              <line x1="350" y1="160" x2="175" y2="200" stroke="#cbd5e1" strokeWidth="1.5"/>
              <line x1="350" y1="160" x2="350" y2="200" stroke="#cbd5e1" strokeWidth="1.5"/>
              <line x1="350" y1="160" x2="525" y2="200" stroke="#cbd5e1" strokeWidth="1.5"/>
              {/* root */}
              <rect x="270" y="20" width="160" height="40" rx="8" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2"/>
              <text x="350" y="36" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="800">WORKSPACE</text>
              <text x="350" y="52" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">{nodeProject?.name || "Project"}</text>
              {/* middle */}
              <rect x="270" y="100" width="160" height="60" rx="8" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1.5"/>
              <text x="350" y="118" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="800">DESIGN SYSTEM</text>
              <text x="350" y="134" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600">Components</text>
              <text x="350" y="150" textAnchor="middle" fill="#64748b" fontSize="10">Tokens · Patterns</text>
              {/* leaves */}
              {[{x:95,y:200,label:"Style DNA",sub:"Colors & Type",c:"#a855f7",bc:"#f5f3ff"},{x:270,y:200,label:"Memory",sub:"Cognee Graph",c:"#06b6d4",bc:"#ecfeff"},{x:445,y:200,label:"Inspiration",sub:"Dribbble refs",c:"#10b981",bc:"#ecfdf5"}].map(n=>(
                <g key={n.label}>
                  <rect x={n.x} y={n.y} width="160" height="48" rx="8" fill={n.bc} stroke={n.c} strokeWidth="1.5"/>
                  <text x={n.x+80} y={n.y+18} textAnchor="middle" fill={n.c} fontSize="9" fontWeight="800">{n.label.toUpperCase()}</text>
                  <text x={n.x+80} y={n.y+34} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600">{n.sub}</text>
                </g>
              ))}
            </svg>
          </div>
        )}

        {/* ── FLOW CHART TAB ── */}
        {diagramTab === "Flow Chart" && (
          <div style={{ position: "relative", height: "260px", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 700 260" preserveAspectRatio="xMidYMid meet">
              {/* arrows */}
              {[[350,44,350,72],[350,92,350,120],[350,140,230,178],[350,140,470,178],[230,218,230,238],[470,218,470,238]].map(([x1,y1,x2,y2],i)=>(
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arr)"/>
                </g>
              ))}
              <defs>
                <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8"/>
                </marker>
              </defs>
              {/* start */}
              <ellipse cx="350" cy="28" rx="60" ry="16" fill="#09090b"/>
              <text x="350" y="33" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">Start</text>
              {/* process 1 */}
              <rect x="270" y="72" width="160" height="48" rx="6" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="1.5"/>
              <text x="350" y="90" textAnchor="middle" fill="#6d28d9" fontSize="9" fontWeight="800">STEP 1</text>
              <text x="350" y="108" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600">Ingest Inspiration</text>
              {/* decision */}
              <polygon points="350,120 430,150 350,180 270,150" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5"/>
              <text x="350" y="147" textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="700">Style Match?</text>
              {/* yes / no */}
              <text x="200" y="172" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="700">Yes</text>
              <text x="500" y="172" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">No</text>
              {/* outcomes */}
              <rect x="150" y="178" width="160" height="40" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5"/>
              <text x="230" y="203" textAnchor="middle" fill="#065f46" fontSize="11" fontWeight="600">Save to Memory</text>
              <rect x="390" y="178" width="160" height="40" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5"/>
              <text x="470" y="203" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="600">Refine Prompt</text>
              {/* end nodes */}
              <ellipse cx="230" cy="244" rx="50" ry="14" fill="#10b981"/>
              <text x="230" y="249" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">Done</text>
              <ellipse cx="470" cy="244" rx="50" ry="14" fill="#ef4444"/>
              <text x="470" y="249" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">Retry</text>
            </svg>
          </div>
        )}

        {/* ── NODE MAP TAB ── */}
        {diagramTab === "Map" && (
          <div style={{ position: "relative", height: "260px", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
            <svg width="100%" height="100%" viewBox="0 0 700 260" preserveAspectRatio="xMidYMid meet">
              {/* edges from center */}
              {[[350,130,140,50],[350,130,560,50],[350,130,100,180],[350,130,600,180],[350,130,250,230],[350,130,450,230]].map(([x1,y1,x2,y2],i)=>(
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3"/>
              ))}
              {/* center node */}
              <circle cx="350" cy="130" r="36" fill={nodeProject?.color || "#8b5cf6"} opacity="0.15"/>
              <circle cx="350" cy="130" r="28" fill={nodeProject?.color || "#8b5cf6"}/>
              <text x="350" y="126" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="800">ROOT</text>
              <text x="350" y="140" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{(nodeProject?.name || "Project").split(" ")[0]}</text>
              {/* satellite nodes */}
              {[
                {cx:140,cy:50,label:"Style DNA",color:"#a855f7"},
                {cx:560,cy:50,label:"Typography",color:"#f97316"},
                {cx:100,cy:180,label:"Layout",color:"#06b6d4"},
                {cx:600,cy:180,label:"Inspiration",color:"#10b981"},
                {cx:250,cy:230,label:"Memory",color:"#6366f1"},
                {cx:450,cy:230,label:"Components",color:"#ec4899"},
              ].map(n=>(
                <g key={n.label}>
                  <circle cx={n.cx} cy={n.cy} r="22" fill={n.color} opacity="0.12"/>
                  <circle cx={n.cx} cy={n.cy} r="16" fill={n.color}/>
                  <text x={n.cx} y={n.cy+4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800">{n.label.slice(0,4).toUpperCase()}</text>
                  <text x={n.cx} y={n.cy+26} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="600">{n.label}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* 4. ACTIVE PROJECTS GRID CARD */}
      <h3 style={{
        fontSize: "16px",
        fontWeight: "700",
        fontFamily: "'Outfit', sans-serif",
        color: "#0f172a",
        marginBottom: "18px"
      }}>
        Workspace Canvases
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
        marginBottom: "32px"
      }}>
        {projects.map(proj => (
          <ProjectCard
            key={proj.id}
            project={proj}
            onClick={() => onOpenProject(proj.id)}
            onDelete={() => { setDeleteTarget(proj); setDeleteConfirmText("") }}
          />
        ))}
      </div>

      {/* 5. ACTIVITY LOGGER & COMMENTS BOX (Inspired by bottom comment bar) */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #eef0f3",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.04)"
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "7px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Activity Logs
        </h3>
        
        {/* Comment input area */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          <input
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddComment()}
            placeholder="Leave a comment or prompt note..."
            style={{
              flex: 1,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              outline: "none"
            }}
          />
          <button onClick={handleAddComment} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post
          </button>
        </div>

        {/* Activities history list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activities.map((act, i) => (
            <div key={i} style={{
              fontSize: "12.5px",
              color: "#475569",
              padding: "8px 12px",
              background: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {act}
            </div>
          ))}
        </div>
      </div>

      </> }

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }} onClick={() => { setDeleteTarget(null); setDeleteConfirmText("") }}>
          <div style={{
            background: "#ffffff", borderRadius: "16px", padding: "28px",
            width: "380px", boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
            animation: "slideDown 0.2s ease-out"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Delete Canvas</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>This action cannot be undone</div>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", margin: "16px 0 8px", lineHeight: "1.5" }}>
              Type <strong style={{ color: "#0f172a" }}>{deleteTarget.name}</strong> to confirm deletion.
            </p>
            <input
              autoFocus
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDeleteProject()}
              placeholder={deleteTarget.name}
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${deleteConfirmText === deleteTarget.name ? "#ef4444" : "#e5e7eb"}`,
                borderRadius: "10px", padding: "10px 14px",
                fontSize: "13px", outline: "none", marginBottom: "16px",
                background: deleteConfirmText === deleteTarget.name ? "#fef2f2" : "#ffffff"
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmText("") }}
                style={secondaryBtn}
              >Cancel</button>
              <button
                onClick={handleDeleteProject}
                disabled={deleteConfirmText !== deleteTarget.name}
                style={{
                  ...primaryBtn,
                  background: deleteConfirmText === deleteTarget.name ? "#ef4444" : "#cbd5e1",
                  cursor: deleteConfirmText === deleteTarget.name ? "pointer" : "not-allowed"
                }}
              >Delete Canvas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline Style blocks for Dashboard
const statCardStyle = {
  background: "#ffffff",
  border: "1px solid #eef0f3",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 4px 20px -8px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
}

const statHeaderStyle = {
  fontSize: "11px",
  color: "#94a3b8",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
}

const nodeBoxStyle = {
  position: "absolute",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
  zIndex: 2,
  minWidth: "120px"
}

const nodeHeaderStyle = {
  fontSize: "8px",
  color: "#94a3b8",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
}

const nodeTitleStyle = {
  fontSize: "11.5px",
  fontWeight: "600",
  color: "#334155",
  marginTop: "2px"
}

const inputStyle = {
  flex: 1,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  outline: "none"
}

const primaryBtn = {
  background: "#09090b",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600"
}

const secondaryBtn = {
  background: "transparent",
  color: "#64748b",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "13px"
}
