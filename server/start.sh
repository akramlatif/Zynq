#!/bin/sh
# ==========================================
# ZYNQ — Docker Startup Script
# (updated for monorepo Docker layout: server code lives in /app/server)
# ==========================================

echo "=========================================="
echo "🚀 ZYNQ BACKEND STARTUP"
echo "=========================================="

# 1. Run Migrations
echo "[1/2] Running database migrations..."
if [ -f "server/dist/db/migrate.js" ]; then
  node server/dist/db/migrate.js
else
  echo "⚠️  Migration script not found at server/dist/db/migrate.js. Skipping migrations."
fi

# 2. Start the Server
echo "[2/2] Starting Express API Server..."
exec node server/dist/app.js
