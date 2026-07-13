#!/bin/sh
# ==========================================
# ZYNQ — Docker Startup Script
# ==========================================

echo "=========================================="
echo "🚀 ZYNQ BACKEND STARTUP"
echo "=========================================="

# 1. Run Migrations
echo "[1/2] Running database migrations..."
# Assuming a custom migration runner or drizzle-kit is available in the production build
# If using Drizzle ORM, a custom script compiled to dist/db/migrate.js is usually best
if [ -f "dist/db/migrate.js" ]; then
  node dist/db/migrate.js
else
  echo "⚠️  Migration script not found. Skipping migrations."
fi

# 2. Start the Server
echo "[2/2] Starting Express API Server..."
exec node dist/app.js
