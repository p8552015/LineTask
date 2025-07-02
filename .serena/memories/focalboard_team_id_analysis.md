# Focalboard Team ID 問題分析

## 🔍 從瀏覽器 Console 發現的關鍵信息

### Console 日誌分析
```
[1751439029.54] Unable to find team in store. TeamID: 0
[1751439029.54] First component subscribing to team 0
[1751439029.54] OctoClient baseURL: http://localhost:8080
```

## 💡 問題根本原因

1. **Focalboard 連接成功** ✅
   - `OctoClient baseURL: http://localhost:8080` 顯示連接正常

2. **Team ID 問題** ❌
   - `TeamID: 0` 表示沒有有效的 team
   - `Unable to find team in store` 表示尚未創建或加入 team

3. **用戶狀態分析** 
   - 用戶可能尚未完成註冊/登入流程
   - 或者已登入但尚未創建/加入 team

## 🎯 解決方案

### 立即行動：完成 Focalboard 設置
1. 確認用戶註冊/登入狀態
2. 創建新 team 或加入現有 team
3. 獲取正確的 Team ID

### 備用方案：使用預設值
如果是單用戶環境，可能可以直接使用：
- `FOCALBOARD_TEAM_ID=0` (根據日誌)
- 或通過 API 直接獲取