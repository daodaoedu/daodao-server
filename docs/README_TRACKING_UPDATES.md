# 追蹤系統數據庫更新說明

## 更新概述

本次更新為 DaoDao 平台實現了完整的 Google Analytics + Microsoft Clarity 風格的用戶行為追蹤系統。

## 修改的現有表格

### 1. view 表 (360_create_table_view.sql)
**主要變更：**
- ❌ **移除**: UNIQUE 約束 `("user_id", "target_type", "target_id")`
- ✅ **新增**: session_id, page_url, referrer_url, user_agent, ip_address
- ✅ **新增**: device_type, scroll_depth, exit_intent, viewport_width, viewport_height
- ✅ **新增**: 性能優化索引

### 2. click 表 (380_create_table_click.sql)
**主要變更：**
- ❌ **移除**: UNIQUE 約束 `("user_id", "target_type", "target_id")`
- ✅ **新增**: click_x, click_y, element_selector, element_text
- ✅ **新增**: click_type, session_id, page_url, user_agent
- ✅ **新增**: viewport_width, viewport_height
- ✅ **新增**: 座標和會話索引

### 3. share 表 (370_create_table_share.sql)
**主要變更：**
- ❌ **移除**: UNIQUE 約束 `("user_id", "target_type", "target_id")`
- ✅ **新增**: session_id, page_url, referrer_url
- ✅ **新增**: share_completed, completion_time
- ✅ **新增**: 分享追蹤索引

### 4. reaction 表 (340_create_table_reaction.sql)
**主要變更：**
- ✅ **擴展**: reaction_type ENUM 從 'like' 擴展到 'like', 'love', 'laugh', 'wow', 'sad', 'angry', 'care'
- ✅ **新增**: session_id, page_url
- ✅ **保留**: 原有 UNIQUE 約束（合理）

## 新增的表格

### 5. user_session 表 (570_create_table_user_session.sql)
**功能**: 用戶會話管理和追蹤
**關鍵欄位**: session_id, user_id, start_time, end_time, entry_page, exit_page, utm_source, device_type

### 6. heatmap_data 表 (580_create_table_heatmap_data.sql)
**功能**: 熱力圖數據收集
**關鍵欄位**: session_id, page_url, interaction_type, x_coordinate, y_coordinate, viewport_width, viewport_height

### 7. frustration_event 表 (590_create_table_frustration_event.sql)
**功能**: 用戶挫折事件檢測
**關鍵欄位**: session_id, event_type (rage_click, dead_click, excessive_scrolling, etc.), severity

### 8. conversion_event 表 (600_create_table_conversion_event.sql)
**功能**: 轉換事件和漏斗分析
**關鍵欄位**: session_id, event_name, event_category, conversion_type, funnel_step

## 外鍵約束 (610_add_session_foreign_keys.sql)

為現有表格添加 session_id 外鍵約束，連接到 user_session 表。

## 執行順序

1. `340_create_table_reaction.sql` - 更新反應類型
2. `360_create_table_view.sql` - 更新瀏覽表
3. `370_create_table_share.sql` - 更新分享表  
4. `380_create_table_click.sql` - 更新點擊表
5. `570_create_table_user_session.sql` - 創建會話表
6. `580_create_table_heatmap_data.sql` - 創建熱力圖表
7. `590_create_table_frustration_event.sql` - 創建挫折事件表
8. `600_create_table_conversion_event.sql` - 創建轉換事件表
9. `610_add_session_foreign_keys.sql` - 添加外鍵約束

## 向後相容性

- ✅ 所有新增欄位都允許 NULL 或有預設值
- ✅ 現有 API 端點不受影響
- ✅ 現有查詢語句繼續工作
- ✅ 可選擇性填入新欄位數據

## 重要注意事項

1. **UNIQUE 約束移除**: view, click, share 表現在允許同一用戶對同一目標有多筆記錄
2. **性能影響**: 新增了多個索引以優化查詢性能
3. **儲存空間**: 預計數據庫大小增加 15-25%
4. **外鍵約束**: 使用 ON DELETE SET NULL 確保數據完整性

## 啟用的新功能

### Google Analytics 風格功能
- ✅ 真實頁面瀏覽量追蹤
- ✅ 用戶會話分析
- ✅ 設備和瀏覽器統計
- ✅ 來源和 UTM 追蹤
- ✅ 轉換漏斗分析

### Microsoft Clarity 風格功能
- ✅ 點擊熱力圖生成
- ✅ 滾動行為分析
- ✅ 用戶挫折點檢測
- ✅ 會話重播數據收集
- ✅ 死點和憤怒點擊識別

---

**更新日期**: 2024-12-22  
**負責人**: Claude Code Assistant  
**相關文件**: [GA_CLARITY_TRACKING_SYSTEM_PLAN.md](./docs/GA_CLARITY_TRACKING_SYSTEM_PLAN.md)