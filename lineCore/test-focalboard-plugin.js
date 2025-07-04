#!/usr/bin/env node

/**
 * 測試 Focalboard 作為 Mattermost 插件的 API 連接
 */

require('dotenv').config();
const axios = require('axios');

const FOCALBOARD_URL = process.env.FOCALBOARD_API_URL || 'http://localhost:8080';
const TOKEN = process.env.FOCALBOARD_TOKEN;

async function testFocalboardPlugin() {
  console.log('🧪 測試 Focalboard 插件 API 連接...');
  console.log('=====================================\n');
  
  console.log('📋 配置信息:');
  console.log(`   Focalboard URL: ${FOCALBOARD_URL}`);
  console.log(`   Token: ${TOKEN ? '已設定' : '未設定'}\n`);
  
  // 創建 axios 客戶端
  const client = axios.create({
    baseURL: `${FOCALBOARD_URL}/plugins/focalboard/api/v2`,
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
    console.log('回應類型:', typeof response.data);
    console.log('回應內容:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Workspaces API 失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
      console.log(`   回應內容: ${error.response.data}`);
    }
  }
  
  console.log('\n');
  
  // 測試 2: 檢查 teams 端點
  console.log('🔧 測試 2: 檢查 teams 端點...');
  try {
    const response = await client.get('/teams');
    console.log(`✅ Teams API 回應: HTTP ${response.status}`);
    console.log('回應類型:', typeof response.data);
    console.log('回應內容:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`❌ Teams API 失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
      console.log(`   回應內容: ${error.response.data}`);
    }
  }
  
  console.log('\n');
  
  // 測試 3: 檢查是否是 Mattermost 服務器
  console.log('🔧 測試 3: 檢查 Mattermost 服務器狀態...');
  try {
    const response = await axios.get(`${FOCALBOARD_URL}/api/v4/system/ping`, {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    console.log(`✅ Mattermost 服務器回應: HTTP ${response.status}`);
    console.log('回應內容:', response.data);
  } catch (error) {
    console.log(`❌ Mattermost 服務器檢查失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
    }
  }
  
  console.log('\n');
  
  // 測試 4: 檢查插件狀態
  console.log('🔧 測試 4: 檢查 Focalboard 插件狀態...');
  try {
    const response = await axios.get(`${FOCALBOARD_URL}/api/v4/plugins`, {
      headers: {
        ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
      },
      timeout: 5000,
      validateStatus: function (status) {
        return status < 500;
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ 插件 API 回應: HTTP ${response.status}`);
      const plugins = response.data;
      
      if (plugins.active) {
        const focalboardPlugin = plugins.active.find(p => p.id === 'focalboard');
        if (focalboardPlugin) {
          console.log('🎉 找到 Focalboard 插件!');
          console.log(`   版本: ${focalboardPlugin.version}`);
          console.log(`   狀態: 啟用`);
        } else {
          console.log('⚠️  Focalboard 插件未啟用或未安裝');
          console.log('已啟用的插件:', plugins.active.map(p => p.id));
        }
      }
    } else {
      console.log(`⚠️  插件 API 回應: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ 插件狀態檢查失敗: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP 狀態: ${error.response.status}`);
      if (error.response.status === 401) {
        console.log('   💡 提示: 需要管理員權限來查看插件狀態');
      }
    }
  }
  
  console.log('\n🎯 測試完成!');
  console.log('\n💡 建議:');
  console.log('1. 確認 Mattermost 服務器正在運行');
  console.log('2. 確認 Focalboard 插件已安裝並啟用');
  console.log('3. 確認 Token 具有適當的權限');
}

// 執行測試
if (require.main === module) {
  testFocalboardPlugin().catch(console.error);
}

module.exports = {
  testFocalboardPlugin
};
