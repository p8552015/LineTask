# 建議的 Shell 命令 (Windows 環境)

## 重要提醒
此專案在 **Windows 10** 環境下，使用 **PowerShell** 作為 shell。

## 系統工具命令

### 檔案和目錄操作
```powershell
# 列出目錄內容
Get-ChildItem                    # 等同於 ls
Get-ChildItem -Recurse           # 遞迴列出

# 目錄操作
Set-Location path                # 等同於 cd
New-Item -ItemType Directory     # 創建目錄
Remove-Item -Recurse -Force      # 刪除目錄

# 檔案操作
Get-Content filename             # 等同於 cat
New-Item -ItemType File          # 創建檔案
Copy-Item source destination     # 複製檔案
Move-Item source destination     # 移動檔案
```

### 搜尋和查找
```powershell
# 檔案內容搜尋
Select-String "pattern" *.js     # 等同於 grep
Get-ChildItem -Recurse -Filter "*.js"  # 查找檔案

# 程序管理
Get-Process                      # 等同於 ps
Stop-Process -Name "process"     # 終止程序
```

## Node.js 開發命令

### 依賴管理
```powershell
# 安裝依賴
npm install                      # 安裝所有依賴
npm install package-name         # 安裝特定包
npm install --save-dev package   # 安裝開發依賴

# 清理
npm cache clean --force          # 清理 npm 緩存
Remove-Item node_modules -Recurse -Force  # 刪除 node_modules
```

### 應用運行
```powershell
# 開發模式
npm run dev                      # 使用 nodemon
npm start                        # 生產模式

# 測試
npm test                         # 執行測試
npm run test:watch               # 監視模式測試

# 代碼檢查
npm run lint                     # ESLint 檢查
npm run lint:fix                 # 自動修復
```

## Git 操作
```powershell
# 基本操作
git status                       # 查看狀態
git add .                        # 暫存所有變更
git commit -m "message"          # 提交變更
git push origin branch           # 推送到遠端

# 分支操作
git branch                       # 列出分支
git checkout -b new-branch       # 創建並切換分支
git merge branch-name           # 合併分支
```

## Docker 操作
```powershell
# 構建和運行
docker build -t line-focalboard-bot .
docker run -p 3000:3000 --env-file .env line-focalboard-bot

# 管理
docker ps                        # 列出容器
docker stop container-id         # 停止容器
docker logs container-id         # 查看日誌
```

## 環境變數設定 (PowerShell)
```powershell
# 臨時設定
$env:NODE_ENV = "development"
$env:PORT = "3000"

# 從 .env 檔案載入
# 建議使用 dotenv 包而非手動設定
```

## 常用組合命令
```powershell
# 完整重裝流程
Remove-Item node_modules -Recurse -Force; Remove-Item package-lock.json; npm install

# 檢查和修復
npm run lint; npm run test; npm run dev

# 部署準備
npm run lint:fix; npm test; docker build -t app .
```

## 注意事項

1. **避免使用 `&&`**: PowerShell 不支援，請使用 `;` 分隔或分別執行
2. **路徑分隔符**: 使用 `\` 或 PowerShell 自動處理的 `/`
3. **權限問題**: 某些操作可能需要 "以系統管理員身分執行"
4. **編碼問題**: 確保檔案使用 UTF-8 編碼避免中文顯示問題