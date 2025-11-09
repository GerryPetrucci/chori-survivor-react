# Versión mínima para debugging
from fastapi import FastAPI
from supabase import create_client, Client
import os

app = FastAPI(root_path="/api")

# Configuración de Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Inicializar Supabase
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        status = "connected"
    except Exception as e:
        status = f"error: {str(e)}"
else:
    status = "no_credentials"

@app.get("/")
async def root():
    return {
        "status": "alive",
        "message": "FastAPI with Supabase",
        "supabase": status,
        "env_test": {
            "has_vite_url": bool(os.getenv("VITE_SUPABASE_URL")),
            "has_supabase_url": bool(os.getenv("SUPABASE_URL")),
            "has_next_url": bool(os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "supabase": status}
