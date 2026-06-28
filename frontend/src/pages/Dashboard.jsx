import { useState, useEffect } from "react"
import ProjectCard from "../components/ProjectCard"
import { SvgIcons } from "../icons"
import { getActivities, logActivity, getStats, getAllMemories, getLocalFacts } from "../api"

export default function Dashboard({ projects, onOpenProject, onDeleteProject, onViewDNA, onUpdateProjects }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newColor, setNewColor] = useState("#7c3aed")
  const [activeTab, setActiveTab] = useState("Overview")
  const [commentInput, setCommentInput] = useState("")
  const [totalNodes, setTotalNodes] = useState(0)
  const [activities, setActivities] = useState([])
  const [statsData, setStatsData] = useState({ ingestCount: 0, alignment: "75.0" })
  const [tasks, setTasks] = useState({
    todo: ["Homepage layout", "Color system tokens"],
    inProgress: ["Typography scale"],
    done: ["Brand mood board", "Logo concepts", "Inspiration ingested"]
  })
  const [newTaskInput, setNewTaskInput] = useState("")
  const [facts, setFacts] = useState([])

  const colorChoices = ["#7c3aed", "#f97316", "#10b981", "#06b6d4", "#ec4899", "#ef4444", "#6366f1", "#f59e0b"]

  useEffect(() => {
    // Load real stats, activities, and facts
    setActivities(getActivities().slice(0, 5))
    setStatsData(getStats())
    
    const allFacts = getLocalFacts()
    const factsArray = Object.keys(allFacts).map(k => ({ label: "Fact", value: allFacts[k].value })).reverse()
    setFacts(factsArray)
    
    // Load real memory count
    getAllMemories().then(mems => setTotalNodes(mems.length))

    // Load tasks from local storage
    try {
      const storedTasks = localStorage.getItem('studiomind_board_tasks')
      if (storedTasks) setTasks(JSON.parse(storedTasks))
    } catch (_) {}
  }, [activeTab])

  const createProject = () => {
    if (!newName.trim()) return
    const newProj = { id: `proj_${Date.now()}`, name: newName.trim(), description: newDesc.trim() || "Creative workspace and style boards", color: newColor }
    onUpdateProjects([...projects, newProj])
    logActivity(`Created new workspace: ${newProj.name}`)
    setActivities(getActivities().slice(0, 5))
    setNewName(""); setNewDesc(""); setNewColor("#7c3aed"); setShowCreate(false)
  }

  const handleAddComment = () => {
    if (!commentInput.trim()) return
    logActivity(`Note: ${commentInput.trim()}`)
    setActivities(getActivities().slice(0, 5))
    setCommentInput("")
  }

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return
    const updatedTasks = { ...tasks, todo: [newTaskInput.trim(), ...tasks.todo] }
    setTasks(updatedTasks)
    localStorage.setItem('studiomind_board_tasks', JSON.stringify(updatedTasks))
    setNewTaskInput("")
    logActivity(`Added task: ${newTaskInput.trim()}`)
  }

  const statIcons = [
    <SvgIcons.Image size={16}/>,
    <SvgIcons.Grid size={16}/>,
    <SvgIcons.Brain size={16}/>,
    <SvgIcons.Check size={16}/>,
  ]

  const timeAgo = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return `${Math.floor(diff/86400)}d ago`
  }

  const activeProjectName = localStorage.getItem('studiomind_last_active_project')
  const activeProject = projects.find(p => p.id === activeProjectName) || projects[0]

  const stats = [
    { label: "Inspirations Ingested", value: `${statsData.ingestCount} URLs`, sub: "Saved vectors", color: "#7c3aed", bg: "#faf5ff" },
    { label: "Style Alignment", value: statsData.alignment, sub: "Based on facts", color: "#10b981", bg: "#f0fdf4" },
    { label: "Memory Nodes", value: `${totalNodes}`, sub: "Mem0 graph entries", color: "#6366f1", bg: "#eef2ff" },
    { label: "Active Workspace", value: activeProject?.name || "None", sub: "Last opened", color: "#f59e0b", bg: "#fffbeb" },
  ]

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", background: "#f8fafc", height: "100%", boxSizing: "border-box", minHeight: 0 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <h1 style={{ margin: "0 0 3px", fontSize: "22px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", color: "#0f172a" }}>Workspace</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Your AI-powered creative command center</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "2px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "3px" }}>
            {["Overview", "Board", "List"].map(tab => {
              const isActive = activeTab === tab
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: isActive ? "#ffffff" : "transparent", border: isActive ? "1px solid #e2e8f0" : "1px solid transparent", borderRadius: "7px", padding: "5px 14px", fontSize: "12.5px", fontWeight: "600", color: isActive ? "#0f172a" : "#64748b", cursor: "pointer", transition: "all 0.12s", boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>
                  {tab}
                </button>
              )
            })}
          </div>
          <button onClick={onViewDNA} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "7px 15px", fontSize: "12.5px", fontWeight: "600", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.12s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.color = "#7c3aed" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569" }}>
            <SvgIcons.Dna size={14}/> Style DNA
          </button>
          <button onClick={() => setShowCreate(true)} style={{ background: "#0f172a", color: "#ffffff", border: "none", borderRadius: "9px", padding: "7px 16px", fontSize: "12.5px", fontWeight: "700", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e293b"}
            onMouseLeave={e => e.currentTarget.style.background = "#0f172a"}>
            + New Canvas
          </button>
        </div>
      </div>

      {/* STAT CARDS — always visible */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "50"; e.currentTarget.style.boxShadow = `0 4px 16px ${s.color}12` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {statIcons[i]}
              </div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", fontFamily: "'Outfit', sans-serif", lineHeight: 1, marginBottom: "3px" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#ffffff", width: "480px", borderRadius: "16px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>New Canvas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Canvas name..." style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "10px 13px", fontSize: "13px", color: "#0f172a", outline: "none" }} />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "10px 13px", fontSize: "13px", color: "#0f172a", outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "7px" }}>
                {colorChoices.map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, border: newColor === c ? "3px solid #0f172a" : "2px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setShowCreate(false)} style={{ background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "9px 18px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
                <button onClick={createProject} disabled={!newName.trim()} style={{ background: newName.trim() ? "#0f172a" : "#e2e8f0", color: newName.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: "9px", padding: "9px 20px", cursor: newName.trim() ? "pointer" : "not-allowed", fontSize: "13px", fontWeight: "600" }}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "Overview" && (
        <>
          {/* Memory Node Map */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <SvgIcons.Brain size={16} color="#7c3aed"/>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Memory Node Map</span>
              </div>
              <span style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "700", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "5px", padding: "2px 8px" }}>Mem0 Graph</span>
            </div>
            <div style={{ position: "relative", height: "210px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                {[["50%","50%","20%","25%"],["50%","50%","80%","25%"],["50%","50%","20%","75%"],["50%","50%","80%","75%"]].map(([x1,y1,x2,y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5 4" />
                ))}
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#ffffff", border: "2px solid #a78bfa", borderRadius: "10px", padding: "9px 16px", textAlign: "center", boxShadow: "0 4px 16px rgba(124,58,237,0.15)", zIndex: 3 }}>
                <div style={{ fontSize: "8.5px", color: "#7c3aed", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Root</div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>Designer DNA</div>
              </div>
              
              {(() => {
                const colors = ["#7c3aed", "#f97316", "#06b6d4", "#10b981"]
                const defaultNodes = [
                  { label: "Style", value: "Premium White" },
                  { label: "Typography", value: "Outfit + Inter" },
                  { label: "Layout", value: "Clean & Modern" },
                  { label: "Inspiration", value: "AI-Driven" }
                ]
                
                const displayNodes = facts.length > 0 
                  ? facts.slice(0, 4) 
                  : defaultNodes;
                  
                // Fill if less than 4 facts
                while (displayNodes.length < 4) {
                  displayNodes.push(defaultNodes[displayNodes.length])
                }

                return displayNodes.map((node, i) => {
                  const pos = [
                    { top: "12%", left: "6%" },
                    { top: "12%", right: "6%" },
                    { bottom: "12%", left: "6%" },
                    { bottom: "12%", right: "6%" }
                  ][i]
                  const color = colors[i]
                  
                  return (
                    <div key={i} style={{ position: "absolute", ...pos, background: "#ffffff", border: "1px solid #e2e8f0", borderLeft: `3px solid ${color}`, borderRadius: "8px", padding: "8px 11px", zIndex: 2, minWidth: "100px", maxWidth: "160px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "8px", color: color, fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>{node.label}</div>
                      <div style={{ fontSize: "10.5px", color: "#475569", fontWeight: "500", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{node.value}</div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Project Grid */}
          <h2 style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>Workspace Canvases</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            {projects.map(proj => <ProjectCard key={proj.id} project={proj} onClick={() => onOpenProject(proj.id)} onDelete={onDeleteProject} />)}
          </div>

          {/* Activity Log */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "12px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.06em" }}>Activity Logs</h3>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
              <input value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddComment()} placeholder="Add a workspace note..."
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "9px 13px", fontSize: "13px", color: "#0f172a", outline: "none" }} />
              <button onClick={handleAddComment} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: "9px", padding: "9px 16px", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}>Post</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {activities.map((act, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#475569", padding: "9px 13px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                    {act.text}
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "11px", flexShrink: 0, marginLeft: "12px" }}>
                    {act.time ? timeAgo(act.time) : "recently"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── BOARD TAB ── */}
      {activeTab === "Board" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { label: "To Design", color: "#f59e0b", items: tasks.todo, isTodo: true },
            { label: "In Progress", color: "#6366f1", items: tasks.inProgress },
            { label: "Done", color: "#10b981", items: tasks.done },
          ].map((col, i) => (
            <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#94a3b8", fontWeight: "600", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "1px 8px" }}>{col.items.length}</span>
              </div>
              
              {col.isTodo && (
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                  <input value={newTaskInput} onChange={e => setNewTaskInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTask()} placeholder="Add task..." style={{ flex: 1, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", outline: "none" }} />
                  <button onClick={handleAddTask} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", padding: "0 10px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>+</button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                {col.items.map((item, j) => (
                  <div key={j} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 13px", fontSize: "13px", color: "#334155", cursor: "grab", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = col.color + "60"; e.currentTarget.style.boxShadow = `0 3px 10px ${col.color}15` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)" }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {activeTab === "List" && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            {["Project", "Status", "Memory Nodes", "Last Active"].map(h => (
              <span key={h} style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
            ))}
          </div>
          {projects.map((proj, i) => {
            const chatLog = localStorage.getItem(`studiomind_chats_${proj.id}`)
            const msgCount = chatLog ? JSON.parse(chatLog).length : 0
            const lastActiveTs = localStorage.getItem(`studiomind_last_active_time_${proj.id}`)
            
            return (
              <div key={proj.id} onClick={() => onOpenProject(proj.id)} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < projects.length - 1 ? "1px solid #f1f5f9" : "none", cursor: "pointer", transition: "background 0.12s", alignItems: "center" }}

                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: proj.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>{proj.name}</div>
                    <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>{proj.description}</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "2px 10px", width: "fit-content", fontWeight: "600" }}>Active</span>
                <span style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>{msgCount} messages</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>{lastActiveTs ? timeAgo(parseInt(lastActiveTs, 10)) : "Never"}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }}
                    style={{
                      background: "transparent", border: "none", padding: "4px",
                      color: "#94a3b8", cursor: "pointer", borderRadius: "6px"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fee2e2" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent" }}
                  >
                    <SvgIcons.X size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
