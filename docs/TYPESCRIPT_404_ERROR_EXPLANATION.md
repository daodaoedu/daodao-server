# 為什麼 API 會出現 404 錯誤？初學者完整說明

## 🤔 發生了什麼事？

想像你的專案就像一個餐廳：
- **TypeScript** 是你寫的食譜（原始碼）
- **JavaScript** 是廚師能看懂的料理步驟（編譯後的程式）
- **Docker** 是你的廚房
- **API** 是客人點餐的菜單

現在的問題是：客人想點「資源列表」這道菜，但廚師說「我們沒有這道菜」（404 錯誤）。

## 🔍 為什麼會這樣？

### 1. TypeScript 需要「翻譯」成 JavaScript

```
食譜（TypeScript）→ 翻譯 → 料理步驟（JavaScript）
   recipe.ts      →  編譯  →    recipe.js
```

你寫的程式碼是 TypeScript（`.ts` 檔案），但 Node.js 只能執行 JavaScript（`.js` 檔案）。

### 2. 本機 vs 雲端的差異

**在你的電腦上（本機開發）：**
```
你寫 TypeScript → ts-node 即時翻譯 → 程式執行
              （像是有個即時翻譯員）
```

**在雲端服務器上：**
```
你寫 TypeScript → 需要先編譯 → 產生 JavaScript → 程式執行
              （需要先翻譯好所有食譜）
```

### 3. 目前的問題

從錯誤訊息看到：
```
❌ TypeScript 路由加載失敗: Error: Cannot find module './dist/src/register-paths'
```

這表示：
- 程式想要載入編譯後的檔案（`dist` 資料夾）
- 但是這個資料夾不存在（因為還沒有執行編譯）

## 📁 資料夾結構說明

```
你的專案/
├── src/                    # 你寫的 TypeScript 原始碼
│   ├── app.ts             # 定義 API 路由
│   ├── controllers/       # 處理請求的程式
│   └── routes/           # API 路徑定義
├── dist/                  # 編譯後的 JavaScript（現在不存在）
│   └── src/              # 應該要有編譯後的檔案
├── index.js              # 程式入口（啟動點）
└── package.json          # 專案設定檔
```

## 🛠️ 解決步驟

### 步驟 1：理解程式的執行流程

1. **Docker 啟動容器**（開店）
2. **執行 index.js**（開始營業）
3. **index.js 嘗試載入 TypeScript 路由**（準備菜單）
4. **發現沒有編譯後的檔案**（食譜還沒翻譯）
5. **無法提供 API 服務**（無法提供菜單上的菜）

### 步驟 2：修復問題

需要在 Docker 容器內執行編譯：

```bash
# 1. 連接到 Docker 容器（進入廚房）
docker exec -it dev_app bash

# 2. 執行編譯指令（翻譯食譜）
npm run build

# 這個指令會：
# - 讀取所有 .ts 檔案
# - 轉換成 .js 檔案
# - 放到 dist/ 資料夾

# 3. 重新啟動服務（重新開始營業）
pm2 restart all
```

### 步驟 3：為什麼本機開發不會有這個問題？

在本機開發時，我們使用 `npm run dev`，它會：
1. 使用 `ts-node` 工具
2. 即時編譯 TypeScript
3. 不需要先產生 `dist` 資料夾

但在生產環境（雲端），為了效能考量：
1. 不使用 `ts-node`（因為即時編譯很慢）
2. 需要預先編譯好所有檔案
3. 直接執行編譯後的 JavaScript

## 📊 圖解說明

### 本機開發流程：
```
[你寫的 .ts 檔案] → [ts-node 即時編譯] → [程式執行]
                        ↑
                    自動處理，你不用管
```

### 雲端部署流程：
```
[你寫的 .ts 檔案] → [npm run build] → [dist/*.js 檔案] → [程式執行]
                        ↑                    ↑
                    需要手動執行        編譯後的結果
```

## 🚀 永久解決方案

### 方案 1：更新 Dockerfile（已完成）

在 Dockerfile 中加入編譯步驟：
```dockerfile
# 複製程式碼
COPY . .

# 編譯 TypeScript（新增這行）
RUN npm run build

# 啟動服務
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

### 方案 2：更新部署流程

確保每次部署都會：
1. 拉取最新程式碼
2. 安裝套件
3. **編譯 TypeScript**（重要！）
4. 重啟服務

## ❓ 常見問題

### Q1: 為什麼要用 TypeScript？
**A**: TypeScript 提供型別檢查，可以在寫程式時就發現錯誤，而不是執行時才發現。

### Q2: 為什麼不直接寫 JavaScript？
**A**: 可以，但 TypeScript 讓大型專案更容易維護，減少錯誤。

### Q3: 每次都要手動編譯嗎？
**A**: 不用，正確設定 CI/CD 後會自動編譯。

### Q4: dist 資料夾是什麼？
**A**: "distribution" 的縮寫，存放編譯後可以發布的程式碼。

## 📝 重點整理

1. **TypeScript 不能直接執行**，需要編譯成 JavaScript
2. **本機開發**用 `ts-node` 自動處理編譯
3. **雲端部署**需要先執行 `npm run build` 編譯
4. **404 錯誤**是因為編譯後的檔案不存在
5. **解決方法**是執行編譯指令並重啟服務

## 🎯 下一步

1. 確保 Docker 映像包含編譯步驟
2. 設定 CI/CD 自動編譯
3. 監控部署日誌確保編譯成功

記住：TypeScript → 編譯 → JavaScript → 執行，少了編譯這步，程式就無法正常運作！