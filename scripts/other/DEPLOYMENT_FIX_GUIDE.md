# 部署問題修復指南

## 問題診斷

當前服務器存在**嚴重的記憶體不足問題**：

### 系統狀態
- 📊 **記憶體**: 1.7GB/1.9GB (89%) - 僅剩 69MB 可用
- 💾 **Swap**: 512MB/512MB (100%) - 完全耗盡
- ⚠️ **系統負載**: 15分鐘平均 24.76（極高）
- 🔥 **kswapd0** 進程占用 71.5% CPU（記憶體交換壓力）

### 問題影響
- Docker pull 操作因記憶體不足被取消
- 部署流程無法完成
- 系統響應緩慢

---

## 解決方案（三步走）

### 📋 步驟總覽

1. **檢查系統資源** → 了解當前狀態
2. **增加 Swap 空間** → 解決記憶體不足
3. **重新部署** → 完成部署流程

---

## 🚀 執行步驟

### 步驟 1: 上傳腳本到服務器

在**本地機器**執行：

```bash
# 從項目根目錄執行
cd /Users/xiaoxu/Projects/daodao-server

# 上傳腳本到服務器
scp scripts/check-server-resources.sh root@YOUR_SERVER_IP:/root/
scp scripts/increase-swap.sh root@YOUR_SERVER_IP:/root/
scp scripts/redeploy.sh root@YOUR_SERVER_IP:/root/

# 賦予執行權限
ssh root@YOUR_SERVER_IP "chmod +x /root/*.sh"
```

**替換 `YOUR_SERVER_IP` 為實際的服務器 IP 地址**

---

### 步驟 2: 登入服務器

```bash
ssh root@YOUR_SERVER_IP
```

---

### 步驟 3: 檢查系統資源

```bash
cd /root
bash check-server-resources.sh
```

**預期輸出**：
- 磁碟使用情況
- 記憶體和 Swap 使用情況
- Docker 資源使用
- 運行中的容器
- 建議措施

---

### 步驟 4: 增加 Swap 空間（關鍵步驟）

```bash
# 增加 4GB swap（建議）
sudo bash increase-swap.sh 4G

# 或者增加 6GB swap（如果磁碟空間充足）
sudo bash increase-swap.sh 6G
```

**這個腳本會**：
- ✅ 創建額外的 swap 文件
- ✅ 自動啟用 swap
- ✅ 配置開機自動掛載
- ✅ 優化 swap 使用策略（swappiness=10）

**執行時間**: 約 2-5 分鐘

**預期結果**：
```
✅ Swap 空間擴展完成！
總 Swap: 4.5GB (原 512MB + 新 4GB)
Swap 使用率: 降至 10-20%
```

---

### 步驟 5: 驗證 Swap 增加成功

```bash
# 查看新的 swap 狀態
free -h

# 應該看到類似輸出：
#                total        used        free
# Swap:          4.5Gi       500Mi       4.0Gi
```

---

### 步驟 6: 重新執行部署

```bash
# 對於 dev 環境
bash redeploy.sh dev

# 對於 production 環境
bash redeploy.sh prod
```

**這個腳本會**：
- ✅ 預檢資源（確保足夠的記憶體和磁碟）
- ✅ 清理 Docker 舊資源
- ✅ 更新代碼
- ✅ 拉取新映像
- ✅ 重啟容器
- ✅ 驗證部署成功

**執行時間**: 約 5-10 分鐘

---

### 步驟 7: 驗證部署成功

```bash
# 1. 查看容器狀態
docker ps

# 應該看到容器運行中，狀態為 "Up"

# 2. 查看容器日誌
docker logs -f dev_app  # 或 prod_app

# 3. 再次檢查資源
bash check-server-resources.sh
```

---

## 📝 完整操作示例

### 本地機器操作：

```bash
# 1. 上傳腳本
cd /Users/xiaoxu/Projects/daodao-server
scp scripts/*.sh root@YOUR_SERVER_IP:/root/
ssh root@YOUR_SERVER_IP "chmod +x /root/*.sh"
```

### 服務器操作：

```bash
# 2. 登入服務器
ssh root@YOUR_SERVER_IP

# 3. 檢查資源
bash check-server-resources.sh

# 4. 增加 swap
sudo bash increase-swap.sh 4G

# 5. 驗證 swap
free -h

# 6. 重新部署
bash redeploy.sh dev

# 7. 驗證部署
docker ps
docker logs -f dev_app
```

---

## ⚠️ 注意事項

### 磁碟空間要求
- 增加 4GB swap 需要至少 **5GB 可用磁碟空間**
- 如果空間不足，先執行清理：
  ```bash
  docker system prune -af
  docker builder prune -af
  ```

### Swap 大小建議
- **記憶體 < 2GB**: 建議 4GB swap
- **記憶體 2-4GB**: 建議 2-4GB swap
- **記憶體 > 4GB**: 建議 1-2GB swap

### 安全考慮
- 所有腳本需要 **root 權限**
- 增加 swap 是**永久性**的（重啟後依然有效）
- 不會影響現有數據和服務

---

## 🔧 故障排除

### 問題 1: "磁碟空間不足"

```bash
# 清理 Docker 資源
docker system prune -af
docker builder prune -af
docker volume prune -f

# 檢查大文件
du -sh /var/lib/docker/*
```

### 問題 2: "操作被取消"（再次發生）

```bash
# 1. 檢查系統負載
top

# 2. 如果 kswapd0 仍然占用高 CPU
# 可能需要重啟部分服務
docker stop $(docker ps -q)
sleep 30
bash redeploy.sh dev
```

### 問題 3: "Docker pull 很慢"

```bash
# 檢查網路連接
ping -c 5 8.8.8.8

# 檢查 Docker registry 連接
docker pull hello-world
```

---

## 📊 長期優化建議

### 1. 升級服務器配置
當前 **2GB RAM** 對於運行 Docker 容器偏小，建議：
- 升級至 **4GB RAM** 或以上
- 這樣可以減少對 swap 的依賴

### 2. 監控設置
```bash
# 定期檢查資源
crontab -e

# 添加每小時檢查
0 * * * * bash /root/check-server-resources.sh >> /var/log/resource-check.log
```

### 3. 自動清理
在 `.github/workflows/continuous-delivery.yml` 中已經添加了：
- ✅ 自動磁碟檢查
- ✅ 自動 Docker 清理
- ✅ 部署前資源驗證

---

## 📞 需要幫助？

如果遇到問題，請提供以下資訊：

```bash
# 收集診斷資訊
echo "=== System Info ===" > /tmp/debug.log
bash check-server-resources.sh >> /tmp/debug.log
echo "=== Docker Info ===" >> /tmp/debug.log
docker ps -a >> /tmp/debug.log
echo "=== Recent Logs ===" >> /tmp/debug.log
journalctl -u docker -n 50 >> /tmp/debug.log

# 查看診斷資訊
cat /tmp/debug.log
```

---

## ✅ 成功標誌

部署成功後，你應該看到：

1. ✅ Swap 使用率 < 50%
2. ✅ 可用記憶體 > 200MB
3. ✅ 系統負載 < 2.0
4. ✅ Docker 容器狀態為 "Up"
5. ✅ 應用日誌正常，無錯誤

---

**最後更新**: 2025-10-21
**適用環境**: dev, production
