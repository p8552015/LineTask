# LINE Bot 任務管理命令指南

## 📱 基本命令格式

### 創建任務
```
/add 任務標題 [參數] | 任務描述
```

## 🎯 支援的參數

| 參數 | 格式 | 說明 | 範例 |
|------|------|------|------|
| 狀態 | `status:狀態` | 設定任務狀態 | `status:todo` `status:in-progress` `status:done` `status:blocked` |
| 優先級 | `@優先級` | 設定任務優先級 | `@low` `@medium` `@high` `@urgent` |
| 負責人 | `:用戶名` | 指派任務負責人 | `:john` `:mary` `:alex` |
| 預估時數 | `hours:數字` | 設定預估工作時數 | `hours:8` `hours:2.5` `hours:16` |
| 截止日期 | `due:YYYY-MM-DD` | 設定任務截止日期 | `due:2025-07-04` `due:2025-12-31` |
| 標籤 | `#標籤名` | 為任務添加標籤 | `#bug` `#frontend` `#urgent` |
| 描述 | `\| 描述內容` | 添加任務詳細描述 | `\| 這是任務的詳細說明` |

## 📋 使用範例

### 1. 簡單任務
```
/add 修復登入問題
```

### 2. 帶狀態和優先級
```
/add 修復登入問題 status:todo @high
```

### 3. 指派負責人和設定時數
```
/add 修復登入問題 :john hours:4
```

### 4. 設定截止日期
```
/add 修復登入問題 due:2025-07-10
```

### 5. 添加標籤
```
/add 修復登入問題 #bug #frontend #critical
```

### 6. 完整格式範例
```
/add 修復登入問題 status:in-progress @high :john hours:8 due:2025-07-10 #bug #frontend | 用戶反映無法登入系統，需要檢查認證流程和資料庫連接
```

## 🔧 其他可用命令

### 查看任務
```
/list                    # 查看所有任務
/list status:todo        # 查看待辦任務
/list status:in-progress # 查看進行中任務
/list status:done        # 查看已完成任務
/list @high              # 查看高優先級任務
/list :john              # 查看 john 的任務
```

### 搜尋任務
```
/search 關鍵字           # 搜尋包含關鍵字的任務
/search #bug             # 搜尋帶有 bug 標籤的任務
```

### 幫助命令
```
/help                    # 查看幫助訊息
/help add                # 查看創建任務的詳細說明
```

## 📊 狀態說明

| 狀態 | 英文 | 中文 | 說明 |
|------|------|------|------|
| `todo` | To Do | 待辦 | 尚未開始的任務 |
| `in-progress` | In Progress | 進行中 | 正在執行的任務 |
| `done` | Done | 已完成 | 已經完成的任務 |
| `blocked` | Blocked | 阻塞 | 因某些原因無法進行的任務 |

## ⭐ 優先級說明

| 優先級 | 英文 | 中文 | 說明 |
|--------|------|------|------|
| `low` | Low | 低 | 不緊急的任務 |
| `medium` | Medium | 中 | 一般重要性的任務 |
| `high` | High | 高 | 重要且緊急的任務 |
| `urgent` | Urgent | 緊急 | 需要立即處理的任務 |

## 🎯 實際使用場景

### 開發團隊
```
/add 實作用戶註冊功能 status:todo @high :alice hours:16 due:2025-07-15 #feature #backend | 需要實作用戶註冊 API，包含郵件驗證和密碼加密
```

### 設計團隊
```
/add 設計新版首頁 status:in-progress @medium :bob hours:24 due:2025-07-20 #design #ui | 根據用戶反饋重新設計首頁布局和視覺效果
```

### 測試團隊
```
/add 測試支付流程 status:todo @high :charlie hours:8 due:2025-07-12 #testing #payment | 全面測試新的支付系統，包含各種支付方式和異常情況
```

### 專案管理
```
/add 準備月度報告 status:todo @medium :david hours:4 due:2025-07-31 #report #management | 整理本月專案進度和團隊績效數據
```

## 💡 使用技巧

1. **參數順序不重要**：你可以以任何順序放置參數
2. **標籤可以多個**：使用多個 `#標籤` 來分類任務
3. **時數支援小數**：可以使用 `hours:2.5` 表示 2.5 小時
4. **描述放在最後**：使用 `|` 分隔符號，後面的內容都會被視為描述
5. **日期格式固定**：必須使用 `YYYY-MM-DD` 格式

## ❌ 常見錯誤

### 錯誤的日期格式
```
❌ due:07/04/2025
❌ due:2025/07/04
✅ due:2025-07-04
```

### 錯誤的優先級
```
❌ @critical
❌ @normal
✅ @high
✅ @urgent
```

### 錯誤的狀態
```
❌ status:pending
❌ status:complete
✅ status:todo
✅ status:done
```

## 🔄 更新任務

目前支援創建任務，後續版本將支援：
- 更新任務狀態
- 修改任務資訊
- 刪除任務
- 添加評論

---

**提示：** 如果命令執行失敗，Bot 會回覆錯誤訊息和建議的修正方式。
