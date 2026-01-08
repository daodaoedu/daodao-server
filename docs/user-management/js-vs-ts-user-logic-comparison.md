# JavaScript vs TypeScript 用戶邏輯比較分析

## 概覽

通過比較原始 JavaScript (`controllers/user.js`) 與新的 TypeScript (`src/services/user.service.ts`) 實現，發現了幾個關鍵差異和潛在問題。

## 🔍 **主要差異分析**

### 1. **臨時用戶處理差異**

#### JavaScript 版本 (原始邏輯)
```javascript
// controllers/user.js:359-363
tempUser = await TempUser.findOne({ _id: req.user._id });
console.log("tempUser", tempUser);
if (!tempUser) {
  return res.status(404).json({ error: 'Temporary user not found' });
}
```

#### TypeScript 版本 (新邏輯)
```typescript
// user.service.ts:369-376
const tempUser = await tx.temp_users.findUnique({
  where: { id: parseInt(tempUserId) }
});

if (!tempUser) {
  throw new NotFoundError('Temporary user not found');
}
```

**關鍵差異**:
- **資料庫**: JS 使用 MongoDB (`TempUser.findOne`)，TS 使用 PostgreSQL (`prisma.temp_users`)
- **查詢方式**: JS 用 `_id`（MongoDB ObjectId），TS 用 `id`（數字 ID）
- **錯誤處理**: JS 直接返回 HTTP 回應，TS 拋出自定義錯誤

### 2. **isSendEmail 處理邏輯差異**

#### JavaScript 版本 (簡化邏輯)
```javascript
// controllers/user.js:502-508
console.log('isSendEmail', isSendEmail);
if (isSendEmail) {
  await sendVerifiedEmail(createdUser.Contact?.email, createdUser.nickname, verifyLink);
  
  await TempUser.findByIdAndDelete(req.user._id);
  console.log('TempUser删除成功:');
}
```

#### TypeScript 版本 (複雜邏輯)
```typescript
// user.service.ts:488-498
if (isSendEmail && createdUser.contacts?.email) {
  await emailService.sendVerificationEmail(
    createdUser.contacts.email, 
    `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
  );
  
  await tx.temp_users.delete({ where: { id: tempUser.id } });
}
```

**關鍵差異**:
- **條件檢查**: TS 版本增加了 `createdUser.contacts?.email` 檢查
- **交易管理**: TS 在同一交易內刪除臨時用戶
- **錯誤處理**: TS 版本如果交易失敗會回滾所有操作

## ⚠️ **發現的問題**

### 1. **資料一致性問題**
```javascript
// JS版本的問題：交易外刪除臨時用戶
await transaction.commit();  // 先提交正式用戶創建
// ... 然後在交易外刪除臨時用戶
if (isSendEmail) {
  await sendVerifiedEmail(...);
  await TempUser.findByIdAndDelete(req.user._id);  // 在交易外執行！
}
```

**風險**: 如果郵件發送失敗，正式用戶已經創建但臨時用戶沒有刪除，造成數據不一致。

### 2. **臨時用戶清理策略不同**

#### JavaScript 版本
- **觸發條件**: 僅當 `isSendEmail === true` 時刪除
- **時機**: 交易提交後
- **風險**: `isSendEmail === false` 時臨時用戶永不清理

#### TypeScript 版本
- **觸發條件**: `isSendEmail === true` 且有郵件地址
- **時機**: 交易內
- **同樣風險**: `isSendEmail === false` 時臨時用戶永不清理

### 3. **錯誤處理差異**

#### JavaScript 版本
```javascript
// controllers/user.js:513-533
} catch (error) {
  if (transaction.finished !== 'commit') {
    await transaction.rollback();
  }
  // 詳細的錯誤日誌
  console.error('完整錯誤日誌：', {
    error: error.toString(),
    stack: error.stack,
    sql: error.sql,
    requestData: { ... },
    newUserId: newUser?.id
  });
}
```

#### TypeScript 版本
```typescript
// user.service.ts 中拋出錯誤，由上層處理
throw new NotFoundError('Temporary user not found');
```

**差異**: JS 版本有完整的錯誤日誌和恢復機制，TS 版本依賴上層錯誤處理。

## 🔧 **建議修正方案**

### 1. **統一臨時用戶清理策略**

建議採用 JavaScript 版本的改進版本：

```typescript
// 建議的 TypeScript 改進版本
const newToken = jwtService.generateToken({
  id: createdUser.id,
  _id: createdUser.external_id || '',
  isTemp: false,
});

