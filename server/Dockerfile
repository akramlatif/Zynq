# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript to dist/
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS runner

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only package.json and lockfile
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the built output from builder
COPY --from=builder /app/dist ./dist
# Copy migrations so they can be run on startup
COPY --from=builder /app/src/db/migrations ./src/db/migrations

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Change ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the API port
EXPOSE 5000

# Use startup script that runs migrations then starts the server
CMD ["./start.sh"]
