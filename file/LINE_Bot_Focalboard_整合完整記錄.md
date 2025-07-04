# 📋 LINE Bot 與 Focalboard 整合完整流程記錄

## 🎯 專案概述
成功建立 LINE Bot 任務管理系統，支援中文自然語言命令，與 Focalboard 看板實時同步。

**完成日期：** 2025年7月4日  
**狀態：** ✅ 完全成功運行

---

## 🔧 技術架構

### 核心組件
- **LINE Bot** - 接收用戶訊息，解析命令
- **Focalboard API** - 任務管理後端
- **Express.js** - Web 服務器
- **Axios** - HTTP 客戶端

### 關鍵文件結構
```
lineCore/
├── src/
│   ├── services/
│   │   ├── FocalboardService.js     # Focalboard API 整合
│   │   └── LineMessageProcessor.js  # 中文命令解析
│   ├── controllers/
│   │   └── LineWebhookController.js # LINE Webhook 處理
│   └── app.js                       # 主應用程式
├── .env                             # 環境變數配置
└── package.json
```

---

## ⚠️ 關鍵錯誤與解決方案

### 錯誤 1: API 端點錯誤
**❌ 錯誤做法：**
```javascript
/teams/${teamId}/boards/${boardId}/blocks
```

**✅ 正確做法：**
```javascript
/boards/${boardId}/blocks
```

**原因：** 獨立 Focalboard 服務器不需要 teams 路徑前綴

### 錯誤 2: 數據結構不完整
**❌ 錯誤做法：**
```javascript
{
  title: "任務標題",
  type: "card",
  boardId: "...",
  // 缺少必需字段
}
```

**✅ 正確做法：**
```javascript
{
  id: "生成的唯一ID",                    // ✅ 必需
  parentId: "看板ID",                   // ✅ 必需
  createdBy: "用戶ID",                  // ✅ 必需
  modifiedBy: "用戶ID",                 // ✅ 必需
  schema: 1,                           // ✅ 必需
  type: "card",                        // ✅ 必需
  title: "任務標題",                    // ✅ 必需
  fields: { /* 屬性配置 */ },           // ✅ 必需
  createAt: Date.now(),                // ✅ 必需（毫秒時間戳）
  updateAt: Date.now(),                // ✅ 必需（毫秒時間戳）
  deleteAt: 0,                         // ✅ 必需
  boardId: "看板ID"                     // ✅ 必需
}
```

### 錯誤 3: 看板權限問題
**❌ 錯誤配置：**
```
FOCALBOARD_DEFAULT_BOARD_ID=vdaf9tn387bfq3edqmh7q1wsbnr  # 無寫入權限
```

**✅ 正確配置：**
```
FOCALBOARD_DEFAULT_BOARD_ID=bd4cehgd6bpy6xgmed7iqdosz6o   # 有寫入權限
```

### 錯誤 4: 中文命令解析缺失
**❌ 問題：** 只支援斜線命令 `/add`，不支援中文自然語言

**✅ 解決方案：** 實現 `parseChineseCommand` 方法
```javascript
parseChineseCommand(message) {
  const createPatterns = [
    /^創建任務[：:]\s*(.+)$/,
    /^新增任務[：:]\s*(.+)$/,
    /^添加任務[：:]\s*(.+)$/,
    // 更多模式...
  ];
  // 解析邏輯...
}
```

---

## 🔑 正確的環境配置

### .env 文件
```bash
# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=49KERc7vWWDergSjcGFJ...
LINE_CHANNEL_SECRET=363bf93e33dabc24c8b3349be33b8e6c

# Focalboard 配置
FOCALBOARD_API_URL=http://localhost:8080
FOCALBOARD_TEAM_ID=0
FOCALBOARD_DEFAULT_BOARD_ID=bd4cehgd6bpy6xgmed7iqdosz6o  # 關鍵：有寫入權限的看板
FOCALBOARD_TOKEN=kas4qri1kxpbnb871afgdz3odmo              # 關鍵：有效的認證 Token

# 服務器配置
PORT=3000
NODE_ENV=development
```

---

## 🧪 測試與驗證流程

