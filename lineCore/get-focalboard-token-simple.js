#!/usr/bin/env node

/**
 * 簡單的 Focalboard Token 獲取工具
 * 使用 API 登入並獲取 Session Token
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FOCALBOARD_URL = 'http://localhost:8080';
const USERNAME = 'tung';
const PASSWORD = '12345678';

async function getFocalboardToken() {
  console.log('🔐 正在獲取 Focalboard Token...');
  console.log(`📡 連接到: ${FOCALBOARD_URL}`);
  console.log(`👤 用戶名: ${USERNAME}`);
  
  try {
    // 創建 axios 實例，保存 cookies
    const client = axios.create({
      baseURL: FOCALBOARD_URL,
      timeout: 10000,
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500; // 接受所有非 5xx 錯誤
      }
    });

    // 嘗試登入
    console.log('\n📝 正在嘗試登入...');
    
    const loginResponse = await client.post('/api/v2/login', {
      type: 'normal',
      username: USERNAME,
      password: PASSWORD
    });

    console.log(`📊 登入回應狀態: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      console.log('✅ 登入成功！');
      
      // 檢查 Set-Cookie 標頭
      const setCookieHeader = loginResponse.headers['set-cookie'];
      
      if (setCookieHeader) {
        console.log('\n🍪 找到 Set-Cookie 標頭:');
        
        let focalboardToken = null;
        
        // 解析 cookies
        setCookieHeader.forEach(cookie => {
          console.log(`   ${cookie}`);
          
          if (cookie.startsWith('FOCALBOARD_TOKEN=')) {
            // 提取 token 值
            const tokenMatch = cookie.match(/FOCALBOARD_TOKEN=([^;]+)/);
            if (tokenMatch) {
              focalboardToken = tokenMatch[1];
            }
          }
        });
        
        if (focalboardToken) {
          console.log('\n🎉 成功獲取 FOCALBOARD_TOKEN!');
          console.log(`Token: ${focalboardToken}`);
          
          // 更新 .env 檔案
          updateEnvFile(focalboardToken);
          
          // 測試 token
          await testToken(focalboardToken);
          
          return focalboardToken;
        } else {
          console.log('❌ 在 Set-Cookie 中沒有找到 FOCALBOARD_TOKEN');
        }
      } else {
        console.log('❌ 沒有找到 Set-Cookie 標頭');
      }
      
      // 顯示完整回應以供調試
      console.log('\n🔍 完整登入回應:');
      console.log('Headers:', JSON.stringify(loginResponse.headers, null, 2));
      console.log('Data:', JSON.stringify(loginResponse.data, null, 2));
      
    } else {
      console.log(`❌ 登入失敗: HTTP ${loginResponse.status}`);
      console.log('錯誤詳情:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ 獲取 Token 時發生錯誤:', error.message);
    
    if (error.response) {
      console.log(`HTTP 狀態: ${error.response.status}`);
      console.log('錯誤詳情:', error.response.data);
    }
  }
  
  return null;
}

/**
 * 更新 .env 檔案
 */
function updateEnvFile(token) {
  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // 更新 FOCALBOARD_TOKEN
    if (envContent.includes('FOCALBOARD_TOKEN=')) {
      envContent = envContent.replace(/FOCALBOARD_TOKEN=.*/, `FOCALBOARD_TOKEN=${token}`);
    } else {
      envContent += `\nFOCALBOARD_TOKEN=${token}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 檔案已更新');
    
  } catch (error) {
    console.error('❌ 更新 .env 檔案失敗:', error.message);
    console.log('\n請手動將以下行添加到 .env 檔案:');
    console.log(`FOCALBOARD_TOKEN=${token}`);
  }
}

/**
 * 測試 Token 是否有效
 */
async function testToken(token) {
  console.log('\n🧪 測試 Token 有效性...');
  
  try {
    const client = axios.create({
      baseURL: FOCALBOARD_URL,
      headers: {
        'Cookie': `FOCALBOARD_TOKEN=${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const response = await client.get('/api/v2/teams');
    
    if (response.status === 200) {
      console.log('✅ Token 測試成功！');
      console.log('🎉 可以正常訪問 Focalboard API');
      return true;
    } else {
      console.log(`❌ Token 測試失敗: HTTP ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Token 測試失敗:', error.message);
    return false;
  }
}

/**
 * 主函數
 */
async function main() {
  console.log('🚀 Focalboard Token 獲取工具');
  console.log('==============================\n');
  
  const token = await getFocalboardToken();
  
  if (token) {
    console.log('\n🎉 Token 獲取完成！');
    console.log('現在可以重新啟動 LINE Bot 服務器了');
  } else {
    console.log('\n❌ Token 獲取失敗');
    console.log('請嘗試手動從瀏覽器複製 Token');
  }
}

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getFocalboardToken,
  testToken
};
