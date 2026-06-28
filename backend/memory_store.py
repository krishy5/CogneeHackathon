import sqlite3
import json
import os
from datetime import datetime
from sentence_transformers import SentenceTransformer
import numpy as np

class MemoryStore:
    def __init__(self, db_path="./memory_data/studiomind.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Memory table with embeddings
        c.execute('''CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding BLOB NOT NULL,
            timestamp TEXT NOT NULL,
            feedback INTEGER DEFAULT 0
        )''')
        
        # Graph relationships
        c.execute('''CREATE TABLE IF NOT EXISTS relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory_id INTEGER,
            related_id INTEGER,
            relationship_type TEXT,
            strength REAL DEFAULT 1.0,
            FOREIGN KEY(memory_id) REFERENCES memories(id),
            FOREIGN KEY(related_id) REFERENCES memories(id)
        )''')
        
        conn.commit()
        conn.close()
    
    async def remember(self, text: str, dataset_name: str):
        """Store text with semantic embedding"""
        embedding = self.encoder.encode(text)
        embedding_bytes = embedding.tobytes()
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''INSERT INTO memories (dataset, content, embedding, timestamp)
                     VALUES (?, ?, ?, ?)''',
                  (dataset_name, text, embedding_bytes, datetime.utcnow().isoformat()))
        conn.commit()
        conn.close()
    
    async def recall(self, query: str, datasets: list, top_k: int = 5) -> list:
        """Semantic search with vector similarity"""
        query_embedding = self.encoder.encode(query)
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Get all memories from specified datasets
        placeholders = ','.join('?' * len(datasets))
        c.execute(f'''SELECT id, content, embedding, feedback 
                     FROM memories 
                     WHERE dataset IN ({placeholders})''', datasets)
        
        results = []
        for row in c.fetchall():
            mem_id, content, embedding_bytes, feedback = row
            mem_embedding = np.frombuffer(embedding_bytes, dtype=np.float32)
            
            # Cosine similarity
            similarity = np.dot(query_embedding, mem_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(mem_embedding)
            )
            
            # Boost by feedback
            score = similarity * (1 + feedback * 0.1)
            results.append((score, content))
        
        conn.close()
        
        # Sort by score and return top_k
        results.sort(reverse=True, key=lambda x: x[0])
        return [content for _, content in results[:top_k]]
    
    async def improve(self, dataset: str):
        """Enrich memory by boosting recent high-quality entries"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Boost feedback for recent positive memories
        c.execute('''UPDATE memories 
                     SET feedback = feedback + 1 
                     WHERE dataset = ? AND feedback >= 0
                     ORDER BY timestamp DESC LIMIT 10''', (dataset,))
        
        conn.commit()
        conn.close()
    
    async def forget(self, dataset: str):
        """Delete all memories in a dataset"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('DELETE FROM memories WHERE dataset = ?', (dataset,))
        conn.commit()
        conn.close()
    
    async def add_feedback(self, dataset: str, content_snippet: str, is_positive: bool):
        """Add user feedback (thumbs up/down)"""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        feedback_delta = 1 if is_positive else -1
        c.execute('''UPDATE memories 
                     SET feedback = feedback + ? 
                     WHERE dataset = ? AND content LIKE ?
                     ORDER BY timestamp DESC LIMIT 1''',
                  (feedback_delta, dataset, f'%{content_snippet[:50]}%'))
        
        conn.commit()
        conn.close()

# Singleton instance
_memory_store = None

def get_memory_store() -> MemoryStore:
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore()
    return _memory_store
