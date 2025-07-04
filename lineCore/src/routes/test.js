const express = require('express');
const router = express.Router();

/**
 * 測試路由 - 用於測試訊息處理功能，繞過 LINE 簽名驗證
 */

// 測試訊息處理
router.post('/message', async (req, res) => {
  try {
    const { message, userId = 'test-user-123' } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Missing message parameter'
      });
    }
    
    console.log(`🧪 測試訊息處理: "${message}"`);
    
    // 獲取訊息處理器
    const messageProcessor = req.app.locals.messageProcessor;
    
    if (!messageProcessor) {
      return res.status(500).json({
        error: 'Message processor not initialized'
      });
    }
    
    // 處理訊息
    const result = await messageProcessor.processTextMessage(message, userId);
    
    console.log('🧪 處理結果:', result);
    
    res.json({
      success: true,
      input: {
        message,
        userId
      },
      result
    });
    
  } catch (error) {
    console.error('🧪 測試處理失敗:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// 測試命令解析
router.post('/parse', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Missing message parameter'
      });
    }
    
    console.log(`🧪 測試命令解析: "${message}"`);
    
    // 獲取訊息處理器
    const messageProcessor = req.app.locals.messageProcessor;
    
    if (!messageProcessor) {
      return res.status(500).json({
        error: 'Message processor not initialized'
      });
    }
    
    // 只解析命令，不執行
    const command = messageProcessor.parseCommand(message);
    
    console.log('🧪 解析結果:', command);
    
    res.json({
      success: true,
      input: message,
      command
    });
    
  } catch (error) {
    console.error('🧪 解析失敗:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// 測試中文命令列表
router.get('/chinese-commands', (req, res) => {
  res.json({
    success: true,
    supportedCommands: {
      create: [
        '創建任務：任務標題',
        '新增任務：任務標題',
        '添加任務：任務標題',
        '建立任務：任務標題',
        '創建：任務標題',
        '新增：任務標題',
        '添加：任務標題'
      ],
      list: [
        '查看任務',
        '顯示任務',
        '列出任務',
        '列表任務',
        '任務列表',
        '任務清單'
      ],
      search: [
        '搜尋：關鍵字',
        '搜索：關鍵字',
        '查找：關鍵字',
        '尋找：關鍵字',
        '搜尋 關鍵字',
        '搜索 關鍵字'
      ],
      help: [
        '幫助',
        '說明',
        '指令',
        '命令',
        'help',
        '如何使用',
        '怎麼用'
      ]
    },
    examples: [
      '創建任務：修復登入問題',
      '新增任務：設計新功能',
      '查看任務',
      '搜尋：bug',
      '幫助'
    ]
  });
});

module.exports = router;
