const axios = require('axios');

async function getBoardProperties() {
  try {
    const response = await axios.get('http://localhost:8080/api/v2/boards/bd4cehgd6bpy6xgmed7iqdosz6o', {
      headers: {
        'Authorization': 'Bearer kas4qri1kxpbnb871afgdz3odmo',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log('🔍 看板屬性分析:');
    console.log('================');
    
    const board = response.data;
    console.log(`看板標題: ${board.title}`);
    console.log(`看板 ID: ${board.id}`);
    console.log('\n📋 卡片屬性 (cardProperties):');
    
    if (board.cardProperties && Array.isArray(board.cardProperties)) {
      board.cardProperties.forEach((prop, index) => {
        console.log(`\n${index + 1}. 屬性: ${prop.name}`);
        console.log(`   ID: ${prop.id}`);
        console.log(`   類型: ${prop.type}`);
        
        if (prop.options && Array.isArray(prop.options)) {
          console.log(`   選項:`);
          prop.options.forEach((option, optIndex) => {
            console.log(`     ${optIndex + 1}. ID: ${option.id}, 值: "${option.value}", 顏色: ${option.color}`);
          });
        } else {
          console.log(`   選項: 無 (${prop.type} 類型)`);
        }
      });
    } else {
      console.log('❌ 沒有找到 cardProperties');
    }

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    if (error.response) {
      console.error('回應狀態:', error.response.status);
      console.error('回應數據:', error.response.data);
    }
  }
}

getBoardProperties();
