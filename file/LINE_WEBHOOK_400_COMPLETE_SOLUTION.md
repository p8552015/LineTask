# LINE Webhook 400 Bad Request 完整解決方案

## 🚨 問題描述
```
Error: The webhook returned an HTTP status code other than 200.(400 Bad Request)
Confirm that your bot server returns status code 200 in response to the HTTP POST request sent from the LINE Platform.
```

## 🎯 根本原因
**Express 全域 JSON 中間件導致 LINE Bot SDK 簽名驗證失敗**

### 技術細節
1. `express.json()` 中間件會解析並修改請求主體
2. LINE Bot SDK 需要**原始請求主體**進行 HMAC-SHA256 簽名驗證
3. 修改後的主體導致簽名不匹配
4. 中間件返回 400 Bad Request

## 🛠️ 完整解決方案

### 步驟 1：移除全域 JSON 解析中間件

**檔案：** `lineCore/src/app.js`

```javascript
// ❌ 錯誤配置 - 移除這些行
setupMiddleware() {
  // ... 其他中間件
  
  // 移除這兩行
  // this.app.use(express.json({ limit: '10mb' }));
  // this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}
```

```javascript
// ✅ 正確配置
setupMiddleware() {
  // 安全性中間件
  this.app.use(helmet());
  
  // CORS 設定
  this.app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Line-Signature']
  }));
  
  // 日誌中間件
  this.app.use(morgan('combined'));
  
  // ⚠️ 重要：不要在這裡設定全域的 JSON 解析中間件
  // LINE Webhook 端點需要原始的請求主體來進行簽名驗證
  
  console.log('中間件設定完成');
}
```

### 步驟 2：為 API 路由單獨添加 JSON 解析

```javascript
// ✅ 只在 API 路由中添加 JSON 解析
setupApiRoutes() {
  const apiRouter = express.Router();
  
  // 為 API 路由添加 JSON 解析中間件
  apiRouter.use(express.json({ limit: '10mb' }));
  apiRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ... API 路由定義
  
  this.app.use('/api', apiRouter);
}
```

### 步驟 3：確保 Webhook 路由正確配置

```javascript
setupRoutes() {
  // ✅ 正式的 LINE Webhook 端點（有簽名驗證）
  this.app.post('/Webhook', 
    this.webhookController.getMiddleware(),  // 現在可以正常工作
    async (req, res) => {
      try {
        await this.webhookController.handleWebhook(req, res);
      } catch (error) {
        console.error('❌ Webhook 處理錯誤:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message 
          });
        }
      }
    }
  );

  // 🧪 測試端點（無簽名驗證）
  this.app.post('/webhook/test', 
    express.json({ limit: '10mb' }),  // 測試端點可以使用 JSON 解析
    async (req, res) => {
      try {
        await this.webhookController.handleWebhook(req, res);
      } catch (error) {
        console.error('❌ 測試端點錯誤:', error);
        res.status(500).json({ error: error.message });
      }
    }
  );
}
```

## 🧪 驗證修復

### 使用診斷工具
```bash
cd lineCore

# 檢查環境配置
node webhook-fix.js

# 詳細 webhook 調試
node webhook-debug.js
```

### 預期結果
```
📊 診斷結果摘要
================
服務器狀態: ✅ 正常
簽名功能: ✅ 正常
測試端點: ✅ 正常
簽名端點: ✅ 正常  # 修復前是 ❌ 異常
自訂端點: ✅ 正常

🎉 所有診斷項目通過！
```

## 📋 部署檢查清單

### 環境配置
- [ ] `.env` 檔案格式正確，無 BOM 字符
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` 已設定
- [ ] `LINE_CHANNEL_SECRET` 已設定（32位十六進制）

### 代碼配置
- [ ] 移除全域 `express.json()` 中間件
- [ ] API 路由單獨配置 JSON 解析
- [ ] Webhook 路由使用原始請求主體
- [ ] 錯誤處理完整

### LINE Developer Console
- [ ] Webhook URL: `https://your-domain.com/Webhook`
- [ ] Webhook 功能已啟用
- [ ] Channel Secret 與環境變數一致

## 🔧 常用命令

```bash
# 啟動服務器
npm start

# 診斷 webhook
node webhook-debug.js

# 檢查環境
node webhook-fix.js

# 手動測試（無簽名）
curl -X POST http://localhost:3000/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"message","message":{"type":"text","text":"test"},"source":{"userId":"test"}}]}'
```

## 🎯 關鍵要點

1. **LINE Bot SDK 需要原始請求主體進行簽名驗證**
2. **全域 JSON 解析中間件會破壞簽名驗證**
3. **只在非 webhook 路由中使用 JSON 解析**
4. **使用診斷工具快速定位問題**

## 📞 如果問題持續

1. 檢查 LINE Developer Console 中的 Channel Secret
2. 確認 `.env` 檔案沒有編碼問題
3. 查看服務器日誌輸出
4. 使用 `webhook-debug.js` 進行詳細診斷

---

**記住：這個問題的核心是 Express 中間件的執行順序和請求主體處理方式！**

## 📚 相關文檔

- `lineCore/WEBHOOK_400_TROUBLESHOOTING_GUIDE.md` - 詳細故障排除指南
- `lineCore/QUICK_FIX_REFERENCE.md` - 快速修復參考
- `lineCore/TROUBLESHOOTING.md` - 一般故障排除指南
