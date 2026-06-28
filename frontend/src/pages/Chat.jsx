import { useState, useEffect } from "react"
import { sendMessage, sendFeedback } from "../api"
import MemoryPanel from "../components/MemoryPanel"
import ChatWindow from "../components/ChatWindow"

const WELCOME = "Hi! I'm **StudioMind**, your AI design partner powered by **Gemini** and **Mem0**.\n\nTell me about your project — I'll remember everything across sessions to give you personalized, context-aware design advice."

export default function Chat({ projectId, projects = [], onBack, onInspiration }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [memory, setMemory] = useState("")
  const [totalMemories, setTotalMemories] = useState(0)
  const [error, setError] = useState(null)

  // Load chat history from localStorage
  useEffect(() => {
    if (!projectId) return
    const stored = localStorage.getItem(`studiomind_chats_${projectId}`)
    if (stored) {
      try { setMessages(JSON.parse(stored)) } catch (_) { resetChat() }
    } else {
      resetChat()
    }
  }, [projectId])

  const resetChat = () => {
    const welcome = [{ role: "assistant", content: WELCOME }]
    setMessages(welcome)
    localStorage.setItem(`studiomind_chats_${projectId}`, JSON.stringify(welcome))
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput("")
    setError(null)

    const withUser = [...messages, { role: "user", content: userText, ts: Date.now() }]
    setMessages(withUser)
    setLoading(true)

    try {
      const result = await sendMessage(userText, projectId, projects)
      const withReply = [...withUser, { role: "assistant", content: result.reply, ts: Date.now() }]
      setMessages(withReply)
      setMemory(result.recalled_memory || "")
      if (result.total_memories) setTotalMemories(result.total_memories)

      // Persist chat locally
      localStorage.setItem(`studiomind_chats_${projectId}`, JSON.stringify(withReply))
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to get a response. Please check your connection.")
      setMessages(withUser) // remove user bubble if AI failed? No — keep it.
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (type, msgContent) => {
    try {
      await sendFeedback(type, msgContent, projectId)
    } catch (err) {
      console.error("Feedback error:", err)
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <ChatWindow
        projectId={projectId}
        projects={projects}
        messages={messages}
        loading={loading}
        error={error}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleFeedback={handleFeedback}
        onInspiration={onInspiration}
        onBack={onBack}
      />
      <MemoryPanel memory={memory} totalMemories={totalMemories} />
    </div>
  )
}
