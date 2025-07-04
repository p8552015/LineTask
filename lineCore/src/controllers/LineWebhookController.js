const { Client, middleware } = require('@line/bot-sdk');

/**
 * LINE Webhook 控制器 - 遵循單一職責原則 (Single Responsibility Principle)
 * 負責處理來自 LINE 的 webhook 請求和回覆訊息
 */
class LineWebhookController {
  /**
   * 建構函數
   * @param {Object} config - LINE Bot 配置
   * @param {IMessageProcessor} messageProcessor - 訊息處理器
   */
  constructor(config, messageProcessor) {
    this.config = config;
    this.messageProcessor = messageProcessor;

    // 🔍 調試：顯示實際使用的憑證
    console.log('🔐 LINE Bot 憑證調試:');
    console.log('   Channel Access Token (前20字):', config.channelAccessToken?.substring(0, 20) + '...');
    console.log('   Channel Secret:', config.channelSecret);
    console.log('   環境變數 Channel Secret:', process.env.LINE_CHANNEL_SECRET);
    console.log('   Channel Secret 長度:', config.channelSecret?.length);
    console.log('   Channel Secret 類型:', typeof config.channelSecret);

    // 驗證必要配置
    if (!config.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
    }
    if (!config.channelSecret) {
      throw new Error('LINE_CHANNEL_SECRET 未設定');
    }

    // 初始化 LINE Bot 客戶端
    this.client = new Client({
      channelAccessToken: config.channelAccessToken,
      channelSecret: config.channelSecret
    });

    // 設定 middleware 並包裝錯誤處理
    this.middleware = this.createEnhancedMiddleware(config.channelSecret);

    console.log('✅ LINE Webhook 控制器初始化完成');
  }

  /**
   * 創建增強的中間件，包含詳細的錯誤處理
   * @param {string} channelSecret - Channel Secret
   * @returns {Function} 增強的中間件函數
   */
  createEnhancedMiddleware(channelSecret) {
    const originalMiddleware = middleware({
      channelSecret: channelSecret
    });

    return (req, res, next) => {
      console.log('🔍 中間件開始處理請求');
      console.log('📋 原始請求標頭:', JSON.stringify({
        'content-type': req.headers['content-type'],
        'x-line-signature': req.headers['x-line-signature'] ? 'present' : 'missing',
        'content-length': req.headers['content-length']
      }, null, 2));

      originalMiddleware(req, res, (error) => {
        if (error) {
          console.error('❌ 中間件錯誤:', error.name, error.message);
          console.error('🔐 簽名驗證詳情:', {
            hasSignature: !!req.headers['x-line-signature'],
            channelSecretLength: channelSecret?.length,
            bodyType: typeof req.body,
            bodyLength: req.body ? JSON.stringify(req.body).length : 0
          });

          // 返回 400 錯誤給 LINE Platform
          return res.status(400).json({
            error: 'Bad Request',
            message: error.message,
            type: error.name,
            timestamp: new Date().toISOString()
          });
        }

        console.log('✅ 中間件驗證通過');
        next();
      });
    };
  }

  /**
   * 取得 LINE middleware
   * @returns {Function} LINE middleware 函數
   */
  getMiddleware() {
    return this.middleware;
  }

  /**
   * 創建測試用的中間件（無簽名驗證）
   * @returns {Function} 測試中間件函數
   */
  getTestMiddleware() {
    return (req, res, next) => {
      console.log('🧪 使用測試中間件（跳過簽名驗證）');
      console.log('📋 測試請求標頭:', JSON.stringify({
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      }, null, 2));
      next();
    };
  }

  /**
   * 處理 webhook 事件
   * @param {Object} req - Express 請求物件
   * @param {Object} res - Express 回應物件
   */
  async handleWebhook(req, res) {
    try {
      // 🔍 詳細的請求日誌
      console.log('🔔 收到 LINE webhook 請求');
      console.log('📋 請求標頭:', JSON.stringify({
        'content-type': req.headers['content-type'],
        'x-line-signature': req.headers['x-line-signature'],
        'user-agent': req.headers['user-agent'],
        'content-length': req.headers['content-length']
      }, null, 2));

      console.log('📦 請求主體:', JSON.stringify(req.body, null, 2));

      // 驗證請求主體結構
      if (!req.body) {
        console.error('❌ 請求主體為空');
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Request body is empty'
        });
      }

      const events = req.body.events;

      if (!events || events.length === 0) {
        console.log('ℹ️  沒有事件需要處理');
        return res.status(200).json({ message: 'No events to process' });
      }

      console.log(`📨 處理 ${events.length} 個事件`);

      // 處理每個事件
      const promises = events.map(event => this.handleEvent(event));
      await Promise.all(promises);

