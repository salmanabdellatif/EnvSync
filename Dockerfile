# ----------------------------------------
# 1. Build Stage
# ----------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy Root Configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the entire source code (apps, libs, etc.)
COPY . .

# Install dependencies (frozen-lockfile ensures strict versioning)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API project
WORKDIR /app/apps/api
RUN pnpm run build

# This creates a folder at /prod/api containing ONLY the production deps (no symlinks)
WORKDIR /app
RUN pnpm --filter=api --prod deploy --legacy /prod/api

# ----------------------------------------
# 2. Production Runner Stage
# ----------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Copy the "Deployed" production dependencies
# This folder has a clean node_modules and package.json
COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /prod/api/package.json ./package.json

# Copy the build artifact
COPY --from=builder /app/apps/api/dist ./dist

# Copy Prisma assets
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/src/main.js"]