# ===========================================
# LockForms.io Docker Build
# Multi-stage build for security and size
# ===========================================

# -----------------------------
# Base stage: Node.js Debian Slim
# -----------------------------
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Ensure app directory is owned by nextjs
RUN chown nextjs:nodejs /app

# -----------------------------
# Dependencies stage
# -----------------------------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# -----------------------------
# Development stage
# -----------------------------
FROM base AS development
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps && npm cache clean --force

COPY --chown=nextjs:nodejs . .

# Generate Prisma client
RUN npx prisma generate

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]

# -----------------------------
# Builder stage
# -----------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# -----------------------------
# Production stage
# -----------------------------
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Security: Run as non-root user
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
