/**
 * 任務模型 - 遵循單一職責原則 (Single Responsibility Principle)
 * 負責任務數據的結構定義和基本驗證
 */
class Task {
  /**
   * 建構函數
   * @param {Object} data - 任務數據
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.status = data.status || 'todo';
    this.priority = data.priority || 'medium';
    this.tags = data.tags || [];
    this.assignee = data.assignee || '';
    this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.boardId = data.boardId || '';
    this.cardId = data.cardId || '';
  }

  /**
   * 驗證任務數據
   * @returns {Object} 驗證結果
   */
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('任務標題不能為空');
    }

    if (this.title && this.title.length > 200) {
      errors.push('任務標題不能超過200個字符');
    }

    if (!this.isValidStatus(this.status)) {
      errors.push('無效的任務狀態');
    }

    if (!this.isValidPriority(this.priority)) {
      errors.push('無效的優先級');
    }

    if (this.dueDate && this.dueDate < new Date()) {
      errors.push('截止日期不能早於當前時間');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 檢查狀態是否有效
   * @param {string} status - 狀態值
   * @returns {boolean} 是否有效
   */
  isValidStatus(status) {
    const validStatuses = ['todo', 'in-progress', 'done', 'blocked'];
    return validStatuses.includes(status);
  }

  /**
   * 檢查優先級是否有效
   * @param {string} priority - 優先級值
   * @returns {boolean} 是否有效
   */
  isValidPriority(priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
  }

  /**
   * 轉換為 JSON 物件
   * @returns {Object} JSON 物件
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      tags: this.tags,
      assignee: this.assignee,
      dueDate: this.dueDate ? this.dueDate.toISOString() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      boardId: this.boardId,
      cardId: this.cardId
    };
  }

  /**
   * 從 Focalboard 卡片數據創建任務
   * @param {Object} cardData - Focalboard 卡片數據
   * @returns {Task} 任務實例
   */
  static fromFocalboardCard(cardData) {
    const task = new Task({
      id: cardData.id,
      title: cardData.title || '',
      description: cardData.description || '',
      boardId: cardData.boardId,
      cardId: cardData.id,
      createdAt: cardData.createAt ? new Date(cardData.createAt) : new Date(),
      updatedAt: cardData.updateAt ? new Date(cardData.updateAt) : new Date()
    });

    // 解析 Focalboard 的屬性
    if (cardData.fields && cardData.fields.properties) {
      const properties = cardData.fields.properties;
      
      // 解析狀態
      if (properties.status) {
        task.status = this.mapFocalboardStatus(properties.status);
      }

      // 解析優先級
      if (properties.priority) {
        task.priority = this.mapFocalboardPriority(properties.priority);
      }

      // 解析指派人員
      if (properties.assignee) {
        task.assignee = properties.assignee;
      }

      // 解析標籤
      if (properties.tags) {
        task.tags = Array.isArray(properties.tags) ? properties.tags : [properties.tags];
      }

      // 解析截止日期
      if (properties.dueDate) {
        task.dueDate = new Date(properties.dueDate);
      }
    }

    return task;
  }

  /**
   * 映射 Focalboard 狀態到內部狀態
   * @param {string} focalboardStatus - Focalboard 狀態
   * @returns {string} 內部狀態
   */
  static mapFocalboardStatus(focalboardStatus) {
    const statusMap = {
      'open': 'todo',
      'in progress': 'in-progress',
      'completed': 'done',
      'blocked': 'blocked'
    };
    return statusMap[focalboardStatus] || 'todo';
  }

  /**
   * 映射 Focalboard 優先級到內部優先級
   * @param {string} focalboardPriority - Focalboard 優先級
   * @returns {string} 內部優先級
   */
  static mapFocalboardPriority(focalboardPriority) {
    const priorityMap = {
      '1': 'low',
      '2': 'medium',
      '3': 'high',
      '4': 'urgent'
    };
    return priorityMap[focalboardPriority] || 'medium';
  }

  /**
   * 更新時間戳
   */
  updateTimestamp() {
    this.updatedAt = new Date();
  }

  /**
   * 克隆任務
   * @returns {Task} 新的任務實例
   */
  clone() {
    return new Task(this.toJSON());
  }
}

module.exports = Task; 