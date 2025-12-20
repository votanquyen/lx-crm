# Production Dockerfile for Lộc Xanh Plant Rental CRM
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM oven/bun:1.1.38-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile --production=false

# Generate Prisma client
RUN bunx prisma generate

# Stage 2: Builder
FROM oven/bun:1.1.38-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application code
COPY . .

# Set build-time environment variables
ARG NODE_ENV=production
ARG NEXT_PUBLIC_ENV=production

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1.1.38-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy node_modules (for Prisma client)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set hostname
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start application
CMD ["bun", "run", "server.js"]
