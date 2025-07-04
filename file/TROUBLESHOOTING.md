# LINE Bot 故障排除指南

## 🚨 常見問題解決方案

### 1. 環境變數問題

#### 問題：dotenv 載入 0 個環境變數
```
[dotenv@17.0.1] injecting env (0) from .env
缺少必要的環境變數: LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, FOCALBOARD_API_URL, FOCALBOARD_TEAM_ID
```

**解決方案：**
```powershell
# 方法1: 自動修復
node setup-env.js

# 方法2: 手動檢查
Get-Content .env  # 檢查 .env 文件內容
```

#### 問題：.env 文件格式錯誤
**解決方案：**
- 確保每行格式為 `KEY=VALUE`
- 不要有多餘的空格
- 不要用引號包圍值（除非值本身包含空格）

### 2. LINE Webhook 400 Bad Request 錯誤 ⭐ **最常見問題**

#### 問題：Webhook 返回 400 錯誤
```
The webhook returned an HTTP status code other than 200.(400 Bad Request)
SignatureValidationFailed: signature validation failed
```

**🎯 根本原因：Express 全域 JSON 中間件導致簽名驗證失敗**

**⚡ 快速修復：**
```bash
# 1. 運行診斷工具
node webhook-debug.js

# 2. 如果看到 "簽名端點: ❌ 異常"，執行以下修復
```

**🛠️ 修復步驟：**

1. **修改 `src/app.js` 中的 `setupMiddleware()` 方法：**
```javascript
// ❌ 移除全域 JSON 解析中間件
// this.app.use(express.json({ limit: '10mb' }));
// this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ 改為註釋
// ⚠️ 重要：不要在這裡設定全域的 JSON 解析中間件
// LINE Webhook 端點需要原始的請求主體來進行簽名驗證
```

2. **修改 `src/app.js` 中的 `setupApiRoutes()` 方法：**
```javascript
setupApiRoutes() {
  const apiRouter = express.Router();

  // ✅ 只在 API 路由中添加 JSON 解析
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ... 其他路由
}
```

3. **重啟服務器並驗證：**
```bash
npm start
node webhook-debug.js  # 應該看到 "簽名端點: ✅ 正常"
```

**📋 詳細指南：** 參考 `WEBHOOK_400_TROUBLESHOOTING_GUIDE.md`

### 3. 其他 LINE Webhook 簽名驗證問題

#### 問題：SignatureValidationFailed (其他原因)
**常見原因：**
1. **Channel Secret 不正確**
2. **編碼問題**
3. **ngrok 修改了請求**

### 3. ngrok 連接問題

#### 問題：ngrok 返回 HTML 而不是 JSON
**解決方案：**
```powershell
# 檢查 ngrok 狀態
curl http://localhost:4040/api/tunnels

# 重新啟動 ngrok
ngrok http 3000
```

#### 問題：ngrok 警告頁面
**解決方案：**
```bash
# 使用 ngrok 認證
ngrok authtoken YOUR_AUTH_TOKEN

# 或使用 --host-header 參數
ngrok http 3000 --host-header=localhost:3000
```

### 4. 應用程式啟動問題

#### 問題：模組找不到
```
Cannot find module './src/app'
```

**解決方案：**
```powershell
# 檢查文件結構
Get-ChildItem -Recurse | Where-Object {$_.Name -eq "app.js"}

# 確保在正確目錄
Set-Location lineCore
```

#### 問題：端口佔用
```
Error: listen EADDRINUSE :::3000
```

**解決方案：**
```powershell
# 檢查端口佔用
netstat -ano | findstr :3000

# 終止佔用端口的程序
taskkill /PID <PID> /F

# 或使用不同端口
$env:PORT = "3001"
```

### 5. LINE Bot 配置問題

#### 問題：LINE Bot API 連接失敗
**解決方案：**
1. 檢查 Channel Access Token
2. 檢查 Channel Secret
3. 確認 LINE Developer Console 設定

#### 問題：Webhook URL 無法驗證
**解決方案：**
1. 確保應用程式正在運行
2. 確保 ngrok 隧道活躍
3. 確保 Webhook URL 正確設定

## 🔧 診斷工具

### 1. 環境檢查
```powershell
node diagnose.js
```

### 2. Webhook 測試
```powershell
node test-webhook.js
```

### 3. 手動測試
```powershell
# 測試本地端點
curl -X POST http://localhost:3000/webhook/test -H "Content-Type: application/json" -d '{"events":[{"type":"message","message":{"type":"text","text":"測試"},"source":{"userId":"test"}}]}'

# 測試健康檢查
curl http://localhost:3000/health
```

## 🔍 調試步驟

### 步驟1：環境變數
```powershell
# 檢查環境變數載入
node -e "require('dotenv').config(); console.log('Loaded vars:', Object.keys(process.env).filter(k => k.startsWith('LINE_') || k.startsWith('FOCALBOARD_')).length)"
```

### 步驟2：應用程式啟動
```powershell
# 檢查應用程式是否能啟動
npm start
```

### 步驟3：端點測試
```powershell
# 測試各個端點
curl http://localhost:3000/health
curl http://localhost:3000/
curl -X POST http://localhost:3000/webhook/test -H "Content-Type: application/json" -d '{"events":[]}'
```

### 步驟4：ngrok 測試
```powershell
# 檢查 ngrok 狀態
curl http://localhost:4040/api/tunnels
```

### 步驟5：LINE 設定確認
1. 打開 LINE Developer Console
2. 檢查 Webhook URL
3. 檢查 Channel Secret
4. 檢查 Channel Access Token

## 🚀 快速修復

### 完整重置
```powershell
# 1. 停止所有相關程序
taskkill /F /IM node.exe
taskkill /F /IM ngrok.exe

# 2. 重新設定環境變數
node setup-env.js

# 3. 重新安裝依賴
Remove-Item node_modules -Recurse -Force
npm install

# 4. 重新啟動
npm start
```

### 快速修復腳本
```powershell
# 執行快速修復腳本
./quick-fix.ps1
```

## 📋 檢查清單

### 啟動前檢查
- [ ] .env 文件存在且格式正確
- [ ] 所有依賴已安裝
- [ ] 端口 3000 可用
- [ ] Focalboard 服務器可達

### 部署前檢查
- [ ] 本地測試通過
- [ ] ngrok 正在運行
- [ ] Webhook URL 已設定
- [ ] LINE Bot 憑證正確

### 測試檢查
- [ ] 健康檢查端點可用
- [ ] 無簽名驗證端點可用
- [ ] 有簽名驗證端點可用
- [ ] ngrok 隧道可用

## 📞 獲取幫助

如果以上方法都無法解決問題，請提供以下信息：

1. **錯誤日誌**
   ```powershell
   npm start 2>&1 | Tee-Object -FilePath error.log
   ```

2. **環境信息**
   ```powershell
   node diagnose.js > diagnosis.log
   ```

3. **系統信息**
   ```powershell
   systeminfo > system.log
   ```

4. **網絡信息**
   ```powershell
   netstat -ano > network.log
   ```

將這些日誌文件一起提供以便進行深入診斷。