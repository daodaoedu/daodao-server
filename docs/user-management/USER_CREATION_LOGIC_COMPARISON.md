# 用戶新增邏輯比較分析

## 文件目的
分析原始 JavaScript 版本 (`/controllers/user.js`) 與現代 TypeScript 版本 (`/src/controllers/user.controller.ts` 和 `/src/services/user.service.ts`) 的用戶創建邏輯差異。

## 架構差異

### 原始 JavaScript 版本
- **位置**: `/controllers/user.js` (第 328-534 行)
- **架構**: 控制器直接處理業務邏輯
- **資料庫**: 使用 Sequelize ORM
- **事務處理**: 手動管理 Sequelize transaction
- **錯誤處理**: 基本的 try-catch 與狀態碼響應

### 現代 TypeScript 版本
- **位置**: `/src/controllers/user.controller.ts` (第 73-84 行) + `/src/services/user.service.ts` (第 548-729 行)
- **架構**: 控制器 + 服務層分離架構
- **資料庫**: 使用 Prisma ORM
- **事務處理**: Prisma 的 `$transaction` API
- **錯誤處理**: 統一的錯誤中間件與自定義錯誤類型

## 詳細功能比較

### 1. 臨時用戶驗證

**原始版本** (user.js:358-363):
```javascript
tempUser = await TempUser.findOne({ _id: req.user._id });
if (!tempUser) {
  return res.status(404).json({ error: 'Temporary user not found' });
}
```

**TypeScript 版本** (user.service.ts:569-575):
```typescript
const tempUser = await tx.temp_users.findUnique({
  where: { id: parseInt(tempUserId) }
});
if (!tempUser) {
  throw new NotFoundError('Temporary user not found');
}
```

**差異分析**:
- **查詢方式**: Sequelize `findOne` vs Prisma `findUnique`
- **ID 處理**: MongoDB ObjectId (`_id`) vs 整數 ID (`parseInt`)
- **錯誤處理**: 直接回應 vs 拋出自定義錯誤

### 2. 重複用戶檢查

**原始版本** (user.js:365-377):
```javascript
const existingUser = await User.findOne({
  where: { nickname: req.user.name },
  transaction
});

if (existingUser) {
  await transaction.rollback();
  return res.status(400).json({
    error: true,
    message: "建立失敗",
    details: `使用者名稱 ${nickname} 已存在`
  });
}
```

**TypeScript 版本** (user.service.ts:578-584):
```typescript
const existingUser = await tx.users.findFirst({
  where: { nickname: tempUser.name }
});

if (existingUser) {
  throw new ConflictError(`使用者名稱 ${tempUser.name} 已存在`);
}
```

**差異分析**:
- **查詢方式**: Sequelize `findOne` vs Prisma `findFirst`
- **事務管理**: 手動 rollback vs 自動處理
- **錯誤拋出**: 統一的 ConflictError 類型

### 3. 地區資料處理

**原始版本** (user.js:393-409):
```javascript
let locationId = null;
if (areaCode) {
  const area = await Area.findOne({
    where: { city: areaCode },
    transaction
  });

  if (!area) {
    await transaction.rollback();
    return res.status(400).json({
      error: true,
      message: "Invalid area code",
      details: `'${areaCode}' 不是有效的城市名稱`
    });
  }
  locationId = area.id;
}
```

**TypeScript 版本** (user.service.ts:587-609):
```typescript
let locationId: number | null = null;
if (areaCode) {
  const cityEnum = getCityNameMapping()[areaCode];
  
  if (!cityEnum) {
    throw new ConflictError(`'${areaCode}' 不是有效的城市名稱`);
  }
  
  const location = await tx.location.findFirst({
    where: {
      city: {
        name: cityEnum
      }
    }
  });
  
  if (!location) {
    throw new ConflictError(`找不到城市 '${areaCode}' 對應的地區資料`);
  }
  locationId = location.id;
}
```

**差異分析**:
- **映射機制**: 直接查詢 vs 先映射再查詢 (`getCityNameMapping()`)
- **類型安全**: TypeScript 強類型與 enum 驗證
- **關聯查詢**: 使用嵌套關聯查詢結構

