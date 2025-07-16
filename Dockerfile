# ---- BUILD STAGE ----
FROM node:22.16-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the TypeScript code
RUN npm run build

# ---- RUNTIME STAGE ----
FROM node:22.16-slim

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Install runtime-only system dependencies
# RUN apt-get update && apt-get install -y \
#     ghostscript \
#     poppler-utils \
#     --no-install-recommends && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# Copy built application from builder stage
COPY --from=builder /app/package*.json ./

# Install only production dependencies and ignore the prepare script for husky
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

# Copy the  from builder
COPY --from=builder /app/dist ./dist

# Copy environment files
COPY .env* ./

# Expose the default app port (change as needed to match your PORT env variable)
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
