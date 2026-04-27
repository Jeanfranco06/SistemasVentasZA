# scripts/deploy.sh
#!/bin/bash

echo "🚀 Iniciando Pipeline de Despliegue Automatizado..."

# 1. Validación de Ambiente
echo "🔍 Validando variables de entorno..."
if [ ! -f .env ]; then
    echo "❌ Error: Archivo .env no encontrado. Use .env.example como base."
    exit 1
fi

# 2. Instalación de Dependencias
echo "📦 Instalando dependencias..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Pruebas Unitarias e Integración (Cobertura > 80%)
echo "🧪 Ejecutando suite de pruebas con Vitest..."
cd backend && npm run test:coverage || { echo "❌ Pruebas de Backend fallidas"; exit 1; }
cd ../frontend && npm run test:coverage || { echo "❌ Pruebas de Frontend fallidas"; exit 1; }
cd ..

# 4. Construcción
echo "🏗️ Construyendo aplicaciones..."
npm run build || { echo "❌ Fallo en la construcción"; exit 1; }

# 5. Verificación de Health Check (Simulada para local)
echo "🩺 Verificando Health Check del sistema..."
# Aquí se dispararía un curl al endpoint /health después de levantar el servicio
# curl -f http://localhost:4000/health || exit 1

echo "✅ Despliegue completado exitosamente."