### 1. 基礎連接測試
```bash
# 測試 Focalboard API 連接
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Requested-With: XMLHttpRequest" \
     http://localhost:8080/api/v2/teams
```

### 2. 權限驗證測試
```bash
# 測試看板讀取權限
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Requested-With: XMLHttpRequest" \
     http://localhost:8080/api/v2/boards/BOARD_ID/blocks
```

### 3. 任務創建測試
```bash
# 測試任務創建權限
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -H "X-Requested-With: XMLHttpRequest" \
     -d '[{"id":"test123","parentId":"BOARD_ID",...}]' \
     http://localhost:8080/api/v2/boards/BOARD_ID/blocks
```

### 4. LINE Bot 功能測試
```
創建任務：測試任務標題
查看任務
搜尋：關鍵字
幫助
```

---

## 📊 錯誤診斷指南

### HTTP 400 - Bad Request
- **原因：** 數據格式錯誤，缺少必需字段
- **檢查：** `createAt`, `updateAt`, `id`, `createdBy`, `modifiedBy`
- **解決：** 確保所有必需字段都存在且格式正確

### HTTP 403 - Forbidden
- **原因：** 權限不足，Token 無寫入權限
- **檢查：** 看板 ID 和 Token 權限
- **解決：** 使用有寫入權限的看板 ID

### HTML 回應而非 JSON
- **原因：** API 端點錯誤，訪問了前端路由
- **檢查：** API 路徑是否正確
- **解決：** 使用正確的 API 端點格式

---

## 🎯 成功標準

### LINE Bot 功能
- ✅ 中文命令解析正常
- ✅ 任務創建回覆正確格式
- ✅ 錯誤處理友善提示

### Focalboard 整合
- ✅ 任務出現在看板上
- ✅ 任務資料完整正確
- ✅ 實時同步無延遲

### 系統穩定性
- ✅ 服務器正常運行
- ✅ 錯誤日誌清晰
- ✅ 性能表現良好

---

## 🚀 部署檢查清單

### 部署前確認
- [ ] 環境變數配置正確
- [ ] Focalboard 服務器運行正常
- [ ] LINE Bot Webhook 設定完成
- [ ] 所有依賴套件安裝完成

### 部署後驗證
- [ ] 健康檢查端點回應正常
- [ ] LINE Bot 回覆測試訊息
- [ ] Focalboard 任務創建成功
- [ ] 錯誤日誌監控設定

---

## 💡 最佳實踐

### 開發建議
1. **先用 CURL 測試 API** - 確認端點和權限
2. **逐步增加複雜度** - 從簡單功能開始
3. **詳細錯誤日誌** - 便於問題診斷
4. **模擬模式開發** - 避免影響生產數據

### 維護建議
1. **定期檢查 Token 有效性**
2. **監控 API 回應時間**
3. **備份重要配置文件**
4. **更新依賴套件版本**

---

## 🎊 專案成果

✅ **完整的 LINE Bot 任務管理系統**
- 支援中文自然語言命令
- 與 Focalboard 實時同步
- 友善的用戶體驗
- 穩定的系統架構

**記錄建立日期：** 2025年7月4日
**最後更新：** 2025年7月4日
**狀態：** 生產就緒 ✅

---

## 📝 詳細技術配置

### Focalboard 服務配置
```yaml
# Focalboard 服務器信息
URL: http://localhost:8080
用戶: tung
密碼: 12345678
Token: kas4qri1kxpbnb871afgdz3odmo
```

### 成功的看板配置
```yaml
看板名稱: Project Tasks
看板ID: bd4cehgd6bpy6xgmed7iqdosz6o
團隊ID: 0
權限: 讀寫權限 ✅
創建者: uidbp98a8ipde7mrdtaao69zc9y
```

### LINE Bot 配置
```yaml
Bot名稱: 任務指派Agent
Channel ID: U8c9c8daa77651fceb58e6f0ef6947c88
Webhook URL: http://localhost:3000/webhook/line
簽名驗證: 啟用 ✅
```

---

## 🔍 關鍵代碼片段

