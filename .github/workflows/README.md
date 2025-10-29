# ⚙️ Configuración de GitHub Actions (GRATIS)

## 📋 Pasos para Activar los Cron Jobs

### 1. Agregar el Secret en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/GerryPetrucci/chori-survivor-react`
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega el siguiente secret:
   - **Name**: `VERCEL_DOMAIN`
   - **Value**: Tu dominio de Vercel (ejemplo: `chori-survivor.vercel.app`)
   - Click en **Add secret**

### 2. Hacer Push del Archivo Workflow

El archivo ya está creado en `.github/workflows/nfl-cron-jobs.yml`. Solo necesitas hacer push:

```powershell
git add .github/workflows/nfl-cron-jobs.yml
git commit -m "Add GitHub Actions cron jobs"
git push origin setup-second
```

### 3. Verificar que Funciona

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Deberías ver el workflow "NFL Data Automation - Cron Jobs"
4. Los trabajos se ejecutarán automáticamente según el horario configurado

### 4. Ejecutar Manualmente (Opcional)

Puedes probar los endpoints manualmente sin esperar al cron:

1. Ve a **Actions** en GitHub
2. Selecciona "NFL Data Automation - Cron Jobs" en el lado izquierdo
3. Click en **Run workflow** (arriba a la derecha)
4. Selecciona qué job ejecutar:
   - `all` - Ejecuta todos
   - `set-current-week` - Solo actualiza semana actual
   - `daily-update` - Solo actualiza partidos y picks
   - `update-weekly-odds` - Solo actualiza odds
5. Click en **Run workflow**

---

## 📅 Horarios Configurados

### Set Current Week
- **Cuándo**: Martes y Jueves a las 5:00 AM (México CDMX)
- **Cron**: `0 11 * * 2,4` (11:00 AM UTC)
- **Qué hace**: Actualiza la semana actual de la temporada NFL

### Daily Update
- **Cuándo**: Todos los días a las 11:59 PM (México CDMX)
- **Cron**: `59 5 * * *` (5:59 AM UTC del día siguiente)
- **Qué hace**: 
  1. Actualiza marcadores de partidos
  2. Si tiene éxito, actualiza los picks automáticamente

### Update Weekly Odds
- **Cuándo**: Todos los días a las 5:00 AM (México CDMX)
- **Cron**: `0 11 * * *` (11:00 AM UTC)
- **Qué hace**: Actualiza las odds de la semana actual

---

## 🔍 Monitoreo

### Ver Logs de Ejecución

1. Ve a **Actions** en GitHub
2. Click en cualquier ejecución del workflow
3. Click en el job que quieres ver (set-current-week, daily-update, etc.)
4. Verás los logs detallados de la ejecución

### Notificaciones de Fallos

GitHub te enviará un email automáticamente si algún job falla.

También puedes configurar notificaciones personalizadas editando el job `notify-on-failure` en el archivo `.github/workflows/nfl-cron-jobs.yml`.

---

## ⚠️ Importante

### Límites de GitHub Actions (Plan Gratuito)

- **2,000 minutos/mes** para repos privados
- **Ilimitado** para repos públicos
- Cada ejecución toma ~30 segundos

**Cálculo mensual**:
- set-current-week: 2 veces/semana × 4 semanas = 8 ejecuciones
- daily-update: 30 días = 30 ejecuciones  
- update-weekly-odds: 30 días = 30 ejecuciones
- **Total**: ~68 ejecuciones/mes × 0.5 min = **34 minutos/mes**

✅ Muy por debajo del límite de 2,000 minutos

---

## 🛠️ Troubleshooting

### El workflow no aparece en Actions
- Asegúrate de haber hecho push del archivo `.github/workflows/nfl-cron-jobs.yml`
- El archivo debe estar en la rama principal o en la rama que estés usando

### El workflow falla con error 404
- Verifica que el secret `VERCEL_DOMAIN` esté configurado correctamente
- Asegúrate de que tu app esté desplegada en Vercel
- El dominio no debe incluir `https://`, solo el dominio: `tu-app.vercel.app`

### El workflow no se ejecuta a la hora programada
- Los cron jobs de GitHub pueden tener un retraso de hasta 15 minutos
- GitHub Actions puede estar saturado en horas pico
- Si es crítico, considera ejecutarlo manualmente

---

## 🎯 Próximos Pasos

1. ✅ Agregar secret `VERCEL_DOMAIN` en GitHub
2. ✅ Hacer push del workflow
3. ✅ Hacer deploy a Vercel
4. ✅ Probar ejecución manual desde Actions
5. ✅ Esperar a la primera ejecución automática

**¡Listo! Tus endpoints se ejecutarán automáticamente sin costo adicional.** 🎉
