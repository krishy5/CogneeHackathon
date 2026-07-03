import { useState, useEffect, useRef } from "react"
import { getMemoryGraph } from "../api"

const COLORS = ["#6366f1", "#ec4899", "#10b981", "#f97316", "#06b6d4", "#8b5cf6", "#f59e0b"]

function forceLayout(nodes, links, width, height) {
  const ITERATIONS = 120, REPULSION = 8000, SPRING_LENGTH = 130, SPRING_K = 0.05, DAMPING = 0.85
  const pos = nodes.map((n, i) => ({
    x: width / 2 + Math.cos((i / nodes.length) * Math.PI * 2) * 160,
    y: height / 2 + Math.sin((i / nodes.length) * Math.PI * 2) * 160,
    vx: 0, vy: 0, id: n.id
  }))
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = REPULSION / (dist * dist)
        pos[i].vx += (dx / dist) * force; pos[i].vy += (dy / dist) * force
        pos[j].vx -= (dx / dist) * force; pos[j].vy -= (dy / dist) * force
      }
    }
    for (const link of links) {
      const a = pos.find(p => p.id === link.source), b = pos.find(p => p.id === link.target)
      if (!a || !b) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - SPRING_LENGTH) * SPRING_K
      a.vx += (dx / dist) * force; a.vy += (dy / dist) * force
      b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force
    }
    for (const p of pos) {
      p.vx *= DAMPING; p.vy *= DAMPING
      p.x = Math.max(60, Math.min(width - 60, p.x + p.vx))
      p.y = Math.max(60, Math.min(height - 60, p.y + p.vy))
    }
  }
  return pos
}

