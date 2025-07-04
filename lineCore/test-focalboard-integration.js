#!/usr/bin/env node

/**
 * 測試 Focalboard 集成
 */

require('dotenv').config();
const FocalboardService = require('./src/services/FocalboardService');

async function testFocalboardIntegration() {
  console.log('🧪 測試 Focalboard 集成...');
  console.log('================================\n');
  
  try {
    // 初始化 Focalboard 服務
    const focalboardService = new FocalboardService(
      process.env.FOCALBOARD_API_URL,
      process.env.FOCALBOARD_TOKEN,
      process.env.FOCALBOARD_TEAM_ID,
      process.env.FOCALBOARD_DEFAULT_BOARD_ID
    );
    
    console.log('📋 配置信息:');
    console.log(`   API URL: ${process.env.FOCALBOARD_API_URL}`);
    console.log(`   Team ID: ${process.env.FOCALBOARD_TEAM_ID}`);
    console.log(`   Board ID: ${process.env.FOCALBOARD_DEFAULT_BOARD_ID}`);
    console.log(`   Token: ${process.env.FOCALBOARD_TOKEN ? '已設定' : '未設定'}\n`);
    
    // 測試 1: 創建任務
    console.log('🔧 測試 1: 創建任務...');
    
    const testTask = {
      title: '測試任務 - ' + new Date().toLocaleString('zh-TW'),
      description: '這是一個通過 LINE Bot 創建的測試任務',
      status: 'todo',
      priority: 'medium',
      assignee: 'LINE Bot',
      tags: ['測試', 'LINE Bot'],
      createdBy: 'Integration Test'
    };
    
    const createdTask = await focalboardService.createTask(testTask);
    
    if (createdTask) {
      console.log('✅ 任務創建成功!');
      console.log(`   任務 ID: ${createdTask.id}`);
      console.log(`   標題: ${createdTask.title}`);
      console.log(`   狀態: ${createdTask.status}`);
      console.log(`   優先級: ${createdTask.priority}\n`);
      
      // 測試 2: 獲取任務列表
      console.log('🔧 測試 2: 獲取任務列表...');
      
      const tasks = await focalboardService.getTasks();
      console.log(`✅ 成功獲取 ${tasks.length} 個任務\n`);
      
      // 測試 3: 獲取單一任務
      console.log('🔧 測試 3: 獲取單一任務...');
      
      const retrievedTask = await focalboardService.getTask(createdTask.id);
      
      if (retrievedTask) {
        console.log('✅ 任務獲取成功!');
        console.log(`   標題: ${retrievedTask.title}`);
        console.log(`   描述: ${retrievedTask.description}\n`);
      } else {
        console.log('❌ 任務獲取失敗\n');
      }
      
      // 測試 4: 更新任務
      console.log('🔧 測試 4: 更新任務...');
      
      const updateData = {
        status: 'in-progress',
        priority: 'high',
        description: '已更新的任務描述 - ' + new Date().toLocaleString('zh-TW')
      };
      
      const updatedTask = await focalboardService.updateTask(createdTask.id, updateData);
      
      if (updatedTask) {
        console.log('✅ 任務更新成功!');
        console.log(`   新狀態: ${updatedTask.status}`);
        console.log(`   新優先級: ${updatedTask.priority}\n`);
      } else {
        console.log('❌ 任務更新失敗\n');
      }
      
    } else {
      console.log('❌ 任務創建失敗\n');
    }
    
    console.log('🎉 Focalboard 集成測試完成!');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.error('詳細錯誤:', error);
  }
}

// 執行測試
if (require.main === module) {
  testFocalboardIntegration().catch(console.error);
}

module.exports = {
  testFocalboardIntegration
};
