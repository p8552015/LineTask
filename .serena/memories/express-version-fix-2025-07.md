# Express 版本兼容性問題修復記錄

## 問題描述
- **錯誤**: `TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError`
- **根本原因**: Express 5.1.0 與 LINE Bot SDK 10.0.0 的 middleware 兼容性衝突
- **症狀**: 路由設定階段崩潰，path-to-regexp 解析失敗

## 解決方案
將 Express 版本從 `^5.1.0` 降級到 `^4.21.0`

## 修復文件
- `lineCore/package.json`: Express 版本調整

## 驗證結果
- ✅ 應用程式成功啟動
- ✅ 所有服務初始化完成
- ✅ Focalboard API 連接正常
- ✅ LINE Bot 服務器運行在 localhost:3000

## 後續建議
- 保持 Express 4.x 直到 LINE Bot SDK 更新兼容性
- 定期檢查 LINE Bot SDK 更新
- 考慮在 CI/CD 中鎖定依賴版本