# Script de configuración rápida para GitHub Actions

Write-Host ""
Write-Host "🚀 Configuración de GitHub Actions - ChoriSurvivor" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar que el workflow existe
if (Test-Path ".\.github\workflows\nfl-cron-jobs.yml") {
    Write-Host "✅ Workflow encontrado: .github/workflows/nfl-cron-jobs.yml" -ForegroundColor Green
} else {
    Write-Host "❌ Error: No se encontró el archivo del workflow" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 PASOS A SEGUIR:" -ForegroundColor Yellow
Write-Host ""

# Paso 2: Obtener dominio de Vercel
Write-Host "1️⃣  ¿Cuál es tu dominio de Vercel?" -ForegroundColor Cyan
Write-Host "    Ejemplo: chori-survivor.vercel.app (sin https://)" -ForegroundColor Gray
Write-Host ""
$domain = Read-Host "    Dominio"

if ([string]::IsNullOrWhiteSpace($domain)) {
    Write-Host ""
    Write-Host "❌ Dominio no proporcionado. Saliendo..." -ForegroundColor Red
    exit 1
}

# Limpiar dominio (por si incluye https://)
$domain = $domain -replace 'https://', '' -replace 'http://', '' -replace '/', ''

Write-Host ""
Write-Host "✅ Dominio configurado: $domain" -ForegroundColor Green
Write-Host ""

# Paso 3: Instrucciones para GitHub
Write-Host "2️⃣  Configurar Secret en GitHub:" -ForegroundColor Cyan
Write-Host ""
Write-Host "    a) Ve a: github.com/GerryPetrucci/chori-survivor-react/settings/secrets/actions" -ForegroundColor White
Write-Host "    b) Click en New repository secret" -ForegroundColor White
Write-Host "    c) Nombre del secret: VERCEL_DOMAIN" -ForegroundColor Yellow
Write-Host "    d) Valor del secret: $domain" -ForegroundColor Yellow
Write-Host "    e) Click en Add secret" -ForegroundColor White
Write-Host ""

# Esperar confirmación
Write-Host "    Presiona ENTER cuando hayas agregado el secret en GitHub..." -ForegroundColor Gray
Read-Host

Write-Host ""
Write-Host "3️⃣  Hacer push a GitHub:" -ForegroundColor Cyan
Write-Host ""

# Verificar estado de git
$gitStatus = git status --porcelain 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: No es un repositorio git" -ForegroundColor Red
    exit 1
}

# Agregar archivos
Write-Host "    Agregando archivos..." -ForegroundColor Gray
git add .github/workflows/

Write-Host "    Creando commit..." -ForegroundColor Gray
git commit -m "Add GitHub Actions for automated cron jobs (free alternative to Vercel Pro)"

Write-Host "    Haciendo push..." -ForegroundColor Gray
git push origin setup-second

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push completado exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Paso 4: Verificar
    Write-Host "4️⃣  Verificar en GitHub:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    a) Ve a: github.com/GerryPetrucci/chori-survivor-react/actions" -ForegroundColor White
    Write-Host "    b) Deberias ver NFL Data Automation - Cron Jobs" -ForegroundColor White
    Write-Host "    c) Puedes ejecutar manualmente con Run workflow" -ForegroundColor White
    Write-Host ""
    
    # Resumen
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📊 HORARIOS CONFIGURADOS (Hora de México CDMX):" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📅 Set Current Week" -ForegroundColor Yellow
    Write-Host "     Martes y Jueves a las 5:00 AM" -ForegroundColor White
    Write-Host ""
    Write-Host "  🏈 Daily Update (Matches + Picks)" -ForegroundColor Yellow
    Write-Host "     Todos los días a las 11:59 PM" -ForegroundColor White
    Write-Host ""
    Write-Host "  🎲 Update Weekly Odds" -ForegroundColor Yellow
    Write-Host "     Todos los días a las 5:00 AM" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ ¡Configuración completada!" -ForegroundColor Green
    Write-Host "   Tu API se ejecutará automáticamente sin costo." -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Más info: .github/workflows/README.md" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error al hacer push. Verifica tu conexion y permisos." -ForegroundColor Red
    Write-Host ""
}
