# 🕐 Programación de Tareas Automáticas (Cron Jobs)

## ⚠️ Requisito: Vercel Pro

Los cron jobs **requieren el plan Vercel Pro** ($20 USD/mes). Si no tienes Pro, puedes:
- Usar servicios externos como [cron-job.org](https://cron-job.org) o [EasyCron](https://www.easycron.com/)
- Configurar un servidor propio con crontab
- Usar GitHub Actions (gratis)

---

## 📅 Configuración Actual en `vercel.json`

### 1. **Set Current Week** - `POST /api/set-current-week`
- **Horario**: Martes y Jueves a las 5:00 AM (hora del servidor UTC)
- **Cron**: `0 5 * * 2,4`
- **Descripción**: Calcula y actualiza la semana actual de la temporada NFL

### 2. **Daily Update** - `POST /api/daily-update`
- **Horario**: Todos los días a las 23:59 (hora del servidor UTC)
- **Cron**: `59 23 * * *`
- **Descripción**: Orquestador que ejecuta:
  1. `update-matches` - Actualiza marcadores de partidos
  2. `auto-update-picks` - Actualiza picks (solo si update-matches tuvo éxito)

### 3. **Update Weekly Odds Auto** - `POST /api/update-weekly-odds-auto`
- **Horario**: Todos los días a las 5:00 AM (hora del servidor UTC)
- **Cron**: `0 5 * * *`
- **Descripción**: Actualiza las odds de la semana actual automáticamente

---

## 🌍 Conversión de Horarios (UTC ↔ México CDMX)

Vercel ejecuta los crons en **UTC**. México CDMX está en **UTC-6**.

| Tarea | Hora México (CDMX) | Hora UTC | Cron Expression |
|-------|-------------------|----------|-----------------|
| Set Current Week (Mar/Jue) | 11:00 PM (día anterior) | 5:00 AM | `0 5 * * 2,4` |
| Daily Update | 5:59 PM | 11:59 PM | `59 23 * * *` |
| Update Weekly Odds | 11:00 PM (día anterior) | 5:00 AM | `0 5 * * *` |

### Ajustar a hora de México

Si quieres que se ejecuten en hora de México:

```json
{
  "crons": [
    {
      "path": "/api/set-current-week",
      "schedule": "0 11 * * 1,3"  // Lunes y Miércoles a las 11 AM UTC = Martes y Jueves 5 AM CDMX
    },
    {
      "path": "/api/daily-update",
      "schedule": "59 5 * * *"  // 5:59 AM UTC = 11:59 PM CDMX (día anterior)
    },
    {
      "path": "/api/update-weekly-odds-auto",
      "schedule": "0 11 * * *"  // 11 AM UTC = 5 AM CDMX
    }
  ]
}
```

---

## 📖 Formato Cron Expression

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo = 0)
│ │ │ │ │
* * * * *
```

### Ejemplos:
- `0 5 * * *` - Todos los días a las 5:00 AM
- `0 5 * * 2,4` - Martes (2) y Jueves (4) a las 5:00 AM
- `59 23 * * *` - Todos los días a las 23:59
- `0 */6 * * *` - Cada 6 horas
- `0 0 * * 0` - Todos los domingos a medianoche

---

## 🔍 Monitoreo de Cron Jobs

### Ver logs en Vercel
1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Logs**
3. Filtra por "cron" para ver solo ejecuciones de cron jobs

### Verificar ejecución manual
Puedes probar los endpoints manualmente:

```bash
# Probar daily-update
curl -X POST https://tu-app.vercel.app/api/daily-update

# Probar update-weekly-odds-auto
curl -X POST https://tu-app.vercel.app/api/update-weekly-odds-auto

# Probar set-current-week
curl -X POST https://tu-app.vercel.app/api/set-current-week
```

---

## 🛠️ Alternativa: GitHub Actions (GRATIS)

Si no quieres pagar Vercel Pro, puedes usar GitHub Actions:

Crea `.github/workflows/cron-jobs.yml`:

```yaml
name: NFL Data Cron Jobs

on:
  schedule:
    # Set current week: Martes y Jueves a las 5 AM CDMX (11 AM UTC)
    - cron: '0 11 * * 2,4'
    # Daily update: Todos los días a las 11:59 PM CDMX (5:59 AM UTC siguiente día)
    - cron: '59 5 * * *'
    # Update odds: Todos los días a las 5 AM CDMX (11 AM UTC)
    - cron: '0 11 * * *'
  workflow_dispatch:  # Permite ejecución manual

jobs:
  set-current-week:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 11 * * 2,4'
    steps:
      - name: Call set-current-week endpoint
        run: |
          curl -X POST https://tu-app.vercel.app/api/set-current-week

  daily-update:
    runs-on: ubuntu-latest
    if: github.event.schedule == '59 5 * * *'
    steps:
      - name: Call daily-update endpoint
        run: |
          curl -X POST https://tu-app.vercel.app/api/daily-update

  update-odds:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 11 * * *'
    steps:
      - name: Call update-weekly-odds-auto endpoint
        run: |
          curl -X POST https://tu-app.vercel.app/api/update-weekly-odds-auto
```

---

## 📊 Resumen de Endpoints Orquestadores

### `/api/daily-update`
**Lógica inteligente:**
1. Ejecuta `update-matches` para actualizar marcadores
2. **Solo si** `update-matches` tiene éxito → ejecuta `auto-update-picks`
3. Retorna resultado detallado de ambas operaciones

**Respuesta:**
```json
{
  "timestamp": "2025-10-29T23:59:00-06:00",
  "update_matches": {
    "status": "success",
    "data": { "matches_updated": 15, "matches_inserted": 0 }
  },
  "auto_update_picks": {
    "status": "success",
    "data": { "picks_updated": 42, "entries_updated": 18 }
  },
  "status": "completed"
}
```

### `/api/update-weekly-odds-auto`
**Lógica inteligente:**
1. Obtiene automáticamente la semana actual de la temporada activa
2. Ejecuta `update-weekly-odds` con esa semana

**Respuesta:**
```json
{
  "timestamp": "2025-10-29T05:00:00-06:00",
  "week": 8,
  "season_id": 1,
  "season_year": 2025,
  "result": { "odds_updated": 12, "odds_inserted": 4 },
  "status": "completed"
}
```

---

## ✅ Próximos Pasos

1. **Hacer deploy** a Vercel
2. **Activar Vercel Pro** (si quieres usar cron jobs nativos)
3. **Verificar** que las variables de entorno estén configuradas
4. **Monitorear** los primeros días para confirmar que funcionan correctamente

Los cron jobs se activarán automáticamente después del deploy si tienes Vercel Pro.
