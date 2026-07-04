const BASE = import.meta.env.VITE_API_URL || "https://cogneehackathon.onrender.com/api"
export const BACKEND = BASE

// --- Session helpers ---
export function getSession() {
  try {
    const s = localStorage.getItem("studiomind_session")
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function saveSession(data) {
  localStorage.setItem("studiomind_session", JSON.stringify(data))
}

export function clearSession() {
  localStorage.removeItem("studiomind_session")
}

function authHeader() {
  const s = getSession()
  return s?.token ? { "Authorization": `Bearer ${s.token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

async function safeJson(res) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return {} }
}

// --- Projects ---
export async function fetchProjects() {
  try {
    const res = await fetch(`${BASE}/projects`, { headers: authHeader() })
    if (res.ok) {
      const data = await safeJson(res)
      return data.projects || []
    }
  } catch (_) {}
  return null
}

export async function persistProjects(projects) {
  try {
    await fetch(`${BASE}/projects`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(projects)
    })
  } catch (_) {}
}

// --- Chats ---
export async function fetchChats(projectId) {
  try {
    const res = await fetch(`${BASE}/projects/${projectId}/chats`, { headers: authHeader() })
    if (res.ok) {
      const data = await safeJson(res)
      return data.chats || []
    }
  } catch (_) {}
  return null
}

export async function persistChats(projectId, messages) {
  try {
    await fetch(`${BASE}/projects/${projectId}/chats`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(messages)
    })
  } catch (_) {}
}
