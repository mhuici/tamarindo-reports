# ===========================================
# TamarindoReports Production Dockerfile
# Optimized for Railway deployment
# ===========================================

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/integrations/package.json ./packages/integrations/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build the application
RUN pnpm build

# ===========================================
# Production stage
# ===========================================
FROM node:20-alpine AS production

# Install runtime dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    && rm -rf /var/cache/apk/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxt:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nuxt:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nuxt:nodejs /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=builder --chown=nuxt:nodejs /app/package.json ./package.json

# Copy prisma schema for migrations
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json

# Set environment
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", ".output/server/index.mjs"]
