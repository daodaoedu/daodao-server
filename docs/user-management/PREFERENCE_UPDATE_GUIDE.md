# 使用者偏好設定更新 API 使用指南

## 目錄
- [概述](#概述)
- [資料庫結構](#資料庫結構)
- [API 端點](#api-端點)
- [前端整合範例](#前端整合範例)
- [完整使用流程](#完整使用流程)
- [錯誤處理](#錯誤處理)
- [最佳實踐](#最佳實踐)

---

## 概述

本文檔說明如何使用 DaoDao 平台的使用者偏好設定 API。使用者偏好設定允許使用者自訂學習偏好、通知設定等個人化選項。

### 核心概念

- **Preference Type（偏好類型）**：偏好的類別，例如「學習領域」、「通知設定」等
- **Preference Option（偏好選項）**：每個類型下的具體選項，例如「前端開發」、「後端開發」等
- **User Preference（使用者偏好）**：使用者對特定選項的選擇狀態（已選/未選）

---

## 資料庫結構

### 相關資料表

#### 1. `preference_types` - 偏好類型表
```typescript
{
  id: number;                    // 唯一識別ID
  name: string;                  // 類型名稱（例如「學習領域」）
  value: string;                 // 唯一標識符（例如"learning_area"）
  description: string | null;    // 類型描述
  max_selections: number | null; // 最大可選數量（預設3）
  display_order: number;         // 顯示順序
  is_active: boolean;            // 是否啟用
  created_at: DateTime;
  updated_at: DateTime;
}
```

#### 2. `preference_options` - 偏好選項表
```typescript
{
  id: number;                    // 選項唯一ID
  preference_type_id: number;    // 所屬偏好類型ID（外鍵）
  name: string;                  // 選項名稱（例如「前端開發」）
  value: string;                 // 選項值（例如"frontend"）
  description: string | null;    // 選項描述
  display_order: number;         // 顯示順序
  is_active: boolean;            // 是否啟用
  selection_count: number;       // 被選擇次數
  created_at: DateTime;
  updated_at: DateTime;
}
```

#### 3. `user_preferences` - 使用者偏好表
```typescript
{
  id: number;                    // 記錄ID
  user_id: number;               // 使用者ID
  preference_option_id: number;  // 選項ID（外鍵）
  is_selected: boolean;          // 是否已選擇
  access_count: number;          // 存取次數
  created_at: DateTime;
  updated_at: DateTime;
}
```

---

## API 端點

### Base URL
```
https://api.daodao.edu/api/v1/me
```

### 1. 獲取使用者偏好設定

#### 請求
```http
GET /api/v1/me/preferences
Authorization: Bearer {JWT_TOKEN}
```

#### 查詢參數（可選）
| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `category` | string | 按分類篩選 | `學習偏好` |
| `includeSystem` | boolean | 是否包含系統設定 | `false` |

#### 成功回應 (200 OK)
```json
{
  "success": true,
  "data": {
    "preferences": [
      {
        "id": 123,
        "preferenceTypeId": 1,
        "optionId": 101,
        "isSelected": true,
        "preferenceType": {
          "id": 1,
          "name": "學習領域",
          "value": "learning_area",
          "description": "您感興趣的學習領域",
          "maxSelections": 3,
          "options": []
        },
        "option": {
          "id": 101,
          "value": "frontend",
          "name": "前端開發",
          "description": "包含 HTML、CSS、JavaScript、React 等"
        }
      }
    ],
    "categories": [
      {
        "type": {
          "id": 1,
          "name": "學習領域",
          "value": "learning_area",
          "description": "您感興趣的學習領域",
          "maxSelections": 3,
          "options": [
            {
              "id": 101,
              "value": "frontend",
              "name": "前端開發",
              "description": "包含 HTML、CSS、JavaScript、React 等"
            },
            {
              "id": 102,
              "value": "backend",
              "name": "後端開發",
              "description": "包含 Node.js、Python、資料庫等"
            }
          ]
        },
        "userSelections": [
          {
            "optionId": 101,
            "isSelected": true
          }
        ]
      }
    ]
  },
  "stats": {
    "totalPreferences": 5,
    "activeSelections": 3,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. 更新使用者偏好設定

#### 請求
```http
PUT /api/v1/me/preferences
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### 請求體
```json
{
  "preferences": [
    {
      "preferenceTypeId": 1,
      "optionId": 101,
      "isSelected": true
    },
    {
      "preferenceTypeId": 1,
      "optionId": 102,
      "isSelected": false
    },
    {
      "preferenceTypeId": 2,
      "optionId": 201,
      "isSelected": true
    }
  ]
}
```

#### 請求參數說明
| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `preferences` | Array | 是 | 偏好設定陣列（1-50項） |
| `preferences[].preferenceTypeId` | number | 是 | 偏好類型ID（必須為正整數） |
| `preferences[].optionId` | number | 是 | 偏好選項ID（必須為正整數） |
| `preferences[].isSelected` | boolean | 是 | 是否選擇此選項 |

#### 成功回應 (200 OK)
```json
{
  "success": true,
  "data": {
    "updated": 2,
    "created": 1,
    "deleted": 1
  },
  "message": "偏好設定已更新：處理 2 項，刪除 1 項",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

#### 錯誤回應 (400 Bad Request)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求資料驗證失敗",
    "details": {
      "preferences": "至少需要提供一個偏好設定"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

#### 錯誤回應 (401 Unauthorized)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "需要登入才能更新個人偏好設定"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

---

## 前端整合範例

### TypeScript 類型定義

```typescript
// API 回應類型
interface PreferenceOption {
  id: number;
  value: string;
  name: string;
  description?: string;
}

interface PreferenceType {
  id: number;
  name: string;
  value: string;
  description?: string;
  maxSelections?: number;
  options: PreferenceOption[];
}

interface UserPreference {
  id: number;
  preferenceTypeId: number;
  optionId: number;
  isSelected: boolean;
  preferenceType: PreferenceType;
  option: PreferenceOption;
}

interface PreferencesResponse {
  success: true;
  data: {
    preferences: UserPreference[];
    categories: Array<{
      type: PreferenceType;
      userSelections: Array<{
        optionId: number;
        isSelected: boolean;
      }>;
    }>;
  };
  stats: {
    totalPreferences: number;
    activeSelections: number;
    lastUpdated?: string;
  };
  timestamp: string;
}

interface UpdatePreferencesRequest {
  preferences: Array<{
    preferenceTypeId: number;
    optionId: number;
    isSelected: boolean;
  }>;
}

interface UpdatePreferencesResponse {
  success: true;
  data: {
    updated: number;
    created: number;
    deleted: number;
  };
  message: string;
  timestamp: string;
}
```

### React 整合範例

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://api.daodao.edu/api/v1';

// 1. 獲取偏好設定的 Hook
function useUserPreferences() {
  const [preferences, setPreferences] = useState<PreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get<PreferencesResponse>(
        `${API_BASE_URL}/me/preferences`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setPreferences(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取偏好設定失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return { preferences, loading, error, refetch: fetchPreferences };
}

// 2. 偏好設定組件
function PreferencesSettings() {
  const { preferences, loading, error, refetch } = useUserPreferences();
  const [selectedOptions, setSelectedOptions] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // 初始化已選擇的選項
  useEffect(() => {
    if (preferences?.data.preferences) {
      const selections: Record<number, boolean> = {};
      preferences.data.preferences.forEach(pref => {
        selections[pref.optionId] = pref.isSelected;
      });
      setSelectedOptions(selections);
    }
  }, [preferences]);

  // 處理選項變更
  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // 提交更新
  const handleSave = async () => {
    try {
      setSaving(true);

      // 構建更新請求
      const updateRequest: UpdatePreferencesRequest = {
        preferences: Object.entries(selectedOptions).map(([optionId, isSelected]) => {
          // 找到對應的 preferenceTypeId
          const preference = preferences?.data.preferences.find(
            p => p.optionId === Number(optionId)
          );

          return {
            preferenceTypeId: preference?.preferenceTypeId || 1, // 需要從 category 中找
            optionId: Number(optionId),
            isSelected
          };
        })
      };

      const response = await axios.put<UpdatePreferencesResponse>(
        `${API_BASE_URL}/me/preferences`,
        updateRequest,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert(response.data.message);
      await refetch(); // 重新獲取最新資料
    } catch (err) {
      alert('更新失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤：{error}</div>;
  if (!preferences) return <div>無資料</div>;

  return (
    <div className="preferences-settings">
      <h2>偏好設定</h2>

      {preferences.data.categories.map(category => (
        <div key={category.type.id} className="preference-category">
          <h3>{category.type.name}</h3>
          {category.type.description && (
            <p className="description">{category.type.description}</p>
          )}
          {category.type.maxSelections && (
            <p className="hint">最多可選擇 {category.type.maxSelections} 項</p>
          )}

          <div className="options">
            {category.type.options.map(option => (
              <label key={option.id} className="option-item">
                <input
                  type="checkbox"
                  checked={selectedOptions[option.id] || false}
                  onChange={() => handleOptionToggle(option.id)}
                />
                <div>
                  <strong>{option.name}</strong>
                  {option.description && (
                    <span className="option-desc">{option.description}</span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving}>
        {saving ? '儲存中...' : '儲存設定'}
      </button>

      <div className="stats">
        <p>已選擇：{preferences.stats.activeSelections} 項</p>
        {preferences.stats.lastUpdated && (
          <p>最後更新：{new Date(preferences.stats.lastUpdated).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
```

### Vue 3 整合範例

```typescript
<template>
  <div class="preferences-settings">
    <h2>偏好設定</h2>

    <div v-if="loading">載入中...</div>
    <div v-else-if="error">錯誤：{{ error }}</div>
    <div v-else-if="preferences">
      <div
        v-for="category in preferences.data.categories"
        :key="category.type.id"
        class="preference-category"
      >
        <h3>{{ category.type.name }}</h3>
        <p v-if="category.type.description" class="description">
          {{ category.type.description }}
        </p>
        <p v-if="category.type.maxSelections" class="hint">
          最多可選擇 {{ category.type.maxSelections }} 項
        </p>

        <div class="options">
          <label
            v-for="option in category.type.options"
            :key="option.id"
            class="option-item"
          >
            <input
              type="checkbox"
              :checked="selectedOptions[option.id]"
              @change="handleOptionToggle(option.id, category.type.id)"
            />
            <div>
              <strong>{{ option.name }}</strong>
              <span v-if="option.description" class="option-desc">
                {{ option.description }}
              </span>
            </div>
          </label>
        </div>
      </div>

      <button @click="handleSave" :disabled="saving">
        {{ saving ? '儲存中...' : '儲存設定' }}
      </button>

      <div class="stats">
        <p>已選擇：{{ preferences.stats.activeSelections }} 項</p>
        <p v-if="preferences.stats.lastUpdated">
          最後更新：{{ formatDate(preferences.stats.lastUpdated) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const API_BASE_URL = 'https://api.daodao.edu/api/v1';

const preferences = ref<PreferencesResponse | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const saving = ref(false);
const selectedOptions = reactive<Record<number, boolean>>({});
const optionTypeMap = reactive<Record<number, number>>({});

// 獲取偏好設定
const fetchPreferences = async () => {
  try {
    loading.value = true;
    const response = await axios.get<PreferencesResponse>(
      `${API_BASE_URL}/me/preferences`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    preferences.value = response.data;

    // 初始化選擇狀態
    response.data.data.preferences.forEach(pref => {
      selectedOptions[pref.optionId] = pref.isSelected;
      optionTypeMap[pref.optionId] = pref.preferenceTypeId;
    });

    error.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : '獲取偏好設定失敗';
  } finally {
    loading.value = false;
  }
};

// 處理選項切換
const handleOptionToggle = (optionId: number, typeId: number) => {
  selectedOptions[optionId] = !selectedOptions[optionId];
  optionTypeMap[optionId] = typeId;
};

// 儲存設定
const handleSave = async () => {
  try {
    saving.value = true;

    const updateRequest: UpdatePreferencesRequest = {
      preferences: Object.entries(selectedOptions).map(([optionId, isSelected]) => ({
        preferenceTypeId: optionTypeMap[Number(optionId)],
        optionId: Number(optionId),
        isSelected
      }))
    };

    const response = await axios.put<UpdatePreferencesResponse>(
      `${API_BASE_URL}/me/preferences`,
      updateRequest,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    alert(response.data.message);
    await fetchPreferences();
  } catch (err) {
    alert('更新失敗：' + (err instanceof Error ? err.message : '未知錯誤'));
  } finally {
    saving.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW');
};

onMounted(() => {
  fetchPreferences();
});
</script>
```

### Vanilla JavaScript 範例

```javascript
// API 客戶端
class PreferencesAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async getPreferences(params = {}) {
    const url = new URL(`${this.baseURL}/me/preferences`);
    Object.keys(params).forEach(key =>
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async updatePreferences(preferences) {
    const response = await fetch(`${this.baseURL}/me/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}

// 使用範例
const api = new PreferencesAPI(
  'https://api.daodao.edu/api/v1',
  localStorage.getItem('token')
);

// 獲取偏好設定
async function loadPreferences() {
  try {
    const data = await api.getPreferences();
    console.log('偏好設定：', data);
    renderPreferences(data);
  } catch (error) {
    console.error('載入失敗：', error);
  }
}

// 更新偏好設定
async function savePreferences(selectedOptions) {
  try {
    const preferences = Object.entries(selectedOptions).map(
      ([optionId, isSelected]) => ({
        preferenceTypeId: getTypeIdForOption(Number(optionId)),
        optionId: Number(optionId),
        isSelected
      })
    );

    const result = await api.updatePreferences(preferences);
    console.log('更新結果：', result);
    alert(result.message);
  } catch (error) {
    console.error('更新失敗：', error);
    alert('更新失敗');
  }
}

// 渲染偏好設定
function renderPreferences(data) {
  const container = document.getElementById('preferences-container');

  data.data.categories.forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'preference-category';

    const title = document.createElement('h3');
    title.textContent = category.type.name;
    categoryDiv.appendChild(title);

    if (category.type.description) {
      const desc = document.createElement('p');
      desc.textContent = category.type.description;
      categoryDiv.appendChild(desc);
    }

    category.type.options.forEach(option => {
      const label = document.createElement('label');
      label.className = 'option-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option.id;
      checkbox.checked = category.userSelections.some(
        s => s.optionId === option.id && s.isSelected
      );
      checkbox.addEventListener('change', (e) => {
        handleOptionChange(option.id, e.target.checked);
      });

      const optionText = document.createElement('span');
      optionText.textContent = option.name;

      label.appendChild(checkbox);
      label.appendChild(optionText);
      categoryDiv.appendChild(label);
    });

    container.appendChild(categoryDiv);
  });
}
```

---

## 完整使用流程

### 1. 初始載入偏好設定

```typescript
// Step 1: 獲取使用者當前偏好設定
const response = await fetch('https://api.daodao.edu/api/v1/me/preferences', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const data = await response.json();

// Step 2: 顯示所有偏好類別和選項
data.data.categories.forEach(category => {
  console.log(`類別：${category.type.name}`);
  console.log(`最多可選：${category.type.maxSelections}`);

  category.type.options.forEach(option => {
    const isSelected = category.userSelections.some(
      s => s.optionId === option.id && s.isSelected
    );
    console.log(`  - ${option.name}: ${isSelected ? '已選' : '未選'}`);
  });
});
```

### 2. 使用者修改偏好

```typescript
// 追蹤使用者的選擇
const userSelections = new Map();

// 當使用者點擊某個選項時
function onOptionClick(typeId, optionId, isSelected) {
  userSelections.set(optionId, {
    preferenceTypeId: typeId,
    optionId: optionId,
    isSelected: isSelected
  });
}

// 範例：使用者選擇「前端開發」
onOptionClick(1, 101, true);  // 類型1，選項101，選中
onOptionClick(1, 102, false); // 類型1，選項102，取消選中
```

### 3. 提交更新

```typescript
// 將所有變更提交到伺服器
async function submitPreferences() {
  const preferences = Array.from(userSelections.values());

  const response = await fetch('https://api.daodao.edu/api/v1/me/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ preferences })
  });

  const result = await response.json();

  if (result.success) {
    console.log('更新成功！');
    console.log(`處理了 ${result.data.updated} 項`);
    console.log(`刪除了 ${result.data.deleted} 項`);
  }
}
```

### 4. 完整範例：批次更新

```typescript
async function updateLearningAreaPreferences() {
  // 假設學習領域的 preferenceTypeId 是 1
  const learningAreaTypeId = 1;

  // 使用者想要選擇的選項
  const desiredOptions = [
    { optionId: 101, name: '前端開發', select: true },
    { optionId: 102, name: '後端開發', select: true },
    { optionId: 103, name: 'UI/UX 設計', select: false },
    { optionId: 104, name: '資料科學', select: true }
  ];

  // 構建更新請求
  const preferences = desiredOptions.map(opt => ({
    preferenceTypeId: learningAreaTypeId,
    optionId: opt.optionId,
    isSelected: opt.select
  }));

  try {
    const response = await fetch('https://api.daodao.edu/api/v1/me/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('更新結果：', result);

    // 顯示成功訊息
    alert(`偏好設定已更新！\n新增/更新：${result.data.updated} 項\n刪除：${result.data.deleted} 項`);

    return result;
  } catch (error) {
    console.error('更新失敗：', error);
    alert('更新失敗，請稍後再試');
    throw error;
  }
}

// 執行更新
updateLearningAreaPreferences();
```

---

## 錯誤處理

### 常見錯誤情況

#### 1. 驗證錯誤（400 Bad Request）

```typescript
// 錯誤原因：偏好設定陣列為空
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求資料驗證失敗",
    "details": {
      "preferences": "至少需要提供一個偏好設定"
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}

// 解決方案：確保 preferences 陣列至少有一個項目
if (preferences.length === 0) {
  throw new Error('至少需要選擇一個偏好');
}
```

#### 2. 未授權（401 Unauthorized）

```typescript
// 錯誤原因：JWT Token 無效或過期
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "需要登入才能更新個人偏好設定"
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}

// 解決方案：檢查並刷新 Token
async function refreshTokenIfNeeded() {
  const token = localStorage.getItem('token');
  if (!token) {
    // 導向登入頁面
    window.location.href = '/login';
    return;
  }

  // 檢查 Token 是否即將過期
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiryTime = payload.exp * 1000;

  if (Date.now() >= expiryTime - 5 * 60 * 1000) { // 5分鐘前
    // 刷新 Token
    await refreshToken();
  }
}
```

#### 3. 資料格式錯誤

```typescript
// 錯誤：preferenceTypeId 或 optionId 不是正整數
const invalidPreference = {
  preferenceTypeId: "1",  // ❌ 應該是數字
  optionId: -5,           // ❌ 應該是正整數
  isSelected: "true"      // ❌ 應該是布林值
};

// 正確格式
const validPreference = {
  preferenceTypeId: 1,    // ✅
  optionId: 101,          // ✅
  isSelected: true        // ✅
};
```

### 錯誤處理最佳實踐

```typescript
async function safeUpdatePreferences(preferences) {
  try {
    // 1. 前端驗證
    if (!Array.isArray(preferences) || preferences.length === 0) {
      throw new Error('偏好設定資料無效');
    }

    if (preferences.length > 50) {
      throw new Error('單次最多只能更新 50 個偏好設定');
    }

    // 2. 驗證每個項目
    preferences.forEach((pref, index) => {
      if (!Number.isInteger(pref.preferenceTypeId) || pref.preferenceTypeId <= 0) {
        throw new Error(`第 ${index + 1} 項的 preferenceTypeId 無效`);
      }
      if (!Number.isInteger(pref.optionId) || pref.optionId <= 0) {
        throw new Error(`第 ${index + 1} 項的 optionId 無效`);
      }
      if (typeof pref.isSelected !== 'boolean') {
        throw new Error(`第 ${index + 1} 項的 isSelected 必須是布林值`);
      }
    });

    // 3. 發送請求
    const response = await fetch(`${API_BASE_URL}/me/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });

    // 4. 處理回應
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || '更新失敗');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    // 5. 錯誤記錄和使用者通知
    console.error('偏好設定更新失敗：', error);

    // 根據錯誤類型顯示不同訊息
    if (error.message.includes('Token')) {
      alert('登入已過期，請重新登入');
      window.location.href = '/login';
    } else if (error.message.includes('驗證')) {
      alert('資料格式錯誤：' + error.message);
    } else {
      alert('更新失敗，請稍後再試');
    }

    throw error;
  }
}
```

---

## 最佳實踐

### 1. 性能優化

```typescript
// ✅ 好的做法：批次更新
async function batchUpdatePreferences(updates) {
  // 一次性提交所有變更
  return await updatePreferences(updates);
}

// ❌ 不好的做法：逐一更新
async function individualUpdates(updates) {
  // 避免在迴圈中發送多個請求
  for (const update of updates) {
    await updatePreferences([update]); // 這會造成多次網路請求
  }
}
```

### 2. 使用者體驗

```typescript
// 追蹤未儲存的變更
class PreferencesManager {
  constructor() {
    this.originalState = new Map();
    this.currentState = new Map();
    this.hasUnsavedChanges = false;
  }

  // 載入初始狀態
  loadPreferences(preferences) {
    preferences.forEach(pref => {
      const key = `${pref.preferenceTypeId}-${pref.optionId}`;
      this.originalState.set(key, pref.isSelected);
      this.currentState.set(key, pref.isSelected);
    });
  }

  // 更新選項
  toggleOption(typeId, optionId) {
    const key = `${typeId}-${optionId}`;
    const newValue = !this.currentState.get(key);
    this.currentState.set(key, newValue);
    this.checkForChanges();
  }

  // 檢查是否有變更
  checkForChanges() {
    this.hasUnsavedChanges = false;

    for (const [key, value] of this.currentState) {
      if (this.originalState.get(key) !== value) {
        this.hasUnsavedChanges = true;
        break;
      }
    }

    // 更新 UI 狀態（例如啟用/禁用儲存按鈕）
    this.updateUI();
  }

  // 離開前提醒
  setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '您有未儲存的變更，確定要離開嗎？';
      }
    });
  }
}
```

### 3. 快取策略

```typescript
class PreferencesCache {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.cacheDuration = 5 * 60 * 1000; // 5分鐘
  }

  // 從快取獲取
  async getPreferences(forceRefresh = false) {
    const now = Date.now();

    // 檢查快取是否有效
    if (
      !forceRefresh &&
      this.cache &&
      this.cacheTime &&
      (now - this.cacheTime) < this.cacheDuration
    ) {
      console.log('使用快取的偏好設定');
      return this.cache;
    }

    // 從 API 獲取
    console.log('從 API 獲取偏好設定');
    const data = await fetchPreferencesFromAPI();

    // 更新快取
    this.cache = data;
    this.cacheTime = now;

    return data;
  }

  // 清除快取
  invalidateCache() {
    this.cache = null;
    this.cacheTime = null;
  }

  // 更新後自動刷新快取
  async updateAndRefresh(preferences) {
    await updatePreferencesAPI(preferences);
    this.invalidateCache();
    return await this.getPreferences(true);
  }
}
```

### 4. 樂觀更新

```typescript
// 樂觀更新：立即更新 UI，如果失敗則回滾
async function optimisticUpdate(optionId, isSelected) {
  // 1. 儲存舊狀態
  const oldState = getCurrentState();

  // 2. 立即更新 UI
  updateUI(optionId, isSelected);

  try {
    // 3. 發送請求到伺服器
    await updatePreferences([{
      preferenceTypeId: getTypeId(optionId),
      optionId,
      isSelected
    }]);

    // 4. 成功 - 顯示成功提示
    showToast('設定已更新');

  } catch (error) {
    // 5. 失敗 - 回滾 UI
    restoreState(oldState);
    showToast('更新失敗，已恢復原始設定', 'error');
    throw error;
  }
}
```

### 5. 防抖動處理

```typescript
// 防止使用者快速點擊造成多次請求
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 使用防抖動的儲存函數
const debouncedSave = debounce(async (preferences) => {
  await updatePreferences(preferences);
}, 1000); // 1秒內只執行一次

// 當使用者變更設定時
function onPreferenceChange(typeId, optionId, isSelected) {
  updateLocalState(typeId, optionId, isSelected);
  debouncedSave(getAllPreferences());
}
```

### 6. 最大選擇數量限制

```typescript
function validateMaxSelections(preferences, maxSelections) {
  // 按類型分組
  const grouped = preferences.reduce((acc, pref) => {
    if (!acc[pref.preferenceTypeId]) {
      acc[pref.preferenceTypeId] = [];
    }
    if (pref.isSelected) {
      acc[pref.preferenceTypeId].push(pref);
    }
    return acc;
  }, {});

  // 檢查每個類型的選擇數量
  for (const [typeId, selected] of Object.entries(grouped)) {
    if (selected.length > maxSelections) {
      throw new Error(
        `類型 ${typeId} 最多只能選擇 ${maxSelections} 項，目前選擇了 ${selected.length} 項`
      );
    }
  }

  return true;
}

// 在 UI 中限制選擇
function handleOptionClick(category, optionId, currentlySelected) {
  const selectedCount = category.type.options.filter(
    opt => selectedOptions[opt.id]
  ).length;

  // 如果要選擇新項目，檢查是否超過限制
  if (!currentlySelected && selectedCount >= category.type.maxSelections) {
    alert(`最多只能選擇 ${category.type.maxSelections} 項`);
    return;
  }

  // 允許取消選擇或在限制內選擇
  toggleOption(optionId);
}
```

---

## 附錄

### API 端點總覽

| 方法 | 端點 | 說明 | 驗證 |
|------|------|------|------|
| GET | `/api/v1/me/preferences` | 獲取使用者偏好設定 | 需要 |
| PUT | `/api/v1/me/preferences` | 更新使用者偏好設定 | 需要 |

### 相關資源

- [API 完整文檔](/docs/API_GUIDE.md)
- [認證流程說明](/docs/AUTH_FLOW.md)
- [錯誤代碼參考](/docs/ERROR_CODES.md)

### 聯絡資訊

如有問題或建議，請聯絡：
- GitHub Issues: https://github.com/daodaoedu/daodao-server/issues
- Email: dev@daodao.edu

---

**最後更新：** 2024-01-15
**版本：** 1.0.0
