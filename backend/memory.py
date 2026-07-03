import os
import uuid
import httpx

_SESSION_ID = f"studiomind-{uuid.uuid4().hex[:8]}"

# ── Design-domain graph model ────────────────────────────────────────────────
# Tells Cognee exactly which entity types and relationships to extract.
# This is what populates the schema view in the Cognee Cloud UI.
DESIGN_GRAPH_MODEL = {
    "title": "DesignMemory",
    "type": "object",
    "properties": {
        "nodes": {
            "type": "array",
            "items": {
                "oneOf": [
                    {
                        "title": "ColorToken",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "hex_value": {"type": "string"},
                            "role": {"type": "string", "description": "e.g. primary, accent, background, text"},
                            "contrast_ratio": {"type": "string"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "TypographyStyle",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "font_family": {"type": "string"},
                            "font_size": {"type": "string"},
                            "font_weight": {"type": "string"},
                            "line_height": {"type": "string"},
                            "usage": {"type": "string", "description": "e.g. heading, body, caption, code"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "DesignPattern",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "category": {"type": "string", "description": "e.g. layout, motion, interaction, visual"},
                            "description": {"type": "string"},
                            "example": {"type": "string"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "ComponentSpec",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "type": {"type": "string", "description": "e.g. button, card, modal, nav, input"},
                            "variant": {"type": "string"},
                            "spacing": {"type": "string"},
                            "border_radius": {"type": "string"},
                            "shadow": {"type": "string"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "BrandIdentity",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "tone": {"type": "string", "description": "e.g. minimal, bold, playful, corporate"},
                            "aesthetic": {"type": "string", "description": "e.g. glassmorphism, neumorphism, flat, material"},
                            "target_audience": {"type": "string"},
                            "mood": {"type": "string"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "DesignDecision",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "rationale": {"type": "string"},
                            "alternatives_considered": {"type": "string"},
                            "outcome": {"type": "string"}
                        },
                        "required": ["name"]
                    },
                    {
                        "title": "UserPreference",
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "category": {"type": "string", "description": "e.g. color, layout, motion, density"},
                            "value": {"type": "string"},
                            "strength": {"type": "string", "description": "e.g. strong, moderate, weak"}
                        },
                        "required": ["name"]
                    }
                ]
            }
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "relation": {
                        "type": "string",
                        "enum": [
                            "uses_color", "uses_typography", "applies_pattern",
                            "contains_component", "expresses_brand", "informed_by",
                            "contrasts_with", "pairs_with", "overrides", "inherits_from",
                            "preferred_over", "rejected_in_favor_of"
                        ]
                    }
                }
            }
        }
    }
}

DESIGN_EXTRACTION_PROMPT = """You are a design systems expert extracting structured knowledge from design conversations.

Extract ALL of the following entity types when present:
- ColorToken: any hex code, color name, palette entry, or color role (primary, accent, bg, text)
- TypographyStyle: font families, sizes (px/rem), weights, line heights, usage contexts
- DesignPattern: layout patterns, visual styles (glassmorphism, neumorphism, flat), motion/animation preferences
- ComponentSpec: UI components with their spacing, radius, shadow, variant details
- BrandIdentity: tone of voice, aesthetic direction, target audience, mood/feeling
- DesignDecision: explicit choices made with rationale (why X was chosen over Y)
- UserPreference: stated likes/dislikes about design with category and strength

Extract relationships between entities:
- uses_color, uses_typography, applies_pattern, contains_component, expresses_brand
- informed_by, contrasts_with, pairs_with, overrides, inherits_from
- preferred_over, rejected_in_favor_of

Be thorough — extract every design detail mentioned, even implicitly.
Preserve exact values: hex codes, px/rem measurements, font names."""


def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=os.environ["COGNEE_BASE_URL"],
        headers={
            "X-Api-Key": os.environ["COGNEE_API_KEY"],
            "X-Tenant-Id": os.environ["COGNEE_TENANT_ID"],
            "Content-Type": "application/json",
        },
        timeout=10.0,
    )


async def init_cognee():
    async with _client() as c:
        r = await c.get("/health")
        r.raise_for_status()
    print(f"Cognee Cloud → connected (session: {_SESSION_ID})")


async def save_memory(text: str, project_id: str, tags: list = None) -> None:
    dataset = f"project_{project_id}"
    async with _client() as c:
        # 1. Store as session QA entry (fast, appears in Sessions view)
        await c.post("/api/v1/remember/entry", json={
            "entry": {
                "type": "qa",
                "question": f"Design context for project {project_id}",
                "answer": text,
                "context": f"project:{project_id} tags:{','.join(tags or [])}"
            },
            "dataset_name": dataset,
            "session_id": _SESSION_ID,
        })

        # 2. Add to knowledge graph with design schema (appears in Schema view)
        await c.post("/api/v1/add_text", json={
            "textData": [text],
            "datasetName": dataset,
        })

    # 3. Cognify with design-domain graph model (non-blocking)
    async with _client() as c:
        await c.post("/api/v1/cognify", json={
            "datasets": [dataset],
            "graphModel": DESIGN_GRAPH_MODEL,
            "customPrompt": DESIGN_EXTRACTION_PROMPT,
            "runInBackground": True,
        })


