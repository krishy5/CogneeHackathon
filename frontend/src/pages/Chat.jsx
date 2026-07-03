import { useState, useEffect } from "react"
import { sendMessage, sendFeedback } from "../api"
import MemoryPanel from "../components/MemoryPanel"
import ChatWindow from "../components/ChatWindow"

export default function Chat({ projectId, onBack, onInspiration }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [memory, setMemory] = useState(null) // What Cognee recalled — shown in panel
  const [error, setError] = useState(null)

  // Load chat history and initial memories from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && projectId) {
      // 1. Load chat log
      const chatLog = localStorage.getItem(`studiomind_chats_${projectId}`)
      if (chatLog) {
        try {
          setMessages(JSON.parse(chatLog))
        } catch (_) {
          setMessages([
            { role: "assistant", content: "Hi! I'm StudioMind. Tell me about your project — I'll remember everything to help you design better." }
          ])
        }
      } else {
        const defaultMessages = [
          { role: "assistant", content: "Hi! I'm StudioMind. Tell me about your project — I'll remember everything to help you design better." }
        ]
        setMessages(defaultMessages)
        localStorage.setItem(`studiomind_chats_${projectId}`, JSON.stringify(defaultMessages))
      }

      // 2. Load active memories for the MemoryPanel on mount
      const memories = localStorage.getItem(`studiomind_memories_${projectId}`)
      if (memories) {
        try {
          const list = JSON.parse(memories)
          setMemory(list.join("\n"))
        } catch (_) {
          setMemory("")
        }
      } else {
        setMemory("")
      }
    }
  }, [projectId])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput("")
    setError(null)

    const userMsg = { role: "user", content: userText }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result = await sendMessage(userText, projectId)
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }])
      setMemory(result.recalled_memory || "")
    } catch (err) {
      console.error(err)
      setError("Failed to communicate with StudioMind. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (type, msgContent) => {
    try {
      await sendFeedback(type, msgContent, projectId)
      
      // Refresh memory panel to show updated/improved graph state
      if (typeof window !== "undefined") {
        const memories = localStorage.getItem(`studiomind_memories_${projectId}`)
        if (memories) {
          const list = JSON.parse(memories)
          setMemory(list.join("\n"))
        }
      }
    } catch (err) {
      console.error("Feedback transmission failed:", err)
    }
  }

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      {/* Central Chat Window Area */}
      <ChatWindow
        projectId={projectId}
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
      
      {/* Right side: Memory Panel */}
      <MemoryPanel memory={memory} />
    </div>
  )
}
