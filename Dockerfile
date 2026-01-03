# ----------------------------------------
# 1. Build Stage
# ----------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm globaly
RUN npm install -g pnpm

# Copy Root Configs (Crucial for workspace linking)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the entire source code (apps, libs, etc.)
COPY . .

# Install dependencies (frozen-lockfile ensures strict versioning)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
# Note: Point explicitly to your schema if it's nested
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the API project
WORKDIR /app/apps/api
RUN pnpm run build

# ----------------------------------------
# 2. Production Runner Stage
# ----------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm (needed for runtime scripts if any)
RUN npm install -g pnpm

# Copy production dependencies (root node_modules usually has everything in pnpm)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# NestJS monorepos output to dist/apps/api
COPY --from=builder /app/apps/api/dist ./dist

# --- FIX: Copy Prisma assets ---
# Ensure the runtime can find the schema/engine
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000

# Start the app
CMD ["node", "dist/src/main.js"]