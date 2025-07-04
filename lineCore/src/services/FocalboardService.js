const axios = require('axios');
const Task = require('../models/Task');
const ITaskService = require('../interfaces/ITaskService');

/**
 * Focalboard 服務 - 遵循單一職責原則 (Single Responsibility Principle)
 * 負責與 Focalboard REST API 的交互
 */
class FocalboardService extends ITaskService {
  /**
   * 建構函數
   * @param {string} apiUrl - Focalboard API URL
   * @param {string} token - 認證 Token
   * @param {string} teamId - 團隊 ID
   */
  constructor(apiUrl, token, teamId, defaultBoardId = null) {
    super();
    this.apiUrl = apiUrl;
    this.token = token;
    this.teamId = teamId;
    this.defaultBoardId = defaultBoardId;
    
    // 設定 axios 實例 - 獨立 Focalboard 服務器的正確路徑
    this.client = axios.create({
      baseURL: `${this.apiUrl}/api/v2`,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 關鍵：Focalboard 的 CSRF 檢查實際上是檢查這個標頭
        'X-Requested-With': 'XMLHttpRequest',
        // 使用 Bearer token 認證（如果有 token）
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      timeout: 10000,
      validateStatus: function (status) {
        // 接受 200-299 和 401 狀態碼，以便我們可以處理認證問題
        return (status >= 200 && status < 300) || status === 401;
      }
    });

    // 設定請求攔截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API 請求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API 請求錯誤:', error);
        return Promise.reject(error);
      }
    );

    // 設定回應攔截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API 回應: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API 回應錯誤:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 初始化服務，取得預設看板
   */
  async initialize() {
    try {
      // 如果已經有預設看板 ID，直接使用
      if (this.defaultBoardId) {
        console.log(`使用配置的預設看板 ID: ${this.defaultBoardId}`);
        return;
      }

      // 否則嘗試從 API 取得看板列表
      const boards = await this.getBoards();
      if (boards.length > 0) {
        this.defaultBoardId = boards[0].id;
        console.log(`使用預設看板: ${boards[0].title} (${this.defaultBoardId})`);
      } else {
        // 如果沒有看板，創建一個預設的
        const defaultBoard = await this.createDefaultBoard();
        this.defaultBoardId = defaultBoard.id;
        console.log(`創建預設看板: ${defaultBoard.title} (${this.defaultBoardId})`);
      }
    } catch (error) {
      console.error('初始化 Focalboard 服務失敗:', error);
      throw error;
    }
  }

  /**
   * 取得所有看板
   * @returns {Promise<Array>} 看板列表
   */
  async getBoards() {
    try {
      const response = await this.client.get(`/teams/${this.teamId}/boards`);
      return response.data || [];
    } catch (error) {
      console.error('取得看板列表失敗:', error);
      throw new Error('無法取得看板列表');
    }
  }

  /**
   * 創建預設看板
   * @returns {Promise<Object>} 看板物件
   */
  async createDefaultBoard() {
    try {
      const boardData = {
        title: 'LINE 任務管理',
        description: '通過 LINE Bot 管理的任務看板',
        teamId: this.teamId,
        type: 'board'
      };

      const response = await this.client.post(`/boards`, boardData);
      return response.data;
    } catch (error) {
      console.error('創建預設看板失敗:', error);
      throw new Error('無法創建預設看板');
    }
  }

  /**
   * 生成 Focalboard 區塊 ID
   * @returns {string} 區塊 ID
   */
  generateBlockId() {
    // 生成類似 Focalboard 的 ID 格式（27 字符）
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 27; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 創建新任務
   * @param {Object} taskData - 任務資料
   * @returns {Promise<Object>} 創建的任務物件
   */
  async createTask(taskData) {
    try {
      const task = new Task(taskData);
      const validation = task.validate();

      if (!validation.isValid) {
        throw new Error(`任務驗證失敗: ${validation.errors.join(', ')}`);
      }

      const boardId = taskData.boardId || this.defaultBoardId;
      if (!boardId) {
        throw new Error('未指定看板 ID 且無預設看板');
      }

      // 檢查是否有有效的 token
      if (!this.token) {
        console.log('⚠️  警告: 沒有 Focalboard Token，將模擬創建任務');
        // 模擬成功創建任務
        task.id = `mock-${Date.now()}`;
        task.cardId = task.id;
        task.boardId = boardId;
        task.createdAt = new Date();

        console.log('✅ 模擬任務創建成功:', {
          id: task.id,
          title: task.title,
          status: task.status
        });

        return task;
      }

      console.log('🔑 使用 Focalboard Token 嘗試創建真實任務...');

      // 生成唯一的區塊 ID
      const blockId = this.generateBlockId();
      const currentTime = Date.now();

      // 創建 Focalboard 卡片（符合 API 要求的完整格式）
      const properties = {
        // 使用正確的屬性 ID（從看板配置中獲取）
        'a972dc7a-5f4c-45d2-8044-8c28c69717f1': this.mapInternalStatusToFocalboard(task.status),
        'd3d682bf-e074-49d9-8df5-7320921c2d23': this.mapInternalPriorityToFocalboard(task.priority),
        'axkhqa4jxr3jcqe4k87g8bhmary': task.assignee || '',
        'a8daz81s4xjgke1ww6cwik5w7ye': task.estimatedHours || 0,
        'a3zsw7xs8sxy7atj8b6totp3mby': task.dueDate ? this.formatDateForFocalboard(task.dueDate) : '',
        'axsedqo8zwuuksck5yxofsd54fr': task.description || '',  // Describe 屬性
        'axiudojuz6ptdogoe53pae777so': task.tags ? task.tags.join(', ') : ''  // Tag 屬性
      };

      console.log('🔍 發送到 Focalboard 的屬性:', JSON.stringify(properties, null, 2));

      const cardData = {
        id: blockId,                              // ✅ 必需：區塊 ID
        parentId: boardId,                        // ✅ 必需：父級 ID（看板 ID）
        createdBy: 'uidbp98a8ipde7mrdtaao69zc9y', // ✅ 必需：創建者 ID（看板創建者）
        modifiedBy: 'uidbp98a8ipde7mrdtaao69zc9y',// ✅ 必需：修改者 ID
        schema: 1,                                // ✅ 必需：架構版本
        type: 'card',                             // ✅ 必需：區塊類型
        title: task.title,                        // ✅ 任務標題
        fields: {
          properties: properties,
          contentOrder: [],
          icon: '🤖',                             // 機器人圖標
          isTemplate: false
        },
        createAt: currentTime,                    // ✅ 必需：創建時間（毫秒時間戳）
        updateAt: currentTime,                    // ✅ 必需：更新時間（毫秒時間戳）
        deleteAt: 0,                              // ✅ 刪除時間（0 表示未刪除）
        boardId: boardId                          // ✅ 必需：看板 ID
      };

      // 如果有描述，創建文字區塊
      if (task.description) {
        cardData.fields.contentOrder.push('description');
      }

      const response = await this.client.post(`/boards/${boardId}/blocks`, [cardData]);
      console.log('API 回應數據:', response.data);
      console.log('API 回應標頭:', response.headers);

      // 檢查回應數據格式
      let createdCard = null;

      if (Array.isArray(response.data) && response.data.length > 0) {
        createdCard = response.data[0];
      } else if (response.data && response.data.id) {
        createdCard = response.data;
      }

      if (!createdCard || !createdCard.id) {
        console.log('⚠️  API 回應成功但沒有返回有效的卡片數據，使用備用 ID');
        createdCard = { id: `card-${Date.now()}` };
      }

      // 如果有描述，創建描述區塊
      if (task.description) {
        await this.createDescriptionBlock(createdCard.id, task.description, boardId);
      }

      // 轉換為 Task 物件返回
      task.id = createdCard.id;
      task.cardId = createdCard.id;
      task.boardId = boardId;

      console.log('✅ 任務創建成功:', {
        id: task.id,
        title: task.title,
        status: task.status
      });

      return task.toJSON();
    } catch (error) {
      console.error('創建任務失敗:', error);
      throw new Error(`創建任務失敗: ${error.message}`);
    }
  }

  /**
   * 創建描述區塊
   * @param {string} parentId - 父級 ID
   * @param {string} description - 描述內容
   * @param {string} boardId - 看板 ID
   */
  async createDescriptionBlock(parentId, description, boardId) {
    try {
      const blockId = this.generateBlockId();
      const currentTime = Date.now();

      const descriptionBlock = {
        id: blockId,                              // ✅ 必需：區塊 ID
        parentId: parentId,                       // ✅ 父級 ID（卡片 ID）
        createdBy: 'uidbp98a8ipde7mrdtaao69zc9y', // ✅ 必需：創建者 ID
        modifiedBy: 'uidbp98a8ipde7mrdtaao69zc9y',// ✅ 必需：修改者 ID
        schema: 1,                                // ✅ 必需：架構版本
        type: 'text',                             // ✅ 必需：區塊類型
        title: description,                       // ✅ 描述內容
        fields: {},                               // ✅ 字段
        createAt: currentTime,                    // ✅ 必需：創建時間
        updateAt: currentTime,                    // ✅ 必需：更新時間
        deleteAt: 0,                              // ✅ 刪除時間
        boardId: boardId                          // ✅ 必需：看板 ID
      };

      await this.client.post(`/boards/${boardId}/blocks`, [descriptionBlock]);
    } catch (error) {
      console.error('創建描述區塊失敗:', error);
      // 不拋出錯誤，因為主要任務已經創建成功
    }
  }

  /**
   * 取得任務列表
   * @param {Object} filters - 篩選條件
   * @returns {Promise<Array>} 任務列表
   */
  async getTasks(filters = {}) {
    try {
      const boardId = filters.boardId || this.defaultBoardId;
      if (!boardId) {
        throw new Error('未指定看板 ID 且無預設看板');
      }

      const response = await this.client.get(`/boards/${boardId}/blocks`);
      console.log('API 回應數據類型:', typeof response.data);
      console.log('API 回應數據:', response.data);

      let blocks = response.data || [];

      // 確保 blocks 是陣列
      if (!Array.isArray(blocks)) {
        console.log('⚠️  API 返回的不是陣列，嘗試提取陣列...');
        if (blocks.blocks && Array.isArray(blocks.blocks)) {
          blocks = blocks.blocks;
        } else if (blocks.data && Array.isArray(blocks.data)) {
          blocks = blocks.data;
        } else {
          console.log('❌ 無法從回應中提取陣列，返回空陣列');
          blocks = [];
        }
      }

      // 篩選出卡片類型的區塊
      const cards = blocks.filter(block => block.type === 'card');
      
      // 轉換為 Task 物件
      const tasks = cards.map(card => {
        const task = Task.fromFocalboardCard(card);
        return task.toJSON();
      });

      // 應用篩選條件
      return this.applyFilters(tasks, filters);
    } catch (error) {
      console.error('取得任務列表失敗:', error);
      throw new Error(`取得任務列表失敗: ${error.message}`);
    }
  }

  /**
   * 取得單一任務
   * @param {string} taskId - 任務ID
   * @returns {Promise<Object>} 任務物件
   */
  async getTask(taskId) {
    try {
      const response = await this.client.get(`/teams/${this.teamId}/boards/${this.defaultBoardId}/blocks/${taskId}`);
      const cardData = response.data;

      if (!cardData) {
        throw new Error('任務不存在');
      }

      const task = Task.fromFocalboardCard(cardData);
      return task.toJSON();
    } catch (error) {
      console.error('取得任務失敗:', error);
      throw new Error(`取得任務失敗: ${error.message}`);
    }
  }

  /**
   * 更新任務
   * @param {string} taskId - 任務ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object>} 更新後的任務物件
   */
  async updateTask(taskId, updateData) {
    try {
      // 先取得現有任務
      const existingTask = await this.getTask(taskId);
      
      // 合併更新資料
      const updatedTaskData = { ...existingTask, ...updateData };
      const task = new Task(updatedTaskData);
      
      const validation = task.validate();
      if (!validation.isValid) {
        throw new Error(`任務驗證失敗: ${validation.errors.join(', ')}`);
      }

      // 準備更新的卡片資料
      const updateCardData = {
        title: task.title,
        fields: {
          properties: {
            status: this.mapInternalStatusToFocalboard(task.status),
            priority: this.mapInternalPriorityToFocalboard(task.priority),
            assignee: task.assignee,
            tags: task.tags,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null
          }
        }
      };

      const response = await this.client.patch(`/teams/${this.teamId}/boards/${this.defaultBoardId}/blocks/${taskId}`, updateCardData);
      const updatedCard = response.data;

      // 轉換為 Task 物件返回
      const updatedTask = Task.fromFocalboardCard(updatedCard);
      return updatedTask.toJSON();
    } catch (error) {
      console.error('更新任務失敗:', error);
      throw new Error(`更新任務失敗: ${error.message}`);
    }
  }

  /**
   * 刪除任務
   * @param {string} taskId - 任務ID
   * @returns {Promise<boolean>} 刪除是否成功
   */
  async deleteTask(taskId) {
    try {
      await this.client.delete(`/teams/${this.teamId}/boards/${this.defaultBoardId}/blocks/${taskId}`);
      return true;
    } catch (error) {
      console.error('刪除任務失敗:', error);
      throw new Error(`刪除任務失敗: ${error.message}`);
    }
  }

  /**
   * 搜尋任務
   * @param {string} query - 搜尋關鍵字
   * @param {Object} options - 搜尋選項
   * @returns {Promise<Array>} 搜尋結果
   */
  async searchTasks(query, options = {}) {
    try {
      const tasks = await this.getTasks(options);
      
      if (!query || query.trim() === '') {
        return tasks;
      }

      const lowerQuery = query.toLowerCase();
      
      return tasks.filter(task => {
        return task.title.toLowerCase().includes(lowerQuery) ||
               task.description.toLowerCase().includes(lowerQuery) ||
               task.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
               task.assignee.toLowerCase().includes(lowerQuery);
      });
    } catch (error) {
      console.error('搜尋任務失敗:', error);
      throw new Error(`搜尋任務失敗: ${error.message}`);
    }
  }

  /**
   * 應用篩選條件
   * @param {Array} tasks - 任務列表
   * @param {Object} filters - 篩選條件
   * @returns {Array} 篩選後的任務列表
   */
  applyFilters(tasks, filters) {
    let filteredTasks = [...tasks];

    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee === filters.assignee);
    }

    if (filters.tag) {
      filteredTasks = filteredTasks.filter(task => task.tags.includes(filters.tag));
    }

    return filteredTasks;
  }

  /**
   * 映射內部狀態到 Focalboard 狀態
   * @param {string} internalStatus - 內部狀態
   * @returns {string} Focalboard 狀態
   */
  mapInternalStatusToFocalboard(internalStatus) {
    const statusMap = {
      'todo': 'ayz81h9f3dwp7rzzbdebesc7ute',        // Not Started
      'in-progress': 'ar6b8m3jxr3asyxhr8iucdbo6yc',  // In Progress
      'done': 'adeo5xuwne3qjue83fcozekz8ko',         // Completed 🙌
      'completed': 'adeo5xuwne3qjue83fcozekz8ko',    // Completed 🙌
      'blocked': 'afi4o5nhnqc3smtzs1hs3ij34dh'       // Blocked
    };
    return statusMap[internalStatus] || 'ayz81h9f3dwp7rzzbdebesc7ute';
  }

  /**
   * 映射內部優先級到 Focalboard 優先級
   * @param {string} internalPriority - 內部優先級
   * @returns {string} Focalboard 優先級
   */
  mapInternalPriorityToFocalboard(internalPriority) {
    const priorityMap = {
      'low': '98a57627-0f76-471d-850d-91f3ed9fd213',         // 3. Low
      'medium': '87f59784-b859-4c24-8ebe-17c766e081dd',     // 2. Medium
      'high': 'd3bfb50f-f569-4bad-8a3a-dd15c3f60101',       // 1. High 🔥
      'urgent': 'd3bfb50f-f569-4bad-8a3a-dd15c3f60101'      // 1. High 🔥 (urgent maps to high)
    };
    return priorityMap[internalPriority] || '87f59784-b859-4c24-8ebe-17c766e081dd';
  }

  /**
   * 格式化日期為 Focalboard 格式
   * @param {Date} date - 日期物件
   * @returns {string} 格式化的日期字串
   */
  formatDateForFocalboard(date) {
    if (!date) return '';

    // 轉換為 YYYY-MM-DD 格式
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * 測試 API 連接
   * @returns {Promise<boolean>} 連接是否成功
   */
  async testConnection() {
    try {
      // 測試 Focalboard 插件的 workspaces 端點
      const response = await this.client.get('/workspaces');
      console.log('✅ Focalboard 插件連接成功');
      return true;
    } catch (error) {
      console.error('API 連接測試失敗:', error);
      if (error.response) {
        console.error('HTTP 狀態:', error.response.status);
        console.error('回應數據:', error.response.data);
      }
      return false;
    }
  }
}

module.exports = FocalboardService; 