async def fetch_memory(query: str, project_id: str) -> str:
    dataset = f"project_{project_id}"
    try:
        async with _client() as c:
            r = await c.post("/api/v1/recall", json={
                "query": query,
                "datasets": [dataset],
                "searchType": "HYBRID_COMPLETION",
                "sessionId": _SESSION_ID,
                "scope": "all",
                "topK": 8,
            })
            if r.status_code >= 400:
                return ""
            results = []
            for item in (r.json() or [])[:8]:
                text = (item.get("answer") or item.get("text") or "") if isinstance(item, dict) else str(item)
                if text:
                    results.append(text)
            return "\n---\n".join(results)
    except Exception as e:
        print(f"Cognee recall: {e}")
        return ""


async def improve_memory(feedback: str, project_id: str) -> None:
    dataset = f"project_{project_id}"
    is_positive = feedback.startswith("thumbsup")
    score = 5 if is_positive else 1
    snippet = feedback.split(":", 1)[-1].strip() if ":" in feedback else feedback

    try:
        async with _client() as c:
            await c.post("/api/v1/remember/entry", json={
                "entry": {
                    "type": "qa",
                    "question": "Design feedback",
                    "answer": snippet[:500],
                    "feedback_text": "thumbsup" if is_positive else "thumbsdown",
                    "feedback_score": score,
                },
                "dataset_name": dataset,
                "session_id": _SESSION_ID,
            })
    except Exception as e:
        print(f"Cognee improve: {e}")


async def forget_memory(project_id: str, memory_id: str = None) -> int:
    dataset = f"project_{project_id}"
    try:
        ds_id = await _get_dataset_id(dataset)
        if ds_id:
            async with _client() as c:
                await c.delete(f"/api/v1/datasets/{ds_id}")
    except Exception as e:
        print(f"Cognee forget: {e}")
    return 1


async def ingest_url(url: str, project_id: str) -> None:
    dataset = f"project_{project_id}"
    text = f"Style reference: {url}"
    async with _client() as c:
        await c.post("/api/v1/remember/entry", json={
            "entry": {
                "type": "qa",
                "question": "Style reference URL",
                "answer": text,
                "context": "inspiration,reference,url"
            },
            "dataset_name": dataset,
            "session_id": _SESSION_ID,
        })
        await c.post("/api/v1/add_text", json={"textData": [text], "datasetName": dataset})
    async with _client() as c:
        await c.post("/api/v1/cognify", json={
            "datasets": [dataset],
            "graphModel": DESIGN_GRAPH_MODEL,
            "customPrompt": DESIGN_EXTRACTION_PROMPT,
            "runInBackground": True,
        })


async def get_style_dna(user_id: str) -> str:
    try:
        async with _client() as c:
            r = await c.get("/api/v1/datasets/")
            if r.status_code >= 400:
                return ""
        all_datasets = [ds["name"] for ds in r.json() if ds.get("name", "").startswith("project_")]
        if not all_datasets:
            return ""
        async with _client() as c:
            r = await c.post("/api/v1/recall", json={
                "query": "design patterns, color preferences, typography choices, aesthetic tendencies, layout decisions, brand identity",
                "datasets": all_datasets,
                "searchType": "GRAPH_SUMMARY_COMPLETION",
                "sessionId": _SESSION_ID,
                "scope": "all",
                "topK": 15,
            })
            if r.status_code >= 400:
                return ""
        raw = r.json()
        return "\n".join(
            (item.get("answer") or item.get("text") or str(item)) if isinstance(item, dict) else str(item)
            for item in (raw or [])
        )
    except Exception as e:
        print(f"Cognee style DNA: {e}")
        return ""


async def list_memories(project_id: str) -> list:
    dataset = f"project_{project_id}"
    try:
        async with _client() as c:
            r = await c.post("/api/v1/recall", json={
                "query": "all design decisions, preferences, colors, typography, components",
                "datasets": [dataset],
                "searchType": "CHUNKS",
                "sessionId": _SESSION_ID,
                "scope": "all",
                "topK": 30,
            })
            r.raise_for_status()
        raw = r.json()
        return [
            {
                "id": str(i),
                "content": (item.get("answer") or item.get("text") or str(item)) if isinstance(item, dict) else str(item)
            }
            for i, item in enumerate(raw or [])
        ]
    except Exception as e:
        print(f"Cognee list: {e}")
        return []


async def _get_dataset_id(name: str) -> str | None:
    async with _client() as c:
        r = await c.get("/api/v1/datasets/")
        r.raise_for_status()
    for ds in r.json():
        if ds["name"] == name:
            return ds["id"]
    return None


async def get_graph(project_id: str) -> dict:
    dataset = f"project_{project_id}"
    try:
        ds_id = await _get_dataset_id(dataset)
        if not ds_id:
            ds_id = await _get_dataset_id("default_dataset")
        if not ds_id:
            return {"nodes": [], "edges": []}
        async with _client() as c:
            r = await c.get(f"/api/v1/datasets/{ds_id}/graph")
            r.raise_for_status()
        data = r.json()
        nodes = [
            {
                "id": n.get("id", str(i)),
                "label": n.get("label") or n.get("name", ""),
                "group": n.get("type", "memory"),
                "detail": str(
                    n.get("properties", {}).get("description", "") or
                    n.get("properties", {}).get("hex_value", "") or
                    n.get("properties", {}).get("font_family", "") or
                    n.get("label", "")
                ),
            }
            for i, n in enumerate(data.get("nodes") or [])
        ]
        edges = [
            {"source": e.get("source"), "target": e.get("target"), "label": e.get("label", "")}
            for e in (data.get("edges") or [])
        ]
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        print(f"Cognee graph: {e}")
        return {"nodes": [], "edges": []}
