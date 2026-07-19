/**
 * 新版 OpenAPI 文檔生成腳本
 * 使用 @asteasolutions/zod-to-openapi
 *
 * 🎯 目標：
 * - 替代 generate-swagger.ts 中 1000+ 行的自定義轉換邏輯
 * - 自動從 Zod schemas 和 registry 生成 OpenAPI 文檔
 * - 支持漸進式遷移（與舊版並存）
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { generateOpenApiDocument, registry } from '../src/config/openapi-registry';

/**
 * 自動載入所有使用 registry 的 validators
 * 這會執行 validators 中的 registry.register() 和 registry.registerPath()
 */
async function loadAllValidators() {
  console.log('📖 載入 validators...');

  const validatorsDir = path.join(__dirname, '../src/validators');

  if (!fs.existsSync(validatorsDir)) {
    console.warn('⚠️  validators 目錄不存在');
    return;
  }

  // 讀取所有 .ts 檔案（排除 .d.ts 和範例檔）
  const files = fs.readdirSync(validatorsDir).filter(file =>
    file.endsWith('.ts') &&
    !file.endsWith('.d.ts') &&
    !file.includes('example') &&
    file !== 'index.ts'
  );

  console.log(`📁 找到 ${files.length} 個 validator 檔案`);

  // 動態載入每個 validator
  for (const file of files) {
    try {
      const filePath = path.join(validatorsDir, file);

      // 清除 require cache 以確保重新載入
      delete require.cache[require.resolve(filePath)];

      // 載入模組（這會執行模組中的 registry 註冊代碼）
      require(filePath);

      console.log(`  ✓ 載入 ${file}`);
    } catch (error) {
      console.error(`  ✗ 載入 ${file} 失敗:`, error);
    }
  }
}

/**
 * 自動載入所有路由定義
 * 如果路由檔案中使用了 registry.registerPath()，會自動註冊
 */
async function loadAllRoutes() {
  console.log('📖 載入 routes...');

  const routesDir = path.join(__dirname, '../src/routes');

  if (!fs.existsSync(routesDir)) {
    console.warn('⚠️  routes 目錄不存在');
    return;
  }

  // 同時涵蓋 `*.routes.ts` 與 `*-routes.ts` 兩種命名（如 user-stats-routes.ts），
  // 否則後者的 registerPath 不會被載入，生成的文檔會漏掉整組路徑
  const files = fs.readdirSync(routesDir).filter(file =>
    file.endsWith('routes.ts') || file.endsWith('routes.js')
  );

  console.log(`📁 找到 ${files.length} 個 route 檔案`);

  for (const file of files) {
    try {
      const filePath = path.join(routesDir, file);

      // 清除 require cache
      delete require.cache[require.resolve(filePath)];

      // 載入路由（如果有 registry 註冊會自動執行）
      require(filePath);

      console.log(`  ✓ 載入 ${file}`);
    } catch (error) {
      // 路由檔案可能沒有 registry 註冊，這是正常的
      console.log(`  ℹ️  ${file} 未包含 OpenAPI 定義（正常）`);
    }
  }
}

/**
 * 主要執行函數
 */
async function main() {
  try {
    console.log('🚀 開始生成 OpenAPI 文檔 (v2 - 使用 @asteasolutions/zod-to-openapi)');
    console.log('================================================');

    // 1. 載入所有 validators（會自動註冊 schemas）
    await loadAllValidators();

    // 2. 載入所有 routes（會自動註冊 paths）
    await loadAllRoutes();

    console.log('\n📊 Registry 統計:');
    console.log(`  - Schemas: ${Object.keys(registry.definitions).length} 個`);

    // 3. 生成 OpenAPI 文檔（tags 定義在 openapi-registry.ts 中）
    console.log('\n📝 生成 OpenAPI 文檔...');
    const openApiDocument = generateOpenApiDocument();

    // 4. 輸出文件
    const outputDir = path.join(__dirname, '..');
    const jsonPath = path.join(outputDir, 'openapi.json');
    const yamlPath = path.join(outputDir, 'openapi.yaml');

    console.log('\n💾 寫入文件...');

    // 寫入 JSON
    fs.writeFileSync(
      jsonPath,
      JSON.stringify(openApiDocument, null, 2),
      'utf-8'
    );
    console.log(`  ✅ JSON: ${jsonPath}`);

    // 寫入 YAML
    fs.writeFileSync(
      yamlPath,
      yaml.dump(openApiDocument, { indent: 2, lineWidth: -1 }),
      'utf-8'
    );
    console.log(`  ✅ YAML: ${yamlPath}`);

    // 5. 統計資訊
    console.log('\n================================================');
    console.log('🎉 OpenAPI 文檔生成完成！');
    console.log(`📊 總計:`);
    console.log(`  - Components/Schemas: ${Object.keys(openApiDocument.components?.schemas || {}).length} 個`);
    console.log(`  - Components/Responses: ${Object.keys(openApiDocument.components?.responses || {}).length} 個`);
    console.log(`  - API Paths: ${Object.keys(openApiDocument.paths || {}).length} 個`);
    console.log(`  - Tags: ${(openApiDocument.tags || []).length} 個`);

    // 6. 完成提示
    console.log('\n💡 提示:');
    console.log('  - 文檔已更新: openapi.json / openapi.yaml');
    console.log('  - 可在 /api-docs 或 /api/docs 查看 Swagger UI');
    console.log('  - 舊版本已備份至: .archived/generate-swagger.ts.backup');

    // route 模組載入時會建立 BullMQ/Redis 等連線，導致 event loop 不會自然結束；
    // 文件已同步寫入完成，直接退出
    process.exit(0);

  } catch (error) {
    console.error('❌ 生成失敗:', error);
    if (error instanceof Error) {
      console.error('錯誤堆疊:', error.stack);
    }
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

export { main };
