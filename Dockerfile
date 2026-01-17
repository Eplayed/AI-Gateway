# API Gateway
FROM node:20-alpine AS api-gateway-builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway
RUN pnpm --filter api-gateway build

FROM node:20-alpine AS api-gateway
WORKDIR /app
COPY --from=api-gateway-builder /app/node_modules ./node_modules
COPY --from=api-gateway-builder /app/packages ./packages
COPY --from=api-gateway-builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/api-gateway/dist/index.js"]

# Prompt Manager
FROM node:20-alpine AS prompt-manager-builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY packages ./packages
COPY apps/prompt-manager ./apps/prompt-manager
RUN pnpm --filter prompt-manager build

FROM node:20-alpine AS prompt-manager
WORKDIR /app
COPY --from=prompt-manager-builder /app/node_modules ./node_modules
COPY --from=prompt-manager-builder /app/packages ./packages
COPY --from=prompt-manager-builder /app/apps/prompt-manager/dist ./apps/prompt-manager/dist
ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "apps/prompt-manager/dist/index.js"]