export default function MemoryGraph({ onBack, projects }) {
  const [nodes, setNodes] = useState([])
  const [links, setLinks] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [cogneeStatus, setCogneeStatus] = useState("connecting")
  const [selected, setSelected] = useState(null)
  const svgRef = useRef(null)
  const W = 800, H = 520

  useEffect(() => {
    async function buildGraph() {
      setLoading(true)
      setCogneeStatus("connecting")
      const baseNodes = [
        { id: "user_root", label: "You", group: "user", detail: "Root of your knowledge graph" },
        ...(projects || []).map(p => ({
          id: `proj_${p.id}`, label: p.name, group: "project", color: p.color,
          detail: p.description || "Design workspace"
        }))
      ]
      const baseLinks = (projects || []).map(p => ({ source: "user_root", target: `proj_${p.id}` }))
      let allNodes = [...baseNodes], allLinks = [...baseLinks]

      try {
        const graphData = await Promise.all((projects || []).map(p => getMemoryGraph(p.id)))
        setCogneeStatus("connected")
        const seen = new Set(baseNodes.map(n => n.id))
        graphData.forEach((data, i) => {
          const projId = `proj_${projects[i].id}`
          ;(data.nodes || []).forEach(node => {
            if (!seen.has(node.id)) {
              seen.add(node.id)
              allNodes.push({ ...node, detail: node.detail || node.label })
              allLinks.push({ source: projId, target: node.id, label: "" })
            }
          })
          ;(data.edges || []).forEach(edge => {
            if (seen.has(edge.source) && seen.has(edge.target)) {
              allLinks.push({ source: edge.source, target: edge.target, label: edge.label || "" })
            }
          })
        })
      } catch {
        setCogneeStatus("fallback")
      }

      const pos = forceLayout(allNodes, allLinks, W, H)
      setNodes(allNodes); setLinks(allLinks); setPositions(pos)
      setLoading(false)
    }
    buildGraph()
  }, [projects])

  const getPos = id => positions.find(p => p.id === id) || { x: W / 2, y: H / 2 }

  const getNodeStyle = node => {
    if (node.group === "user") return { r: 28, fill: "#0f172a", stroke: "#6366f1", sw: 3 }
    if (node.group === "project") return { r: 20, fill: node.color || "#6366f1", stroke: "#fff", sw: 2.5 }
    return { r: 11, fill: "#e0e7ff", stroke: "#6366f1", sw: 1.5 }
  }

  const statusBadge = {
    connecting: ["#f59e0b", "⏳ Connecting..."],
    connected: ["#10b981", "✓ Cognee Cloud Live"],
    fallback: ["#f97316", "⚡ Local Mode"]
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "#f8fafc" }}>
      <button onClick={onBack} style={{
        background: "transparent", border: "none", color: "#64748b",
        cursor: "pointer", marginBottom: "20px", fontSize: "13.5px", fontWeight: "600",
        display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px"
      }}>← Dashboard</button>

      {/* Header */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px 28px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "30px" }}>🕸️</span>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", color: "#0f172a" }}>Live Memory Graph</h1>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Real-time Cognee knowledge graph. Click any node to inspect.</p>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px", background: "#f1f5f9",
            border: `1px solid ${statusBadge[cogneeStatus]?.[0]}30`,
            borderRadius: "8px", padding: "8px 14px", fontSize: "12.5px", fontWeight: "700", color: statusBadge[cogneeStatus]?.[0]
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusBadge[cogneeStatus]?.[0], animation: cogneeStatus === "connected" ? "pulse 2s infinite" : "none" }} />
            {statusBadge[cogneeStatus]?.[1]}
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
          {[{ color: "#0f172a", label: "You (Root)" }, { color: "#6366f1", label: "Workspace" }, { color: "#e0e7ff", label: "Memory Node" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: "600", color: "#64748b" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color, border: "1.5px solid #6366f1" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Graph + Side Panel */}
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {/* Graph Canvas */}
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          {loading ? (
            <div style={{ height: "520px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "#94a3b8" }}>
              <div style={{ width: "32px", height: "32px", border: "3px solid #e2e8f0", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span style={{ fontWeight: "600", fontSize: "14px" }}>Traversing Cognee Graph...</span>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="520" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width={W} height={H} fill="url(#grid)" />

              {links.map((link, i) => {
                const sp = getPos(link.source), tp = getPos(link.target)
                const mx = (sp.x + tp.x) / 2, my = (sp.y + tp.y) / 2
                return (
                  <g key={i}>
                    <line x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
                    {link.label && (
                      <text x={mx} y={my - 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">{link.label}</text>
                    )}
                  </g>
                )
              })}

              {nodes.map(node => {
                const { x, y } = getPos(node.id)
                const { r, fill, stroke, sw } = getNodeStyle(node)
                const isUser = node.group === "user"
                const isSelected = selected?.id === node.id
                return (
                  <g key={node.id} onClick={() => setSelected(selected?.id === node.id ? null : node)} style={{ cursor: "pointer" }}>
                    {isUser && <circle cx={x} cy={y} r={r + 8} fill="#6366f1" opacity="0.1" />}
                    {isSelected && <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#6366f1" strokeWidth="2.5" opacity="0.6" />}
                    <circle cx={x} cy={y} r={r} fill={fill} stroke={isSelected ? "#6366f1" : stroke} strokeWidth={isSelected ? sw + 1 : sw}
                      style={{ filter: isUser ? "url(#glow)" : "drop-shadow(0 2px 4px rgba(0,0,0,0.12))", transition: "r 0.2s" }} />
                    {isUser && <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="11" fontWeight="800">YOU</text>}
                    <text x={x} y={y + r + 13} textAnchor="middle" fill="#475569" fontSize="10.5" fontWeight="700" style={{ pointerEvents: "none" }}>
                      {node.label.length > 18 ? node.label.substring(0, 18) + "…" : node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* Right-side Overview Panel */}
        <div style={{
          width: "240px", flexShrink: 0, background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: "16px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          minHeight: "200px"
        }}>
          {selected ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {selected.group}
                </span>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "16px", lineHeight: 1 }}>×</button>
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", wordBreak: "break-word" }}>
                {selected.label}
              </div>
              {selected.detail && (
                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginBottom: "12px", wordBreak: "break-word" }}>
                  {selected.detail.length > 200 ? selected.detail.substring(0, 200) + "…" : selected.detail}
                </div>
              )}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>
                  Connections: {links.filter(l => l.source === selected.id || l.target === selected.id).length}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Graph Overview</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                <span style={{ fontWeight: "700", color: "#6366f1" }}>{nodes.length}</span> nodes
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                <span style={{ fontWeight: "700", color: "#6366f1" }}>{links.length}</span> edges
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>
                Click any node to inspect its details and connections.
              </div>
              {nodes.length === 0 && !loading && (
                <div style={{ marginTop: "16px", padding: "10px", background: "#fef3c7", borderRadius: "8px", fontSize: "11px", color: "#92400e" }}>
                  No graph data yet. Start a chat to build memory.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
