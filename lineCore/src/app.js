require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// 導入服務和控制器
const FocalboardService = require('./services/FocalboardService');
const LineMessageProcessor = require('./services/LineMessageProcessor');
const LineWebhookController = require('./controllers/LineWebhookController');

/**
 * 主應用程式類 - 遵循依賴反轉原則 (Dependency Inversion Principle)
 * 負責整合所有服務和控制器，啟動應用程式
 */
class App {
  /**
   * 建構函數
   */
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    // 服務實例
    this.focalboardService = null;
    this.messageProcessor = null;
    this.webhookController = null;
    
    console.log('應用程式初始化開始...');
  }

  /**
   * 初始化應用程式
   */
  async initialize() {
    try {
      // 設定中間件
      this.setupMiddleware();
      
      // 初始化服務
      await this.initializeServices();
      
      // 設定路由
      this.setupRoutes();
      
      // 設定錯誤處理
      this.setupErrorHandling();
      
      console.log('應用程式初始化完成');
    } catch (error) {
      console.error('應用程式初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 設定中間件
   */
  setupMiddleware() {
    // 安全性中間件
    this.app.use(helmet());
    
    // CORS 設定
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // 日誌中間件
    this.app.use(morgan('combined'));
    
    // JSON 解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    console.log('中間件設定完成');
  }

  /**
   * 初始化服務
   */
  async initializeServices() {
    try {
      // 驗證環境變數
      this.validateEnvironmentVariables();
      
      // 初始化 Focalboard 服務
      this.focalboardService = new FocalboardService(
        process.env.FOCALBOARD_API_URL,
        process.env.FOCALBOARD_TOKEN,
        process.env.FOCALBOARD_TEAM_ID
      );
      
      console.log('正在初始化 Focalboard 服務...');
      await this.focalboardService.initialize();
      console.log('Focalboard 服務初始化完成');
      
      // 初始化 LINE 訊息處理器
      this.messageProcessor = new LineMessageProcessor(this.focalboardService);
      console.log('LINE 訊息處理器初始化完成');
      
      // 初始化 LINE Webhook 控制器
      const lineConfig = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET
      };
      
      this.webhookController = new LineWebhookController(lineConfig, this.messageProcessor);
      console.log('LINE Webhook 控制器初始化完成');
      
    } catch (error) {
      console.error('服務初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 驗證環境變數
   */
  validateEnvironmentVariables() {
    const requiredVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'FOCALBOARD_API_URL',
      'FOCALBOARD_TEAM_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`缺少必要的環境變數: ${missingVars.join(', ')}`);
    }

    console.log('環境變數驗證通過');
  }

  /**
   * 設定路由
   */
  setupRoutes() {
    // 健康檢查端點
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          focalboard: this.focalboardService ? 'initialized' : 'not_initialized',
          messageProcessor: this.messageProcessor ? 'initialized' : 'not_initialized',
          webhookController: this.webhookController ? 'initialized' : 'not_initialized'
        }
      });
    });

    // ✅ 恢復正式的 LINE Webhook 端點（有簽名驗證）
    this.app.post('/Webhook', 
      this.webhookController.getMiddleware(),
      (req, res) => this.webhookController.handleWebhook(req, res)
    );

    // 🔧 保留測試端點（無簽名驗證）
    this.app.post('/webhook/test', express.json(), async (req, res) => {
      try {
        console.log('📨 測試端點收到 webhook（無簽名驗證）');
        await this.webhookController.handleWebhook(req, res);
      } catch (error) {
        console.error('測試端點錯誤:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // LINE Webhook 端點 - 自訂路徑（保留向後兼容）
    this.app.post('/webhook/line', 
      this.webhookController.getMiddleware(),
      (req, res) => this.webhookController.handleWebhook(req, res)
    );

    // API 端點
    this.setupApiRoutes();

    // 根路徑
    this.app.get('/', (req, res) => {
      res.json({
        message: 'LINE 任務管理機器人 API',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          webhook_secure: '/Webhook (正式用，有簽名驗證)',
          webhook_test: '/webhook/test (測試用，無簽名驗證)',
          webhook_custom: '/webhook/line (備用，有簽名驗證)',
          health: '/health',
          api: '/api/*'
        }
      });
    });

    console.log('路由設定完成');
  }

  /**
   * 設定 API 路由
   */
  setupApiRoutes() {
    const apiRouter = express.Router();

    // 任務相關 API
    apiRouter.get('/tasks', async (req, res) => {
      try {
        const filters = req.query;
        const tasks = await this.focalboardService.getTasks(filters);
        res.json({ success: true, data: tasks });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    apiRouter.post('/tasks', async (req, res) => {
      try {
        const taskData = req.body;
        const task = await this.focalboardService.createTask(taskData);
        res.status(201).json({ success: true, data: task });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    apiRouter.get('/tasks/:id', async (req, res) => {
      try {
        const task = await this.focalboardService.getTask(req.params.id);
        res.json({ success: true, data: task });
      } catch (error) {
        res.status(404).json({ success: false, error: error.message });
      }
    });

    apiRouter.put('/tasks/:id', async (req, res) => {
      try {
        const updateData = req.body;
        const task = await this.focalboardService.updateTask(req.params.id, updateData);
        res.json({ success: true, data: task });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    apiRouter.delete('/tasks/:id', async (req, res) => {
      try {
        const result = await this.focalboardService.deleteTask(req.params.id);
        res.json({ success: true, data: { deleted: result } });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    // 搜尋 API
    apiRouter.get('/search', async (req, res) => {
      try {
        const { q: query, ...options } = req.query;
        const results = await this.focalboardService.searchTasks(query, options);
        res.json({ success: true, data: results });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    // 系統狀態 API
    apiRouter.get('/status', async (req, res) => {
      try {
        const tasks = await this.focalboardService.getTasks();
        const statusCounts = tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});

        res.json({
          success: true,
          data: {
            totalTasks: tasks.length,
            statusCounts,
            lastUpdated: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 測試 Focalboard 連接
    apiRouter.get('/test/focalboard', async (req, res) => {
      try {
        const isConnected = await this.focalboardService.testConnection();
        res.json({ 
          success: true, 
          data: { connected: isConnected } 
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 處理訊息測試 API
    apiRouter.post('/test/message', async (req, res) => {
      try {
        const { message, userId = 'test-user' } = req.body;
        const result = await this.messageProcessor.processTextMessage(message, userId);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    this.app.use('/api', apiRouter);
    console.log('API 路由設定完成');
  }

  /**
   * 設定錯誤處理
   */
  setupErrorHandling() {
    // 404 處理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `路由 ${req.originalUrl} 不存在`,
        timestamp: new Date().toISOString()
      });
    });

    // 全域錯誤處理
    this.app.use((error, req, res, next) => {
      console.error('未處理的錯誤:', error);

      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';

      res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        timestamp: new Date().toISOString()
      });
    });

    console.log('錯誤處理設定完成');
  }

  /**
   * 啟動應用程式
   */
  async start() {
    try {
      await this.initialize();
      
      const server = this.app.listen(this.port, () => {
        console.log(`\n🚀 LINE 任務管理機器人已啟動`);
        console.log(`📡 服務器運行在: http://localhost:${this.port}`);
        console.log(`🔗 Webhook URL: http://localhost:${this.port}/webhook/line`);
        console.log(`💊 健康檢查: http://localhost:${this.port}/health`);
        console.log(`📚 API 文檔: http://localhost:${this.port}/api/*`);
        console.log(`\n⏰ 啟動時間: ${new Date().toLocaleString('zh-TW')}`);
        console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}\n`);
      });

      // 優雅關閉
      this.setupGracefulShutdown(server);

      return server;
    } catch (error) {
      console.error('應用程式啟動失敗:', error);
      process.exit(1);
    }
  }

  /**
   * 設定優雅關閉
   * @param {Object} server - HTTP 服務器實例
   */
  setupGracefulShutdown(server) {
    const gracefulShutdown = (signal) => {
      console.log(`\n收到 ${signal} 信號，正在優雅關閉...`);
      
      server.close(() => {
        console.log('HTTP 服務器已關閉');
        
        // 這裡可以添加其他清理工作
        // 例如：關閉數據庫連接、清理緩存等
        
        console.log('應用程式已安全關閉');
        process.exit(0);
      });

      // 強制關閉超時
      setTimeout(() => {
        console.error('強制關閉應用程式');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * 取得應用程式實例
   * @returns {Express} Express 應用程式實例
   */
  getApp() {
    return this.app;
  }
}

module.exports = App; 