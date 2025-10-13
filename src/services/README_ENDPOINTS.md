# Endpoints de Actualización - Chori Survivor

Este servicio proporciona endpoints para actualizar automáticamente los partidos y la semana actual de la temporada NFL.

## Requisitos

- Python 3.8+
- FastAPI
- Supabase Python Client
- pytz
- requests

## Instalación

1. Instalar las dependencias:
```bash
pip install fastapi supabase pytz requests uvicorn
```

2. Configurar las variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SPORTS_DB_API_KEY=3
```

## Ejecutar el servidor

```bash
uvicorn src.services.update_matches:app --reload
```

El servidor estará disponible en `http://127.0.0.1:8000`

## Endpoints

### 1. POST /update-matches

Actualiza los marcadores de los partidos desde TheSportsDB API.

**Ejemplo de uso:**
```bash
curl -X POST http://127.0.0.1:8000/update-matches
```

**Respuesta:**
```json
{
  "matches_updated": 15,
  "picks_updated": 0,
  "status": "completed"
}
```

**Funcionalidad:**
- Obtiene la temporada activa de Supabase
- Consulta los partidos desde septiembre hasta febrero
- Actualiza los marcadores en la tabla `matches`
- Cambia el estado de los partidos a "completed"

### 2. GET /current-week

Calcula y actualiza la semana actual basándose en la fecha de inicio de la temporada.

**Ejemplo de uso:**
```bash
curl http://127.0.0.1:8000/current-week
```

**Respuesta:**
```json
{
  "current_week": 5,
  "season_year": 2025,
  "season_id": 1,
  "updated": true
}
```

**Funcionalidad:**
- Calcula la semana actual basándose en la fecha de inicio de la temporada
- Actualiza el campo `current_week` en la tabla `seasons`
- Retorna información de la temporada actual

## Documentación Interactiva

Una vez que el servidor esté ejecutándose, puedes acceder a:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Despliegue en Producción

### Opción 1: Cron Job con Vercel Serverless Functions

1. Convertir a función serverless en Vercel
2. Configurar un cron job en `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/update-matches",
    "schedule": "0 */2 * * *"
  }, {
    "path": "/api/current-week",
    "schedule": "0 0 * * *"
  }]
}
```

### Opción 2: AWS Lambda con EventBridge

1. Empaquetar el código como función Lambda
2. Configurar EventBridge para ejecutar según horario

### Opción 3: Backend Node.js con node-cron

Integrar con tu backend existente y usar `node-cron` para ejecutar periódicamente.

## Logs

Los logs se guardan en `matches_update.log` y también se muestran en la consola.

## Errores Comunes

### Error: [Errno 11001] getaddrinfo failed
- **Causa**: Problemas de conectividad o DNS
- **Solución**: Verifica tu conexión a Internet y la URL de TheSportsDB API

### Error: No hay temporada activa
- **Causa**: No existe una temporada con `is_active = true` en la base de datos
- **Solución**: Asegúrate de tener una temporada activa en la tabla `seasons`

### Error: Equipos no encontrados
- **Causa**: El nombre del equipo en TheSportsDB no coincide con los nombres en tu base de datos
- **Solución**: Verifica los nombres de los equipos en la tabla `teams`
