# ----------------------------------------
# Stage 1: Base - Install Dependencies
# ----------------------------------------
FROM node:20-alpine AS base

# Install system dependencies needed for Prisma/native modules
# openssl is required for Prisma Client
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package management files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (development dependencies are needed for building)
RUN npm ci

# ----------------------------------------
# Stage 2: Builder - Compile TypeScript
# ----------------------------------------
FROM base AS builder

WORKDIR /app

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

# Prune dev dependencies to keep the image small
RUN npm prune --production

# ----------------------------------------
# Stage 3: Runner - Production Image
# ----------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install runtime dependencies (only what's strictly needed)
RUN apk add --no-cache openssl

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built artifacts from builder stage
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER expressjs

# Expose the application port
EXPOSE 5000

# Start command
# We use dumb-init or similar in a real prod env, but node is fine for this scope
CMD ["node", "dist/index.js"]
