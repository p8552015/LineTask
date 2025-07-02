# LINE Focalboard Bot - 專案概述

## 專案目的
這是一個整合 LINE Bot 與 Focalboard 的任務管理系統，採用「Webhook → 中介服務 → Focalboard REST API」架構。

## 技術棧
- **Backend**: Node.js + Express.js
- **LINE SDK**: @line/bot-sdk v10.0.0
- **HTTP Client**: axios v1.10.0
- **Security**: helmet v8.1.0, cors v2.8.5
- **Logging**: winston v3.17.0, morgan v1.10.0
- **Environment**: dotenv v17.0.1
- **Development**: nodemon v3.1.10, jest v30.0.3, typescript v5.8.3

## 核心功能
- LINE Bot 命令處理（/add, /list, /search, /help）
- Focalboard 任務同步
- 支援任務屬性：優先級 (@high/@medium/@low)、標籤 (#tag)、負責人 (:assignee)
- RESTful API 端點
- Docker 容器化支援

## API 金鑰配置
- LINE_CHANNEL_ACCESS_TOKEN: WA/IyTZmye+8WZkSsIFAeasrtHQ3/M3fxpzVUhN2UlWmHMnG6gEoOLX+TkcVwIAeyO890eFBO58g/sdIErtmerAXGh4VMvn3PiwoXhd5Gmz0wFMbwblmLARA3RFezu3ykq4dlDdZx6csu7Wz6KlV8gdB04t89/1O/w1cDnyilFU=
- LINE_CHANNEL_SECRET: 6Ud41dd979b59b253074d8caa73646465a
- GOOGLE_API_KEY: AIzaSyBhxvFiqElDAeXvloN8AtPH2XNECsT1bXg