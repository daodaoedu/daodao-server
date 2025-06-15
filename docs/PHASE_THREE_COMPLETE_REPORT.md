# 階段三：TypeScript Sequelize 模型建立 - 完成報告

## 1. 概述

本報告概述 DaoDao 專案中 Resource（學習資源）與 Resource Review（資源心得）API 開發的第三階段：TypeScript Sequelize 模型建立。依照專案規範，我們使用 Sequelize ORM 建立符合實際資料表結構的模型，並設定了它們之間的關聯關係。

## 2. 完成項目

### 2.1 Resource 模型

在 `src/models/resource.ts` 中建立了 Resource 模型，實現了以下功能：

- **完整的資料表結構映射**：包括所有欄位定義、資料類型和約束條件
- **資料驗證**：為類型、費用和程度等欄位添加了驗證規則
- **外部關聯**：設定了與 categories 和 users 表的外部關聯
- **索引定義**：按照資料表結構定義了所有需要的索引

```typescript
// 定義 Resource 模型
const Resource = sequelize.define<Model<ResourceAttributes, ResourceCreationAttributes>>(
  'Resource',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    // ... 其他欄位定義
  },
  {
    tableName: 'resources',
    timestamps: true,
    underscored: true,
    paranoid: true,
    // ... 其他設定
  }
);
```

### 2.2 ResourceReview 模型

在 `src/models/resourceReview.ts` 中建立了 ResourceReview 模型，包含：

- **評分欄位**：使用 DECIMAL(2,1) 支援 0.5 分間距的評分系統
- **Boolean 欄位**：定義了 9 個內容特色和 6 個資源使用的 Boolean 欄位
- **選項驗證**：為 time_usage 和 status 等欄位添加了選項驗證
- **唯一約束**：實現每用戶每資源只能有一個心得的約束

```typescript
// 評分欄位示例
score_impact: {
  type: DataTypes.DECIMAL(2, 1),
  allowNull: false,
  validate: {
    min: 1.0,
    max: 5.0,
    isDecimal: true
  }
},

// Boolean 欄位示例
well_structured: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
},
```

### 2.3 標籤相關模型

#### Tag 模型

在 `src/models/tag.ts` 中建立了 Tag 模型，用於存儲標籤名稱：

```typescript
const Tag = sequelize.define<Model<TagAttributes, TagCreationAttributes>>(
  'Tag',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    // ... 其他欄位
  },
  {
    tableName: 'tags',
    // ... 其他設定
  }
);
```

#### EntityTag 模型

在 `src/models/entityTag.ts` 中建立了 EntityTag 模型，實現多對多關聯：

```typescript
const EntityTag = sequelize.define<Model<EntityTagAttributes, EntityTagCreationAttributes>>(
  'EntityTag',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: {
          args: [['resource', 'idea', 'project', 'practice', 'circle', 'user']],
          msg: 'Invalid entity type'
        }
      }
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // ... 其他欄位
  },
  {
    tableName: 'entity_tags',
    // ... 其他設定
  }
);
```

### 2.4 模型關聯設定

在 `src/models/index.ts` 中設定了所有模型之間的關聯關係：

- **Resource 和 User 的關聯**：建立者關係
- **Resource 和 Category 的關聯**：主分類和子分類關係
- **Resource 和 ResourceReview 的關聯**：一對多關係
- **ResourceReview 和 User 的關聯**：作者關係
- **Tag 和 EntityTag 的關聯**：多對多關係的一部分

```typescript
// Resource <-> ResourceReview 關聯
Resource.hasMany(ResourceReview, { foreignKey: 'resource_id', as: 'reviews' });
ResourceReview.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

// Tag <-> EntityTag 關聯
Tag.hasMany(EntityTag, { foreignKey: 'tag_id', as: 'entityTags' });
EntityTag.belongsTo(Tag, { foreignKey: 'tag_id', as: 'tag' });
```

此外，還處理了與現有 JavaScript 模型的混合使用情況，通過動態引入的方式實現漸進式導入。

## 3. 設計決策

### 3.1 使用函數式模型定義

遵循專案規範，我們使用 Sequelize 的函數式 API 定義模型，而非使用 class 繼承的方式：

```typescript
// 使用函數式 API
const Resource = sequelize.define<Model<ResourceAttributes, ResourceCreationAttributes>>(
  'Resource',
  {
    // 欄位定義
  },
  {
    // 模型選項
  }
);

// 而非使用類繼承
// class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> {}
```

