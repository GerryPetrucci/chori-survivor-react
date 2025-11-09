# Versión mínima para debugging
from fastapi import FastAPI
import os

app = FastAPI(root_path="/api")

@app.get("/")
async def root():
    return {
        "status": "alive",
        "message": "Minimal FastAPI server working",
        "env_test": {
            "has_vite_url": bool(os.getenv("VITE_SUPABASE_URL")),
            "has_supabase_url": bool(os.getenv("SUPABASE_URL")),
            "has_next_url": bool(os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
