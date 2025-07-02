/**
 * 任務服務接口 - 遵循接口隔離原則 (Interface Segregation Principle)
 * 定義任務管理的核心方法
 */
class ITaskService {
  /**
   * 創建新任務
   * @param {Object} taskData - 任務資料
   * @param {string} taskData.title - 任務標題
   * @param {string} taskData.description - 任務描述
   * @param {string} taskData.priority - 優先級
   * @param {string} taskData.tags - 標籤
   * @param {string} taskData.assignee - 指派人員
   * @param {Date} taskData.dueDate - 截止日期
   * @returns {Promise<Object>} 創建的任務物件
   */
  async createTask(taskData) {
    throw new Error('Method not implemented');
  }

  /**
   * 取得任務列表
   * @param {Object} filters - 篩選條件
   * @param {string} filters.status - 狀態篩選
   * @param {string} filters.assignee - 指派人員篩選
   * @param {string} filters.priority - 優先級篩選
   * @returns {Promise<Array>} 任務列表
   */
  async getTasks(filters = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * 取得單一任務
   * @param {string} taskId - 任務ID
   * @returns {Promise<Object>} 任務物件
   */
  async getTask(taskId) {
    throw new Error('Method not implemented');
  }

  /**
   * 更新任務
   * @param {string} taskId - 任務ID
   * @param {Object} updateData - 更新資料
   * @returns {Promise<Object>} 更新後的任務物件
   */
  async updateTask(taskId, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * 刪除任務
   * @param {string} taskId - 任務ID
   * @returns {Promise<boolean>} 刪除是否成功
   */
  async deleteTask(taskId) {
    throw new Error('Method not implemented');
  }

  /**
   * 搜尋任務
   * @param {string} query - 搜尋關鍵字
   * @param {Object} options - 搜尋選項
   * @returns {Promise<Array>} 搜尋結果
   */
  async searchTasks(query, options = {}) {
    throw new Error('Method not implemented');
  }
}

module.exports = ITaskService; 