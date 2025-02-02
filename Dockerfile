# 使用官方的 Node.js 镜像作为基础镜像
FROM node:20

# 设置环境变量
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# 设置工作目录
WORKDIR /app

# 複製 package.json 和 package-lock.json 到工作目錄
COPY package*.json ./

# 在 root 權限下預先創建並設置目錄權限
RUN mkdir -p /app/node_modules && \
    chown -R node:node /app

# 切換用戶並執行安裝 (關鍵修改)
USER node
RUN npm config set cache /home/node/.npm-cache && \
    npm cache clean --force && \
    npm install --no-cache --force && \
    npm install -g pm2

# 切換回 root 用於後續操作 (必要時)
USER root

# 暴露应用程序运行的端口
EXPOSE 3000

# 調試步驟以驗證安裝
RUN node -v && npm -v && pm2 -v && ls -al /app

# 使用 PM2 启动应用程序
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
