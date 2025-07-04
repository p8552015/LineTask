#!/usr/bin/env node

/**
 * LINE Webhook 快速修復工具
 * 自動診斷並修復常見的 webhook 問題
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔧 LINE Webhook 快速修復工具');
console.log('============================\n');

/**
 * 檢查環境變數
 */
function checkEnvironmentVariables() {
  console.log('1. 檢查環境變數');
  console.log('===============');
  
  const requiredVars = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'FOCALBOARD_API_URL',
    'FOCALBOARD_TEAM_ID'
  ];
  
  const issues = [];
  const envStatus = {};
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    envStatus[varName] = !!value;
    
    if (value) {
      if (varName.includes('TOKEN')) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: 未設定`);
      issues.push(`缺少環境變數: ${varName}`);
    }
  });
  
  // 特別檢查 Channel Secret 格式
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (channelSecret) {
    if (channelSecret.length !== 32) {
      console.log(`⚠️  Channel Secret 長度異常: ${channelSecret.length} (應為 32)`);
      issues.push('Channel Secret 長度不正確');
    }
    if (!/^[a-f0-9]+$/.test(channelSecret)) {
      console.log('⚠️  Channel Secret 格式異常: 應為 32 位十六進制字符');
      issues.push('Channel Secret 格式不正確');
    }
  }
  
  return { issues, envStatus };
}

/**
 * 檢查 .env 檔案
 */
function checkEnvFile() {
  console.log('\n2. 檢查 .env 檔案');
  console.log('================');
  
  const envPath = path.join(__dirname, '.env');
  const issues = [];
  
  try {
    if (fs.existsSync(envPath)) {
      console.log(`✅ .env 檔案存在: ${envPath}`);
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      console.log(`📄 .env 檔案內容 (${lines.length} 行):`);
      lines.forEach((line, index) => {
        const [key] = line.split('=');
        if (key && key.includes('TOKEN')) {
          console.log(`   ${index + 1}: ${key}=***`);
        } else {
          console.log(`   ${index + 1}: ${line}`);
        }
      });
      
      // 檢查是否有空值
      const emptyVars = lines.filter(line => line.endsWith('=') || line.endsWith('=""'));
      if (emptyVars.length > 0) {
        console.log('⚠️  發現空的環境變數:');
        emptyVars.forEach(line => console.log(`   ${line}`));
        issues.push('存在空的環境變數');
      }
      
    } else {
      console.log(`❌ .env 檔案不存在: ${envPath}`);
      issues.push('.env 檔案不存在');
    }
  } catch (error) {
    console.error(`❌ 讀取 .env 檔案失敗: ${error.message}`);
    issues.push('.env 檔案讀取失敗');
  }
  
  return issues;
}

/**
 * 檢查 LINE Bot SDK 配置
 */
function checkLineBotSDK() {
  console.log('\n3. 檢查 LINE Bot SDK');
  console.log('==================');
  
  const issues = [];
  
  try {
    const { Client, middleware } = require('@line/bot-sdk');
    console.log('✅ LINE Bot SDK 載入成功');
    
    // 測試 Client 初始化
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    
    if (channelAccessToken && channelSecret) {
      try {
        const client = new Client({
          channelAccessToken,
          channelSecret
        });
        console.log('✅ LINE Bot Client 初始化成功');
        
        // 測試 middleware 初始化
        const mw = middleware({ channelSecret });
        console.log('✅ LINE Bot Middleware 初始化成功');
        
      } catch (error) {
        console.error(`❌ LINE Bot 初始化失敗: ${error.message}`);
        issues.push('LINE Bot 初始化失敗');
      }
    } else {
      console.log('⚠️  無法測試 LINE Bot 初始化（缺少憑證）');
      issues.push('缺少 LINE Bot 憑證');
    }
    
  } catch (error) {
    console.error(`❌ LINE Bot SDK 載入失敗: ${error.message}`);
    issues.push('LINE Bot SDK 載入失敗');
  }
  
  return issues;
}

/**
 * 生成修復建議
 */
function generateFixSuggestions(allIssues) {
  console.log('\n🔧 修復建議');
  console.log('===========');
  
  if (allIssues.length === 0) {
    console.log('✅ 沒有發現問題！');
    return;
  }
  
  console.log('發現以下問題需要修復:\n');
  
  allIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\n📋 修復步驟:');
  
  if (allIssues.some(issue => issue.includes('.env'))) {
    console.log('\n🔹 .env 檔案問題:');
    console.log('   1. 確保 .env 檔案存在於 lineCore 目錄');
    console.log('   2. 檢查檔案權限是否正確');
    console.log('   3. 確保檔案格式正確（KEY=VALUE）');
  }
  
  if (allIssues.some(issue => issue.includes('環境變數'))) {
    console.log('\n🔹 環境變數問題:');
    console.log('   1. 前往 LINE Developer Console');
    console.log('   2. 複製正確的 Channel Access Token 和 Channel Secret');
    console.log('   3. 更新 .env 檔案中的對應值');
    console.log('   4. 重新啟動應用程式');
  }
  
  if (allIssues.some(issue => issue.includes('Channel Secret'))) {
    console.log('\n🔹 Channel Secret 問題:');
    console.log('   1. Channel Secret 應為 32 位十六進制字符');
    console.log('   2. 從 LINE Developer Console 重新複製');
    console.log('   3. 確保沒有多餘的空格或換行符');
  }
  
  if (allIssues.some(issue => issue.includes('LINE Bot'))) {
    console.log('\n🔹 LINE Bot SDK 問題:');
    console.log('   1. 重新安裝依賴: npm install');
    console.log('   2. 檢查 Node.js 版本是否支援');
    console.log('   3. 清除 node_modules 並重新安裝');
  }
}

/**
 * 創建範例 .env 檔案
 */
function createSampleEnvFile() {
  console.log('\n📝 創建範例 .env 檔案');
  console.log('====================');
  
  const envPath = path.join(__dirname, '.env');
  const samplePath = path.join(__dirname, '.env.example');
  
  const sampleContent = `# LINE Bot 配置
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# Focalboard 配置  
FOCALBOARD_API_URL=http://localhost:8080
FOCALBOARD_TEAM_ID=your_team_id_here
FOCALBOARD_DEFAULT_BOARD_ID=your_board_id_here
FOCALBOARD_TOKEN=

# 服務器配置
PORT=3000
NODE_ENV=development

# 其他配置
ALLOWED_ORIGINS=*
WEBHOOK_BASE_URL=http://localhost:3000
`;
  
  try {
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(samplePath, sampleContent);
      console.log(`✅ 已創建範例檔案: ${samplePath}`);
      console.log('   請複製為 .env 並填入正確的值');
    } else {
      console.log('ℹ️  .env 檔案已存在，跳過創建範例檔案');
    }
  } catch (error) {
    console.error(`❌ 創建範例檔案失敗: ${error.message}`);
  }
}

/**
 * 主要修復流程
 */
function main() {
  console.log('開始診斷 Webhook 問題...\n');
  
  const allIssues = [];
  
  // 1. 檢查環境變數
  const { issues: envIssues } = checkEnvironmentVariables();
  allIssues.push(...envIssues);
  
  // 2. 檢查 .env 檔案
  const envFileIssues = checkEnvFile();
  allIssues.push(...envFileIssues);
  
  // 3. 檢查 LINE Bot SDK
  const sdkIssues = checkLineBotSDK();
  allIssues.push(...sdkIssues);
  
  // 4. 生成修復建議
  generateFixSuggestions(allIssues);
  
  // 5. 創建範例檔案（如果需要）
  if (allIssues.some(issue => issue.includes('.env'))) {
    createSampleEnvFile();
  }
  
  console.log('\n🎯 下一步:');
  if (allIssues.length === 0) {
    console.log('   1. 運行診斷工具: node webhook-debug.js');
    console.log('   2. 啟動應用程式: npm start');
    console.log('   3. 測試 webhook 功能');
  } else {
    console.log('   1. 根據上述建議修復問題');
    console.log('   2. 重新運行此工具驗證修復');
    console.log('   3. 運行診斷工具: node webhook-debug.js');
  }
  
  console.log('\n📞 如需更多幫助:');
  console.log('   - 查看 TROUBLESHOOTING.md');
  console.log('   - 運行: node diagnose.js');
  console.log('   - 檢查應用程式日誌');
}

// 執行修復
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  checkEnvFile,
  checkLineBotSDK
};
