import sqlite3
import json
import os
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "cognee_data", "studiomind.db")

# ---------------------------------------------------------------------------
# Lightweight embedding via hash-based projection (no heavy ML deps needed)
# Falls back to sentence-transformers if available
# ---------------------------------------------------------------------------
try:
    from sentence_transformers import SentenceTransformer
    _encoder = SentenceTransformer("all-MiniLM-L6-v2")
    def _embed(text: str) -> np.ndarray:
        return _encoder.encode(text, normalize_embeddings=True).astype(np.float32)
except Exception:
    def _embed(text: str) -> np.ndarray:
        # Deterministic 64-dim hash projection fallback
        h = hashlib.sha256(text.encode()).digest()
        vec = np.frombuffer(h * 4, dtype=np.uint8)[:64].astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


class MemoryStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()

    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS memories (
                    id          TEXT PRIMARY KEY,
                    dataset     TEXT NOT NULL,
                    content     TEXT NOT NULL,
                    embedding   BLOB NOT NULL,
                    tags        TEXT DEFAULT '[]',
                    feedback    REAL DEFAULT 0.0,
                    access_count INTEGER DEFAULT 0,
                    created_at  TEXT NOT NULL,
                    accessed_at TEXT NOT NULL,
                    ttl_days    INTEGER DEFAULT 90
                );

                CREATE TABLE IF NOT EXISTS entities (
                    id      TEXT PRIMARY KEY,
                    dataset TEXT NOT NULL,
                    name    TEXT NOT NULL,
                    type    TEXT NOT NULL,
                    value   TEXT
                );

                CREATE TABLE IF NOT EXISTS relationships (
                    id          TEXT PRIMARY KEY,
                    dataset     TEXT NOT NULL,
                    from_id     TEXT NOT NULL,
                    to_id       TEXT NOT NULL,
                    rel_type    TEXT NOT NULL,
                    strength    REAL DEFAULT 1.0
                );

                CREATE INDEX IF NOT EXISTS idx_mem_dataset ON memories(dataset);
                CREATE INDEX IF NOT EXISTS idx_ent_dataset ON entities(dataset);
            """)

    # ------------------------------------------------------------------
    # remember() — store with embedding + entity extraction
    # ------------------------------------------------------------------
    async def remember(self, text: str, dataset: str, tags: list = None, ttl_days: int = 90) -> str:
        mem_id = hashlib.sha256(f"{dataset}:{text}:{datetime.utcnow().isoformat()}".encode()).hexdigest()[:16]
        embedding = _embed(text)
        now = datetime.utcnow().isoformat()

        # Extract simple entities (design-domain keywords)
        extracted_tags = tags or _extract_tags(text)

        with self._conn() as conn:
            conn.execute("""
                INSERT OR IGNORE INTO memories
                    (id, dataset, content, embedding, tags, feedback, access_count, created_at, accessed_at, ttl_days)
                VALUES (?, ?, ?, ?, ?, 0.0, 0, ?, ?, ?)
            """, (mem_id, dataset, text, embedding.tobytes(), json.dumps(extracted_tags), now, now, ttl_days))

            # Store extracted entities
            for tag in extracted_tags:
                eid = hashlib.sha256(f"{dataset}:{tag}".encode()).hexdigest()[:16]
                conn.execute("""
                    INSERT OR IGNORE INTO entities (id, dataset, name, type, value)
                    VALUES (?, ?, ?, 'tag', ?)
                """, (eid, dataset, tag, mem_id))

        return mem_id

    # ------------------------------------------------------------------
    # recall() — hybrid: vector similarity + recency + feedback score
    # ------------------------------------------------------------------
    async def recall(self, query: str, dataset: str, top_k: int = 6) -> List[str]:
        query_vec = _embed(query)
        now = datetime.utcnow()

        with self._conn() as conn:
            rows = conn.execute(
                "SELECT id, content, embedding, feedback, created_at, access_count FROM memories WHERE dataset = ?",
                (dataset,)
            ).fetchall()

        if not rows:
            return []

        scored = []
        for row in rows:
            mem_vec = np.frombuffer(row["embedding"], dtype=np.float32)
            similarity = _cosine(query_vec, mem_vec)

            # Recency score: decay over 30 days
            age_days = (now - datetime.fromisoformat(row["created_at"])).days
            recency = max(0.0, 1.0 - age_days / 30.0)

            # Feedback boost (capped)
            feedback_boost = min(row["feedback"] * 0.05, 0.3)

            # Access frequency boost
            freq_boost = min(row["access_count"] * 0.01, 0.1)

            final_score = similarity * 0.6 + recency * 0.2 + feedback_boost + freq_boost
            scored.append((final_score, row["id"], row["content"]))

        scored.sort(reverse=True)
        top = scored[:top_k]

        # Update access counts
        ids = [r[1] for r in top]
        with self._conn() as conn:
            for mid in ids:
                conn.execute("""
                    UPDATE memories SET access_count = access_count + 1, accessed_at = ?
                    WHERE id = ?
                """, (datetime.utcnow().isoformat(), mid))

        return [r[2] for r in top]

    # ------------------------------------------------------------------
    # improve() — feedback weighting + trigger compression
    # ------------------------------------------------------------------
    async def improve(self, dataset: str, content_snippet: str, is_positive: bool) -> None:
        delta = 2.0 if is_positive else -1.5
        with self._conn() as conn:
            conn.execute("""
                UPDATE memories SET feedback = MAX(-5, MIN(10, feedback + ?))
                WHERE dataset = ? AND content LIKE ?
            """, (delta, dataset, f"%{content_snippet[:60]}%"))

        # Auto-compress if dataset has grown large
        await self._maybe_compress(dataset)

    # ------------------------------------------------------------------
    # forget() — dataset-level or node-level deletion
    # ------------------------------------------------------------------
    async def forget(self, dataset: str, memory_id: str = None) -> int:
        with self._conn() as conn:
            if memory_id:
                conn.execute("DELETE FROM memories WHERE id = ? AND dataset = ?", (memory_id, dataset))
                conn.execute("DELETE FROM entities WHERE value = ? AND dataset = ?", (memory_id, dataset))
                return 1
            else:
                c = conn.execute("DELETE FROM memories WHERE dataset = ?", (dataset,))
                conn.execute("DELETE FROM entities WHERE dataset = ?", (dataset,))
                conn.execute("DELETE FROM relationships WHERE dataset = ?", (dataset,))
                return c.rowcount

    # ------------------------------------------------------------------
    # forget_expired() — TTL-based decay (call on startup or scheduled)
    # ------------------------------------------------------------------
    async def forget_expired(self) -> int:
        cutoff = datetime.utcnow().isoformat()
        with self._conn() as conn:
            # Delete memories past their TTL
            rows = conn.execute(
                "SELECT id, dataset, created_at, ttl_days FROM memories"
            ).fetchall()
            expired_ids = []
            for row in rows:
                expiry = datetime.fromisoformat(row["created_at"]) + timedelta(days=row["ttl_days"])
                if expiry.isoformat() < cutoff:
                    expired_ids.append((row["id"], row["dataset"]))

            for mid, ds in expired_ids:
                conn.execute("DELETE FROM memories WHERE id = ?", (mid,))
                conn.execute("DELETE FROM entities WHERE value = ?", (mid,))

        return len(expired_ids)

    # ------------------------------------------------------------------
    # list_memories() — for the frontend memory management UI
    # ------------------------------------------------------------------
    async def list_memories(self, dataset: str, limit: int = 30) -> list:
        with self._conn() as conn:
            rows = conn.execute("""
                SELECT id, content, tags, feedback, created_at, access_count
                FROM memories WHERE dataset = ?
                ORDER BY feedback DESC, access_count DESC
                LIMIT ?
            """, (dataset, limit)).fetchall()
        return [dict(r) for r in rows]

    # ------------------------------------------------------------------
    # get_graph() — return nodes + edges for visualization
    # ------------------------------------------------------------------
    async def get_graph(self, dataset: str) -> dict:
        with self._conn() as conn:
            mems = conn.execute(
                "SELECT id, content, tags, feedback FROM memories WHERE dataset = ? LIMIT 40",
                (dataset,)
            ).fetchall()
            ents = conn.execute(
                "SELECT id, name, type FROM entities WHERE dataset = ? LIMIT 30",
                (dataset,)
            ).fetchall()

        nodes = []
        for m in mems:
            snippet = m["content"][:50].replace('"', '')
            nodes.append({"id": m["id"], "label": snippet, "group": "memory", "feedback": m["feedback"]})
        for e in ents:
            nodes.append({"id": e["id"], "label": e["name"], "group": e["type"]})

        # Build edges: entity → memory
        edges = []
        with self._conn() as conn:
            ents_full = conn.execute(
                "SELECT id, value FROM entities WHERE dataset = ?", (dataset,)
            ).fetchall()
        for e in ents_full:
            if e["value"]:
                edges.append({"source": e["id"], "target": e["value"]})

        return {"nodes": nodes, "edges": edges}

    # ------------------------------------------------------------------
    # cross_project_recall() — for Style DNA across all user projects
    # ------------------------------------------------------------------
    async def cross_project_recall(self, user_id: str, query: str, top_k: int = 10) -> List[str]:
        with self._conn() as conn:
            datasets = conn.execute(
                "SELECT DISTINCT dataset FROM memories WHERE dataset LIKE ?",
                (f"project_{user_id}_%",)
            ).fetchall()

        all_results = []
        for row in datasets:
            results = await self.recall(query, row["dataset"], top_k=3)
            all_results.extend(results)

        return all_results[:top_k]

    # ------------------------------------------------------------------
    # _maybe_compress() — summarize old low-value memories
    # ------------------------------------------------------------------
    async def _maybe_compress(self, dataset: str) -> None:
        with self._conn() as conn:
            count = conn.execute(
                "SELECT COUNT(*) as c FROM memories WHERE dataset = ?", (dataset,)
            ).fetchone()["c"]

        if count < 50:
            return

        # Mark lowest-scored old memories for pruning
        with self._conn() as conn:
            conn.execute("""
                DELETE FROM memories WHERE id IN (
                    SELECT id FROM memories
                    WHERE dataset = ? AND feedback < -1
                    ORDER BY feedback ASC, accessed_at ASC
                    LIMIT 10
                )
            """, (dataset,))


# ---------------------------------------------------------------------------
# Domain-aware tag extractor (no external NLP needed)
# ---------------------------------------------------------------------------
DESIGN_KEYWORDS = [
    "dark mode", "light mode", "glassmorphism", "neumorphism", "minimalist",
    "typography", "color palette", "grid", "spacing", "layout", "animation",
    "gradient", "border radius", "shadow", "contrast", "accessibility",
    "mobile", "desktop", "responsive", "component", "icon", "illustration",
    "brand", "logo", "font", "serif", "sans-serif", "monospace",
    "primary color", "secondary color", "accent", "background", "foreground",
]

def _extract_tags(text: str) -> list:
    text_lower = text.lower()
    return [kw for kw in DESIGN_KEYWORDS if kw in text_lower][:8]


# Singleton
_store: Optional[MemoryStore] = None

def get_memory_store() -> MemoryStore:
    global _store
    if _store is None:
        _store = MemoryStore()
    return _store
