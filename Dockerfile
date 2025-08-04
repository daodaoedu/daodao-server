# 階段一：建構階段
FROM node:20-alpine AS builder

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝所有依賴（包含開發依賴）
RUN npm ci && \
    npm cache clean --force

# 複製原始碼
COPY . .

# 生成 Prisma 客戶端和編譯 TypeScript
RUN npx prisma generate && \
    npx tsc --project tsconfig.build.json && \
    npx tsc-alias --project tsconfig.build.json

# 階段二：運行階段
FROM node:20-alpine AS runtime

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 只安裝生產依賴
RUN npm ci --only=production && \
    npm install -g pm2 && \
    npm cache clean --force

# 從建構階段複製編譯後的檔案
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/ecosystem.config.js ./

# 確保 generated 目錄在正確位置以供編譯後的 JS 檔案使用
RUN ln -sf /app/generated /app/dist/generated

# 複製其他必要檔案
COPY prisma/ ./prisma/

# 建立非 root 使用者
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 創建並設置 logs 目錄權限
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露應用程式運行的端口
EXPOSE 3000

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# 使用 PM2 啟動應用程式
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

