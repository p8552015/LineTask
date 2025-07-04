#!/usr/bin/env node

/**
 * 測試中文命令解析功能
 */

const LineMessageProcessor = require('./src/services/LineMessageProcessor');
const FocalboardService = require('./src/services/FocalboardService');

// 創建模擬的 Focalboard 服務
const mockFocalboardService = {
  async createTask(taskData) {
    console.log('📝 模擬創建任務:', taskData);
    return {
      id: `mock-${Date.now()}`,
      ...taskData,
      createdAt: new Date()
    };
  },
  
  async getTasks(filters) {
    console.log('📋 模擬獲取任務列表:', filters);
    return [
      { id: '1', title: '測試任務 1', status: 'todo' },
      { id: '2', title: '測試任務 2', status: 'in-progress' }
    ];
  },
  
  async searchTasks(query) {
    console.log('🔍 模擬搜尋任務:', query);
    return [
      { id: '1', title: `包含 "${query}" 的任務`, status: 'todo' }
    ];
  }
};

async function testChineseCommands() {
  console.log('🧪 測試中文命令解析功能...');
  console.log('================================\n');
  
  // 創建訊息處理器
  const processor = new LineMessageProcessor(mockFocalboardService);
  
  // 測試用例
  const testCases = [
    {
      name: '創建任務（冒號）',
      message: '創建任務：測試 LINE Bot 功能',
      expected: 'create'
    },
    {
      name: '創建任務（英文冒號）',
      message: '創建任務:修復登入問題',
      expected: 'create'
    },
    {
      name: '新增任務',
      message: '新增任務：設計新功能',
      expected: 'create'
    },
    {
      name: '添加任務',
      message: '添加任務：寫測試案例',
      expected: 'create'
    },
    {
      name: '建立任務',
      message: '建立任務：部署到生產環境',
      expected: 'create'
    },
    {
      name: '簡化創建',
      message: '創建：優化數據庫查詢',
      expected: 'create'
    },
    {
      name: '查看任務',
      message: '查看任務',
      expected: 'list'
    },
    {
      name: '顯示任務',
      message: '顯示任務',
      expected: 'list'
    },
    {
      name: '任務列表',
      message: '任務列表',
      expected: 'list'
    },
    {
      name: '搜尋任務（冒號）',
      message: '搜尋：登入',
      expected: 'search'
    },
    {
      name: '搜索任務（空格）',
      message: '搜索 bug',
      expected: 'search'
    },
    {
      name: '查找任務',
      message: '查找：前端',
      expected: 'search'
    },
    {
      name: '幫助',
      message: '幫助',
      expected: 'help'
    },
    {
      name: '說明',
      message: '說明',
      expected: 'help'
    },
    {
      name: '如何使用',
      message: '如何使用',
      expected: 'help'
    },
    {
      name: '傳統斜線命令',
      message: '/add 測試任務',
      expected: 'add'
    },
    {
      name: '無效命令',
      message: '隨便說點什麼',
      expected: 'unknown'
    }
  ];
  
  console.log('🔧 開始測試命令解析...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`📝 測試: ${testCase.name}`);
    console.log(`   輸入: "${testCase.message}"`);
    
    try {
      const command = processor.parseCommand(testCase.message);
      console.log(`   解析結果: type="${command.type}", isValid=${command.isValid}`);
      
      if (command.type === testCase.expected) {
        console.log(`   ✅ 通過 - 預期: ${testCase.expected}, 實際: ${command.type}`);
        passedTests++;
        
        // 如果是創建任務，顯示解析的任務數據
        if (command.type === 'create' && command.taskData) {
          console.log(`   📋 任務標題: "${command.taskData.title}"`);
        }
        
        // 如果是搜尋，顯示查詢內容
        if (command.type === 'search' && command.query) {
          console.log(`   🔍 搜尋內容: "${command.query}"`);
        }
      } else {
        console.log(`   ❌ 失敗 - 預期: ${testCase.expected}, 實際: ${command.type}`);
      }
    } catch (error) {
      console.log(`   ❌ 錯誤: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📊 測試結果統計:');
  console.log(`   通過: ${passedTests}/${totalTests}`);
  console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有測試通過！中文命令解析功能正常工作。');
  } else {
    console.log('\n⚠️  部分測試失敗，需要檢查命令解析邏輯。');
  }
  
  // 測試完整的訊息處理流程
  console.log('\n🔧 測試完整訊息處理流程...\n');
  
  const testMessage = '創建任務：測試完整流程';
  console.log(`📝 測試訊息: "${testMessage}"`);
  
  try {
    const result = await processor.processTextMessage(testMessage, 'test-user-123');
    console.log('✅ 處理結果:', result);
  } catch (error) {
    console.log('❌ 處理失敗:', error.message);
  }
}

// 執行測試
if (require.main === module) {
  testChineseCommands().catch(console.error);
}

module.exports = {
  testChineseCommands
};
