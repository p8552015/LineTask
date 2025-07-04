#!/usr/bin/env node

/**
 * 檢查任務是否在 Focalboard 中成功創建
 */

const { chromium } = require('playwright');

const FOCALBOARD_URL = 'http://localhost:8080';
const BOARD_URL = 'http://localhost:8080/bd4cehgd6bpy6xgmed7iqdosz6o/vdaf9tn387bfq3edqmh7q1wsbnr';
const USERNAME = 'tung';
const PASSWORD = '12345678';
const TASK_ID = 'cqryxh5pkbtye8e1hj33hcescfy'; // 剛才創建的任務 ID

async function checkTaskCreated() {
  console.log('🔍 檢查任務是否在 Focalboard 中成功創建...');
  
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
    await page.waitForTimeout(5000); // 等待看板載入
    
    // 截圖以供調試
    await page.screenshot({ path: 'focalboard-before-search.png', fullPage: true });
    console.log('📸 已保存看板截圖: focalboard-before-search.png');
    
    // 搜尋我們創建的任務
    console.log(`🔍 搜尋任務 ID: ${TASK_ID}...`);
    
    // 方法 1: 尋找包含任務標題的元素
    const taskTitleSelectors = [
      `[data-testid*="${TASK_ID}"]`,
      `[id*="${TASK_ID}"]`,
      `[class*="${TASK_ID}"]`,
      'text="測試任務"',
      'text="CURL"',
      'text="🧪"'
    ];
    
    let foundTask = false;
    let taskElement = null;
    
    for (const selector of taskTitleSelectors) {
      try {
        console.log(`   嘗試選擇器: ${selector}`);
        taskElement = await page.locator(selector).first();
        
        if (await taskElement.isVisible()) {
          console.log(`✅ 找到任務元素: ${selector}`);
          foundTask = true;
          break;
        }
      } catch (error) {
        console.log(`   選擇器失敗: ${selector}`);
      }
    }
    
    // 方法 2: 搜尋所有卡片元素
    console.log('🔍 搜尋所有卡片元素...');
    
    const cardSelectors = [
      '.Card',
      '[class*="card"]',
      '[class*="Card"]',
      '[data-testid*="card"]',
      '.octo-card',
      '.board-card'
    ];
    
    let allCards = [];
    
    for (const selector of cardSelectors) {
      try {
        const cards = await page.locator(selector).all();
        if (cards.length > 0) {
          console.log(`   找到 ${cards.length} 個卡片 (${selector})`);
          allCards = allCards.concat(cards);
        }
      } catch (error) {
        console.log(`   選擇器失敗: ${selector}`);
      }
    }
    
    // 檢查每個卡片的內容
    console.log(`📋 檢查 ${allCards.length} 個卡片的內容...`);
    
    for (let i = 0; i < Math.min(allCards.length, 20); i++) { // 限制檢查前 20 個卡片
      try {
        const card = allCards[i];
        const cardText = await card.textContent();
        
        if (cardText && (
          cardText.includes('測試任務') || 
          cardText.includes('CURL') || 
          cardText.includes('🧪') ||
          cardText.includes(TASK_ID)
        )) {
          console.log(`🎉 找到匹配的卡片 #${i + 1}:`);
          console.log(`   內容: ${cardText}`);
          foundTask = true;
          
          // 點擊卡片查看詳細信息
          await card.click();
          await page.waitForTimeout(2000);
          
          // 截圖卡片詳細信息
          await page.screenshot({ path: `task-details-${i}.png` });
          console.log(`📸 已保存卡片詳細截圖: task-details-${i}.png`);
          
          break;
        }
      } catch (error) {
        console.log(`   檢查卡片 #${i + 1} 失敗: ${error.message}`);
      }
    }
    
    // 方法 3: 檢查頁面源碼
    console.log('🔍 檢查頁面源碼中是否包含任務 ID...');
    
    const pageContent = await page.content();
    
    if (pageContent.includes(TASK_ID)) {
      console.log(`✅ 在頁面源碼中找到任務 ID: ${TASK_ID}`);
      foundTask = true;
    }
    
    if (pageContent.includes('測試任務') || pageContent.includes('CURL')) {
      console.log('✅ 在頁面源碼中找到任務標題關鍵字');
      foundTask = true;
    }
    
    // 最終截圖
    await page.screenshot({ path: 'focalboard-final.png', fullPage: true });
    console.log('📸 已保存最終截圖: focalboard-final.png');
    
    // 結果報告
    if (foundTask) {
      console.log('\n🎉 任務創建驗證成功！');
      console.log('✅ 任務已在 Focalboard 看板中找到');
    } else {
      console.log('\n⚠️  任務創建驗證結果不確定');
      console.log('❓ 無法在看板界面中明確找到新創建的任務');
      console.log('💡 可能的原因:');
      console.log('   1. 任務創建成功但界面尚未刷新');
      console.log('   2. 任務在不同的視圖或狀態列中');
      console.log('   3. 頁面載入或選擇器問題');
    }
    
    // 等待一段時間以便觀察
    console.log('\n⏳ 等待 10 秒以便觀察結果...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error.message);
    
    if (page) {
      // 截圖以供調試
      await page.screenshot({ path: 'error-check.png' });
      console.log('📸 已保存錯誤截圖: error-check.png');
    }
  } finally {
    if (browser) {
      console.log('🔚 關閉瀏覽器...');
      await browser.close();
    }
  }
}

// 執行檢查
if (require.main === module) {
  checkTaskCreated().catch(console.error);
}

module.exports = {
  checkTaskCreated
};
