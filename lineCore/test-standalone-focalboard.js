#!/usr/bin/env node

/**
 * 測試獨立 Focalboard 服務器的 API 連接
 */

require('dotenv').config();
const axios = require('axios');

const FOCALBOARD_URL = process.env.FOCALBOARD_API_URL || 'http://localhost:8080';
const TOKEN = process.env.FOCALBOARD_TOKEN;

async function testStandaloneFocalboard() {
  console.log('🧪 測試獨立 Focalboard 服務器 API...');
  console.log('=====================================\n');
  
  console.log('📋 配置信息:');
  console.log(`   Focalboard URL: ${FOCALBOARD_URL}`);
  console.log(`   Token: ${TOKEN ? '已設定' : '未設定'}\n`);
  
  // 創建 axios 客戶端
  const client = axios.create({
    baseURL: `${FOCALBOARD_URL}/api/v2`,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
    },
    timeout: 10000,
    validateStatus: function (status) {
      return status < 500; // 接受所有非 5xx 錯誤
    }
  });
  
  // 測試 1: 檢查 workspaces 端點
  console.log('🔧 測試 1: 檢查 workspaces 端點...');
  try {
    const response = await client.get('/workspaces');
    console.log(`✅ Workspaces API 回應: HTTP ${response.status}`);
    
    if (response.headers['content-type']?.includes('application/json')) {
      console.log('回應類型: JSON ✅');
      console.log('回應內容:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('回應類型: HTML ❌');
      console.log('這表示我們訪問的是前端頁面，不是 API 端點');
    }
  } catch (error) {
    console.log(`❌ Workspaces API 失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
    }
  }
  
  console.log('\n');
  
  // 測試 2: 檢查 teams 端點
  console.log('🔧 測試 2: 檢查 teams 端點...');
  try {
    const response = await client.get('/teams');
    console.log(`✅ Teams API 回應: HTTP ${response.status}`);
    
    if (response.headers['content-type']?.includes('application/json')) {
      console.log('回應類型: JSON ✅');
      console.log('回應內容:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('回應類型: HTML ❌');
      console.log('這表示我們訪問的是前端頁面，不是 API 端點');
    }
  } catch (error) {
    console.log(`❌ Teams API 失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
    }
  }
  
  console.log('\n');
  
  // 測試 3: 嘗試不同的 API 路徑
  console.log('🔧 測試 3: 嘗試不同的 API 路徑...');
  
  const testPaths = [
    '/api/v1/workspaces',
    '/api/v1/teams',
    '/api/workspaces',
    '/api/teams',
    '/workspaces',
    '/teams'
  ];
  
  for (const path of testPaths) {
    try {
      console.log(`   測試路徑: ${path}`);
      const response = await axios.get(`${FOCALBOARD_URL}${path}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
        },
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      
      if (response.headers['content-type']?.includes('application/json')) {
        console.log(`   ✅ ${path} 返回 JSON (HTTP ${response.status})`);
        console.log(`   數據:`, JSON.stringify(response.data, null, 2));
        break; // 找到有效的 API 端點就停止
      } else {
        console.log(`   ❌ ${path} 返回 HTML (HTTP ${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${path} 失敗: ${error.message}`);
    }
  }
  
  console.log('\n');
  
  // 測試 4: 檢查 Focalboard 版本信息
  console.log('🔧 測試 4: 檢查版本信息...');
  try {
    const response = await axios.get(`${FOCALBOARD_URL}/api/v2/hello`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    console.log(`✅ Hello API 回應: HTTP ${response.status}`);
    if (response.headers['content-type']?.includes('application/json')) {
      console.log('版本信息:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log(`❌ 版本信息檢查失敗: ${error.message}`);
  }
  
  console.log('\n🎯 測試完成!');
  console.log('\n💡 分析結果:');
  console.log('1. 如果所有 API 都返回 HTML，說明 Focalboard 可能沒有啟用 API');
  console.log('2. 或者需要特殊的配置來啟用 REST API');
  console.log('3. 檢查 Focalboard 的配置文件和啟動參數');
}

// 執行測試
if (require.main === module) {
  testStandaloneFocalboard().catch(console.error);
}

module.exports = {
  testStandaloneFocalboard
};
