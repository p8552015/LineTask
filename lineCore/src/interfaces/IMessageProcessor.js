/**
 * 訊息處理接口 - 遵循接口隔離原則 (Interface Segregation Principle)
 * 定義 LINE 訊息處理的核心方法
 */
class IMessageProcessor {
  /**
   * 處理文字訊息
   * @param {string} message - 訊息內容
   * @param {string} userId - 用戶ID
   * @returns {Promise<Object>} 處理結果
   */
  async processTextMessage(message, userId) {
    throw new Error('Method not implemented');
  }

  /**
   * 解析命令
   * @param {string} message - 訊息內容
   * @returns {Object} 解析後的命令物件
   */
  parseCommand(message) {
    throw new Error('Method not implemented');
  }

  /**
   * 生成回覆訊息
   * @param {Object} result - 處理結果
   * @param {string} command - 原始命令
   * @returns {string} 回覆訊息
   */
  generateReplyMessage(result, command) {
    throw new Error('Method not implemented');
  }

  /**
   * 驗證命令格式
   * @param {Object} command - 命令物件
   * @returns {Object} 驗證結果
   */
  validateCommand(command) {
    throw new Error('Method not implemented');
  }
}

module.exports = IMessageProcessor; 