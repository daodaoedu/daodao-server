# 圖片上傳 - FormData 統一提交方案

> **目的**：解決「先上傳圖片，再建立資料」流程中的資料一致性問題
> **狀態**：待討論
> **日期**：2026-02-01

---

## 1. 問題描述

### 原本流程的問題

```
前端上傳圖片 → 取得圖片 URL → 呼叫 API 建立資料
     ✓              ✓                ✗
                                  失敗 → 孤兒圖片
```

### 影響

- 儲存空間浪費
- 無法追蹤哪些圖片是有效的

---

## 2. 解決方案：FormData 統一提交

### 核心概念

```
前端：FormData 一次送出 (圖片 + 表單資料)
                    ↓
後端：驗證表單資料 → 成功 → 上傳圖片到 R2 → 建立資料庫記錄
                    ↓ 失敗
              直接回傳錯誤 (圖片未上傳，無孤兒問題)
```

### 流程圖

```
┌─ 前端 ──────────────────────────────────────────────────────┐
│                                                             │
│  FormData {                                                 │
│    mood: "happy",                                           │
│    note: "今天完成了...",                                    │
│    images: [File, File, File]   ← 圖片檔案                   │
│  }                                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─ 後端 ──────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: 驗證表單資料 (不含圖片)                              │
│          ├── 失敗 → 回傳 400，圖片未處理，無孤兒              │
│          └── 成功 ↓                                         │
│                                                             │
│  Step 2: 上傳圖片到 R2                                       │
│          ├── 失敗 → 回傳 500，已上傳的圖片立即刪除            │
│          └── 成功 ↓                                         │
│                                                             │
│  Step 3: 建立資料庫記錄 (含圖片 URL)                          │
│          ├── 失敗 → 刪除已上傳的圖片                          │
│          └── 成功 → 回傳資料                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 前後端分工

### 前端職責

| 任務 | 說明 |
|-----|------|
| 收集表單資料 | 文字欄位等 |
| 圖片選擇與本地預覽 | 用戶選圖後顯示預覽 (不上傳) |
| 組裝 FormData | 將所有資料打包成 FormData |
| 顯示上傳進度 | 整體進度條 |
| 錯誤提示 | 顯示驗證錯誤或上傳失敗訊息 |

### 後端職責

| 任務 | 說明 |
|-----|------|
| 解析 FormData | 分離表單資料與圖片檔案 |
| 驗證表單資料 | **先驗證，再處理圖片** |
| 上傳圖片到 R2 | 驗證成功後才上傳 |
| 建立資料庫記錄 | 含圖片 URL |
| 錯誤回滾 | 失敗時刪除已上傳的圖片 |

---

## 4. API 範例

### 4.1 新增打卡 (含圖片)

```
POST /api/v1/practices/{practiceId}/checkins
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request (FormData)**

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `mood` | string | N | 心情 |
| `note` | string | N | 備註 (最多 300 字) |
| `tags` | string (JSON) | N | 標籤陣列 |
| `images` | File[] | N | 圖片檔案 (最多 3 張) |

**Request 範例 (前端)**

```typescript
const formData = new FormData();
formData.append('mood', 'happy');
formData.append('note', '今天讀了兩個章節，收穫很多！');
formData.append('tags', JSON.stringify(['專注', '有收穫']));

// 多張圖片 (最多 3 張)
images.forEach(file => {
  formData.append('images', file);
});

await api.post(`/practices/${practiceId}/checkins`, formData);
```

**Response (201)**

```json
{
  "success": true,
  "data": {
    "id": "checkin_abc123",
    "mood": "happy",
    "note": "今天讀了兩個章節，收穫很多！",
    "imageUrls": [
      "https://r2.daodao.com/images/aaa.jpg",
      "https://r2.daodao.com/images/bbb.jpg"
    ],
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

**後端處理邏輯**

```typescript
async function createCheckIn(req, res) {
  const { mood, note, tags } = parseFormData(req);
  const imageFiles = req.files || [];

  // 1. 驗證表單資料
  const validation = checkInSchema.safeParse({ mood, note, tags });
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  // 2. 上傳圖片到 R2
  const imageUrls: string[] = [];
  try {
    for (const file of imageFiles) {
      const url = await r2Service.upload(file);
      imageUrls.push(url);
    }
  } catch (uploadError) {
    // 清理已上傳的圖片
    await cleanupImages(imageUrls);
    throw new Error('圖片上傳失敗');
  }

  // 3. 建立資料庫記錄
  try {
    const checkIn = await prisma.practice_checkins.create({
      data: {
        practice_id: practiceId,
        user_id: userId,
        mood,
        note,
        image_urls: imageUrls,
        checkin_date: new Date()
      }
    });

    return res.status(201).json({ success: true, data: checkIn });

  } catch (dbError) {
    // DB 失敗，清理已上傳的圖片
    await cleanupImages(imageUrls);
    throw dbError;
  }
}
```

---

### 4.2 編輯打卡 - 部分更新圖片

**核心概念**：前端傳送「最終順序」，用 URL 或 `new:索引` 表示

```
PUT /api/v1/practices/{practiceId}/checkins/{checkinId}
Content-Type: multipart/form-data
```

**Request (FormData)**

| 欄位 | 類型 | 說明 |
|-----|------|------|
| `mood` | string | 心情 |
| `note` | string | 備註 |
| `imageOrder` | string (JSON) | 最終圖片順序，現有用 URL，新圖用 `new:0`, `new:1`... |
| `images` | File[] | 新上傳的圖片，順序對應 `new:索引` |

---

**範例 1：刪除 bbb，新增 ddd 到最後**

```
原本：[aaa, bbb, ccc]
操作：刪除 bbb，新增 ddd
結果：[aaa, ccc, ddd]
```

```typescript
const formData = new FormData();
formData.append('mood', 'happy');
formData.append('note', '修改後的內容');

