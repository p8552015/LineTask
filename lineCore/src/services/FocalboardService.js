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
  constructor(apiUrl, token, teamId) {
    super();
    this.apiUrl = apiUrl;
    this.token = token;
    this.teamId = teamId;
    this.defaultBoardId = null;
    
    // 設定 axios 實例
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      timeout: 10000
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

      // 創建 Focalboard 卡片
      const cardData = {
        title: task.title,
        type: 'card',
        boardId: boardId,
        parentId: boardId,
        schema: 1,
        fields: {
          properties: {
            status: this.mapInternalStatusToFocalboard(task.status),
            priority: this.mapInternalPriorityToFocalboard(task.priority),
            assignee: task.assignee,
            tags: task.tags,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null
          },
          contentOrder: []
        }
      };

      // 如果有描述，創建文字區塊
      if (task.description) {
        cardData.fields.contentOrder.push('description');
      }

      const response = await this.client.post(`/blocks`, cardData);
      const createdCard = response.data;

      // 如果有描述，創建描述區塊
      if (task.description) {
        await this.createDescriptionBlock(createdCard.id, task.description, boardId);
      }

      // 轉換為 Task 物件返回
      task.id = createdCard.id;
      task.cardId = createdCard.id;
      task.boardId = boardId;
      
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
      const descriptionBlock = {
        type: 'text',
        parentId: parentId,
        boardId: boardId,
        title: description,
        schema: 1,
        fields: {}
      };

      await this.client.post(`/blocks`, descriptionBlock);
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
      const blocks = response.data || [];

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
      const response = await this.client.get(`/blocks/${taskId}`);
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

      const response = await this.client.patch(`/blocks/${taskId}`, updateCardData);
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
      await this.client.delete(`/blocks/${taskId}`);
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
      'todo': 'open',
      'in-progress': 'in progress',
      'done': 'completed',
      'blocked': 'blocked'
    };
    return statusMap[internalStatus] || 'open';
  }

  /**
   * 映射內部優先級到 Focalboard 優先級
   * @param {string} internalPriority - 內部優先級
   * @returns {string} Focalboard 優先級
   */
  mapInternalPriorityToFocalboard(internalPriority) {
    const priorityMap = {
      'low': '1',
      'medium': '2',
      'high': '3',
      'urgent': '4'
    };
    return priorityMap[internalPriority] || '2';
  }

  /**
   * 測試 API 連接
   * @returns {Promise<boolean>} 連接是否成功
   */
  async testConnection() {
    try {
      await this.client.get('/teams');
      return true;
    } catch (error) {
      console.error('API 連接測試失敗:', error);
      return false;
    }
  }
}

module.exports = FocalboardService; 