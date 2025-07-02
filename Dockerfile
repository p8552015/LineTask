# 使用官方 Node.js 18 Alpine 基礎映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 添加非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 複製 package 文件
COPY package*.json ./

# 安裝依賴（僅生產依賴）
RUN npm ci --only=production && npm cache clean --force

# 複製應用程式代碼
COPY . .

# 設定檔案權限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 啟動應用
CMD ["npm", "start"] 