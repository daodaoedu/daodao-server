# 用戶資料匯出腳本使用說明

## 功能說明
`export-all-users.js` 可以從 PostgreSQL 資料庫匯出所有註冊用戶的完整資料，包括：
- 基本資訊（暱稱、性別、教育階段等）
- 聯絡資訊（Email、社群媒體帳號等）
- 個人簡介（自我介紹、想做的事等）
- 位置資訊（城市、國家）
- 標籤列表
- 註冊時間等

## 使用方式

### 在 VPS 上執行（推薦）

由於資料庫在遠端 VPS 上，建議直接在 VPS 執行：

```bash
# 1. SSH 連接到 VPS
ssh your-vps-server

# 2. 進入專案目錄
cd /path/to/daodao-server

# 3. 執行匯出腳本（預設輸出 JSON）
node scripts/export-all-users.js

# 4. 或匯出為 CSV 格式
node scripts/export-all-users.js csv
```

### 匯出檔案

腳本會在專案根目錄產生檔案：
- JSON 格式: `users-export-YYYY-MM-DD-HH-MM-SS.json`
- CSV 格式: `users-export-YYYY-MM-DD-HH-MM-SS.csv`

### 下載匯出檔案

從 VPS 下載到本地：

```bash
# 使用 scp 下載
scp your-vps:/path/to/daodao-server/users-export-*.json ./

# 或使用 rsync
rsync -avz your-vps:/path/to/daodao-server/users-export-*.json ./
```

## 匯出的資料欄位

### 基本資訊
- `id` - 用戶 ID
- `external_id` - 外部 UUID
- `nickname` - 暱稱
- `birth_date` - 生日
- `gender` - 性別
- `education_stage` - 教育階段
- `language` - 語言
- `is_open_profile` - 是否公開個人檔案
- `is_open_location` - 是否公開位置

### 聯絡資訊
- `email` - Email
- `google_id` - Google ID
- `photo_url` - 大頭照網址
- `is_subscribe_email` - 是否訂閱電子報
- `instagram` - Instagram 帳號
- `discord` - Discord 帳號
- `line` - Line 帳號
- `facebook` - Facebook 帳號

### 個人簡介
- `self_introduction` - 自我介紹
- `share_list` - 可以分享的內容
- `want_to_do_list` - 想做的事（以 ; 分隔）

### 位置資訊
- `location_city` - 城市
- `location_country` - 國家
- `location_is_taiwan` - 是否在台灣

### 其他
- `tag_list` - 標籤列表（以 ; 分隔）
- `role_id` - 角色 ID
- `mongo_id` - MongoDB ID
- `created_at` - 建立時間
- `updated_at` - 更新時間

## 統計資訊

腳本執行時會顯示：
- 總用戶數
- 有填寫 Email 的用戶數
- 有填寫性別的用戶數
- 有填寫位置的用戶數
- 有自我介紹的用戶數
- 訂閱電子報的用戶數

## 注意事項

1. **資料隱私**：匯出檔案包含個人資料，請妥善保管
2. **檔案大小**：如果用戶數量很多，JSON 檔案可能會很大
3. **CSV 格式**：CSV 檔案已加入 BOM，可以在 Excel 中正確顯示中文
4. **執行時間**：取決於用戶數量和資料庫連線速度

## 故障排除

### 資料庫連接失敗
確認環境變數設定正確：
```bash
echo $APP_ENV
cat .env | grep DATABASE
```

### 關聯資料為空
某些欄位可能為空是正常的，因為使用者可能沒有填寫完整資料。

### 記憶體不足
如果用戶數量太多，可以修改腳本加入分頁查詢。
