# 優化的 Dockerfile - 更好的層緩存策略

# 基礎映像層 - 很少變動
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
# 啟用 corepack 並安裝固定版本 pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate
WORKDIR /app

# 生產依賴層 - 只在 package.json 變動時重建
FROM base AS deps-prod
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# 開發依賴層 - 用於構建階段
FROM base AS deps-dev
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Prisma 層 - 只在 schema 變動時重建
FROM deps-dev AS prisma
COPY prisma ./prisma
RUN pnpm run prisma:generate && \
    echo "Prisma client generated successfully"

# 構建層 - 編譯 TypeScript
FROM prisma AS builder
COPY tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts
COPY controllers ./controllers
COPY models ./models
COPY routes ./routes
COPY services ./services
COPY middlewares ./middlewares
COPY utils ./utils
COPY public ./public
COPY index.js ./
COPY ecosystem.config.js ./

# 編譯 TypeScript
RUN pnpm run build

# 生產映像 - 最小化尺寸
FROM base AS runtime

ARG NODE_ENV=prod
ENV NODE_ENV=$NODE_ENV
ENV HEALTH_CHECK_PORT=3000
ENV HEALTH_CHECK_PATH=/api/v1/health

# PM2 is already installed as a local dependency

# 創建用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 複製生產依賴
COPY --from=deps-prod /app/node_modules ./node_modules

# 複製編譯後的代碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ecosystem.config.js ./

# 複製 Prisma 文件和生成的客戶端
COPY --from=prisma /app/generated ./generated
COPY prisma ./prisma

# 創建必要的目錄和確保 generated 目錄可訪問
RUN mkdir -p /app/logs /app/dist/generated && \
    if [ -d "/app/generated" ] && [ "$(ls -A /app/generated 2>/dev/null)" ]; then \
        cp -r /app/generated/* /app/dist/generated/; \
    fi

# 設置權限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + process.env.HEALTH_CHECK_PORT + process.env.HEALTH_CHECK_PATH, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

EXPOSE 3000

# 使用 PM2 啟動
CMD ["./node_modules/.bin/pm2-runtime", "start", "ecosystem.config.js"]