// 最終順序：aaa, ccc, 新圖
formData.append('imageOrder', JSON.stringify([
  'https://r2.daodao.com/images/aaa.jpg',
  'https://r2.daodao.com/images/ccc.jpg',
  'new:0'  // 對應 images[0]
]));

// 新圖片
formData.append('images', dddFile);
```

---

**範例 2：刪除 bbb，新增 ddd 到中間**

```
原本：[aaa, bbb, ccc]
結果：[aaa, ddd, ccc]
```

```typescript
formData.append('imageOrder', JSON.stringify([
  'https://r2.daodao.com/images/aaa.jpg',
  'new:0',  // ddd 放中間
  'https://r2.daodao.com/images/ccc.jpg'
]));
formData.append('images', dddFile);
```

---

**範例 3：調換順序 (不上傳新圖)**

```
原本：[aaa, bbb, ccc]
結果：[ccc, aaa, bbb]
```

```typescript
formData.append('imageOrder', JSON.stringify([
  'https://r2.daodao.com/images/ccc.jpg',
  'https://r2.daodao.com/images/aaa.jpg',
  'https://r2.daodao.com/images/bbb.jpg'
]));
// 不 append images
```

---

**範例 4：全部替換**

```
原本：[aaa, bbb, ccc]
結果：[xxx, yyy]
```

```typescript
formData.append('imageOrder', JSON.stringify([
  'new:0',
  'new:1'
]));
formData.append('images', xxxFile);
formData.append('images', yyyFile);
```

---

**範例 5：刪除全部圖片**

```typescript
formData.append('imageOrder', JSON.stringify([]));
// 不 append images
```

---

**後端處理邏輯**

```typescript
async function updateCheckIn(req, res) {
  const { mood, note, imageOrder } = parseFormData(req);
  const newImageFiles = req.files || [];

  // 1. 取得現有打卡記錄
  const checkin = await prisma.practice_checkins.findUnique({ where: { id: checkinId } });
  const existingUrls = checkin.image_urls || [];

  // 2. 上傳新圖片到 R2，建立索引對應
  const newUrlMap: Record<string, string> = {};
  try {
    for (let i = 0; i < newImageFiles.length; i++) {
      newUrlMap[`new:${i}`] = await r2Service.upload(newImageFiles[i]);
    }
  } catch (uploadError) {
    await cleanupImages(Object.values(newUrlMap));
    throw new Error('圖片上傳失敗');
  }

  // 3. 解析 imageOrder，組合最終 URL 陣列
  const finalUrls = (imageOrder || []).map(item => {
    if (item.startsWith('new:')) {
      return newUrlMap[item];
    }
    return item;  // 現有 URL
  });

  // 4. 檢查數量限制 (最多 3 張)
  if (finalUrls.length > 3) {
    await cleanupImages(Object.values(newUrlMap));
    throw new BadRequestError('圖片最多 3 張');
  }

  // 5. 找出要刪除的圖片
  const urlsToDelete = existingUrls.filter(url => !finalUrls.includes(url));

  // 6. 更新資料庫
  try {
    await prisma.practice_checkins.update({
      where: { id: checkinId },
      data: { mood, note, image_urls: finalUrls }
    });
  } catch (dbError) {
    await cleanupImages(Object.values(newUrlMap));
    throw dbError;
  }

  // 7. 刪除不再使用的圖片 (成功後才刪)
  for (const url of urlsToDelete) {
    await r2Service.delete(url).catch(err => {
      logger.warn('Failed to delete image', { url, err });
    });
  }

  return res.json({ success: true, data: updatedCheckIn });
}
```

---

### 4.3 更新使用者頭像

**情境**：更新個人資料時一併更新頭像

```
PUT /api/v2/me
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Request (FormData)**

