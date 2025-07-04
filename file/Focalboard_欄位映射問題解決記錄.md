# Focalboard 欄位映射問題解決記錄

## 📋 問題描述

**日期**: 2025年7月4日  
**問題**: LINE Bot 創建的任務在 Focalboard 中顯示欄位為空白或錯誤  
**症狀**: Status、Priority 顯示空白，Assignee 顯示 "Empty"，Describe、Tag 不顯示

## 🔍 錯誤原因分析

### 1. **根本錯誤**: 假設屬性 ID 而非查詢實際值
- ❌ **錯誤做法**: 憑想像或從其他看板複製屬性 ID
- ✅ **正確做法**: 從目標看板的實際配置中獲取屬性 ID

### 2. **具體錯誤映射**:

#### Status 屬性錯誤映射:
```javascript
// ❌ 錯誤的 ID (憑想像)
'todo': 'akj3fkmxq7idma55mdt8sqpumyw'
'in-progress': 'aq1dwbf661yx337hjcd5q3sbxwa'

// ✅ 正確的 ID (從實際看板獲取)
'todo': 'ayz81h9f3dwp7rzzbdebesc7ute'        // Not Started
'in-progress': 'ar6b8m3jxr3asyxhr8iucdbo6yc'  // In Progress
'completed': 'adeo5xuwne3qjue83fcozekz8ko'    // Completed 🙌
```

#### Priority 屬性錯誤映射:
```javascript
// ❌ 錯誤的 ID
'high': 'ar87yh5xmsswqkxmjq1ipfftfpc'
'medium': 'aoy9njppsgdnx8izr4p1fy7r6nqy'

// ✅ 正確的 ID
'high': 'd3bfb50f-f569-4bad-8a3a-dd15c3f60101'    // 1. High 🔥
'medium': '87f59784-b859-4c24-8ebe-17c766e081dd'  // 2. Medium
'low': '98a57627-0f76-471d-850d-91f3ed9fd213'     // 3. Low
```

## 🛠️ 正確的解決流程

### 步驟 1: 獲取看板實際配置
```javascript
// 創建調試腳本獲取看板屬性
const response = await axios.get('http://localhost:8080/api/v2/boards/{boardId}', {
  headers: {
    'Authorization': 'Bearer {token}',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// 分析 cardProperties 獲取正確的屬性 ID 和選項值
board.cardProperties.forEach(prop => {
  console.log(`屬性: ${prop.name}, ID: ${prop.id}, 類型: ${prop.type}`);
  if (prop.options) {
    prop.options.forEach(option => {
      console.log(`  選項: ${option.value}, ID: ${option.id}`);
    });
  }
});
```

### 步驟 2: 使用正確的屬性映射
```javascript
const properties = {
  // Status 屬性 (select 類型)
  'a972dc7a-5f4c-45d2-8044-8c28c69717f1': this.mapInternalStatusToFocalboard(task.status),
  
  // Priority 屬性 (select 類型)  
  'd3d682bf-e074-49d9-8df5-7320921c2d23': this.mapInternalPriorityToFocalboard(task.priority),
  
  // Assignee 屬性 (person 類型) - 需要用戶 ID
  'axkhqa4jxr3jcqe4k87g8bhmary': task.assignee || '',
  
  // Estimated Hours 屬性 (number 類型)
  'a8daz81s4xjgke1ww6cwik5w7ye': task.estimatedHours || 0,
  
  // Due Date 屬性 (text 類型) - 使用 YYYY-MM-DD 格式
  'a3zsw7xs8sxy7atj8b6totp3mby': task.dueDate ? this.formatDateForFocalboard(task.dueDate) : '',
  
  // Describe 屬性 (text 類型)
  'axsedqo8zwuuksck5yxofsd54fr': task.description || '',
  
  // Tag 屬性 (text 類型)
  'axiudojuz6ptdogoe53pae777so': task.tags ? task.tags.join(', ') : ''
};
```

### 步驟 3: 添加調試日誌
```javascript
console.log('🔍 發送到 Focalboard 的屬性:', JSON.stringify(properties, null, 2));
```

### 步驟 4: 使用 Browser 驗證結果
- 登入 Focalboard: `http://localhost:8080` (tung/12345678)
- 檢查任務卡片的實際顯示
- 驗證每個欄位是否正確顯示

## 🎯 關鍵學習點

### 1. **永遠不要假設 ID 值**
- Focalboard 的屬性 ID 和選項 ID 都是隨機生成的 GUID
- 每個看板的配置都不同
- 必須從實際看板配置中獲取

### 2. **理解不同屬性類型的要求**
- **select 類型**: 需要選項 ID (如 Status, Priority)
- **person 類型**: 需要用戶 ID，不是用戶名稱
- **text 類型**: 直接使用字串值 (如 Describe, Tag)
- **number 類型**: 使用數字值 (如 Estimated Hours)
- **date 類型**: 通常使用 ISO 字串或特定格式

### 3. **正確的調試方法**
1. 先獲取看板配置
2. 添加詳細日誌
3. 使用 browser 驗證結果
4. 逐步修復每個欄位

### 4. **日期格式處理**
```javascript
// ✅ 正確的日期格式化
formatDateForFocalboard(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

## 📊 最終結果

### ✅ 成功修復的欄位:
- Status: 正確顯示狀態標籤
- Priority: 正確顯示優先級標籤  
- Estimated Hours: 正確顯示數字
- Due Date: 正確顯示日期格式
- Describe: 正確顯示描述文字
- Tag: 正確顯示標籤文字

### ⚠️ 需要注意的欄位:
- Assignee: person 類型需要用戶 ID，不是用戶名稱

## 🔧 預防措施

1. **建立標準流程**: 每次整合新看板時，先獲取配置
2. **創建工具腳本**: 自動獲取和分析看板屬性配置
3. **添加驗證機制**: 創建任務後自動驗證欄位顯示
4. **文檔記錄**: 記錄每個看板的屬性映射配置

## 💡 改進建議

1. **動態屬性映射**: 從看板配置自動生成屬性映射
2. **用戶 ID 映射**: 建立用戶名稱到 ID 的映射表
3. **屬性類型檢查**: 根據屬性類型自動格式化數據
4. **錯誤處理**: 當屬性 ID 不存在時提供友好錯誤信息

---

**記住**: Focalboard 整合的關鍵是**準確的屬性映射**，永遠從實際配置中獲取 ID，不要假設或複製！