### 4. 資料庫記錄創建

**原始版本** (user.js:411-441):
```javascript
const contact = await Contact.create({
  google_id: tempUser.googleID,
  photo_url: tempUser.photoURL,
  is_subscribe_email: isSubscribeEmail,
  email: tempUser.email,
  ig: contactList?.instagram,
  discord: contactList?.discord,
  line: contactList?.line,
  fb: contactList?.facebook
}, { transaction });

const basicInfo = await BasicInfo.create({
  self_introduction: selfIntroduction,
  share_list: share,
  want_to_do_list: wantToDoList
}, { transaction });

newUser = await User.create({
  mongo_id: tempUser._id.toString(),
  nickname: tempUser.name,
  gender,
  education_stage: educationStage,
  tag_list: tagList,
  contact_id: contact.id,
  is_open_location: isOpenLocation,
  location_id: locationId,
  role_id: 2,
  is_open_profile: isOpenProfile,
  birth_date: birthDate,
  basic_info_id: basicInfo.id,
}, { transaction });
```

**TypeScript 版本** (user.service.ts:612-650):
```typescript
const basicInfo = await tx.basic_info.create({
  data: {
    self_introduction: selfIntroduction,
    share_list: Array.isArray(share) ? share.join(',') : share,
    want_to_do_list: validateWantToDoList(wantToDoList || [])
  }
});

const contact = await tx.contacts.create({
  data: {
    google_id: tempUser.google_id,
    photo_url: tempUser.photo_url,
    is_subscribe_email: isSubscribeEmail,
    email: tempUser.email,
    ig: contactList?.instagram,
    discord: contactList?.discord,
    line: contactList?.line,
    fb: contactList?.facebook
  }
});

const newUser = await tx.users.create({
  data: {
    mongo_id: tempUser.id.toString(),
    nickname: tempUser.name,
    gender: gender as 'male' | 'female' | 'other' | undefined,
    education_stage: (educationStage as 'university' | 'high' | 'other') || 'other',
    tag_list: [],
    contact_id: contact.id,
    is_open_location: isOpenLocation ?? true,
    location_id: locationId,
    role_id: 2,
    is_open_profile: isOpenProfile ?? true,
    birth_date: birthDate ? new Date(birthDate) : null,
    basic_info_id: basicInfo.id,
  }
});
```

**差異分析**:
- **Prisma data 包裝**: 所有 create 操作需要 `data` 屬性
- **資料驗證**: 增加 `validateWantToDoList()` 函數進行資料驗證
- **類型轉換**: 顯式類型轉換 (`as 'male' | 'female' | 'other'`)
- **預設值處理**: 使用 nullish coalescing (`??`) 運算符
- **標籤處理**: 標籤改為空陣列，後續透過 `entity_tags` 表處理

### 5. 職位關聯處理

**原始版本** (user.js:443-465):
```javascript
if (roleList && roleList.length) {
  const positions = await Position.findAll({
    where: { name: { [Op.in]: roleList } },
    transaction
  });

  if (positions.length > 0) {
    const positionValues = positions.map(position => ({
      user_id: newUser.id,
      position_id: position.id
    }));

    const insertQuery = `
      INSERT INTO user_positions (user_id, position_id)
      VALUES ${positionValues.map(v => `(${v.user_id}, ${v.position_id})`).join(',')}
    `;

    await sequelize.query(insertQuery, {
      transaction
    });
  }
}
```

**TypeScript 版本** (user.service.ts:652-666):
```typescript
if (roleList && roleList.length > 0) {
  const positions = await tx.position.findMany({
    where: { name: { in: roleList } }
  });

  if (positions.length > 0) {
    await tx.user_positions.createMany({
      data: positions.map(position => ({
        user_id: newUser.id,
        position_id: position.id
      }))
    });
  }
}
```

**差異分析**:
- **查詢方法**: Sequelize `findAll` vs Prisma `findMany`
- **插入方式**: 原生 SQL vs Prisma `createMany`
- **程式碼簡潔性**: Prisma 版本更簡潔，沒有手動 SQL 組裝

