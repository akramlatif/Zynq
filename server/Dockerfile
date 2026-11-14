# ==========================================
# Build Stage
# NOTE: Build context must be the REPO ROOT (docker build -f server/Dockerfile .)
# because this monorepo keeps a single npm-workspaces lockfile at the root.
# There is no server/package-lock.json, so a server-only context cannot work.
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests and the root lockfile
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/

# Install all workspace dependencies (including devDependencies for build)
RUN npm ci

# Build the shared package first (server imports its types)
COPY shared/ ./shared/
RUN npm run build --workspace=shared

# Build the server TypeScript
COPY server/tsconfig.json ./server/
COPY server/src/ ./server/src/
RUN npm run build --workspace=server

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS runner

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy workspace manifests and root lockfile, install prod deps only
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY client/package.json ./client/
RUN npm ci --omit=dev

# Copy the built output from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared/dist ./shared/dist
# Copy migrations so they can be run on startup
COPY --from=builder /app/server/src/db/migrations ./server/src/db/migrations

# Copy startup script
COPY server/start.sh ./start.sh
RUN chmod +x start.sh

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

# Use startup script that runs migrations then starts the server
CMD ["./start.sh"]
