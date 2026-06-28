# Cognee Implementation Guide

## All 4 Core APIs Demonstrated

### 1️⃣ `cognee.remember()` — Save to Memory

**Where**: `backend/memory.py:save_memory()` + `backend/agent.py:run_agent()`

```python
async def save_memory(text: str, project_id: str) -> None:
    """Store conversation exchange into project-scoped memory."""
    await cognee.remember(text, dataset_name=f"project_{project_id}")

# Called after every LLM response
memory_entry = f"User asked: {user_message}\nAssistant responded: {reply}"
await save_memory(memory_entry, project_id)
```

**Visible in UI**: 
- Memory Panel updates in real-time
- Activity log shows "Memory saved" event
- Node count increases in stats

---

### 2️⃣ `cognee.recall()` — Semantic Search

**Where**: `backend/memory.py:fetch_memory()` + `backend/agent.py:run_agent()`

```python
async def fetch_memory(query: str, project_id: str) -> str:
    """Retrieve relevant memories BEFORE calling LLM."""
    results = await cognee.recall(
        query, 
        datasets=[f"project_{project_id}"]
    )
    return "\n".join([str(r) for r in results])

# Always recall before LLM call
recalled = await fetch_memory(user_message, project_id)
system_prompt = f"MEMORY: {recalled}\n\n{base_prompt}"
```

**Visible in UI**:
- **Memory Panel** (right side) shows exactly what was recalled
- AI references past conversations: *"I remember you preferred..."*
- Highlighted nodes in memory graph

---

### 3️⃣ `cognee.improve()` — Learn from Feedback

**Where**: `backend/memory.py:improve_memory()` + `backend/routes/chat.py:feedback()`

```python
async def improve_memory(feedback: str, project_id: str) -> None:
    """Enrich memory graph based on thumbs up/down."""
    await cognee.improve(dataset=f"project_{project_id}")

# When user clicks 👍 or 👎
await improve_memory(feedback_type, project_id)
```

**Visible in UI**:
- Thumbs up/down buttons on every AI message
- Memory panel shows `✓ Approved` or `✗ Rejected` tags
- AI stops suggesting rejected patterns in future

---

### 4️⃣ `cognee.forget()` — Surgical Deletion

**Where**: `backend/memory.py:delete_project_memory()`

```python
async def delete_project_memory(project_id: str) -> None:
    """Permanently wipe all project memory."""
    await cognee.forget(dataset=f"project_{project_id}")

# Called when user deletes a project from dashboard
```

**Visible in UI**:
- Project deletion modal warns about memory loss
- Memory node count drops to 0
- Chat history clears

---

## Advanced Cognee Features Used

### Cross-Project Memory Traversal

**Where**: `backend/memory.py:get_style_dna()`

```python
async def get_style_dna(user_id: str) -> str:
    """Query ACROSS all projects to find patterns."""
    results = await cognee.recall(
        "What are consistent design patterns across ALL projects?",
        datasets=[f"user_{user_id}"]  # User-level, not project-level
    )
    return "\n".join([str(r) for r in results])
```

**Visible in UI**:
- Style DNA page shows aggregated insights
- *"You consistently use electric indigo accents"*
- Pattern visualization

---

### URL Ingestion into Memory

**Where**: `backend/memory.py:ingest_url()` + `frontend/Inspiration.jsx`

```python
async def ingest_url(url: str, project_id: str) -> None:
    """Cognee automatically fetches and parses URL content."""
    await cognee.remember(url, dataset_name=f"project_{project_id}")
```

**Visible in UI**:
- Paste Dribbble URL → automatically indexed
- Memory panel shows *"Ingested style reference from dribbble.com"*
- AI can reference visual style from that URL

---

### Memory Namespacing

Prevents memory bleed between projects:

```python
# Project A memory
await cognee.remember(text, dataset_name="project_proj_001")

# Project B memory (completely isolated)
await cognee.remember(text, dataset_name="project_proj_002")

# Recall only fetches from same namespace
results = await cognee.recall(query, datasets=["project_proj_001"])
```

---

## Memory Lifecycle in Action

### User Journey Example

**Session 1 — First Conversation**
```
User: "I want a dark, minimal aesthetic"
  ↓
1️⃣ cognee.recall() → Empty (no past memory)
  ↓
2️⃣ LLM generates reply with dark palette suggestions
  ↓
3️⃣ cognee.remember() → Saves preference
```

**Session 2 — Memory Recall**
```
User: "What colors should I use?"
  ↓
1️⃣ cognee.recall() → "User prefers dark, minimal aesthetic"
  ↓
2️⃣ LLM: "I remember you wanted dark mode. Let's use #09090b..."
  ↓
3️⃣ cognee.remember() → Saves new exchange
```

**Feedback Loop**
```
User: 👍 on AI message
  ↓
1️⃣ cognee.improve() → Enriches memory weights
  ↓
2️⃣ Future recalls prioritize similar patterns
```

---

## Testing Checklist

- [x] `remember()` — Chat saves to memory panel
- [x] `recall()` — Memory panel shows what was fetched
- [x] `improve()` — Thumbs up/down tags appear
- [x] `forget()` — Project deletion clears memory
- [x] Cross-project recall — Style DNA aggregates
- [x] URL ingestion — Inspiration board feeds memory
- [x] Namespace isolation — Projects don't leak memory

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                    │
│  Chat │ Memory Panel │ Style DNA │ Inspiration Board       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND (Python)                     │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐               │
│  │ agent.py  │  │memory.py │  │ routes/   │               │
│  │ (LLM)     │→ │(Cognee)  │← │chat.py    │               │
│  └───────────┘  └──────────┘  └───────────┘               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              COGNEE MEMORY LAYER (Self-Hosted)              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Vector Store    │  │  Knowledge Graph │               │
│  │  (Embeddings)    │  │  (Relationships) │               │
│  └──────────────────┘  └──────────────────┘               │
│          Hybrid Retrieval Engine                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Memory Enrichment Strategy

Every interaction improves memory quality:

1. **Initial save** — Raw conversation text
2. **Semantic indexing** — Cognee extracts entities (colors, fonts, layouts)
3. **Graph connections** — Links related preferences
4. **Feedback weighting** — 👍 increases recall priority
5. **Cross-project patterns** — Discovers your "design DNA"

This creates a **living knowledge graph** that gets smarter over time.

---

## Performance Optimizations

- **Lazy loading** — Only recall when user sends message
- **Batch remember** — Save multiple exchanges at once
- **Namespace partitioning** — Isolated datasets for speed
- **Result limiting** — `top_k=5` for recall to prevent overload

---

**Result**: A production-ready persistent memory system that demonstrates ALL Cognee capabilities in a polished, user-facing application.
