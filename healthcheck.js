#!/usr/bin/env node

/**
 * Docker 健康檢查腳本
 * 檢查服務是否正常運行
 */

const http = require('http');

const port = process.env.PORT || 3000;

const options = {
  hostname: 'localhost',
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const healthCheck = () => {
  const req = http.request(options, (res) => {
    console.log(`健康檢查狀態碼: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      process.exit(0); // 健康
    } else {
      process.exit(1); // 不健康
    }
  });

  req.on('error', (err) => {
    console.error(`健康檢查錯誤: ${err.message}`);
    process.exit(1); // 不健康
  });

  req.on('timeout', () => {
    console.error('健康檢查超時');
    req.destroy();
    process.exit(1); // 不健康
  });

  req.end();
};

healthCheck(); 