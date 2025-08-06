# 優化的 Dockerfile - 更好的層緩存策略

# 基礎映像層 - 很少變動
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依賴層 - 只在 package.json 變動時重建
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=prod && \
    cp -R node_modules prod_node_modules && \
    npm ci && \
    npm cache clean --force

# Prisma 層 - 只在 schema 變動時重建
FROM deps AS prisma
COPY prisma ./prisma
RUN npx prisma generate

# 構建層 - 編譯 TypeScript
FROM prisma AS builder
COPY tsconfig*.json ./
COPY src ./src
COPY controllers ./controllers
COPY models ./models
COPY routes ./routes
COPY services ./services
COPY middlewares ./middlewares
COPY utils ./utils
COPY config ./config
COPY public ./public
COPY index.js ./
COPY ecosystem.config.js ./

# 編譯 TypeScript
RUN npx tsc --project tsconfig.build.json && \
    npx tsc-alias --project tsconfig.build.json

# 生產映像 - 最小化尺寸
FROM base AS runtime

ARG NODE_ENV=prod
ENV NODE_ENV=$NODE_ENV

# 安裝 PM2
RUN npm install -g pm2

# 創建用戶
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 複製生產依賴
COPY --from=deps /app/prod_node_modules ./node_modules

# 複製編譯後的代碼
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ecosystem.config.js ./

# 複製 Prisma 文件
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/generated ./generated
COPY prisma ./prisma

# 創建必要的目錄和符號鏈接
RUN ln -sf /app/generated /app/dist/generated && \
    mkdir -p /app/logs

# 設置權限
RUN chown -R nodejs:nodejs /app
USER nodejs

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

EXPOSE 3000

# 使用 PM2 啟動
CMD ["pm2-runtime", "start", "ecosystem.config.js"]