# 深度問題分析 - 關鍵發現

## 🚨 核心問題：檔案結構混亂

### 問題1: 雙重目錄結構
**現狀：**
- `lineTask/lineCore/` 目錄包含：package.json, index.js, node_modules, .env
- `lineTask/src/` 目錄包含：實際應用邏輯（app.js, controllers/, services/, models/, interfaces/）
- `lineTask/` 根目錄包含：README.md, Dockerfile, healthcheck.js, .dockerignore

**影響：**
- 路徑引用錯誤
- 部署和開發環境混亂
- 無法正常啟動應用

### 問題2: 關鍵路徑錯誤
**檔案：** `lineCore/index.js` 第8行
**錯誤代碼：** `const App = require('./src/app');`
**正確代碼：** `const App = require('../src/app');`

**原因：** src 目錄在 lineCore 的上一層，不是同層

### 問題3: 遺失的根目錄檔案
**已刪除檔案：**
- 根目錄的 `index.js`
- 根目錄的 `package.json`

**現有檔案：**
- `lineCore/index.js` ✓
- `lineCore/package.json` ✓

### 問題4: 環境配置位置問題
- `.env` 檔案在 `lineCore/` 目錄
- 應用邏輯在根目錄 `src/` 中
- 可能導致環境變數載入問題

### 問題5: Windows PowerShell 兼容性
- `&&` 操作符在 Windows PowerShell 中不支援
- 需要使用 `;` 或分別執行命令

## 💡 解決方案優先級
1. **修正路徑引用** (高優先級)
2. **統一檔案結構** (高優先級)  
3. **環境變數配置** (中優先級)
4. **Windows 命令兼容性** (低優先級)