      console.log('✅ 所有事件處理完成');
      res.status(200).json({ message: 'Events processed successfully' });

    } catch (error) {
      console.error('❌ 處理 webhook 時發生錯誤:', error);
      console.error('📊 錯誤堆疊:', error.stack);

      // 根據錯誤類型返回適當的狀態碼
      let statusCode = 500;
      let errorMessage = error.message;

      if (error.name === 'SignatureValidationFailed') {
        statusCode = 400;
        errorMessage = 'Signature validation failed';
        console.error('🔐 簽名驗證失敗 - 請檢查 Channel Secret 設定');
      } else if (error.name === 'JSONParseError') {
        statusCode = 400;
        errorMessage = 'Invalid JSON in request body';
        console.error('📝 JSON 解析錯誤 - 請檢查請求格式');
      }

      res.status(statusCode).json({
        error: statusCode === 400 ? 'Bad Request' : 'Internal Server Error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 處理單一事件
   * @param {Object} event - LINE 事件物件
   */
  async handleEvent(event) {
    try {
      console.log(`處理事件類型: ${event.type}`);

      switch (event.type) {
        case 'message':
          await this.handleMessageEvent(event);
          break;
        
        case 'follow':
          await this.handleFollowEvent(event);
          break;
        
        case 'unfollow':
          await this.handleUnfollowEvent(event);
          break;
        
        case 'join':
          await this.handleJoinEvent(event);
          break;
        
        case 'leave':
          await this.handleLeaveEvent(event);
          break;
        
        case 'postback':
          await this.handlePostbackEvent(event);
          break;
        
        default:
          console.log(`未處理的事件類型: ${event.type}`);
      }
    } catch (error) {
      console.error('處理事件時發生錯誤:', error);
      // 發送錯誤訊息給用戶
      await this.sendErrorMessage(event, error.message);
    }
  }

  /**
   * 處理訊息事件
   * @param {Object} event - 訊息事件
   */
  async handleMessageEvent(event) {
    const { message, source } = event;
    
    // 只處理文字訊息
    if (message.type !== 'text') {
      console.log(`跳過非文字訊息: ${message.type}`);
      return;
    }

    const userId = source.userId;
    const messageText = message.text;

    console.log(`用戶 ${userId} 發送訊息: ${messageText}`);

    // 使用訊息處理器處理訊息
    const result = await this.messageProcessor.processTextMessage(messageText, userId);
    
    // 回覆處理結果
    await this.replyMessage(event.replyToken, result.message);
  }

  /**
   * 處理追蹤事件（用戶加入好友）
   * @param {Object} event - 追蹤事件
   */
  async handleFollowEvent(event) {
    const userId = event.source.userId;
    console.log(`用戶 ${userId} 加入好友`);

    const welcomeMessage = `🎉 歡迎使用 LINE 任務管理機器人！

我可以幫您管理任務，支援以下功能：
• 創建任務
• 查看任務列表
• 搜尋任務
• 更新和刪除任務

輸入 /help 查看詳細指令說明
輸入 /add 開始創建您的第一個任務吧！`;

    await this.replyMessage(event.replyToken, welcomeMessage);
  }

  /**
   * 處理取消追蹤事件（用戶封鎖或刪除好友）
   * @param {Object} event - 取消追蹤事件
   */
  async handleUnfollowEvent(event) {
    const userId = event.source.userId;
    console.log(`用戶 ${userId} 取消追蹤`);
    // 這裡可以進行清理工作，如刪除用戶相關數據
  }

  /**
   * 處理加入群組事件
   * @param {Object} event - 加入群組事件
   */
  async handleJoinEvent(event) {
    const groupId = event.source.groupId || event.source.roomId;
    console.log(`機器人加入群組/聊天室: ${groupId}`);

    const joinMessage = `👋 大家好！我是任務管理機器人

我可以幫助團隊管理任務：
• 任何人都可以創建和查看任務
• 支援任務指派和標籤分類
• 可以搜尋和篩選任務

輸入 /help 查看使用說明`;

    await this.replyMessage(event.replyToken, joinMessage);
  }

  /**
   * 處理離開群組事件
   * @param {Object} event - 離開群組事件
   */
  async handleLeaveEvent(event) {
    const groupId = event.source.groupId || event.source.roomId;
    console.log(`機器人離開群組/聊天室: ${groupId}`);
    // 這裡可以進行清理工作
  }

  /**
   * 處理 postback 事件（快速回覆按鈕）
   * @param {Object} event - postback 事件
   */
  async handlePostbackEvent(event) {
    const data = event.postback.data;
    const userId = event.source.userId;
    
    console.log(`用戶 ${userId} 點擊 postback: ${data}`);
    
    // 解析 postback 數據並執行相應操作
    try {
      const actionData = JSON.parse(data);
      await this.handlePostbackAction(event, actionData);
    } catch (error) {
      console.error('解析 postback 數據失敗:', error);
      await this.replyMessage(event.replyToken, '操作失敗，請重試');
    }
  }

  /**
   * 處理 postback 動作
   * @param {Object} event - 原始事件
   * @param {Object} actionData - 動作數據
   */
  async handlePostbackAction(event, actionData) {
    const { action, taskId } = actionData;
    const userId = event.source.userId;

    switch (action) {
      case 'complete_task':
        const command = `/complete ${taskId}`;
        const result = await this.messageProcessor.processTextMessage(command, userId);
        await this.replyMessage(event.replyToken, result.message);
        break;
      
      case 'view_task':
        const viewCommand = `/view ${taskId}`;
        const viewResult = await this.messageProcessor.processTextMessage(viewCommand, userId);
        await this.replyMessage(event.replyToken, viewResult.message);
        break;
      
      default:
        await this.replyMessage(event.replyToken, '未知的操作');
    }
  }

  /**
   * 回覆訊息
   * @param {string} replyToken - 回覆 token
   * @param {string} message - 訊息內容
   */
  async replyMessage(replyToken, message) {
    try {
      await this.client.replyMessage(replyToken, {
        type: 'text',
        text: message
      });
      console.log('訊息回覆成功');
    } catch (error) {
      console.error('回覆訊息失敗:', error);
      throw error;
    }
  }

  /**
   * 推送訊息
   * @param {string} to - 目標用戶/群組 ID
   * @param {string} message - 訊息內容
   */
  async pushMessage(to, message) {
    try {
      await this.client.pushMessage(to, {
        type: 'text',
        text: message
      });
      console.log('訊息推送成功');
    } catch (error) {
      console.error('推送訊息失敗:', error);
      throw error;
    }
  }

  /**
   * 發送錯誤訊息
   * @param {Object} event - LINE 事件
   * @param {string} errorMessage - 錯誤訊息
   */
  async sendErrorMessage(event, errorMessage) {
    try {
      const userFriendlyMessage = `❌ 處理請求時發生錯誤

錯誤訊息: ${errorMessage}

請檢查您的指令格式是否正確，或輸入 /help 查看使用說明。`;

      await this.replyMessage(event.replyToken, userFriendlyMessage);
    } catch (error) {
      console.error('發送錯誤訊息失敗:', error);
    }
  }

  /**
   * 發送 Flex Message（彈性訊息）
   * @param {string} replyToken - 回覆 token
   * @param {Object} flexMessage - Flex Message 物件
   */
  async sendFlexMessage(replyToken, flexMessage) {
    try {
      await this.client.replyMessage(replyToken, {
        type: 'flex',
        altText: flexMessage.altText || 'Flex Message',
        contents: flexMessage
      });
      console.log('Flex Message 發送成功');
    } catch (error) {
      console.error('發送 Flex Message 失敗:', error);
      throw error;
    }
  }

  /**
   * 創建任務卡片 Flex Message
   * @param {Object} task - 任務物件
   * @returns {Object} Flex Message 物件
   */
  createTaskFlexMessage(task) {
    return {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: task.title,
            weight: 'bold',
            size: 'lg',
            wrap: true
          }
        ],
        backgroundColor: this.getStatusColor(task.status)
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `狀態: ${task.status}`,
            size: 'sm',
            color: '#555555'
          },
          {
            type: 'text',
            text: `優先級: ${task.priority}`,
            size: 'sm',
            color: '#555555'
          },
          {
            type: 'text',
            text: `ID: ${task.id.substring(0, 8)}...`,
            size: 'xs',
            color: '#999999'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '完成',
              data: JSON.stringify({ action: 'complete_task', taskId: task.id })
            },
            style: 'primary',
            flex: 1
          }
        ]
      }
    };
  }

  /**
   * 根據狀態取得顏色
   * @param {string} status - 任務狀態
   * @returns {string} 顏色代碼
   */
  getStatusColor(status) {
    const colorMap = {
      'todo': '#FFE082',
      'in-progress': '#81C784',
      'done': '#A5D6A7',
      'blocked': '#FFAB91'
    };
    return colorMap[status] || '#E0E0E0';
  }

  /**
   * 健康檢查
   * @returns {Object} 健康檢查結果
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      service: 'LINE Webhook Controller',
      timestamp: new Date().toISOString(),
      config: {
        hasChannelAccessToken: !!this.config.channelAccessToken,
        hasChannelSecret: !!this.config.channelSecret
      }
    };
  }
}

module.exports = LineWebhookController; 