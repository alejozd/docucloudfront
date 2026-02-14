#!/usr/bin/env bash
set -euo pipefail

# Uso:
#   bash scripts/deploy_frontend.sh
#   PM2_PROCESS_NAME=frotnend bash scripts/deploy_frontend.sh
#   PM2_PROCESS_NAME=frontend PROJECT_DIR=/var/www/docucloudfront bash scripts/deploy_frontend.sh

PROJECT_DIR="${PROJECT_DIR:-/var/www/docucloudfront}"
PM2_PROCESS_NAME="${PM2_PROCESS_NAME:-frotnend}"
BRANCH_NAME="${BRANCH_NAME:-$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}"
RUN_AS_SUDO="${RUN_AS_SUDO:-true}"

run_cmd() {
  if [[ "$RUN_AS_SUDO" == "true" ]]; then
    sudo "$@"
  else
    "$@"
  fi
}

if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  echo "❌ Error: PROJECT_DIR no parece ser un repo git válido: $PROJECT_DIR"
  exit 1
fi

echo "📁 Proyecto: $PROJECT_DIR"
echo "🌿 Rama: $BRANCH_NAME"
echo "🧩 Proceso PM2: $PM2_PROCESS_NAME"
echo

echo "1) Actualizando código (git pull)..."
run_cmd git -C "$PROJECT_DIR" pull origin "$BRANCH_NAME"

echo "2) Instalando dependencias (npm install)..."
run_cmd npm --prefix "$PROJECT_DIR" install

echo "3) Compilando frontend (npm run build)..."
run_cmd npm --prefix "$PROJECT_DIR" run build

echo "4) Gestionando proceso PM2..."
if run_cmd pm2 describe "$PM2_PROCESS_NAME" >/dev/null 2>&1; then
  echo "   ↻ Reiniciando proceso existente: $PM2_PROCESS_NAME"
  run_cmd pm2 restart "$PM2_PROCESS_NAME"
else
  echo "   ▶ Proceso no existe. Iniciando uno nuevo con npm start..."
  run_cmd pm2 start npm --name "$PM2_PROCESS_NAME" --prefix "$PROJECT_DIR" -- start
fi

echo "5) Guardando estado de PM2..."
run_cmd pm2 save

echo
run_cmd pm2 status

echo
 echo "✅ Despliegue completado correctamente."
