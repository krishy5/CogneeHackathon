const BASE = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? "https://studiomind-backend.onrender.com/api"
  : "/api"

// ── localStorage helpers ─────────────────────────────────────────────────────
const getLocal = (key, def = []) => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def } catch { return def }
}
const setLocal = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

// ── Reply style ──────────────────────────────────────────────────────────────
const STYLE_KEY = "studiomind_reply_style"
const DEFAULT_STYLE = { tone: "professional", format: "mixed", detail: "balanced", focus: "all" }
export const getReplyStyle = () => { try { const s = localStorage.getItem(STYLE_KEY); return s ? { ...DEFAULT_STYLE, ...JSON.parse(s) } : { ...DEFAULT_STYLE } } catch { return { ...DEFAULT_STYLE } } }
export const setReplyStyle = (style) => localStorage.setItem(STYLE_KEY, JSON.stringify(style))

// ── Gemini key (set via Vercel env var VITE_GEMINI_API_KEY) ──────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""
export const getGeminiApiKey = () => GEMINI_API_KEY
export const setGeminiApiKey = () => {}

// ── Seed mock projects ───────────────────────────────────────────────────────
const seedMockDatabase = () => {
  if (!localStorage.getItem("studiomind_memories_proj_001"))
    setLocal("studiomind_memories_proj_001", ["User started Luminary App project.", "Aesthetic target: Calming meditation dark tracker."])
  if (!localStorage.getItem("studiomind_memories_proj_002"))
    setLocal("studiomind_memories_proj_002", ["Project: Forge Design System.", "Aesthetic target: Structured SaaS design system."])
}
if (typeof window !== "undefined") seedMockDatabase()

// ── Gemini fallback ──────────────────────────────────────────────────────────
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]

async function callGemini(message, history, style) {
  const apiKey = GEMINI_API_KEY
  if (!apiKey) throw new Error("No Gemini API key configured")
  const systemPrompt = `You are StudioMind — a senior AI design partner with persistent memory.\nGive specific design recommendations with exact values (hex codes, rem/px, font names).\nTone: ${style.tone} | Detail: ${style.detail}`
  const contents = [
    ...history.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: message }] }
  ]
  const body = { system_instruction: { parts: [{ text: systemPrompt }] }, contents, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }
  let lastError
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); lastError = new Error(e?.error?.message || `HTTP ${res.status}`); continue }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response")
      return text
    } catch (e) { lastError = e }
  }
  throw lastError || new Error("All Gemini models failed")
}

// ── sendMessage ──────────────────────────────────────────────────────────────
export const sendMessage = async (message, project_id) => {
  try {
    const res = await fetch(`${BASE}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, project_id })
    })
    if (res.ok) {
      const data = await res.json()
      return { reply: data.reply, recalled_memory: data.recalled_memory || "" }
    }
  } catch (_) {}

  // Gemini fallback
  const chatKey = `studiomind_chats_${project_id}`
  const chats = getLocal(chatKey, [])
  const history = chats.slice(-20).map(m => ({ role: m.role, content: m.content }))
  let reply
  try { reply = await callGemini(message, history, getReplyStyle()) }
  catch (err) { reply = `(Error: ${err.message})` }
  return { reply, recalled_memory: "(local fallback — backend offline)" }
}

// ── sendFeedback ─────────────────────────────────────────────────────────────
export const sendFeedback = async (type, messageContent, project_id) => {
  try {
    await fetch(`${BASE}/feedback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: `${type}: ${messageContent.substring(0, 150)}`, project_id })
    })
  } catch (_) {}
  return { status: "ok" }
}

// ── ingestURL ────────────────────────────────────────────────────────────────
export const ingestURL = async (url, project_id) => {
  try {
    await fetch(`${BASE}/ingest`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, project_id })
    })
  } catch (_) {}
  return { status: "ok" }
}

// ── getDNA ───────────────────────────────────────────────────────────────────
export const getDNA = async (user_id) => {
  try {
    const res = await fetch(`${BASE}/dna?user_id=${encodeURIComponent(user_id)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.dna && data.dna.trim()) return data
    }
  } catch (_) {}
  const lines = []
  try {
    const projects = JSON.parse(localStorage.getItem("studiomind_projects") || "[]")
    for (const p of projects) {
      const chats = getLocal(`studiomind_chats_${p.id}`, [])
      chats
        .filter(m => m.role === "assistant" && m.content && !m.content.startsWith("(Error") && !m.content.includes("Hi! I'm StudioMind"))
        .slice(-4)
        .forEach(m => lines.push(`${p.name}: ${m.content.slice(0, 200).replace(/\n/g, " ")}`))
    }
  } catch (_) {}
  return { dna: lines.join("\n") || "" }
}

// ── forgetMemory ─────────────────────────────────────────────────────────────
export const forgetMemory = async (nodeId, project_id) => {
  try {
    await fetch(`${BASE}/memory`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: project_id || "global", memory_id: nodeId })
    })
  } catch (_) {}
  return { status: "ok" }
}

// ── listMemories ─────────────────────────────────────────────────────────────
export const listMemories = async (project_id) => {
  try {
    const res = await fetch(`${BASE}/memory?project_id=${project_id}`)
    if (res.ok) { const data = await res.json(); return data.memories || [] }
  } catch (_) {}
  return []
}

// ── getMemoryGraph ───────────────────────────────────────────────────────────
export const getMemoryGraph = async (project_id) => {
  try {
    const res = await fetch(`${BASE}/graph?project_id=${project_id}`)
    if (res.ok) return await res.json()
  } catch (_) {}
  return { nodes: [], edges: [] }
}

// ── searchCognee ─────────────────────────────────────────────────────────────
export const searchCognee = async (query) => {
  try {
    const res = await fetch(`${BASE}/search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) })
    if (res.ok) { const data = await res.json(); return data?.results || null }
  } catch (_) {}
  return null
}
