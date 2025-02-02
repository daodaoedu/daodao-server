# 使用官方的 Node.js 镜像作为基础镜像
FROM node:20

# 设置环境变量
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 清理 npm 缓存并安装项目依赖
RUN npm cache clean --force && npm install --no-cache

# 安装 PM2
RUN npm install -g pm2

# 复制应用程序代码到容器内的工作目录
COPY . .

# 修正权限问题，避免 "ENOTEMPTY" 或 "EEXIST" 相关错误
RUN chown -R node:node /app && chmod -R 755 /app

# 切换为非 root 用户
USER node

# 暴露应用程序运行的端口
EXPOSE 3000

# 調試步驟以驗證安裝
RUN node -v && npm -v && pm2 -v && ls -al /app

# 使用 PM2 启动应用程序
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
