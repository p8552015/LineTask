#!/usr/bin/env node

/**
 * LINE 任務管理機器人 - 主入口文件
 * 整合 LINE Bot 與 Focalboard，提供任務管理功能
 */

const App = require('./src/app');

/**
 * 主函數 - 啟動應用程式
 */
async function main() {
  try {
    console.log('🤖 LINE 任務管理機器人啟動中...\n');
    
    // 顯示環境資訊
    console.log('📋 環境資訊:');
    console.log(`   Node.js 版本: ${process.version}`);
    console.log(`   平台: ${process.platform}`);
    console.log(`   環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   時區: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`);
    
    // 創建並啟動應用程式
    const app = new App();
    await app.start();
    
  } catch (error) {
    console.error('❌ 應用程式啟動失敗:', error);
    process.exit(1);
  }
}

// 處理未捕獲的異常
process.on('uncaughtException', (error) => {
  console.error('💥 未捕獲的異常:', error);
  process.exit(1);
});

// 處理未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未處理的 Promise 拒絕:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// 啟動應用程式
if (require.main === module) {
  main();
}

module.exports = main; 