import { useState } from "react"

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login") // login | register
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setError("")
    setLoading(true)
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Authentication failed")
      onAuth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f4f5f7", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "40px 44px",
        width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        border: "1px solid #eef0f3"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{
            width: "36px", height: "36px", background: "#09090b", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ width: "14px", height: "14px", border: "2.5px solid #fff", transform: "rotate(45deg)" }} />
          </div>
          <span style={{ fontSize: "18px", fontWeight: "800", color: "#09090b", fontFamily: "'Outfit', sans-serif" }}>
            StudioMind
          </span>
        </div>

        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: "800", color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: "13.5px", color: "#64748b" }}>
          {mode === "login" ? "Sign in to your design workspace" : "Start your memory-powered design journey"}
        </p>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <div>
              <label style={labelStyle}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#8b5cf6"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#8b5cf6"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#8b5cf6"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? "#e2e8f0" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
            color: loading ? "#94a3b8" : "#fff", border: "none", borderRadius: "12px",
            padding: "14px", fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
            marginTop: "4px", transition: "all 0.2s"
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13.5px", color: "#64748b" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}
            style={{ background: "none", border: "none", color: "#8b5cf6", fontWeight: "700", cursor: "pointer", fontSize: "13.5px" }}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13.5px", color: "#1e293b", outline: "none", transition: "border-color 0.15s", background: "#fafafa" }