| 欄位 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `name` | string | N | 暱稱 |
| `gender` | string | N | 性別 |
| `birthDate` | string | N | 生日 |
| `avatar` | File | N | 新頭像圖片 |

**Request 範例 (前端)**

```typescript
const formData = new FormData();
formData.append('name', '小明');
formData.append('gender', 'male');
formData.append('birthDate', '1990-01-15');

// 頭像 (可選)
if (avatarFile) {
  formData.append('avatar', avatarFile);
}

await api.put('/me', formData);
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "小明",
    "gender": "male",
    "photoURL": "https://r2.daodao.com/avatars/xyz.jpg",
    "updatedAt": "2026-02-01T10:00:00Z"
  }
}
```

**後端處理邏輯**

```typescript
async function updateUser(req, res) {
  const { name, gender, birthDate } = parseFormData(req);
  const avatarFile = req.file;

  // 1. 驗證表單資料
  const validation = updateUserSchema.safeParse({ name, gender, birthDate });
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  let newAvatarUrl: string | undefined;
  const oldAvatarUrl = user.contacts?.photo_url;

  // 2. 上傳新頭像 (如果有)
  if (avatarFile) {
    newAvatarUrl = await r2Service.upload(avatarFile, 'avatars/');
  }

  // 3. 更新資料庫
  try {
    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: { nickname: name, gender, birth_date: birthDate }
      });

      if (newAvatarUrl) {
        await tx.contacts.update({
          where: { id: user.contacts.id },
          data: { photo_url: newAvatarUrl }
        });
      }
    });

    // 4. 刪除舊頭像 (Transaction 成功後)
    if (newAvatarUrl && oldAvatarUrl) {
      await r2Service.delete(oldAvatarUrl).catch(err => {
        logger.warn('Failed to delete old avatar', { oldAvatarUrl, err });
      });
    }

    return res.json({ success: true, data: updatedUser });

  } catch (dbError) {
    // 5. DB 失敗，刪除已上傳的新頭像
    if (newAvatarUrl) {
      await r2Service.delete(newAvatarUrl).catch(() => {});
    }
    throw dbError;
  }
}
```

---

## 5. 錯誤處理流程

```
用戶填寫表單 + 選擇圖片
              │
              ▼
點擊「送出」
              │
              ▼
送出 FormData (表單 + 圖片)
              │
              ▼
後端：驗證表單資料
              │
    ┌─────────┴─────────┐
    ▼                   ▼
  驗證失敗            驗證成功
    │                   │
    ▼                   ▼
回傳 400            上傳圖片到 R2
(圖片未處理)              │
    │              ┌─────┴─────┐
    ▼              ▼           ▼
前端顯示錯誤     上傳失敗      上傳成功
用戶修正後重試      │           │
                   ▼           ▼
              清理已上傳    建立 DB 記錄
              回傳 500          │
                          ┌────┴────┐
                          ▼         ▼
                       DB 失敗    成功
                          │         │
                          ▼         ▼
                    清理已上傳   回傳 201
                    回傳 500
```

---

## 6. 限制設定

| 項目 | 目前值 | 說明 |
|-----|-------|------|
| 單張圖片大小 | **500 KB** | 前端自動壓縮至此大小 |
| 圖片數量上限 | **3 張** | 單次請求最多 |
| 總請求大小 | ~2 MB | 500KB x 3 + 表單資料 |
| 請求超時 | 60 秒 | 考慮上傳時間 |

### 前端圖片壓縮

```typescript
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,           // 500 KB
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  return await imageCompression(file, options);
}
```

### 後端圖片壓縮 (雙重保險)

```typescript
import sharp from 'sharp';

async function compressImage(buffer: Buffer): Promise<Buffer> {
  let compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  if (compressed.length > 500 * 1024) {
    compressed = await sharp(buffer)
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 60 })
      .toBuffer();
  }

  return compressed;
}
```

---

## 7. 適用場景

| 場景 | 欄位 | 資料結構 | 圖片數量 |
|-----|------|---------|---------|
| **Checkin (打卡)** | `image_urls` | 陣列 | 3 張 |
| **Create User (註冊)** | `photo_url` | 單一 | 1 張 |
| **Update User (更新資料)** | `photo_url` | 單一 | 1 張 |

---

## 8. 待討論事項

- [x] 單張圖片大小上限？ → **500 KB**
- [x] 單次最多幾張圖片？ → **3 張**
- [x] 圖片壓縮由前端還是後端處理？ → **雙重壓縮**
- [ ] Note 圖片數量上限？
- [ ] 是否需要支援拖曳上傳？
- [ ] 上傳失敗時的重試機制？
