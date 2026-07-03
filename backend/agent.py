import os
from langchain_core.messages import HumanMessage, SystemMessage
from memory import fetch_memory, save_memory

def _get_llm():
    gemini_key    = os.getenv("GEMINI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key    = os.getenv("OPENAI_API_KEY")

    def valid(k): return bool(k and not k.startswith("PLACEHOLDER") and k.strip())

    if valid(gemini_key):
        from langchain_google_genai import ChatGoogleGenerativeAI
        for model in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]:
            try:
                llm = ChatGoogleGenerativeAI(model=model, google_api_key=gemini_key, temperature=0.7)
                # quick probe — will raise if quota exceeded
                return llm
            except Exception:
                continue
        # return last attempt anyway, let invoke() handle it
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_key, temperature=0.7)
    elif valid(anthropic_key):
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(model="claude-3-5-sonnet-20241022",
                             anthropic_api_key=anthropic_key,
                             temperature=0.7, max_tokens=2048)
    elif valid(openai_key):
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(model="gpt-4o-mini", openai_api_key=openai_key, temperature=0.7)
    raise RuntimeError("No valid LLM API key found in environment.")


async def _invoke_with_fallback(system_prompt: str, user_message: str) -> str:
    """Try Gemini models in order, fall back gracefully on quota errors."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        for model in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
            try:
                llm = ChatGoogleGenerativeAI(model=model, google_api_key=gemini_key, temperature=0.7)
                import asyncio
                response = await asyncio.get_event_loop().run_in_executor(
                    None, lambda l=llm: l.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_message)])
                )
                return response.content
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"Gemini {model} quota exceeded, trying next...")
                    continue
                raise
    raise RuntimeError("All Gemini models quota exceeded. Please check your API key billing.")


async def run_agent(user_message: str, project_id: str) -> dict:
    import asyncio

    # 1. RECALL — silent-fail so Cognee outage never blocks the response
    try:
        recalled = await asyncio.wait_for(fetch_memory(user_message, project_id), timeout=8.0)
    except Exception:
        recalled = ""
    memory_block = recalled.strip() if recalled else "No prior memory for this project yet."

    # 2. BUILD SYSTEM PROMPT
    system_prompt = f"""You are StudioMind — a senior AI design partner with persistent memory backed by a Cognee knowledge graph.

━━━ RECALLED MEMORY FOR THIS PROJECT ━━━
{memory_block}

━━━ YOUR IDENTITY & RULES ━━━
• You are opinionated, precise, and creative — a senior designer, not a generalist.
• ALWAYS reference memory explicitly: "I remember you chose #1a1a2e as your dark bg..."
• NEVER ask for information already in your memory.
• If memory is empty, ask sharp discovery questions across these dimensions:
  → Color: palette, primary/accent/bg hex values, dark/light mode preference
  → Typography: font families, scale (px/rem), weights, line heights
  → Layout: grid system, spacing scale, breakpoints, density preference
  → Components: border radius, shadow style, button/card/input specs
  → Brand: tone (minimal/bold/playful), aesthetic (glassmorphism/flat/material), audience
  → Motion: animation style, duration, easing preferences
• Give exact design values: hex codes, rem/px sizes, font names, spacing scales.
• Use markdown: **bold** for key terms, `code` for tokens/values.
• When you learn new design facts, state them clearly so they get saved to memory."""

    # 3. CALL LLM with model fallback
    reply = await _invoke_with_fallback(system_prompt, user_message)

    # 4. REMEMBER — fire-and-forget, never block the response
    asyncio.create_task(_save_silent(f"User: {user_message}\nAssistant: {reply}", project_id))

    return {"reply": reply, "recalled_memory": recalled or ""}


async def _save_silent(text: str, project_id: str):
    try:
        await save_memory(text, project_id)
    except Exception as e:
        print(f"Memory save (non-blocking): {e}")