// 總是嘗試發送郵件（如果有郵件地址）
let emailSent = false;
if (isSendEmail && createdUser.contacts?.email) {
  try {
    await emailService.sendVerificationEmail(
      createdUser.contacts.email, 
      `${process.env.BACKEND_URL}/email/verify?token=${newToken}`
    );
    emailSent = true;
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
    // 不要因為郵件失敗而回滾整個用戶創建
  }
}

// 總是清理臨時用戶（在交易內）
await tx.temp_users.delete({ where: { id: tempUser.id } });

return {
  user: formatUserResponse(createdUser),
  token: newToken,
  emailSent
};
```

### 2. **增強錯誤處理**

```typescript
// 增加類似 JS 版本的詳細錯誤日誌
try {
  // ... 用戶創建邏輯
} catch (error) {
  console.error('用戶創建失敗:', {
    error: error.toString(),
    stack: error.stack,
    tempUserId,
    userData: {
      email: tempUser?.email,
      nickname: tempUser?.name
    }
  });
  throw error; // 重新拋出讓上層處理
}
```

### 3. **資料庫遷移一致性**

確保 MongoDB 的臨時用戶數據能正確遷移到 PostgreSQL：

```typescript
// 添加數據遷移檢查
const tempUser = await tx.temp_users.findUnique({
  where: { id: parseInt(tempUserId) }
});

if (!tempUser) {
  // 嘗試從 MongoDB 查找（過渡期）
  const mongoTempUser = await findMongoTempUser(tempUserId);
  if (mongoTempUser) {
    // 遷移到 PostgreSQL
    tempUser = await migrateTempUser(mongoTempUser, tx);
  } else {
    throw new NotFoundError('Temporary user not found');
  }
}
```

## 📊 **邏輯流程比較**

### JavaScript 版本流程
```
1. 查找 MongoDB 臨時用戶
2. 檢查用戶名稱重複
3. 在 PostgreSQL 交易中創建用戶相關記錄
4. 提交交易
5. 如果 isSendEmail === true:
   - 發送郵件
   - 刪除 MongoDB 臨時用戶
6. 返回結果
```

### TypeScript 版本流程
```
1. 在 PostgreSQL 交易中:
   - 查找 PostgreSQL 臨時用戶
   - 檢查用戶名稱重複
   - 創建用戶相關記錄
   - 如果 isSendEmail === true 且有郵件:
     - 發送郵件
     - 刪除臨時用戶
   - 提交交易
2. 返回結果
```

## 🎯 **總結與建議**

### 優點比較
- **JavaScript 版本**: 錯誤處理完整，日誌詳細
- **TypeScript 版本**: 交易一致性較好，型別安全

### 主要問題
1. **兩個版本都有臨時用戶清理不完整的問題**
2. **TypeScript 版本可能缺少詳細的錯誤處理**
3. **資料庫混用造成的一致性問題**

### 最終建議
1. **統一臨時用戶清理**: 無論 `isSendEmail` 值為何都應清理
2. **改進錯誤處理**: 借鑑 JS 版本的詳細日誌
3. **分離郵件發送**: 不要讓郵件發送失敗影響用戶創建
4. **數據遷移策略**: 制定完整的 MongoDB 到 PostgreSQL 遷移計劃