### 6. 新功能處理

**TypeScript 版本新增功能**:

1. **偏好設定處理** (user.service.ts:694-696):
```typescript
if (preferences) {
  await handleUserPreferences(createdUser.id, preferences, tx);
}
```

2. **標籤處理** (user.service.ts:698-701):
```typescript
if (tagList && tagList.length > 0) {
  await tagService.setEntityTags('user', createdUser.id, tagList, createdUser.id, tx);
}
```

**新增說明**:
- 偏好設定透過專用的 `user_preferences` 表處理
- 標籤改用 `entity_tags` 表統一管理，支援多實體類型

### 7. Token 生成與郵件發送

**原始版本** (user.js:492-508):
```javascript
const newToken = generateToken({
  id: createdUser.id,
  _id: createdUser.external_id,
  isTemp: false,
});

const verifyLink = `${BACKEND_URL}/email/verify?token=${newToken}`;

if (isSendEmail) {
  await sendVerifiedEmail(createdUser.Contact?.email, createdUser.nickname, verifyLink);
  await TempUser.findByIdAndDelete(req.user._id);
}
```

**TypeScript 版本** (user.service.ts:704-720):
```typescript
const newToken = jwtService.generateToken({
  id: createdUser.id,
  _id: createdUser.external_id || '',
  isTemp: false,
});

if (isSendEmail && createdUser.contacts?.email) {
  await emailService.sendVerificationEmail(
    createdUser.contacts.email, 
    `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
  );
  
  await tx.temp_users.delete({ where: { id: tempUser.id } });
}
```

**差異分析**:
- **服務分離**: 使用 `jwtService` 和 `emailService` 服務
- **空值安全**: TypeScript 版本有更好的空值檢查
- **刪除方式**: Prisma `delete` vs MongoDB `findByIdAndDelete`

### 8. 響應格式

**原始版本** (user.js:511):
```javascript
res.status(201).json({ 
  message: "User created successfully", 
  user: formatUserResponse(createdUser), 
  token: newToken 
});
```

**TypeScript 版本** (user.service.ts:722-727):
```typescript
const result = {
  user: await formatUserResponse(createdUser),
  token: newToken
};

return createSuccessResponse(result);
```

**差異分析**:
- **響應標準化**: 使用 `createSuccessResponse` 統一響應格式
- **訊息處理**: 移除硬編碼的 success message

## 核心差異摘要

### 1. 架構層面
- **分層設計**: TypeScript 版本實現控制器與服務層分離
- **錯誤處理**: 統一的錯誤中間件取代分散的錯誤響應
- **類型安全**: TypeScript 提供編譯時類型檢查

### 2. 資料庫層面
- **ORM 遷移**: 從 Sequelize 遷移到 Prisma
- **事務處理**: Prisma 提供更簡潔的事務 API
- **查詢語法**: Prisma 的查詢語法更直觀

### 3. 功能擴展
- **偏好設定**: 新增用戶偏好設定管理
- **標籤系統**: 改用統一的 entity_tags 系統
- **城市映射**: 增加城市名稱映射機制

### 4. 程式碼品質
- **類型安全**: 強類型檢查減少運行時錯誤
- **資料驗證**: 更嚴格的資料驗證函數
- **程式碼重用**: 服務層可被多個控制器重用

## 建議

1. **完整遷移**: 建議完全遷移到 TypeScript 版本，因為它提供更好的:
   - 類型安全
   - 錯誤處理
   - 程式碼維護性

2. **功能對齊**: 確保兩個版本的業務邏輯完全一致，特別是:
   - 資料驗證規則
   - 預設值處理
   - 錯誤回應格式

3. **測試覆蓋**: 為 TypeScript 版本增加完整的單元測試和整合測試

4. **文件更新**: 更新 API 文件以反映新的響應格式和錯誤處理方式

## 結論

TypeScript 版本相對於原始 JavaScript 版本有顯著改進，在架構設計、類型安全、錯誤處理和功能擴展方面都有明顯提升。建議優先使用 TypeScript 版本，並逐步廢棄 JavaScript 版本。