#!/usr/bin/env node

/**
 * 使用 Playwright 自動化獲取 FOCALBOARD_TOKEN
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FOCALBOARD_URL = 'http://localhost:8080';
const BOARD_URL = 'http://localhost:8080/bd4cehgd6bpy6xgmed7iqdosz6o/vdaf9tn387bfq3edqmh7q1wsbnr';
const USERNAME = 'tung';
const PASSWORD = '12345678';

async function getFocalboardTokenWithPlaywright() {
  console.log('🎭 使用 Playwright 自動化獲取 FOCALBOARD_TOKEN...');
  
  let browser;
  let context;
  let page;
  
  try {
    // 啟動瀏覽器
    console.log('🚀 啟動瀏覽器...');
    browser = await chromium.launch({ 
      headless: false, // 設為 false 以便觀察過程
      slowMo: 1000 // 減慢操作速度以便觀察
    });
    
    context = await browser.newContext();
    page = await context.newPage();
    
    // 前往 Focalboard 首頁
    console.log(`📡 前往 ${FOCALBOARD_URL}...`);
    await page.goto(FOCALBOARD_URL);
    
    // 等待頁面載入
    await page.waitForTimeout(2000);
    
    // 檢查是否需要登入
    console.log('🔍 檢查登入狀態...');
    
    // 嘗試找到登入表單
    const loginForm = await page.locator('input[type="text"], input[type="email"], input[placeholder*="username"], input[placeholder*="email"]').first();
    
    if (await loginForm.isVisible()) {
      console.log('🔐 需要登入，正在填寫登入表單...');
      
      // 填寫用戶名
      await loginForm.fill(USERNAME);
      console.log(`✅ 已填寫用戶名: ${USERNAME}`);
      
      // 找到密碼欄位
      const passwordField = await page.locator('input[type="password"]').first();
      await passwordField.fill(PASSWORD);
      console.log('✅ 已填寫密碼');
      
      // 找到並點擊登入按鈕
      const loginButton = await page.locator('button[type="submit"], button:has-text("登入"), button:has-text("Login"), button:has-text("Sign in")').first();
      await loginButton.click();
      console.log('✅ 已點擊登入按鈕');
      
      // 等待登入完成
      await page.waitForTimeout(3000);
    }
    
    // 前往指定的看板頁面
    console.log(`📋 前往看板頁面: ${BOARD_URL}...`);
    await page.goto(BOARD_URL);
    await page.waitForTimeout(2000);
    
    // 等待頁面完全載入
    await page.waitForTimeout(5000);

    // 獲取所有 Cookies
    console.log('🍪 獲取所有 Cookies...');
    const cookies = await context.cookies();

    // 同時檢查 localStorage、sessionStorage 和頁面變數
    console.log('💾 檢查瀏覽器存儲和頁面變數...');
    const storageData = await page.evaluate(() => {
      const localStorage = {};
      const sessionStorage = {};
      const pageVariables = {};

      // 獲取 localStorage
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        localStorage[key] = window.localStorage.getItem(key);
      }

      // 獲取 sessionStorage
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        sessionStorage[key] = window.sessionStorage.getItem(key);
      }

      // 檢查常見的 CSRF token 位置
      try {
        // 檢查 meta 標籤
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
          pageVariables.csrfFromMeta = csrfMeta.getAttribute('content');
        }

        // 檢查全域變數
        if (window.csrfToken) pageVariables.csrfFromWindow = window.csrfToken;
        if (window.CSRF_TOKEN) pageVariables.csrfFromWindowUpper = window.CSRF_TOKEN;
        if (window._csrf) pageVariables.csrfFromUnderscore = window._csrf;

        // 檢查 Focalboard 特定變數
        if (window.focalboardConfig) pageVariables.focalboardConfig = window.focalboardConfig;
        if (window.baseURL) pageVariables.baseURL = window.baseURL;

      } catch (error) {
        pageVariables.error = error.message;
      }

      return { localStorage, sessionStorage, pageVariables };
    });

    console.log(`\n📋 找到 ${cookies.length} 個 Cookies:`);
    console.log(`💾 localStorage 項目: ${Object.keys(storageData.localStorage).length}`);
    console.log(`💾 sessionStorage 項目: ${Object.keys(storageData.sessionStorage).length}`);
    console.log(`🌐 頁面變數: ${Object.keys(storageData.pageVariables).length}`);

    let focalboardToken = null;
    let focalboardCsrf = null;

    if (cookies.length === 0) {
      console.log('❌ 沒有找到任何 Cookies，可能登入失敗');

      // 檢查當前頁面 URL
      const currentUrl = page.url();
      console.log(`當前頁面 URL: ${currentUrl}`);

      // 檢查頁面內容
      const pageTitle = await page.title();
      console.log(`頁面標題: ${pageTitle}`);

      // 檢查是否有錯誤訊息
      const errorElements = await page.locator('.error, .alert, .warning, [class*="error"], [class*="alert"]').all();
      if (errorElements.length > 0) {
        console.log('🚨 發現錯誤訊息:');
        for (const element of errorElements) {
          const text = await element.textContent();
          console.log(`   ${text}`);
        }
      }
    } else {
      cookies.forEach(cookie => {
        console.log(`   ${cookie.name} = ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);

        // 查找 FOCALBOARD 相關的 Cookie
        if (cookie.name.includes('FOCALBOARD') ||
            cookie.name.includes('TOKEN') ||
            cookie.name.includes('SESSION') ||
            cookie.name.toLowerCase().includes('focalboard') ||
            cookie.name.includes('auth') ||
            cookie.name.includes('session') ||
            cookie.name.toLowerCase().includes('csrf')) {
          console.log(`   ⭐ 可能的 Focalboard Token: ${cookie.name} = ${cookie.value}`);

          if (cookie.name === 'focalboardSessionId' || cookie.name === 'FOCALBOARD_TOKEN') {
            focalboardToken = cookie.value;
          } else if (cookie.name.toLowerCase().includes('csrf')) {
            focalboardCsrf = cookie.value;
          } else if (!focalboardToken) {
            focalboardToken = cookie.value;
          }
        }
      });
    }

    // 檢查 localStorage 和 sessionStorage 中的認證信息
    console.log('\n💾 瀏覽器存儲內容:');

    // 檢查 localStorage
    if (Object.keys(storageData.localStorage).length > 0) {
      console.log('📦 localStorage:');
      Object.entries(storageData.localStorage).forEach(([key, value]) => {
        const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
        console.log(`   ${key} = ${displayValue}`);

        if (key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('focalboard')) {
          console.log(`   ⭐ 可能的認證信息: ${key} = ${value}`);

          if (key === 'focalboardSessionId') {
            focalboardToken = value;
          } else if (key.toLowerCase().includes('csrf')) {
            focalboardCsrf = value;
          } else if (!focalboardToken) {
            focalboardToken = value;
          }
        }
      });
    }

    // 檢查 sessionStorage
    if (Object.keys(storageData.sessionStorage).length > 0) {
      console.log('📦 sessionStorage:');
      Object.entries(storageData.sessionStorage).forEach(([key, value]) => {
        const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
        console.log(`   ${key} = ${displayValue}`);

        if (key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('session') ||
            key.toLowerCase().includes('focalboard') ||
            key.toLowerCase().includes('csrf')) {
          console.log(`   ⭐ 可能的認證信息: ${key} = ${value}`);

          if (key === 'focalboardSessionId') {
            focalboardToken = value;
          } else if (key.toLowerCase().includes('csrf')) {
            focalboardCsrf = value;
          } else if (!focalboardToken) {
            focalboardToken = value;
          }
        }
      });
    }
    
    // 如果沒有找到明顯的 token，嘗試使用最長的 cookie 值
    if (!focalboardToken) {
      console.log('\n🔍 沒有找到明顯的 FOCALBOARD_TOKEN，查找最長的 Cookie...');
      
      let longestCookie = null;
      let maxLength = 0;
      
      cookies.forEach(cookie => {
        if (cookie.value.length > maxLength) {
          maxLength = cookie.value.length;
          longestCookie = cookie;
        }
      });
      
      if (longestCookie && longestCookie.value.length > 10) {
        console.log(`   🎯 最長的 Cookie: ${longestCookie.name} = ${longestCookie.value}`);
        focalboardToken = longestCookie.value;
      }
    }
    
    if (focalboardToken) {
      console.log(`\n🎉 找到 Session Token: ${focalboardToken}`);
      if (focalboardCsrf) {
        console.log(`🎉 找到 CSRF Token: ${focalboardCsrf}`);
      } else {
        console.log(`⚠️  沒有找到 CSRF Token，可能需要手動獲取`);
      }

      // 更新 .env 檔案
      updateEnvFile(focalboardToken, focalboardCsrf);

      // 測試 Token
      await testTokenWithPlaywright(page, focalboardToken, focalboardCsrf);

      return { sessionToken: focalboardToken, csrfToken: focalboardCsrf };
    } else {
      console.log('\n❌ 沒有找到有效的 FOCALBOARD_TOKEN');
      
      // 截圖以供調試
      await page.screenshot({ path: 'focalboard-debug.png' });
      console.log('📸 已保存調試截圖: focalboard-debug.png');
      
      return null;
    }
    
  } catch (error) {
    console.error('❌ 自動化過程中發生錯誤:', error.message);
    
    if (page) {
      // 截圖以供調試
      await page.screenshot({ path: 'error-debug.png' });
      console.log('📸 已保存錯誤截圖: error-debug.png');
    }
    
    return null;
  } finally {
    if (browser) {
      console.log('🔚 關閉瀏覽器...');
      await browser.close();
    }
  }
}

async function testTokenWithPlaywright(page, sessionToken, csrfToken) {
  console.log('\n🧪 測試 Token 有效性...');

  try {
    // 在頁面中執行 API 測試
    const result = await page.evaluate(async (tokens) => {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };

        // 如果有 CSRF token，添加到標頭
        if (tokens.csrfToken) {
          headers['X-CSRF-Token'] = tokens.csrfToken;
        }

        const response = await fetch('/api/v2/teams', {
          method: 'GET',
          headers: headers,
          credentials: 'include' // 包含 cookies
        });

        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    }, { sessionToken, csrfToken });
    
    if (result.ok) {
      console.log('✅ Token 測試成功！');
      console.log('🎉 可以正常訪問 Focalboard API');
      return true;
    } else {
      console.log(`❌ Token 測試失敗: ${result.status}`);
      console.log('回應:', result.data);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Token 測試失敗:', error.message);
    return false;
  }
}

function updateEnvFile(sessionToken, csrfToken) {
  try {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // 更新 FOCALBOARD_TOKEN
    if (envContent.includes('FOCALBOARD_TOKEN=')) {
      envContent = envContent.replace(/FOCALBOARD_TOKEN=.*/, `FOCALBOARD_TOKEN=${sessionToken}`);
    } else {
      envContent += `\nFOCALBOARD_TOKEN=${sessionToken}`;
    }

    // 添加或更新 FOCALBOARD_CSRF
    if (csrfToken) {
      if (envContent.includes('FOCALBOARD_CSRF=')) {
        envContent = envContent.replace(/FOCALBOARD_CSRF=.*/, `FOCALBOARD_CSRF=${csrfToken}`);
      } else {
        envContent += `\nFOCALBOARD_CSRF=${csrfToken}`;
      }
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 檔案已更新');

  } catch (error) {
    console.error('❌ 更新 .env 檔案失敗:', error.message);
    console.log('\n請手動將以下行添加到 .env 檔案:');
    console.log(`FOCALBOARD_TOKEN=${sessionToken}`);
    if (csrfToken) {
      console.log(`FOCALBOARD_CSRF=${csrfToken}`);
    }
  }
}

async function main() {
  console.log('🎭 Playwright 自動化 FOCALBOARD_TOKEN 獲取工具');
  console.log('==============================================\n');
  
  const token = await getFocalboardTokenWithPlaywright();
  
  if (token) {
    console.log('\n🎉 Token 獲取完成！');
    console.log('現在可以重新啟動 LINE Bot 服務器了');
  } else {
    console.log('\n❌ Token 獲取失敗');
    console.log('請檢查 Focalboard 是否正常運行，以及登入憑證是否正確');
  }
}

// 執行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getFocalboardTokenWithPlaywright
};
