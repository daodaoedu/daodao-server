# 使用更小的 Alpine 基礎映像
FROM node:20-alpine

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json 到工作目錄
COPY package*.json ./

# 合併安裝步驟減少層級
RUN npm install && \
    npm install -g pm2 && \
    npm cache clean --force

# 複製應用程式代碼到容器內的工作目錄
COPY . .

# 合併生成和編譯步驟
RUN npx prisma generate && \
    npm run build

# 暴露應用程式運行的端口
EXPOSE 3000

# 使用 PM2 啟動應用程式
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

