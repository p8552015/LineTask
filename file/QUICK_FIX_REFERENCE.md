# LINE Webhook 400 錯誤快速修復參考

## 🚨 症狀
```
The webhook returned an HTTP status code other than 200.(400 Bad Request)
```

## ⚡ 快速診斷
```bash
cd lineCore
node webhook-debug.js
```

## 🎯 最常見原因
**Express 全域 JSON 中間件導致簽名驗證失敗**

## 🛠️ 快速修復

### 1. 修改 `lineCore/src/app.js` - setupMiddleware()
```javascript
// ❌ 移除這些行
// this.app.use(express.json({ limit: '10mb' }));
// this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ 改為註釋說明
// ⚠️ 重要：不要在這裡設定全域的 JSON 解析中間件
// LINE Webhook 端點需要原始的請求主體來進行簽名驗證
```

### 2. 修改 `lineCore/src/app.js` - setupApiRoutes()
```javascript
// ✅ 只在 API 路由中添加
setupApiRoutes() {
  const apiRouter = express.Router();
  
  // 為 API 路由添加 JSON 解析中間件
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // ... 其他 API 路由
}
```

### 3. 重啟服務器
```bash
# 停止服務器 (Ctrl+C)
cd lineCore
npm start
```

### 4. 驗證修復
```bash
cd lineCore
node webhook-debug.js
```

## ✅ 成功標誌
```
📊 診斷結果摘要
================
簽名端點: ✅ 正常  # 之前是 ❌ 異常

🎉 所有診斷項目通過！
```

## 🔗 建議 Webhook URL
```
# 本地測試
http://localhost:3000/Webhook

# 生產環境 (使用 ngrok 或其他)
https://your-domain.com/Webhook
```

## 🧪 測試命令
```bash
# 測試無簽名端點
curl -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"type":"text","text":"測試"},"source":{"userId":"test"}}]}'

# 檢查服務器健康狀態
curl http://localhost:3000/health
```

## 🔧 診斷工具
```bash
cd lineCore

# 環境配置檢查
node webhook-fix.js

# 詳細 webhook 調試
node webhook-debug.js

# 一般診斷
node diagnose.js
```

## 📝 記住
**LINE Bot SDK 需要原始請求主體進行簽名驗證，不能被 express.json() 預處理！**

## 📋 檢查清單
- [ ] 移除全域 `express.json()` 中間件
- [ ] 在 API 路由中單獨添加 JSON 解析
- [ ] 重啟服務器
- [ ] 運行 `webhook-debug.js` 驗證
- [ ] 確認所有測試通過

## 🆘 如果還是不行
1. 檢查 `.env` 檔案格式
2. 確認 LINE_CHANNEL_SECRET 正確
3. 查看服務器日誌
4. 檢查防火牆設定

---
*完整指南請參考：LINE_WEBHOOK_400_COMPLETE_SOLUTION.md*
