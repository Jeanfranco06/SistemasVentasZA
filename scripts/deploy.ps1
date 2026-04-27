# scripts/deploy.ps1
Write-Host "🚀 Iniciando Pipeline de Despliegue Automatizado..." -ForegroundColor Cyan

# 1. Validación de Ambiente
Write-Host "🔍 Validando variables de entorno..."
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: Archivo .env no encontrado." -ForegroundColor Red
    exit 1
}

# 2. Instalación de Dependencias
Write-Host "📦 Instalando dependencias..."
npm install
Set-Location backend; npm install; Set-Location ..
Set-Location frontend; npm install; Set-Location ..

# 3. Pruebas Unitarias e Integración (Cobertura > 80%)
Write-Host "🧪 Ejecutando suite de pruebas..."
Set-Location backend; npm run test:coverage; if ($LASTEXITCODE -ne 0) { Write-Host "❌ Pruebas Backend fallidas" -ForegroundColor Red; exit 1 }
Set-Location ../frontend; npm run test:coverage; if ($LASTEXITCODE -ne 0) { Write-Host "❌ Pruebas Frontend fallidas" -ForegroundColor Red; exit 1 }
Set-Location ..

# 4. Construcción
Write-Host "🏗️ Construyendo aplicaciones..."
npm run build; if ($LASTEXITCODE -ne 0) { Write-Host "❌ Fallo en la construcción" -ForegroundColor Red; exit 1 }

Write-Host "✅ Despliegue completado exitosamente." -ForegroundColor Green
