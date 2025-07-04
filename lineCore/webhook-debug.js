#!/usr/bin/env node

/**
 * LINE Webhook 調試工具
 * 專門用於診斷 webhook 簽名驗證問題
 */

require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

console.log('🔍 LINE Webhook 調試工具');
console.log('========================\n');

// 配置
const config = {
  baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3000',
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

console.log('📋 當前配置:');
console.log(`   Base URL: ${config.baseUrl}`);
console.log(`   Channel Secret: ${config.channelSecret ? '已設定 (' + config.channelSecret.length + ' 字符)' : '❌ 未設定'}`);
console.log(`   Channel Access Token: ${config.channelAccessToken ? '已設定 (' + config.channelAccessToken.substring(0, 20) + '...)' : '❌ 未設定'}`);
console.log('');

/**
 * 創建 LINE 簽名
 * @param {string} channelSecret - Channel Secret
 * @param {string|Buffer} body - 請求主體
 * @returns {string} Base64 編碼的簽名
 */
function createLineSignature(channelSecret, body) {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const signature = crypto
    .createHmac('sha256', channelSecret)
    .update(bodyString, 'utf8')
    .digest('base64');
  return signature;
}

/**
 * 驗證簽名
 * @param {string} channelSecret - Channel Secret
 * @param {string|Buffer} body - 請求主體
 * @param {string} signature - 要驗證的簽名
 * @returns {boolean} 驗證結果
 */
function validateSignature(channelSecret, body, signature) {
  const expectedSignature = createLineSignature(channelSecret, body);
  return expectedSignature === signature;
}

// 測試用的 webhook 事件
const testEvent = {
  events: [
    {
      type: 'message',
      message: {
        type: 'text',
        text: 'Hello, World!'
      },
      source: {
        userId: 'test-user-12345'
      },
      timestamp: Date.now(),
      replyToken: 'test-reply-token-12345'
    }
  ]
};

/**
 * 測試簽名生成和驗證
 */
function testSignatureGeneration() {
  console.log('🔐 測試簽名生成和驗證');
  console.log('====================');
  
  if (!config.channelSecret) {
    console.log('❌ Channel Secret 未設定，跳過簽名測試');
    return false;
  }
  
  try {
    const bodyString = JSON.stringify(testEvent);
    const signature = createLineSignature(config.channelSecret, bodyString);
    
    console.log(`📝 測試主體長度: ${bodyString.length} 字符`);
    console.log(`🔑 生成的簽名: ${signature}`);
    console.log(`📏 簽名長度: ${signature.length} 字符`);
    
    // 驗證簽名
    const isValid = validateSignature(config.channelSecret, bodyString, signature);
    console.log(`✅ 簽名驗證結果: ${isValid ? '通過' : '失敗'}`);
    
    // 測試不同的主體格式
    console.log('\n🧪 測試不同主體格式:');
    
    // 1. 字符串主體
    const stringSignature = createLineSignature(config.channelSecret, bodyString);
    console.log(`   字符串主體簽名: ${stringSignature}`);
    
    // 2. Buffer 主體
    const bufferBody = Buffer.from(bodyString, 'utf8');
    const bufferSignature = createLineSignature(config.channelSecret, bufferBody);
    console.log(`   Buffer 主體簽名: ${bufferSignature}`);
    
    // 3. 比較結果
    console.log(`   簽名一致性: ${stringSignature === bufferSignature ? '✅ 一致' : '❌ 不一致'}`);
    
    return true;
  } catch (error) {
    console.error('❌ 簽名測試失敗:', error.message);
    return false;
  }
}

/**
 * 測試 webhook 端點
 * @param {string} endpoint - 端點路徑
 * @param {boolean} useSignature - 是否使用簽名
 */
async function testWebhookEndpoint(endpoint, useSignature = false) {
  console.log(`\n🌐 測試端點: ${endpoint}`);
  console.log(`🔐 使用簽名: ${useSignature ? '是' : '否'}`);
  console.log('='.repeat(50));
  
  try {
    const url = `${config.baseUrl}${endpoint}`;
    const bodyString = JSON.stringify(testEvent);
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'LINE-Webhook-Debug/1.0'
    };
    
    if (useSignature && config.channelSecret) {
      const signature = createLineSignature(config.channelSecret, bodyString);
      headers['X-Line-Signature'] = signature;
      console.log(`🔑 添加簽名標頭: ${signature}`);
    }
    
    console.log(`📤 發送請求到: ${url}`);
    console.log(`📋 請求標頭:`, JSON.stringify(headers, null, 2));
    console.log(`📦 請求主體長度: ${bodyString.length} 字符`);
    
    const response = await axios.post(url, testEvent, {
      headers,
      timeout: 10000,
      validateStatus: () => true // 接受所有狀態碼
    });
    
    console.log(`📨 回應狀態: ${response.status} ${response.statusText}`);
    console.log(`📋 回應標頭:`, JSON.stringify(response.headers, null, 2));
    console.log(`📦 回應內容:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ 測試成功');
      return true;
    } else {
      console.log(`❌ 測試失敗 (HTTP ${response.status})`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 請求失敗:', error.message);
    if (error.response) {
      console.error(`   HTTP 狀態: ${error.response.status}`);
      console.error(`   回應內容:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * 檢查服務器狀態
 */
async function checkServerStatus() {
  console.log('🏥 檢查服務器狀態');
  console.log('================');
  
  try {
    const healthUrl = `${config.baseUrl}/health`;
    console.log(`📡 檢查健康端點: ${healthUrl}`);
    
    const response = await axios.get(healthUrl, { timeout: 5000 });
    
    console.log('✅ 服務器運行正常');
    console.log('📊 服務器狀態:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.error('❌ 服務器檢查失敗:', error.message);
    console.error('   請確保服務器正在運行: npm start');
    return false;
  }
}

/**
 * 主要診斷流程
 */
async function main() {
  console.log('開始 Webhook 診斷...\n');
  
  // 1. 檢查服務器狀態
  const serverOK = await checkServerStatus();
  if (!serverOK) {
    console.log('\n❌ 服務器未運行，請先啟動服務器');
    process.exit(1);
  }
  
  // 2. 測試簽名生成
  const signatureOK = testSignatureGeneration();
  
  // 3. 測試各個端點
  const results = {
    testEndpoint: await testWebhookEndpoint('/webhook/test', false),
    signedEndpoint: await testWebhookEndpoint('/Webhook', true),
    customEndpoint: await testWebhookEndpoint('/webhook/line', true)
  };
  
  // 4. 總結報告
  console.log('\n📊 診斷結果摘要');
  console.log('================');
  console.log(`服務器狀態: ${serverOK ? '✅ 正常' : '❌ 異常'}`);
  console.log(`簽名功能: ${signatureOK ? '✅ 正常' : '❌ 異常'}`);
  console.log(`測試端點: ${results.testEndpoint ? '✅ 正常' : '❌ 異常'}`);
  console.log(`簽名端點: ${results.signedEndpoint ? '✅ 正常' : '❌ 異常'}`);
  console.log(`自訂端點: ${results.customEndpoint ? '✅ 正常' : '❌ 異常'}`);
  
  const allOK = serverOK && signatureOK && results.signedEndpoint;
  
  if (allOK) {
    console.log('\n🎉 所有診斷項目通過！');
    console.log('📋 建議的 Webhook URL:');
    console.log(`   ${config.baseUrl}/Webhook`);
  } else {
    console.log('\n❌ 發現問題，請檢查以下項目:');
    if (!serverOK) console.log('   - 確保服務器正在運行');
    if (!signatureOK) console.log('   - 檢查 LINE_CHANNEL_SECRET 環境變數');
    if (!results.signedEndpoint) console.log('   - 檢查簽名驗證邏輯');
  }
  
  console.log('\n🔧 如果問題持續，請檢查:');
  console.log('   1. LINE Developer Console 中的 Channel Secret');
  console.log('   2. 環境變數檔案 (.env)');
  console.log('   3. 服務器日誌輸出');
}

// 執行診斷
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createLineSignature,
  validateSignature,
  testWebhookEndpoint
};
