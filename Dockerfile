# 使用官方的 Node.js 镜像作为基础镜像
FROM node:20


ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 安装 PM2
RUN npm install -g pm2

# 复制应用程序代码到容器内的工作目录
COPY . .

# 暴露应用程序运行的端口
EXPOSE 3000

# 調試步驟以驗證安裝
RUN node -v
RUN npm -v
RUN pm2 -v
RUN ls -al /app

# 使用 PM2 启动应用程序
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

