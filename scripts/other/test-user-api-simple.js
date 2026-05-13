/**
 * DaoDao User API 測試腳本 (Node.js 版本)
 * 測試分支: feat/update-user-create-flow
 *
 * 使用方式:
 * 1. npm install axios
 * 2. node scripts/test-user-api-simple.js
 */

const axios = require('axios');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
let AUTH_TOKEN = "PRIVATE_RUNTIME_AUTH_TOKEN_REQUIRED";
let CREATED_USER_ID = '';
let CUSTOM_ID = '';

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
};

// API 請求輔助函數
async function apiRequest(method, endpoint, data = null, description = '') {
  console.log('\n' + '='.repeat(60));
  log.info(`測試: ${description}`);
  log.info(`端點: ${method} ${endpoint}`);

  if (data) {
    log.info('請求資料:');
    console.log(JSON.stringify(data, null, 2));
  }

  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (AUTH_TOKEN) {
      config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);

    log.info('回應:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      log.success('✓ 測試通過');
    }

    return response.data;
  } catch (error) {
    log.error('✗ 測試失敗');
    if (error.response) {
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

// ==============================================
// 測試 1: 獲取可用的偏好選項
// ==============================================
async function testGetAvailablePreferences() {
  return await apiRequest(
    'GET',
    '/api/users/preferences/available',
    null,
    '獲取系統所有可用的偏好選項'
  );
}

// ==============================================
// 測試 2: 創建用戶 (包含所有新欄位)
// ==============================================
async function testCreateUser() {
  const userData = {
    gender: 'male',
    birthDate: '1995-06-15',
    educationStage: 'university',
    isOpenLocation: true,
    isOpenProfile: true,
    isSubscribeEmail: true,
    location: '台北市',
    roleList: ['工程師', '學生'],
    selfIntroduction: '我是一名熱愛學習的軟體工程師，對教育科技充滿熱情。',
    share: '我可以分享程式設計、系統架構設計的經驗',
    wantToDoList: ['interaction', 'do-project'],
    tagList: ['JavaScript', 'TypeScript', 'Node.js', '教育科技'],

    // 新增: 興趣清單 (category names)
    interestList: ['information_and_computer_science', 'education_learning'],

    // 新增: 偏好設定
    preferences: {
      learningStyle: ['hands_on', 'theoretical'],
      contentType: ['video', 'article'],
    },

    contactList: {
      instagram: '@test_user',
      discord: 'TestUser#1234',
      line: 'test_line_id',
      facebook: 'test.user',
    },

    // 新增欄位
    professionalField: 'information_and_communication_technologies_icts',
    personalSlogan: '終身學習者，用科技改變教育',
    referralSource: 'instagram',

    isSendEmail: false, // 測試環境設為 false
  };

  const result = await apiRequest(
    'POST',
    '/api/users',
    userData,
    '創建完整用戶資料 (包含新欄位)'
  );

  if (result && result.success) {
    CREATED_USER_ID = result.data.user.id;
    AUTH_TOKEN = result.data.token;
    log.success(`用戶創建成功! User ID: ${CREATED_USER_ID}`);
  }

  return result;
}

// ==============================================
// 測試 3: 獲取當前用戶資料
// ==============================================
async function testGetMe() {
  return await apiRequest(
    'GET',
    '/api/me',
    null,
    '獲取當前登入用戶的完整資料'
  );
}

// ==============================================
// 測試 4: 更新用戶資料
// ==============================================
async function testUpdateUser() {
  const updateData = {
    name: '測試用戶(已更新)',
    selfIntroduction: '更新後的自我介紹：我是一名全端工程師，專注於教育科技領域的創新。',
    tagList: ['JavaScript', 'TypeScript', 'React', '教育科技', 'AI'],

    // 更新興趣清單
    interestList: [
      'information_and_computer_science',
      'education_learning',
      'arts_and_design',
    ],

    // 更新偏好設定
    preferences: {
      learningStyle: ['hands_on', 'group_discussion'],
      contentType: ['video', 'hands_on_practice'],
      difficulty: ['beginner_friendly'],
    },

    // 更新新欄位
    professionalField: 'education',
    personalSlogan: '用教育改變世界，讓學習更有趣',
    referralSource: 'friend_referral',

    contactList: {
      instagram: '@updated_user',
      discord: 'UpdatedUser#5678',
    },
  };

  return await apiRequest(
    'PUT',
    '/api/me',
    updateData,
    '更新用戶資料 (包含新欄位)'
  );
}

// ==============================================
// 測試 5: CustomId 功能測試
// ==============================================
async function testCustomIdFeatures() {
  // 5.1 檢查 customId 可用性
  CUSTOM_ID = `test_user_${Date.now()}`;

  log.info('\n--- 5.1 檢查 customId 可用性 ---');
  const availability = await apiRequest(
    'GET',
    `/api/users/custom-id/${CUSTOM_ID}/availability`,
    null,
    `檢查 customId "${CUSTOM_ID}" 是否可用`
  );

  if (!availability || !availability.data.available) {
    log.warning('CustomId 不可用，生成新的 ID');
    CUSTOM_ID = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 5.2 設置 customId
  log.info('\n--- 5.2 設置 customId ---');
  const setResult = await apiRequest(
    'POST',
    '/api/me/custom-id',
    { customId: CUSTOM_ID },
    `設置 customId 為 "${CUSTOM_ID}"`
  );

  if (setResult && setResult.success) {
    log.success(`CustomId 設置成功: ${CUSTOM_ID}`);
  }

  // 5.3 通過 customId 獲取用戶資料
  log.info('\n--- 5.3 通過 customId 獲取用戶 ---');
  await apiRequest(
    'GET',
    `/api/users/custom-id/${CUSTOM_ID}`,
    null,
    `通過 customId "${CUSTOM_ID}" 獲取用戶資料`
  );

  // 5.4 驗證 customId 已被使用
  log.info('\n--- 5.4 驗證 customId 已被使用 ---');
  await apiRequest(
    'GET',
    `/api/users/custom-id/${CUSTOM_ID}/availability`,
    null,
    `再次檢查 customId "${CUSTOM_ID}" 應該不可用`
  );

  // 5.5 測試移除 customId
  log.info('\n--- 5.5 移除 customId ---');
  await apiRequest(
    'DELETE',
    '/api/me/custom-id',
    null,
    '移除當前用戶的 customId'
  );

  // 5.6 驗證 customId 已移除
  log.info('\n--- 5.6 驗證 customId 已移除 ---');
  const meAfterRemove = await apiRequest(
    'GET',
    '/api/me',
    null,
    '確認 customId 已被移除'
  );

  if (meAfterRemove && meAfterRemove.data.customId === null) {
    log.success('CustomId 移除成功');
  }
}

// ==============================================
// 測試 6: 用戶列表與搜尋
// ==============================================
async function testUserList() {
  log.info('\n--- 6.1 獲取用戶列表 ---');
  await apiRequest(
    'GET',
    '/api/users?page=1&pageSize=10',
    null,
    '獲取公開用戶列表 (分頁)'
  );

  log.info('\n--- 6.2 搜尋用戶 ---');
  await apiRequest(
    'GET',
    '/api/users?page=1&pageSize=5&educationStage=university&search=工程師',
    null,
    '搜尋大學階段且包含"工程師"關鍵字的用戶'
  );
}

// ==============================================
// 測試 7: 通過 ID 獲取用戶
// ==============================================
async function testGetUserById() {
  if (!CREATED_USER_ID) {
    log.warning('未找到創建的用戶 ID，跳過此測試');
    return;
  }

  await apiRequest(
    'GET',
    `/api/users/${CREATED_USER_ID}`,
    null,
    `獲取指定用戶 (ID: ${CREATED_USER_ID}) 的完整資料`
  );
}

// ==============================================
// 測試 8: 用戶偏好設定管理
// ==============================================
async function testUserPreferences() {
  log.info('\n--- 8.1 獲取當前用戶偏好 ---');
  const currentPrefs = await apiRequest(
    'GET',
    '/api/me/preferences',
    null,
    '獲取當前用戶的偏好設定'
  );

  log.info('\n--- 8.2 更新用戶偏好 ---');

  // 注意: 這裡的 preferenceTypeId 和 optionId 需要根據實際資料庫資料調整
  const prefsUpdate = {
    preferences: [
      {
        preferenceTypeId: 1,
        optionId: 1,
        isSelected: true,
      },
      {
        preferenceTypeId: 1,
        optionId: 2,
        isSelected: true,
      },
      {
        preferenceTypeId: 2,
        optionId: 3,
        isSelected: true,
      },
    ],
  };

  await apiRequest(
    'PUT',
    '/api/me/preferences',
    prefsUpdate,
    '更新用戶偏好設定'
  );
}

// ==============================================
// 測試 9: 欄位驗證測試
// ==============================================
async function testFieldValidation() {
  log.info('\n--- 9.1 測試無效的專業領域 ---');
  await apiRequest(
    'PUT',
    '/api/me',
    { professionalField: 'invalid_field_name' },
    '測試無效的 professionalField (應該失敗)'
  );

  log.info('\n--- 9.2 測試過長的個人標語 ---');
  await apiRequest(
    'PUT',
    '/api/me',
    { personalSlogan: 'A'.repeat(300) },
    '測試超過 200 字的 personalSlogan (應該失敗)'
  );

  log.info('\n--- 9.3 測試超過 5 個興趣 ---');
  await apiRequest(
    'PUT',
    '/api/me',
    {
      interestList: [
        'information_and_computer_science',
        'education_learning',
        'arts_and_design',
        'nature_environment',
        'health_and_wellness',
        'business_and_entrepreneurship',
      ],
    },
    '測試超過 5 個興趣 (應該失敗)'
  );

  log.info('\n--- 9.4 測試無效的 customId 格式 ---');
  await apiRequest(
    'POST',
    '/api/me/custom-id',
    { customId: '___invalid___' },
    '測試無效的 customId 格式 (應該失敗)'
  );
}

// ==============================================
// 主測試流程
// ==============================================
async function main() {
  console.log('\n' + '='.repeat(60));
  log.info('DaoDao User API 測試腳本 (Node.js 版本)');
  log.info(`API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(60));

  try {
    // 提示: 需要先有臨時用戶 token
    log.warning('\n請注意: 如果要測試完整的創建用戶流程,');
    log.warning('需要先通過 Google OAuth 創建臨時用戶並獲取 token。');
    log.warning('可以設置環境變數 AUTH_TOKEN=<你的token> 來跳過創建步驟。\n');

    if (process.env.AUTH_TOKEN) {
      AUTH_TOKEN = process.env.AUTH_TOKEN;
      log.success('已從環境變數讀取 AUTH_TOKEN');
    }

    // 測試流程
    log.info('\n🚀 開始執行測試...\n');

    // 1. 獲取可用偏好選項
    await testGetAvailablePreferences();
    await sleep(500);

    // 2. 創建用戶 (如果沒有 token)
    if (!AUTH_TOKEN) {
      log.warning('\n未提供 AUTH_TOKEN，將嘗試創建新用戶');
      log.warning('注意: 創建用戶需要有效的臨時用戶 ID');
      // await testCreateUser();
      // await sleep(500);
    }

    // 3. 獲取當前用戶
    if (AUTH_TOKEN) {
      await testGetMe();
      await sleep(500);

      // 4. 更新用戶
      await testUpdateUser();
      await sleep(500);

      // 5. CustomId 功能測試
      await testCustomIdFeatures();
      await sleep(500);

      // 6. 用戶列表與搜尋
      await testUserList();
      await sleep(500);

      // 7. 通過 ID 獲取用戶
      await testGetUserById();
      await sleep(500);

      // 8. 偏好設定管理
      await testUserPreferences();
      await sleep(500);

      // 9. 欄位驗證測試
      await testFieldValidation();
    }

    console.log('\n' + '='.repeat(60));
    log.success('所有測試執行完畢！');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    log.error('測試執行過程中發生錯誤:');
    console.error(error);
    process.exit(1);
  }
}

// 輔助函數: sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 執行測試
main();
