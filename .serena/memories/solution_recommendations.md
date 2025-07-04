# 解決方案建議

## 🎯 修復步驟 (按優先級)

### 第一步：修正關鍵路徑錯誤 (立即執行)
**檔案:** `lineCore/index.js` 第8行
```javascript
// 錯誤
const App = require('./src/app');

// 修正為
const App = require('../src/app');
```

### 第二步：統一專案結構 (建議選項)

#### 選項A: 移動檔案到根目錄 (推薦)
```powershell
# 1. 複製核心檔案到根目錄
Copy-Item lineCore/package.json .
Copy-Item lineCore/index.js .
Copy-Item lineCore/.env .

# 2. 修正 index.js 路徑
# 改為: const App = require('./src/app');

# 3. 移除 lineCore 目錄 (可選)
Remove-Item lineCore -Recurse -Force
```

#### 選項B: 移動 src 到 lineCore (替代方案)
```powershell
# 1. 移動 src 目錄
Move-Item src lineCore/

# 2. 保持原路徑: require('./src/app')

# 3. 更新工作目錄為 lineCore
Set-Location lineCore
```

### 第三步：環境變數修正
確保 `.env` 檔案在正確位置並包含所有必要變數：
```env
LINE_CHANNEL_ACCESS_TOKEN=49KERc7vWWDergSjcGFJj4FtjereP6RN1FyB6lx5bbHZY0UL+qflkZprZNZSoRA0yO890eFBO58g/sdIErtmerAXGh4VMvn3PiwoXhd5GmxqPUwKQo5TsqRtUwxkltYzO07rA4hu6SaXg2Q4PCvGMwdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=363bf93e33dabc24c8b3349be33b8e6c
GOOGLE_API_KEY=AIzaSyBhxvFiqElDAeXvloN8AtPH2XNECsT1bXg
FOCALBOARD_API_URL=http://localhost:8080/api/v2
FOCALBOARD_TOKEN=your_real_focalboard_token_here
FOCALBOARD_TEAM_ID=0
PORT=3000
NODE_ENV=development
```

### 第四步：依賴和啟動測試
```powershell
# 1. 確保在正確目錄
Set-Location C:\Users\東興\Desktop\lineTask

# 2. 安裝依賴 (如果使用選項A)
npm install

# 3. 測試啟動
npm run dev
```

## 🔧 預期結果

修正後應該能夠：
1. ✅ 正常載入 App 模組
2. ✅ 正確讀取環境變數
3. ✅ 啟動 Express 服務器
4. ✅ 響應健康檢查 (`GET /health`)
5. ✅ 處理 LINE Webhook (`POST /webhook/line`)

## ⚠️ 注意事項

1. **備份**: 在執行任何移動操作前先備份
2. **路徑一致性**: 確保所有相對路徑在新結構下正確
3. **環境變數**: `FOCALBOARD_TOKEN` 需要真實有效的值
4. **Windows 兼容性**: 使用 PowerShell 原生命令而非 Unix 命令

## 🚀 快速修復命令 (僅路徑問題)
```powershell
# 最小修正 - 僅修改路徑
$content = Get-Content "lineCore\index.js" -Raw
$content = $content -replace "require\('\./src/app'\)", "require('../src/app')"
Set-Content "lineCore\index.js" $content

# 測試啟動
Set-Location lineCore
npm start
```