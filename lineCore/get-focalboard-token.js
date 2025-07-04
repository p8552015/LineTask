#!/usr/bin/env node

/**
 * Focalboard API Token 獲取工具
 * 幫助獲取 Focalboard 的 API Token
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const FOCALBOARD_URL = 'http://localhost:8080';

/**
 * 獲取 Focalboard API Token
 */
async function getFocalboardToken() {
  console.log('🔐 Focalboard API Token 獲取工具');
  console.log('================================\n');

  try {
    // 方法 1: 嘗試直接登入
    console.log('方法 1: 嘗試 API 登入...');
    
    const username = 'tung';
    const password = '12345678';
    
    console.log(`使用帳號: ${username}`);
    
    // 創建 axios 實例
    const client = axios.create({
      baseURL: FOCALBOARD_URL,
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // 接受所有非 5xx 錯誤
      }
    });

    // 嘗試登入
    try {
      const loginResponse = await client.post('/api/v2/login', {
        type: 'normal',
        username: username,
        password: password
      });

      if (loginResponse.status === 200) {
        console.log('✅ 登入成功！');
        
        // 檢查回應中是否有 token
        const token = loginResponse.data.token || 
                     loginResponse.headers['authorization'] ||
                     loginResponse.headers['x-auth-token'];
        
        if (token) {
          console.log(`🎉 獲取到 Token: ${token}`);
          return token;
        } else {
          console.log('⚠️  登入成功但沒有找到 token');
          console.log('回應數據:', JSON.stringify(loginResponse.data, null, 2));
          console.log('回應標頭:', JSON.stringify(loginResponse.headers, null, 2));
        }
      } else {
        console.log(`❌ 登入失敗: HTTP ${loginResponse.status}`);
        console.log('錯誤:', loginResponse.data);
      }
    } catch (error) {
      console.log(`❌ 登入請求失敗: ${error.message}`);
      if (error.response) {
        console.log(`HTTP 狀態: ${error.response.status}`);
        console.log('錯誤詳情:', error.response.data);
      }
    }

    // 方法 2: 檢查是否可以無認證訪問
    console.log('\n方法 2: 檢查無認證訪問...');
    
    try {
      const testResponse = await client.get('/api/v2/teams');
      
      if (testResponse.status === 200) {
        console.log('✅ 可以無認證訪問 API！');
        console.log('🎉 不需要 token，可以直接使用 API');
        return 'NO_TOKEN_NEEDED';
      }
    } catch (error) {
      console.log('❌ 無認證訪問失敗');
    }

    // 方法 3: 提供手動設定指引
    console.log('\n方法 3: 手動獲取 Token');
    console.log('===================');
    console.log('請按照以下步驟手動獲取 API Token:');
    console.log('');
    console.log('1. 打開瀏覽器，前往: http://localhost:8080');
    console.log('2. 使用帳號登入:');
    console.log(`   用戶名: ${username}`);
    console.log(`   密碼: ${password}`);
    console.log('3. 登入後，打開瀏覽器開發者工具 (F12)');
    console.log('4. 前往 Network (網路) 標籤');
    console.log('5. 在 Focalboard 中執行任何操作 (如創建卡片)');
    console.log('6. 在 Network 標籤中找到 API 請求');
    console.log('7. 查看請求標頭中的 Authorization 欄位');
    console.log('8. 複製 Bearer token 部分');
    console.log('');
    
    return new Promise((resolve) => {
      rl.question('請輸入從瀏覽器獲取的 API Token (或按 Enter 跳過): ', (token) => {
        rl.close();
        if (token.trim()) {
          console.log(`✅ 收到 Token: ${token.trim()}`);
          resolve(token.trim());
        } else {
          console.log('⚠️  跳過 Token 設定');
          resolve(null);
        }
      });
    });

  } catch (error) {
    console.error('❌ 獲取 Token 過程中發生錯誤:', error.message);
    return null;
  }
}

/**
 * 更新 .env 檔案
 */
function updateEnvFile(token) {
  const fs = require('fs');
  const path = require('path');
  
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
    console.log('請手動將以下行添加到 .env 檔案:');
    console.log(`FOCALBOARD_TOKEN=${token}`);
  }
}

/**
 * 測試 Token
 */
async function testToken(token) {
  console.log('\n🧪 測試 Token...');
  
  try {
    const client = axios.create({
      baseURL: FOCALBOARD_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
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
  const token = await getFocalboardToken();
  
  if (token && token !== 'NO_TOKEN_NEEDED') {
    const isValid = await testToken(token);
    
    if (isValid) {
      updateEnvFile(token);
      console.log('\n🎉 設定完成！');
      console.log('請重新啟動 LINE Bot 服務器以應用新的 Token');
    } else {
      console.log('\n❌ Token 無效，請重新獲取');
    }
  } else if (token === 'NO_TOKEN_NEEDED') {
    updateEnvFile('');
    console.log('\n🎉 設定完成！');
    console.log('Focalboard 不需要認證，可以直接使用');
  } else {
    console.log('\n⚠️  未設定 Token');
    console.log('LINE Bot 可能無法正常創建任務到 Focalboard');
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
