#!/usr/bin/env ts-node

/**
 * 自動生成 OpenAPI 文檔腳本
 * 從 swagger-jsdoc 配置生成靜態 openapi.yaml 文件
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { swaggerSpec } from '../src/config/swagger.config';

const outputPath = path.resolve(__dirname, '..', 'openapi.yaml');

// 定義 OpenAPI 規範的類型
interface OpenAPISpec {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, any>;
  [key: string]: any;
}

try {
  const spec = swaggerSpec as OpenAPISpec;
  
  // 將 swaggerSpec 轉換為 YAML 格式
  const yamlStr = yaml.dump(spec, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  });

  // 寫入文件
  fs.writeFileSync(outputPath, yamlStr, 'utf8');
  
  console.log(`✅ OpenAPI 文檔已成功生成: ${outputPath}`);
  console.log(`📊 文檔版本: ${spec.info?.version || 'unknown'}`);
  console.log(`📝 API 標題: ${spec.info?.title || 'unknown'}`);
  
  // 統計 API 路徑數量
  const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
  console.log(`🔗 API 路徑數量: ${pathCount}`);
  
} catch (error) {
  console.error('❌ 生成 OpenAPI 文檔時發生錯誤:', error);
  process.exit(1);
}