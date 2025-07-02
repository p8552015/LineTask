# 任務完成檢查清單

## 程式碼修改後必須執行的檢查

### 1. 語法和風格檢查
```powershell
# 代碼風格檢查
npm run lint

# 自動修復可修復的問題
npm run lint:fix
```

### 2. 測試執行
```powershell
# 執行所有測試
npm test

# 監視模式測試 (開發時)
npm run test:watch
```

### 3. 應用啟動測試
```powershell
# 開發模式啟動
npm run dev

# 生產模式啟動測試
npm start
```

### 4. 功能驗證清單

#### LINE Bot 功能
- [ ] Webhook 端點響應正常 (`POST /webhook/line`)
- [ ] 健康檢查通過 (`GET /health`)
- [ ] 命令解析正確 (`/add`, `/list`, `/search`, `/help`)
- [ ] 錯誤處理適當

#### Focalboard 整合
- [ ] API 連接測試 (`GET /api/test/focalboard`)
- [ ] 任務 CRUD 操作 (`/api/tasks/*`)
- [ ] 資料同步正確

#### 環境配置
- [ ] 環境變數正確載入
- [ ] API 金鑰驗證通過
- [ ] 日誌輸出正常

### 5. 部署前檢查

#### Docker 容器化
```powershell
# 構建映像
docker build -t line-focalboard-bot .

# 測試容器運行
docker run -p 3000:3000 --env-file .env line-focalboard-bot

# 健康檢查
curl http://localhost:3000/health
```

#### 檔案完整性
- [ ] 所有必要檔案存在
- [ ] 路徑引用正確
- [ ] 依賴版本相容

### 6. 性能和安全檢查
- [ ] 內存洩漏檢查
- [ ] API 響應時間合理
- [ ] 安全標頭正確設定 (helmet)
- [ ] CORS 設定適當

### 7. 文檔更新
- [ ] README.md 反映最新變更
- [ ] API 文檔更新
- [ ] 環境設定指南正確

## 常見問題快速檢查

### 啟動失敗
1. 檢查 `.env` 檔案存在且格式正確
2. 確認 `FOCALBOARD_TOKEN` 有效
3. 驗證網路連接到 Focalboard API
4. 檢查 PORT 是否被佔用

### 測試失敗
1. 確認測試環境資料庫狀態
2. 檢查模擬 (mock) 設定
3. 驗證測試資料有效性

### 部署問題
1. Docker 映像構建成功
2. 環境變數正確傳遞
3. 外部服務可達性
4. 網路端口開放

## 緊急回滾程序
1. 停止服務: `npm stop` 或 `docker stop`
2. 還原代碼: `git checkout previous-working-commit`
3. 重新部署: `npm start` 或重新啟動容器
4. 驗證服務正常