這樣做的好處是代碼更簡潔，更符合函數式編程風格，也避免了類繼承可能帶來的複雜性。

### 3.2 接口分離

我們分別定義了基本屬性接口和創建時的屬性接口：

```typescript
// 基本屬性接口
export interface ResourceAttributes {
  // 所有欄位
}

// 創建時的屬性接口
export interface ResourceCreationAttributes extends Optional<ResourceAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}
```

這樣可以確保在創建模型實例時，不需要提供自動生成的欄位（如 id、時間戳等），提高了代碼的類型安全性。

### 3.3 漸進式導入策略

為了支援漸進式導入策略，我們在 `models/index.ts` 中採用了動態引入的方式處理現有的 JavaScript 模型：

```typescript
try {
  // 動態引入，避免 TypeScript 編譯錯誤
  const existingModels = require('./index.js');
  
  // 提取其他模型
  const { User, Category } = existingModels;
  
  // 設定關聯關係
  // ...
} catch (error) {
  // 錯誤處理
}
```

這樣既能與現有模型集成，又不會影響新的 TypeScript 模型的類型安全性。

### 3.4 索引策略

我們在模型定義中直接設定了索引，確保與資料庫結構一致：

```typescript
indexes: [
  { fields: ['type'] },
  { fields: ['cost'] },
  { fields: ['created_by'] },
  { fields: ['created_at'] },
  { fields: ['level'] },
  { fields: ['type', 'cost', 'level'] }
]
```

這樣在同步模型到資料庫時，能夠自動創建所需的索引，提高查詢效能。

## 4. 發現的問題與解決方案

### 4.1 與現有模型的集成問題

**問題**：需要將新的 TypeScript 模型與現有的 JavaScript 模型集成。

**解決方案**：使用動態引入和錯誤處理，確保即使在現有模型不可用的情況下，新模型也能正常工作。

### 4.2 資料類型精度問題

**問題**：評分欄位需要支援 0.5 分間距。

**解決方案**：使用 DECIMAL(2, 1) 資料類型，並添加驗證規則確保值在 1.0 到 5.0 之間。

### 4.3 模型關聯複雜性

**問題**：模型之間有多種複雜的關聯關係。

**解決方案**：在 `models/index.ts` 中集中設定所有關聯，並使用清晰的別名（as）來區分不同類型的關聯。

## 5. 與階段二的集成

本階段的模型建立工作充分利用了階段二中建立的 TypeScript 型別定義，包括：

- 使用階段二定義的列舉值（ResourceType, CostType, LevelType 等）
- 引用階段二的型別定義，確保模型欄位與 API 欄位的一致性
- 為模型添加與階段二定義的資料轉換函數相匹配的驗證規則

## 6. 未來改進方向

### 6.1 查詢效能優化

目前的模型定義已經包含了基本的索引設定，但可以進一步優化：

- 添加更多的複合索引以支援常見查詢模式
- 為 Boolean 欄位添加部分索引，提高篩選效能
- 使用資料庫視圖簡化複雜查詢

### 6.2 模型擴展

隨著功能的發展，可能需要擴展現有模型：

- 添加統計欄位（如平均評分、評論數等）
- 添加全文搜尋支援
- 實現軟刪除的便捷方法

### 6.3 關聯查詢優化

對於涉及多表的複雜查詢，可以實現專門的查詢方法：

- 優化關聯載入（eager loading）策略
- 實現自定義查詢方法，避免 N+1 查詢問題
- 使用資料庫級別的計算（如窗口函數）提高統計查詢效能

## 7. 結論

階段三的 TypeScript Sequelize 模型建立已經完成。我們遵循專案規範，使用函數式方法定義了完整的資料模型，並設定了它們之間的關聯關係。這些模型充分反映了實際資料表結構，提供了類型安全的資料訪問層，為後續的 API 開發奠定了堅實的基礎。

## 8. 下一步計劃

準備進入階段四的 Zod 驗證器設計：

1. 基於階段二的 Zod schema，實作 Resource 驗證器
2. 實作 ResourceReview 驗證器
3. 實作自定義驗證邏輯，處理複雜的業務規則
4. 整合錯誤處理機制，提供友好的錯誤訊息

完成階段四後，將進入階段五的服務層開發，繼續推進整個開發計劃。
