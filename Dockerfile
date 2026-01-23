# 1. BUILD STAGE
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy Root Configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# B. Copy Source Code
COPY apps/api ./apps/api

# C. Install Dependencies
RUN pnpm install --frozen-lockfile

# D. Generate Prisma Client (Linux Version)
# This runs inside Docker to fix the "Missing Module" error
WORKDIR /app/apps/api
RUN npx prisma generate --schema=prisma/schema.prisma

# E. Build the API
RUN pnpm run build

# F. Create a clean "prod" folder
# This removes devDependencies and creates a standalone package
WORKDIR /app
RUN pnpm --filter=api --prod deploy --legacy /prod/api

# 2. RUNNER STAGE
FROM node:22-alpine AS runner

WORKDIR /app

# Install OpenSSL (Required for Prisma on Alpine)
RUN apk add --no-cache openssl libc6-compat

# Copy the "cleaned" production dependencies
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /prod/api/package.json ./package.json

# Copy the compiled code
COPY --from=builder /app/apps/api/dist ./dist

# Copy the Generated Prisma Client (Linux Engine)
COPY --from=builder /app/apps/api/src/generated ./dist/src/generated

# Copy Prisma Config (Runtime requirement)
COPY --from=builder /app/apps/api/prisma.config.ts ./

# Expose Port
EXPOSE 3000

# Start App
CMD ["node", "dist/src/main.js"]