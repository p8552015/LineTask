# 代碼結構與設計模式

## 專案架構 (SOLID 原則)

### 目錄結構
```
lineTask/
├── src/                          # 主要應用邏輯
│   ├── interfaces/               # 接口定義 (Interface Segregation)
│   │   ├── ITaskService.js       # 任務服務接口
│   │   └── IMessageProcessor.js  # 訊息處理接口
│   ├── models/                   # 資料模型
│   │   └── Task.js              # 任務模型 + 驗證 + Focalboard 映射
│   ├── services/                 # 服務層 (Single Responsibility)
│   │   ├── FocalboardService.js  # Focalboard API 交互
│   │   └── LineMessageProcessor.js # LINE 命令解析
│   ├── controllers/              # 控制器層
│   │   └── LineWebhookController.js # Webhook 事件處理
│   └── app.js                   # 主應用類 (Dependency Injection)
├── lineCore/                    # 混亂的重複結構
│   ├── package.json            # 正確的依賴配置
│   ├── index.js                # 入口點 (路徑錯誤)
│   ├── .env                    # 環境變數
│   └── node_modules/           # 依賴包
└── [根目錄檔案]
    ├── README.md               # 完整文檔
    ├── Dockerfile              # 容器化
    └── healthcheck.js          # 健康檢查
```

## 設計模式應用

### 1. Dependency Injection Pattern
- `App` 類別注入 FocalboardService 和 LineMessageProcessor
- 控制器注入服務依賴

### 2. Interface Segregation
- `ITaskService`: 任務 CRUD 操作抽象
- `IMessageProcessor`: 訊息處理抽象

### 3. Strategy Pattern
- LineMessageProcessor 處理不同命令類型
- 支援擴展新命令而無需修改核心邏輯

### 4. Factory Pattern
- Task.js 提供任務創建和驗證工廠方法

## 代碼風格和約定

### 命名約定
- **類別**: PascalCase (如 `FocalboardService`)
- **方法/變數**: camelCase (如 `processMessage`)
- **常數**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- **檔案**: PascalCase 對應類別名

### 錯誤處理
- 使用 try-catch 包裝異步操作
- 統一錯誤格式回應
- 詳細日誌記錄 (winston)

### 安全性
- helmet 中間件 (XSS, CSRF 防護)
- CORS 跨域控制
- LINE Webhook 簽名驗證