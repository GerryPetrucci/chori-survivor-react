# Test: Solo import de Supabase sin usar
from fastapi import FastAPI
import os

# Intentar importar Supabase dentro de try/except
supabase_error = None
try:
    from supabase import create_client, Client
    supabase_imported = True
except Exception as e:
    supabase_imported = False
    supabase_error = str(e)

app = FastAPI(root_path="/api")

@app.get("/")
async def root():
    return {
        "status": "alive",
        "message": "Testing Supabase import",
        "supabase_imported": supabase_imported,
        "supabase_error": supabase_error,
        "env_test": {
            "has_vite_url": bool(os.getenv("VITE_SUPABASE_URL")),
            "has_supabase_url": bool(os.getenv("SUPABASE_URL")),
            "has_next_url": bool(os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
