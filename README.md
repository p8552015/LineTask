# LINE Focalboard Bot 🤖

一個整合 LINE Bot 與 Focalboard 的任務管理系統，讓您可以通過 LINE 聊天輕鬆管理任務。

## 🎯 專案亮點

- ✅ **完整的中文命令支援** - 支援自然語言任務創建
- ✅ **多行任務格式** - 支援詳細的任務屬性設定
- ✅ **Focalboard 完美整合** - 所有欄位正確映射和顯示
- ✅ **SOLID 設計原則** - 高品質的程式碼架構
- ✅ **完整的錯誤處理** - 詳細的日誌和故障排除
- ✅ **豐富的文檔** - 包含完整的設定和使用指南

## 功能特色 ✨

- 🚀 **通過 LINE 管理任務**: 使用簡單的命令創建、查詢、更新和刪除任務
- 📋 **Focalboard 整合**: 所有任務同步到 Focalboard 看板系統  
- 🏷️ **豐富的任務屬性**: 支援優先級、標籤、指派人員、截止日期
- 🔍 **智能搜尋**: 快速搜尋和篩選任務
- 📊 **狀態追蹤**: 追蹤任務進度和狀態統計
- 🛡️ **SOLID 原則**: 遵循良好的軟體設計原則，易於維護和擴展

## 架構設計 🏗️

```
LINE Official Account → Webhook → 中介服務 (Node.js) → Focalboard REST API
```

### 核心組件

- **LineWebhookController**: 處理 LINE Webhook 事件
- **LineMessageProcessor**: 解析和處理 LINE 訊息命令  
- **FocalboardService**: 與 Focalboard API 交互
- **Task Model**: 任務資料模型和驗證

## 快速開始 🚀

### 前置需求

- Node.js >= 14.0.0
- 運行中的 Focalboard 實例
- LINE Developers 帳號和 Bot Channel

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone https://github.com/p8552015/LineTask.git
   cd LineTask/lineCore
   ```

2. **安裝依賴**
   ```bash
   cd lineCore
   npm install
   ```

3. **配置環境變數**

   複製 `.env.template` 為 `.env` 並填入您的設定：
   ```bash
   cp .env.template .env
   ```

   編輯 `.env` 文件：
   ```bash
   # LINE Bot Configuration
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   LINE_CHANNEL_SECRET=your_line_channel_secret

   # Focalboard Configuration
   FOCALBOARD_API_URL=http://localhost:8080/api/v2
   FOCALBOARD_TOKEN=your_focalboard_token
   FOCALBOARD_TEAM_ID=0
   FOCALBOARD_DEFAULT_BOARD_ID=your_board_id

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **啟動服務**
   ```bash
   # 開發模式
   npm run dev
   
   # 生產模式  
   npm start
   ```

5. **設定 LINE Webhook**
   
   在 LINE Developers Console 中設定 Webhook URL：
   ```
   https://your-domain.com/webhook/line
   ```

## 使用指南 📖

### LINE Bot 命令

#### 創建任務 (支援多種格式)

**簡單格式:**
```
創建任務：任務標題
```

**完整格式:**
```
創建任務：任務標題
優先級：高/中/低
負責人：負責人姓名
預估時間：8小時
截止日期：7月18日
狀態：進行中
描述：詳細描述
標籤：標籤1,標籤2,標籤3
```

**範例:**
```
創建任務：修復用戶登入頁面的驗證問題
優先級：高
負責人：張工程師
預估時間：4小時
截止日期：明天
狀態：待辦
描述：修復登入頁面的表單驗證邏輯
標籤：bug,前端,緊急
```

#### 查看任務
```
查看任務                  # 顯示所有任務
查看我的任務              # 顯示指派給我的任務
```

#### 其他命令
```
幫助                     # 顯示幫助訊息
狀態                     # 顯示系統狀態
```

### 任務屬性

- **優先級**: `@low`, `@medium`, `@high`, `@urgent`
- **狀態**: `todo`, `in-progress`, `done`, `blocked`
- **標籤**: `#標籤名` (可多個)
- **負責人**: `:用戶名`

## API 端點 🔌

### 健康檢查
```
GET /health
```

### 任務管理
```
GET    /api/tasks           # 取得任務列表
POST   /api/tasks           # 創建任務
GET    /api/tasks/:id       # 取得單一任務
PUT    /api/tasks/:id       # 更新任務
DELETE /api/tasks/:id       # 刪除任務
```

### 搜尋和狀態
```
GET /api/search?q=keyword   # 搜尋任務
GET /api/status             # 系統狀態
```

### 測試端點
```
GET  /api/test/focalboard   # 測試 Focalboard 連接
POST /api/test/message      # 測試訊息處理
```

## 開發 🛠️

### 專案結構
```
lineTask/
├── src/
│   ├── controllers/        # 控制器層
│   ├── services/          # 服務層  
│   ├── models/            # 資料模型
│   ├── interfaces/        # 接口定義
│   ├── utils/             # 工具函數
│   └── middleware/        # 中間件
├── config/                # 配置文件
├── tests/                 # 測試文件
├── docs/                  # 文檔
└── index.js              # 主入口
```

### 開發腳本
```bash
npm run dev          # 開發模式 (nodemon)
npm run test         # 執行測試
npm run test:watch   # 監視模式測試
npm run lint         # 代碼檢查
npm run lint:fix     # 自動修復代碼
```

### 設計原則

本專案遵循 **SOLID 原則**：

- **S** - Single Responsibility: 每個類別只負責一個功能
- **O** - Open/Closed: 對擴展開放，對修改封閉
- **L** - Liskov Substitution: 子類別可以替換父類別
- **I** - Interface Segregation: 接口隔離，避免依賴不需要的接口
- **D** - Dependency Inversion: 依賴抽象而非具體實現

## 部署 🚀

### Docker 部署
```bash
# 構建映像
docker build -t line-focalboard-bot .

# 運行容器
docker run -p 3000:3000 --env-file .env line-focalboard-bot
```

### PM2 部署
```bash
# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start index.js --name "line-bot"

# 監控
pm2 monit
```

## 故障排除 🔧

### 常見問題

1. **Focalboard 連接失敗**
   - 檢查 FOCALBOARD_API_URL 是否正確
   - 確認 Focalboard 服務正在運行
   - 驗證 API Token 有效性

2. **LINE Webhook 錯誤**  
   - 確認 Webhook URL 可從外部存取
   - 檢查 Channel Secret 和 Access Token
   - 查看服務器日誌

3. **任務創建失敗**
   - 檢查任務標題是否為空
   - 確認看板 ID 存在
   - 查看詳細錯誤訊息

### 日誌查看
```bash
# 即時日誌
npm run dev

# PM2 日誌
pm2 logs line-bot

# Docker 日誌  
docker logs <container-name>
```

## 貢獻 🤝

歡迎提交 Issue 和 Pull Request！

### 開發流程
1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權 📄

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 聯絡 📧

如有問題或建議，請透過以下方式聯絡：

- GitHub Issues: [專案議題](https://github.com/p8552015/LineTask/issues)
- GitHub Repository: [LineTask](https://github.com/p8552015/LineTask)

---

⭐ 如果這個專案對您有幫助，請給我們一個星星！ 