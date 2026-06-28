from mem0 import Memory
import os

# Initialize Mem0
mem0_config = {
    "vector_store": {
        "provider": "qdrant",
        "config": {
            "collection_name": "studiomind",
            "embedding_model_dims": 384,
            "on_disk": True,
            "path": "./mem0_data"
        }
    }
}

memory = None

async def init_memory():
    """Initialize Mem0 memory system."""
    global memory
    try:
        os.makedirs("./mem0_data", exist_ok=True)
        memory = Memory.from_config(mem0_config)
        print("Mem0 initialized successfully.")
    except Exception as e:
        print(f"Error initializing Mem0: {e}")

async def save_memory(text: str, project_id: str) -> None:
    """Store conversation using Mem0's add() method."""
    global memory
    if memory:
        memory.add(text, user_id=project_id)

async def fetch_memory(query: str, project_id: str) -> str:
    """Retrieve relevant memories using Mem0's search() method."""
    global memory
    if not memory:
        return ""
    
    # Search memories for this project
    results = memory.search(query, user_id=project_id, limit=5)
    
    if not results:
        return ""
    
    # Extract memory content
    memories = []
    for result in results:
        if isinstance(result, dict) and "memory" in result:
            memories.append(result["memory"])
        elif isinstance(result, str):
            memories.append(result)
    
    return "\n".join(memories)

async def ingest_url(url: str, project_id: str) -> None:
    """Store URL reference using Mem0."""
    global memory
    if memory:
        memory.add(f"Reference URL: {url}", user_id=project_id)

async def improve_memory(feedback: str, project_id: str) -> None:
    """Store user feedback using Mem0."""
    global memory
    if memory:
        memory.add(f"User feedback: {feedback}", user_id=project_id)

async def get_style_dna(user_id: str) -> str:
    """Analyze patterns across all projects using Mem0."""
    global memory
    if not memory:
        return ""
    
    # Get all memories related to design patterns
    queries = [
        "design patterns and preferences",
        "color and typography choices",
        "layout and spacing preferences"
    ]
    
    all_memories = []
    for query in queries:
        results = memory.search(query, user_id=user_id, limit=10)
        if results:
            for result in results:
                if isinstance(result, dict) and "memory" in result:
                    all_memories.append(result["memory"])
                elif isinstance(result, str):
                    all_memories.append(result)
    
    if not all_memories:
        return "Not enough conversation data for style DNA analysis yet. Keep chatting!"
    
    # Analyze patterns
    content_text = " ".join(all_memories).lower()
    patterns = []
    
    if "dark" in content_text or "light" in content_text or "white" in content_text:
        patterns.append("Theme Preference: Consistent use of light/dark color schemes")
    
    if "font" in content_text or "typography" in content_text:
        patterns.append("Typography: Strong focus on font selection and hierarchy")
    
    if "spacing" in content_text or "margin" in content_text:
        patterns.append("Layout: Attention to whitespace and spacing")
    
    if "palette" in content_text or "color" in content_text:
        patterns.append("Color Theory: Active exploration of color palettes")
    
    if "minimal" in content_text or "clean" in content_text:
        patterns.append("Design Philosophy: Minimalist, clean aesthetics")
    
    return "\n".join(patterns) if patterns else "Style DNA analysis in progress..."

async def delete_project_memory(project_id: str) -> None:
    """Delete all memories for a project using Mem0."""
    global memory
    if memory:
        # Get all memories for this user
        all_memories = memory.get_all(user_id=project_id)
        # Delete each memory
        if all_memories:
            for mem in all_memories:
                if isinstance(mem, dict) and "id" in mem:
                    memory.delete(mem["id"])
