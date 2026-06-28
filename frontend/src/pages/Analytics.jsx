import { useState, useEffect } from "react"
import { SvgIcons } from "../icons"

export default function Analytics({ projects, onBack }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [], max: 10 })
  const [hiddenLines, setHiddenLines] = useState([])

  useEffect(() => {
    // 1. Generate last 7 days of labels
    const days = 7
    const labels = []
    const rawDates = []
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      rawDates.push(d.getTime())
      labels.push(d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }))
    }

    // 2. Gather data for each project
    const datasets = []
    const totalData = new Array(days).fill(0)
    let globalMax = 5 // minimum height

    projects.forEach(p => {
      const chatLog = localStorage.getItem(`studiomind_chats_${p.id}`)
      const data = new Array(days).fill(0)
      
      if (chatLog) {
        try {
          const msgs = JSON.parse(chatLog)
          msgs.forEach(m => {
            // If no timestamp, assume it's from today (for legacy data)
            const ts = m.ts || Date.now()
            
            // Find which bucket this fits into
            for (let i = 0; i < days; i++) {
              const bucketStart = rawDates[i]
              const bucketEnd = bucketStart + 86400000 // +1 day
              if (ts >= bucketStart && ts < bucketEnd) {
                data[i]++
                totalData[i]++
                break
              }
            }
          })
        } catch (_) {}
      }
      
      datasets.push({
        id: p.id,
        label: p.name,
        color: p.color,
        data
      })
    })

    // Calculate max for Y axis scaling
    datasets.forEach(d => {
      const m = Math.max(...d.data)
      if (m > globalMax) globalMax = m
    })
    const totalMax = Math.max(...totalData)
    if (totalMax > globalMax) globalMax = totalMax

    // Add Mixed/Total dataset
    datasets.push({
      id: "mixed",
      label: "Total Activity (Mixed)",
      color: "#0f172a", // Dark thick line
      data: totalData,
      isTotal: true
    })

    setChartData({ labels, datasets, max: Math.ceil(globalMax * 1.2) }) // 20% headroom
  }, [projects])

  // Chart Dimensions
  const width = 800
  const height = 400
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom

  const getX = (index) => padding.left + (index * (graphWidth / (chartData.labels.length - 1)))
  const getY = (val) => padding.top + graphHeight - ((val / chartData.max) * graphHeight)

  const toggleLine = (id) => {
    setHiddenLines(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", background: "#f8fafc", height: "100%", boxSizing: "border-box" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <div>
          <h1 style={{ margin: "0 0 3px", fontSize: "22px", fontWeight: "800", fontFamily: "'Outfit', sans-serif", color: "#0f172a" }}>Activity Analytics</h1>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Review chat history trends across all your active workspaces.</p>
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Chat History Graph (Last 7 Days)</h2>
          
          {/* Legend / Filter (Moved to top) */}
          <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", padding: "12px 16px", maxWidth: "60%" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Filter Graph (Click to toggle)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {chartData.datasets.map((ds) => {
                if (ds.data.every(v => v === 0) && !ds.isTotal) return null; // Don't show legend for empty projects
                const isHidden = hiddenLines.includes(ds.id);
                return (
                  <button 
                    key={ds.id} 
                    onClick={() => toggleLine(ds.id)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "6px", 
                      background: "transparent", border: "none", cursor: "pointer",
                      opacity: isHidden ? 0.4 : 1, transition: "opacity 0.2s",
                      padding: "2px 6px", borderRadius: "6px"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: "10px", height: "10px", borderRadius: ds.isTotal ? "2px" : "50%", background: ds.color }} />
                    <span style={{ fontSize: "11.5px", fontWeight: ds.isTotal ? "800" : "600", color: "#475569" }}>
                      {ds.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        
        <div style={{ position: "relative", width: "100%", overflowX: "hidden" }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: "visible", margin: "0 auto", display: "block", maxHeight: "45vh" }}>
            
            {/* Y Axis Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + (graphHeight * (1 - ratio))
              const val = Math.round(chartData.max * ratio)
              return (
                <g key={i}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray={i === 0 ? "none" : "5 5"} />
                  <text x={padding.left - 12} y={y + 4} fontSize="11" fill="#94a3b8" textAnchor="end" fontWeight="600">{val}</text>
                </g>
              )
            })}

            {/* X Axis Labels */}
            {chartData.labels.map((label, i) => (
              <text key={i} x={getX(i)} y={height - padding.bottom + 24} fontSize="11" fill="#64748b" textAnchor="middle" fontWeight="600">{label}</text>
            ))}

            {/* Render Lines */}
            {chartData.datasets.map((ds, i) => {
              if (ds.data.every(v => v === 0) || hiddenLines.includes(ds.id)) return null // Skip flat lines or hidden lines
              
              const points = ds.data.map((val, idx) => `${getX(idx)},${getY(val)}`).join(" L ")
              const isTotal = ds.isTotal
              
              return (
                <g key={ds.id}>
                  {/* The Line */}
                  <path 
                    d={`M ${points}`} 
                    fill="none" 
                    stroke={ds.color} 
                    strokeWidth={isTotal ? "4" : "2.5"} 
                    strokeLinejoin="round" 
                    strokeLinecap="round" 
                    style={{ filter: isTotal ? "drop-shadow(0px 8px 16px rgba(15,23,42,0.2))" : "none", transition: "all 0.3s" }}
                  />
                  
                  {/* Data Points */}
                  {ds.data.map((val, idx) => (
                    <circle 
                      key={idx} 
                      cx={getX(idx)} 
                      cy={getY(val)} 
                      r={isTotal ? "5" : "4"} 
                      fill="#fff" 
                      stroke={ds.color} 
                      strokeWidth={isTotal ? "3" : "2"}
                      style={{ transition: "all 0.2s", cursor: "pointer" }}
                    >
                      <title>{ds.label}: {val} messages</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
