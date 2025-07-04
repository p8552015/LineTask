#!/usr/bin/env node

/**
 * 獲取所有 Focalboard Cookies 的工具
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const FOCALBOARD_URL = 'http://localhost:8080';
const USERNAME = 'tung';
const PASSWORD = '12345678';

async function getAllCookies() {
  console.log('🍪 正在獲取所有 Focalboard Cookies...');
  
  return new Promise((resolve, reject) => {
    // 使用 curl 獲取登入後的所有 cookies
    const curlCommand = `curl -i -s -X POST ${FOCALBOARD_URL}/api/v2/login ` +
      `-H "Content-Type: application/json" ` +
      `-d "{\\"type\\":\\"normal\\",\\"username\\":\\"${USERNAME}\\",\\"password\\":\\"${PASSWORD}\\"}" ` +
      `-c cookies.txt`;
    
    console.log('📡 執行 curl 命令...');
    console.log(`命令: ${curlCommand}`);
    
    exec(curlCommand, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ curl 命令執行失敗:', error.message);
        reject(error);
        return;
      }
      
      console.log('\n📄 HTTP 回應:');
      console.log(stdout);
      
      if (stderr) {
        console.log('\n⚠️  stderr:');
        console.log(stderr);
      }
      
      // 檢查是否有 cookies.txt 文件
      const cookiesPath = path.join(__dirname, 'cookies.txt');
      if (fs.existsSync(cookiesPath)) {
        console.log('\n🍪 Cookies 文件內容:');
        const cookiesContent = fs.readFileSync(cookiesPath, 'utf8');
        console.log(cookiesContent);
        
        // 解析 cookies
        parseCookies(cookiesContent);
      } else {
        console.log('❌ 沒有找到 cookies.txt 文件');
      }
      
      resolve(stdout);
    });
  });
}

function parseCookies(cookiesContent) {
  console.log('\n🔍 解析 Cookies:');
  
  const lines = cookiesContent.split('\n');
  let focalboardToken = null;
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const name = parts[5];
        const value = parts[6];
        
        console.log(`   ${name} = ${value}`);
        
        if (name.includes('FOCALBOARD') || name.includes('TOKEN') || name.includes('SESSION')) {
          focalboardToken = value;
          console.log(`   ⭐ 可能的 Token: ${name} = ${value}`);
        }
      }
    }
  });
  
  if (focalboardToken) {
    updateEnvFile(focalboardToken);
  }
}

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

async function main() {
  try {
    await getAllCookies();
  } catch (error) {
    console.error('❌ 獲取 Cookies 失敗:', error.message);
  }
}

if (require.main === module) {
  main();
}
