# LINE Bot 使用說明

## 🚀 快速開始

### 1. 環境準備
```powershell
# 設置環境變數
node setup-env.js

# 安裝依賴
npm install

# 運行診斷
node diagnose.js
```

### 2. 啟動應用程式
```powershell
# 開發模式
npm run dev

# 生產模式
npm start
```

### 3. 設置 ngrok 隧道
```powershell
# 啟動 ngrok
ngrok http 3000

# 複製 HTTPS URL 到 LINE Developer Console
```

### 4. 配置 LINE Developer Console
1. 打開 [LINE Developer Console](https://developers.line.biz/)
2. 選擇你的 Provider 和 Channel
3. 進入 "Messaging API" 頁面
4. 設置 Webhook URL：`https://your-ngrok-url.ngrok.io/Webhook`
5. 啟用 "Use webhook"

## 🛠️ 維護工具

### 診斷工具
```powershell
# 全面診斷
node diagnose.js

# 測試 Webhook
node test-webhook.js

# 快速修復
./quick-fix.ps1
```

### 環境管理
```powershell
# 重新設置環境變數
node setup-env.js

# 檢查環境變數
Get-Content .env
```

## 📱 LINE Bot 功能

### 基本命令
| 命令 | 說明 | 範例 |
|------|------|------|
| `/help` | 顯示幫助信息 | `/help` |
| `/add` | 創建新任務 | `/add 完成報告` |
| `/list` | 列出任務 | `/list` |
| `/search` | 搜索任務 | `/search 報告` |
| `/complete` | 完成任務 | `/complete 1` |
| `/delete` | 刪除任務 | `/delete 1` |

### 任務管理
```
📝 創建任務
/add 任務標題 #標籤 @優先級

📋 查看任務
/list - 顯示所有任務
/list todo - 顯示待辦任務
/list done - 顯示已完成任務

🔍 搜索任務
/search 關鍵字
/search #標籤
/search @優先級

✅ 完成任務
/complete 任務ID
/done 任務ID

🗑️ 刪除任務
/delete 任務ID
/remove 任務ID
```

### 高級功能
```
📊 任務統計
/stats - 顯示任務統計
/status - 顯示系統狀態

🔄 同步功能
/sync - 同步 Focalboard 數據
/refresh - 刷新本地緩存

⚙️ 設置功能
/settings - 顯示設置選項
/config - 配置個人偏好
```

## 🔧 API 端點

### 健康檢查
```
GET /health
```

### Webhook 端點
```
POST /Webhook          # 正式端點（有簽名驗證）
POST /webhook/test     # 測試端點（無簽名驗證）
POST /webhook/line     # 備用端點（有簽名驗證）
```

### 任務 API
```
GET    /api/tasks      # 獲取任務列表
POST   /api/tasks      # 創建任務
GET    /api/tasks/:id  # 獲取特定任務
PUT    /api/tasks/:id  # 更新任務
DELETE /api/tasks/:id  # 刪除任務
```

### 搜索 API
```
GET /api/search?q=關鍵字
```

### 測試 API
```
GET  /api/test/focalboard    # 測試 Focalboard 連接
POST /api/test/message       # 測試訊息處理
```

## 🐛 故障排除

### 常見問題
1. **環境變數載入失敗**
   ```powershell
   node setup-env.js
   ```

2. **簽名驗證失敗**
   ```powershell
   node test-webhook.js
   ```

3. **ngrok 連接問題**
   ```powershell
   ngrok http 3000
   ```

4. **端口佔用**
   ```powershell
   netstat -ano | findstr :3000
   ```

### 診斷步驟
1. 檢查 `.env` 文件
2. 運行診斷工具
3. 檢查網絡連接
4. 確認 LINE 設定

詳細故障排除請參考 [TROUBLESHOOTING.md](../file/TROUBLESHOOTING.md)

## 📈 監控和日誌

### 應用程式日誌
```powershell
# 查看實時日誌
npm start

# 保存日誌到文件
npm start 2>&1 | Tee-Object -FilePath app.log
```

### 健康檢查
```powershell
# 檢查應用程式狀態
curl http://localhost:3000/health

# 檢查服務狀態
curl http://localhost:3000/api/status
```

## 🚢 部署

### 本地部署
```powershell
# 1. 準備環境
node setup-env.js

# 2. 啟動應用程式
npm start

# 3. 啟動 ngrok
ngrok http 3000

# 4. 配置 LINE Webhook
# 複製 ngrok URL 到 LINE Developer Console
```

### Docker 部署
```powershell
# 構建映像
docker build -t line-bot .

# 運行容器
docker run -p 3000:3000 --env-file .env line-bot
```

## 📞 支援

### 獲取幫助
1. 查看 [TROUBLESHOOTING.md](../file/TROUBLESHOOTING.md)
2. 運行診斷工具
3. 檢查日誌文件
4. 提供錯誤信息

### 聯繫信息
- 項目文檔：請參考 README.md
- 錯誤回報：請提供完整的錯誤日誌
- 功能建議：歡迎提出改進建議

## 🔄 更新和維護

### 定期維護
```powershell
# 更新依賴
npm update

# 清理緩存
npm cache clean --force

# 重新安裝依賴
Remove-Item node_modules -Recurse -Force
npm install
```

### 備份重要文件
```powershell
# 備份配置文件
Copy-Item .env .env.backup
Copy-Item package.json package.json.backup
```

### 版本控制
```powershell
# 提交更改
git add .
git commit -m "Update configuration"
git push origin main
```