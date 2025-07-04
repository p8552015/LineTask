#!/usr/bin/env node

/**
 * 環境變數設置工具
 * 確保 .env 文件正確配置
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 環境變數設置工具');
console.log('==================\n');

const envPath = path.join(__dirname, '.env');
const templatePath = path.join(__dirname, '.env.template');

// 環境變數配置
const envConfig = {
  // LINE Bot 設定
  LINE_CHANNEL_ACCESS_TOKEN: '49KERc7vWWDergSjcGFJj4FtjereP6RN1FyB6lx5bbHZY0UL+qflkZprZNZSoRA0yO890eFBO58g/sdIErtmerAXGh4VMvn3PiwoXhd5GmxqPUwKQo5TsqRtUwxkltYzO07rA4hu6SaXg2Q4PCvGMwdB04t89/1O/w1cDnyilFU=',
  LINE_CHANNEL_SECRET: '363bf93e33dabc24c8b3349be33b8e6c',
  
  // Focalboard 設定
  FOCALBOARD_API_URL: 'http://localhost:8080',
  FOCALBOARD_TEAM_ID: 'bd4cehgd6bpy6xgmed7iqdosz6o',
  FOCALBOARD_DEFAULT_BOARD_ID: 'vdaf9tn387bfq3edqmh7q1wsbnr',
  FOCALBOARD_TOKEN: '',
  
  // 服務器設定
  PORT: '3000',
  NODE_ENV: 'development',
  
  // 其他設定
  ALLOWED_ORIGINS: '*'
};

function createEnvFile() {
  console.log('📝 創建 .env 文件...');
  
  let envContent = '# LINE Bot 與 Focalboard 整合設定\n';
  envContent += `# 生成時間: ${new Date().toISOString()}\n\n`;
  
  // LINE Bot 設定
  envContent += '# LINE Bot 設定 - 從 LINE Developer Console 取得\n';
  envContent += `LINE_CHANNEL_ACCESS_TOKEN=${envConfig.LINE_CHANNEL_ACCESS_TOKEN}\n`;
  envContent += `LINE_CHANNEL_SECRET=${envConfig.LINE_CHANNEL_SECRET}\n\n`;
  
  // Focalboard 設定
  envContent += '# Focalboard 設定\n';
  envContent += `FOCALBOARD_API_URL=${envConfig.FOCALBOARD_API_URL}\n`;
  envContent += `FOCALBOARD_TEAM_ID=${envConfig.FOCALBOARD_TEAM_ID}\n`;
  envContent += `FOCALBOARD_DEFAULT_BOARD_ID=${envConfig.FOCALBOARD_DEFAULT_BOARD_ID}\n`;
  envContent += `FOCALBOARD_TOKEN=${envConfig.FOCALBOARD_TOKEN}\n\n`;
  
  // 服務器設定
  envContent += '# 服務器設定\n';
  envContent += `PORT=${envConfig.PORT}\n`;
  envContent += `NODE_ENV=${envConfig.NODE_ENV}\n\n`;
  
  // 其他設定
  envContent += '# 其他設定\n';
  envContent += `ALLOWED_ORIGINS=${envConfig.ALLOWED_ORIGINS}\n`;
  
  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env 文件創建成功');
    return true;
  } catch (error) {
    console.error('❌ .env 文件創建失敗:', error.message);
    return false;
  }
}

function checkEnvFile() {
  console.log('🔍 檢查現有 .env 文件...');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env 文件不存在');
    return false;
  }
  
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const vars = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=', 2);
        if (key && value) {
          vars[key] = value;
        }
      }
    });
    
    console.log(`✅ .env 文件存在，包含 ${Object.keys(vars).length} 個變數`);
    
    // 檢查必要的環境變數
    const requiredVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'FOCALBOARD_API_URL',
      'FOCALBOARD_TEAM_ID'
    ];
    
    let missingVars = [];
    requiredVars.forEach(varName => {
      if (!vars[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log(`❌ 缺少必要的環境變數: ${missingVars.join(', ')}`);
      return false;
    }
    
    console.log('✅ 所有必要的環境變數都已設定');
    return true;
  } catch (error) {
    console.error('❌ 讀取 .env 文件失敗:', error.message);
    return false;
  }
}

function backupEnvFile() {
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    try {
      fs.copyFileSync(envPath, backupPath);
      console.log(`📋 已備份現有 .env 文件到: ${backupPath}`);
    } catch (error) {
      console.error('⚠️  備份失敗:', error.message);
    }
  }
}

function testEnvFile() {
  console.log('\n🧪 測試環境變數載入...');
  
  try {
    // 清除現有環境變數
    delete require.cache[require.resolve('dotenv')];
    
    // 重新載入環境變數
    require('dotenv').config();
    
    const requiredVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'FOCALBOARD_API_URL',
      'FOCALBOARD_TEAM_ID'
    ];
    
    let loadedCount = 0;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        loadedCount++;
        console.log(`✅ ${varName}: ${varName.includes('TOKEN') ? process.env[varName].substring(0, 20) + '...' : process.env[varName]}`);
      } else {
        console.log(`❌ ${varName}: 未載入`);
      }
    });
    
    console.log(`\n📊 環境變數載入狀態: ${loadedCount}/${requiredVars.length} 個變數成功載入`);
    return loadedCount === requiredVars.length;
  } catch (error) {
    console.error('❌ 環境變數載入測試失敗:', error.message);
    return false;
  }
}

// 主要流程
async function main() {
  console.log('開始環境變數設置...\n');
  
  const envExists = checkEnvFile();
  
  if (!envExists) {
    console.log('\n🔄 創建新的 .env 文件...');
    const created = createEnvFile();
    if (!created) {
      console.log('\n❌ 設置失敗');
      process.exit(1);
    }
  } else {
    console.log('\n❓ .env 文件已存在，是否要重新創建？');
    console.log('   如果當前配置有問題，建議重新創建');
    console.log('   輸入 "y" 重新創建，其他鍵跳過');
    
    // 在實際環境中，這裡可以加入用戶輸入功能
    // 現在先自動檢查並決定是否重新創建
    const testPassed = testEnvFile();
    if (!testPassed) {
      console.log('\n🔄 檢測到問題，重新創建 .env 文件...');
      backupEnvFile();
      createEnvFile();
    }
  }
  
  // 最終測試
  console.log('\n🎯 最終測試...');
  const finalTest = testEnvFile();
  
  if (finalTest) {
    console.log('\n🎉 環境變數設置完成！');
    console.log('\n📋 接下來的步驟:');
    console.log('1. 運行診斷工具: node diagnose.js');
    console.log('2. 啟動應用程式: npm start');
    console.log('3. 測試 Webhook 功能');
  } else {
    console.log('\n❌ 環境變數設置失敗，請檢查錯誤訊息');
    process.exit(1);
  }
}

main().catch(console.error);