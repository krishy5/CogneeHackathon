import { useState, useEffect } from "react"
import { sendMessage, sendFeedback } from "../api"
import { fetchChats, persistChats } from "../auth"
import MemoryPanel from "../components/MemoryPanel"
import ChatWindow from "../components/ChatWindow"

const defaultMsg = { role: "assistant", content: "Hi! I'm StudioMind. Tell me about your project — I'll remember everything to help you design better.", ts: Date.now() }

export default function Chat({ projectId, userId, onBack, onInspiration }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [memory, setMemory] = useState(null)
  const [error, setError] = useState(null)

  // Load chat history — backend first, localStorage fallback
  useEffect(() => {
    if (!projectId) return
    fetchChats(projectId).then(serverChats => {
      if (serverChats && serverChats.length > 0) {
        setMessages(serverChats)
      } else {
        const local = localStorage.getItem(`studiomind_chats_${projectId}`)
        if (local) {
          try { setMessages(JSON.parse(local)) } catch (_) { setMessages([defaultMsg]) }
        } else {
          setMessages([defaultMsg])
        }
      }
    })
  }, [projectId])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setInput("")
    setError(null)

    const newMessages = [...messages, { role: "user", content: userText, ts: Date.now() }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const result = await sendMessage(userText, projectId)
      const finalMessages = [...newMessages, { role: "assistant", content: result.reply, ts: Date.now() }]
      setMessages(finalMessages)
      setMemory(result.recalled_memory || "")
      // Persist to backend + localStorage
      persistChats(projectId, finalMessages)
      localStorage.setItem(`studiomind_chats_${projectId}`, JSON.stringify(finalMessages))
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
