const IMessageProcessor = require('../interfaces/IMessageProcessor');

/**
 * LINE 訊息處理器 - 遵循單一職責原則 (Single Responsibility Principle)
 * 負責解析 LINE 訊息並轉換為任務操作命令
 */
class LineMessageProcessor extends IMessageProcessor {
  /**
   * 建構函數
   * @param {ITaskService} taskService - 任務服務實例
   */
  constructor(taskService) {
    super();
    this.taskService = taskService;
    
    // 定義支援的命令
    this.supportedCommands = {
      'add': 'createTask',
      'create': 'createTask',
      'new': 'createTask',
      'list': 'listTasks',
      'ls': 'listTasks',
      'show': 'listTasks',
      'search': 'searchTasks',
      'find': 'searchTasks',
      'update': 'updateTask',
      'edit': 'updateTask',
      'modify': 'updateTask',
      'delete': 'deleteTask',
      'remove': 'deleteTask',
      'del': 'deleteTask',
      'complete': 'completeTask',
      'done': 'completeTask',
      'finish': 'completeTask',
      'help': 'showHelp',
      'status': 'showStatus'
    };

    // 定義優先級映射
    this.priorityMap = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'urgent': '緊急'
    };

    // 定義狀態映射
    this.statusMap = {
      'todo': '待辦',
      'in-progress': '進行中',
      'done': '已完成',
      'blocked': '阻塞'
    };
  }

  /**
   * 處理文字訊息
   * @param {string} message - 訊息內容
   * @param {string} userId - 用戶ID
   * @returns {Promise<Object>} 處理結果
   */
  async processTextMessage(message, userId) {
    try {
      console.log(`處理用戶 ${userId} 的訊息: ${message}`);

      // 解析命令
      const command = this.parseCommand(message);
      console.log('解析後的命令:', command);

      // 驗證命令
      const validation = this.validateCommand(command);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
          data: null
        };
      }

      // 執行命令
      const result = await this.executeCommand(command, userId);
      
      return {
        success: true,
        message: this.generateReplyMessage(result, command),
        data: result
      };

    } catch (error) {
      console.error('處理訊息時發生錯誤:', error);
      return {
        success: false,
        message: `處理訊息時發生錯誤: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * 解析命令
   * @param {string} message - 訊息內容
   * @returns {Object} 解析後的命令物件
   */
  parseCommand(message) {
    // 移除前後空白並轉為小寫
    const cleanMessage = message.trim();
    
    // 檢查是否以斜線開頭（命令格式）
    if (!cleanMessage.startsWith('/')) {
      return {
        type: 'unknown',
        originalMessage: message,
        isValid: false
      };
    }

    // 移除斜線並分割參數
    const parts = cleanMessage.slice(1).split(/\s+/);
    const commandType = parts[0].toLowerCase();
    const args = parts.slice(1);

    // 基本命令結構
    const command = {
      type: commandType,
      originalMessage: message,
      args: args,
      isValid: true
    };

    // 根據命令類型解析特定參數
    switch (commandType) {
      case 'add':
      case 'create':
      case 'new':
        return this.parseCreateCommand(args, command);
      
      case 'list':
      case 'ls':
      case 'show':
        return this.parseListCommand(args, command);
      
      case 'search':
      case 'find':
        return this.parseSearchCommand(args, command);
      
      default:
        return command;
    }
  }

  /**
   * 解析創建任務命令
   * @param {Array} args - 參數陣列
   * @param {Object} command - 基本命令物件
   * @returns {Object} 解析後的命令
   */
  parseCreateCommand(args, command) {
    if (args.length === 0) {
      command.isValid = false;
      command.error = '請提供任務標題';
      return command;
    }

    // 解析任務資訊
    const fullText = args.join(' ');
    const taskData = {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      assignee: '',
      dueDate: null
    };

    // 使用正則表達式解析不同部分
    let remainingText = fullText;

    // 解析標籤 (#tag1 #tag2)
    const tagMatches = remainingText.match(/#\w+/g);
    if (tagMatches) {
      taskData.tags = tagMatches.map(tag => tag.slice(1)); // 移除 #
      remainingText = remainingText.replace(/#\w+/g, '').trim();
    }

    // 解析優先級 (@high, @low, @urgent)
    const priorityMatch = remainingText.match(/@(low|medium|high|urgent)/i);
    if (priorityMatch) {
      taskData.priority = priorityMatch[1].toLowerCase();
      remainingText = remainingText.replace(/@(low|medium|high|urgent)/i, '').trim();
    }

    // 解析指派人員 (:user)
    const assigneeMatch = remainingText.match(/:(\w+)/);
    if (assigneeMatch) {
      taskData.assignee = assigneeMatch[1];
      remainingText = remainingText.replace(/:(\w+)/, '').trim();
    }

    // 解析截止日期 (due:2024-12-31)
    const dueDateMatch = remainingText.match(/due:(\d{4}-\d{2}-\d{2})/);
    if (dueDateMatch) {
      taskData.dueDate = new Date(dueDateMatch[1]);
      remainingText = remainingText.replace(/due:\d{4}-\d{2}-\d{2}/, '').trim();
    }

    // 剩餘的文字作為標題和描述
    const titleAndDesc = remainingText.split('|');
    taskData.title = titleAndDesc[0].trim();
    if (titleAndDesc.length > 1) {
      taskData.description = titleAndDesc[1].trim();
    }

    command.taskData = taskData;
    return command;
  }

  /**
   * 解析列表命令
   * @param {Array} args - 參數陣列
   * @param {Object} command - 基本命令物件
   * @returns {Object} 解析後的命令
   */
  parseListCommand(args, command) {
    command.filters = {};

    // 解析篩選條件
    args.forEach(arg => {
      if (arg.startsWith('status:')) {
        command.filters.status = arg.split(':')[1];
      } else if (arg.startsWith('priority:')) {
        command.filters.priority = arg.split(':')[1];
      } else if (arg.startsWith('assignee:')) {
        command.filters.assignee = arg.split(':')[1];
      }
    });

    return command;
  }

  /**
   * 解析搜尋命令
   * @param {Array} args - 參數陣列
   * @param {Object} command - 基本命令物件
   * @returns {Object} 解析後的命令
   */
  parseSearchCommand(args, command) {
    if (args.length === 0) {
      command.isValid = false;
      command.error = '請提供搜尋關鍵字';
      return command;
    }

    command.query = args.join(' ');
    return command;
  }

  /**
   * 驗證命令格式
   * @param {Object} command - 命令物件
   * @returns {Object} 驗證結果
   */
  validateCommand(command) {
    if (!command.isValid) {
      return {
        isValid: false,
        message: command.error || '無效的命令格式'
      };
    }

    if (!this.supportedCommands[command.type]) {
      return {
        isValid: false,
        message: `不支援的命令: ${command.type}。輸入 /help 查看可用命令。`
      };
    }

    return {
      isValid: true,
      message: '命令格式正確'
    };
  }

  /**
   * 生成回覆訊息
   * @param {Object} result - 處理結果
   * @param {Object} command - 原始命令
   * @returns {string} 回覆訊息
   */
  generateReplyMessage(result, command) {
    const methodName = this.supportedCommands[command.type];
    
    switch (methodName) {
      case 'createTask':
        return this.formatCreateTaskMessage(result);
      
      case 'listTasks':
        return this.formatTaskListMessage(result);
      
      case 'searchTasks':
        return this.formatSearchResultMessage(result, command.query);
      
      case 'showHelp':
        return this.getHelpMessage();
      
      default:
        return '命令執行完成';
    }
  }

  /**
   * 格式化創建任務訊息
   * @param {Object} task - 任務物件
   * @returns {string} 格式化的訊息
   */
  formatCreateTaskMessage(task) {
    let message = `✅ 任務創建成功\n`;
    message += `ID: ${task.id}\n`;
    message += `標題: ${task.title}\n`;
    message += `狀態: ${this.statusMap[task.status]}\n`;
    message += `優先級: ${this.priorityMap[task.priority]}`;
    
    if (task.tags.length > 0) {
      message += `\n標籤: ${task.tags.map(tag => `#${tag}`).join(' ')}`;
    }
    
    if (task.assignee) {
      message += `\n負責人: ${task.assignee}`;
    }
    
    if (task.dueDate) {
      message += `\n截止日期: ${new Date(task.dueDate).toLocaleDateString('zh-TW')}`;
    }
    
    return message;
  }

  /**
   * 格式化任務列表訊息
   * @param {Array} tasks - 任務陣列
   * @returns {string} 格式化的訊息
   */
  formatTaskListMessage(tasks) {
    if (tasks.length === 0) {
      return '📝 目前沒有任務';
    }

    let message = `📝 任務列表 (共 ${tasks.length} 個):\n\n`;
    
    tasks.slice(0, 10).forEach((task, index) => {
      const statusIcon = this.getStatusIcon(task.status);
      const priorityIcon = this.getPriorityIcon(task.priority);
      
      message += `${statusIcon} ${task.title}\n`;
      message += `   ID: ${task.id.substring(0, 8)}...\n`;
      message += `   ${priorityIcon} ${this.priorityMap[task.priority]}`;
      
      if (task.tags.length > 0) {
        message += ` | ${task.tags.map(tag => `#${tag}`).join(' ')}`;
      }
      
      message += '\n\n';
    });

    if (tasks.length > 10) {
      message += `... 還有 ${tasks.length - 10} 個任務`;
    }

    return message;
  }

  /**
   * 格式化搜尋結果訊息
   * @param {Array} tasks - 搜尋結果
   * @param {string} query - 搜尋關鍵字
   * @returns {string} 格式化的訊息
   */
  formatSearchResultMessage(tasks, query) {
    if (tasks.length === 0) {
      return `🔍 搜尋 "${query}" 沒有找到相關任務`;
    }

    let message = `🔍 搜尋 "${query}" 找到 ${tasks.length} 個任務:\n\n`;
    return message + this.formatTaskListMessage(tasks).replace('📝 任務列表 (共 ' + tasks.length + ' 個):\n\n', '');
  }

  /**
   * 取得狀態圖示
   * @param {string} status - 狀態
   * @returns {string} 狀態圖示
   */
  getStatusIcon(status) {
    const iconMap = {
      'todo': '⏳',
      'in-progress': '🔄',
      'done': '✅',
      'blocked': '🚫'
    };
    return iconMap[status] || '❓';
  }

  /**
   * 取得優先級圖示
   * @param {string} priority - 優先級
   * @returns {string} 優先級圖示
   */
  getPriorityIcon(priority) {
    const iconMap = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'urgent': '🔴'
    };
    return iconMap[priority] || '⚪';
  }

  /**
   * 取得幫助訊息
   * @returns {string} 幫助訊息
   */
  getHelpMessage() {
    return `🤖 LINE 任務管理機器人 - 指令說明

📝 創建任務:
/add 任務標題 #標籤 @優先級 :負責人
範例: /add 修正登入 bug #mobile @high :john

📋 查看任務:
/list - 顯示所有任務
/list status:todo - 顯示待辦任務

🔍 搜尋任務:
/search 關鍵字
範例: /search 登入

💡 其他:
/help - 顯示此幫助訊息`;
  }

  /**
   * 執行命令 - 基本實現
   * @param {Object} command - 命令物件
   * @param {string} userId - 用戶 ID
   * @returns {Promise<Object>} 執行結果
   */
  async executeCommand(command, userId) {
    const methodName = this.supportedCommands[command.type];
    
    switch (methodName) {
      case 'createTask':
        return await this.taskService.createTask(command.taskData);
      
      case 'listTasks':
        return await this.taskService.getTasks(command.filters);
      
      case 'searchTasks':
        return await this.taskService.searchTasks(command.query);
      
      case 'showHelp':
        return this.getHelpMessage();
      
      default:
        throw new Error(`未實現的命令: ${methodName}`);
    }
  }
}

module.exports = LineMessageProcessor; 