### FocalboardService.js 核心方法
```javascript
// 正確的任務創建方法
async createTask(task) {
  const blockId = this.generateBlockId();
  const currentTime = Date.now();

  const cardData = {
    id: blockId,
    parentId: boardId,
    createdBy: 'uidbp98a8ipde7mrdtaao69zc9y',
    modifiedBy: 'uidbp98a8ipde7mrdtaao69zc9y',
    schema: 1,
    type: 'card',
    title: task.title,
    fields: {
      properties: {
        'a972dc7a-5f4c-45d2-8044-8c28c69717f1': this.mapInternalStatusToFocalboard(task.status),
        'd3d682bf-e074-49d9-8df5-7320921c2d23': this.mapInternalPriorityToFocalboard(task.priority),
      },
      contentOrder: [],
      icon: '🤖',
      isTemplate: false
    },
    createAt: currentTime,
    updateAt: currentTime,
    deleteAt: 0,
    boardId: boardId
  };

  const response = await this.client.post(`/boards/${boardId}/blocks`, [cardData]);
  return response.data;
}
```

### 中文命令解析模式
```javascript
// 支援的中文命令模式
const createPatterns = [
  /^創建任務[：:]\s*(.+)$/,
  /^新增任務[：:]\s*(.+)$/,
  /^添加任務[：:]\s*(.+)$/,
  /^建立任務[：:]\s*(.+)$/,
  /^創建[：:]\s*(.+)$/,
  /^新增[：:]\s*(.+)$/,
  /^添加[：:]\s*(.+)$/
];

const listPatterns = [
  /^(查看|顯示|列出|列表)任務$/,
  /^任務列表$/,
  /^任務清單$/
];

const searchPatterns = [
  /^(搜尋|搜索|查找|尋找)[：:]\s*(.+)$/,
  /^(搜尋|搜索|查找|尋找)\s+(.+)$/
];
```

---

## 🚨 常見問題解決

### 問題 1: 任務創建後看不到
**症狀：** LINE Bot 回覆成功，但 Focalboard 看板上沒有任務
**原因：** 使用了錯誤的看板 ID 或權限不足
**解決：** 確認使用 `bd4cehgd6bpy6xgmed7iqdosz6o`

### 問題 2: 中文顯示亂碼
**症狀：** 任務標題在 Focalboard 中顯示亂碼
**原因：** 編碼問題
**解決：** 確保 Content-Type 設為 `application/json; charset=utf-8`

### 問題 3: LINE Bot 不回應
**症狀：** 發送訊息後沒有回覆
**原因：** Webhook 簽名驗證失敗或服務器未運行
**解決：** 檢查服務器狀態和 LINE Channel Secret

---

## 📊 性能監控

### 關鍵指標
- **回應時間：** < 3 秒
- **成功率：** > 99%
- **錯誤率：** < 1%
- **可用性：** 24/7

### 監控命令
```bash
# 檢查服務器狀態
curl http://localhost:3000/health

# 檢查 Focalboard 連接
curl -H "Authorization: Bearer kas4qri1kxpbnb871afgdz3odmo" \
     http://localhost:8080/api/v2/teams

# 檢查 LINE Bot 狀態
curl -X POST http://localhost:3000/test/parse \
     -H "Content-Type: application/json" \
     -d '{"message":"創建任務：測試"}'
```

---

## 🔄 備份與恢復

### 重要文件備份
```bash
# 備份配置文件
cp .env .env.backup
cp package.json package.json.backup

# 備份源代碼
tar -czf linebot-backup-$(date +%Y%m%d).tar.gz src/
```

### 快速恢復步驟
1. 恢復環境變數配置
2. 安裝依賴：`npm install`
3. 啟動服務：`npm start`
4. 驗證功能：發送測試訊息

---

## 🎯 未來改進方向

### 功能擴展
- [ ] 任務狀態更新
- [ ] 任務分配功能
- [ ] 截止日期提醒
- [ ] 任務優先級調整
- [ ] 批量操作支援

### 技術優化
- [ ] 錯誤重試機制
- [ ] 快取機制實現
- [ ] 日誌系統完善
- [ ] 性能監控儀表板
- [ ] 自動化測試套件

---

**最終確認：** 系統完全正常運行，所有功能測試通過 ✅
**維護責任：** 定期檢查 Token 有效性和服務器狀態
**聯絡信息：** 如有問題請檢查此文檔的故障排除章節
