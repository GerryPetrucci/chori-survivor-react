# ChoriSurvivor NFL API

## Endpoints disponibles después del deploy

Una vez que tu sitio esté desplegado en Vercel (ej: `https://tu-app.vercel.app`), tu API estará disponible en:

### Base URL
```
https://tu-app.vercel.app/api
```

### Endpoints

#### 1. **GET /** - Información de la API
```bash
curl https://tu-app.vercel.app/api/
```

#### 2. **POST /update-matches** - Actualizar partidos de la NFL
```bash
# Actualizar semana específica
curl -X POST https://tu-app.vercel.app/api/update-matches \
  -H "Content-Type: application/json" \
  -d '{"week": 8}'

# Actualizar desde semana actual en adelante
curl -X POST https://tu-app.vercel.app/api/update-matches
```

#### 3. **POST /update-weekly-odds** - Actualizar odds de la semana
```bash
curl -X POST https://tu-app.vercel.app/api/update-weekly-odds \
  -H "Content-Type: application/json" \
  -d '{"week": 8}'
```

#### 4. **GET /get-weekly-odds** - Obtener odds de una semana
```bash
curl "https://tu-app.vercel.app/api/get-weekly-odds?week=8"
```

#### 5. **POST /auto-update-picks** - Actualizar picks automáticamente
```bash
curl -X POST https://tu-app.vercel.app/api/auto-update-picks
```

#### 6. **GET /current-week** - Obtener semana actual
```bash
curl https://tu-app.vercel.app/api/current-week
```

#### 7. **POST /set-current-week** - Establecer semana actual
```bash
curl -X POST https://tu-app.vercel.app/api/set-current-week
```

#### 8. **GET /list-teams** - Listar equipos
```bash
curl https://tu-app.vercel.app/api/list-teams
```

#### 9. **GET /test-env** - Probar variables de entorno
```bash
curl https://tu-app.vercel.app/api/test-env
```

#### 10. **GET /test-api** - Probar conexión a API NFL
```bash
curl https://tu-app.vercel.app/api/test-api
```

## Configuración de Variables de Entorno en Vercel

⚠️ **IMPORTANTE**: Debes agregar las variables de entorno en el dashboard de Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las siguientes variables:

```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
RAPIDAPI_KEY=tu_rapidapi_key
```

## Automatización con Cron Jobs (Vercel Pro)

Si tienes Vercel Pro, puedes programar tareas automáticas creando un archivo `vercel.json` con crons:

```json
{
  "crons": [
    {
      "path": "/api/update-matches",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/auto-update-picks",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

## Deploy

Simplemente haz push a tu repositorio de GitHub conectado a Vercel:

```bash
git add .
git commit -m "Add Python API endpoints"
git push origin main
```

Vercel automáticamente detectará la carpeta `api/` y desplegará las funciones serverless de Python.
