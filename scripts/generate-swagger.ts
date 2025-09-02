/**
 * Zod v4 自動生成 Swagger/OpenAPI 文檔腳本
 * 使用 Zod v4 內建的 metadata 功能自動生成 OpenAPI 3.0 規範
 */

import fs from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * 提取 Zod v4 metadata 的函數
 */
function extractZodV4Metadata(schema: z.ZodSchema): any {
  // 檢查是否有 _def 和 description
  const def = (schema as any)._def;
  const metadata: any = {};

  // 提取 description
  if (def?.description) {
    metadata.description = def.description;
  }

  // 提取 metadata（從 .meta() 方法）
  if (def?.metadata) {
    Object.assign(metadata, def.metadata);
  }

  // 處理不同類型的 schema
  if (schema instanceof z.ZodObject) {
    metadata.type = 'object';
    metadata.properties = {};
    
    // 遍歷物件屬性
    const shape = schema.shape;
    for (const [key, value] of Object.entries(shape)) {
      metadata.properties[key] = extractZodV4Metadata(value as z.ZodSchema);
    }
  } else if (schema instanceof z.ZodArray) {
    metadata.type = 'array';
    metadata.items = extractZodV4Metadata(schema.element as z.ZodSchema);
  } else if (schema instanceof z.ZodEnum) {
    metadata.type = 'string';
    metadata.enum = schema.options;
    
    // 檢查是否有 enumDescriptions
    if (def?.metadata?.enumDescriptions) {
      metadata.enumDescriptions = def.metadata.enumDescriptions;
    }
  } else if (schema instanceof z.ZodString) {
    metadata.type = 'string';
    
    // 提取字串限制
    if (def?.checks) {
      for (const check of def.checks) {
        switch (check.kind) {
          case 'min':
            metadata.minLength = check.value;
            break;
          case 'max':
            metadata.maxLength = check.value;
            break;
          case 'email':
            metadata.format = 'email';
            break;
          case 'url':
            metadata.format = 'uri';
            break;
          case 'uuid':
            metadata.format = 'uuid';
            break;
        }
      }
    }
  } else if (schema instanceof z.ZodNumber) {
    metadata.type = 'number';
    
    // 提取數字限制
    if (def?.checks) {
      for (const check of def.checks) {
        switch (check.kind) {
          case 'min':
            metadata.minimum = check.value;
            break;
          case 'max':
            metadata.maximum = check.value;
            break;
          case 'int':
            metadata.type = 'integer';
            break;
        }
      }
    }
  } else if (schema instanceof z.ZodBoolean) {
    metadata.type = 'boolean';
  }

  return metadata;
}

/**
 * 載入所有 Zod validators 並提取 metadata
 */
async function loadZodV4SchemasWithMetadata(): Promise<any> {
  console.log('🔍 掃描 validators 目錄...');
  
  const validatorsDir = path.join(__dirname, '../src/validators');
  const schemas: any = {};
  
  if (!fs.existsSync(validatorsDir)) {
    console.warn('⚠️  validators 目錄不存在:', validatorsDir);
    return schemas;
  }

  const files = fs.readdirSync(validatorsDir).filter(file => 
    file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts'
  );

  console.log(`📁 找到 ${files.length} 個 validator 檔案`);

  for (const file of files) {
    try {
      const filePath = path.join(validatorsDir, file);
      const moduleName = file.replace('.ts', '');
      
      console.log(`📖 載入 ${file}...`);
      
      // 動態載入模組
      delete require.cache[require.resolve(filePath)];
      const module = require(filePath);
      
      // 提取所有 exported schemas
      const fileSchemas: any = {};
      for (const [exportName, exportValue] of Object.entries(module)) {
        if (exportValue && typeof exportValue === 'object' && (exportValue as any)._def) {
          // 這是一個 Zod schema
          console.log(`  ✓ 發現 schema: ${exportName}`);
          
          try {
            // 使用 Zod v4 內建的 JSON schema 生成功能
            const zodSchema = exportValue as z.ZodSchema;
            
            // 檢查 Zod v4 是否有內建的 toJsonSchema 方法
            let jsonSchema: any;
            if (typeof (zodSchema as any).toJsonSchema === 'function') {
              jsonSchema = (zodSchema as any).toJsonSchema();
            } else {
              // 回退到手動提取 metadata
              jsonSchema = extractZodV4Metadata(zodSchema);
            }
            
            fileSchemas[exportName] = jsonSchema;
          } catch (error) {
            console.warn(`  ⚠️  無法處理 schema ${exportName}:`, error);
          }
        }
      }
      
      if (Object.keys(fileSchemas).length > 0) {
        schemas[moduleName] = fileSchemas;
        console.log(`  ✅ ${moduleName}: ${Object.keys(fileSchemas).length} 個 schemas`);
      }
      
    } catch (error) {
      console.error(`❌ 載入 ${file} 失敗:`, error);
    }
  }
  
  return schemas;
}

/**
 * 解析單個路由檔案並提取 API 路徑
 */
function parseRouteFile(filePath: string, routeName: string): any[] {
  const paths: any[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 解析路由定義的正則表達式
    const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([\s\S]*?)\);/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      const [, method, path, middlewareAndHandler] = match;
      
      // 提取 validate 中間件使用的 validator
      const validateMatch = middlewareAndHandler.match(/validate\s*\(\s*([^,\s]+)/);
      const validatorName = validateMatch ? validateMatch[1] : null;
      
      // 從註解中提取描述
      const commentRegex = new RegExp(`\\/\\*\\*[\\s\\S]*?${method.toUpperCase()}\\s+${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?\\*\\/`, 'i');
      const commentMatch = content.match(commentRegex);
      let summary = '';
      let description = '';
      
      if (commentMatch) {
        const comment = commentMatch[0];
        const lines = comment.split('\n');
        for (let i = 1; i < lines.length - 1; i++) {
          const line = lines[i].replace(/^\s*\*\s?/, '').trim();
          if (line && !line.startsWith('@') && !line.includes('請求體') && !line.includes('需要認證')) {
            if (!summary) {
              summary = line;
            } else {
              description += (description ? ' ' : '') + line;
            }
          }
        }
      }
      
      // 修正路徑生成邏輯 - 根據實際的路由註冊映射
      let basePath = '';
      const routeMapping: Record<string, string> = {
        'auth.routes.ts': '/api/v1/auth',
        'user.routes.ts': '/api/v1/users',
        'resource.routes.ts': '/api/v1/resources',
        'practice.routes.ts': '/api/v1/practices',
        'project.routes.ts': '/api/v1/projects',
        'comment.routes.ts': '/api/v1/comments',
        'idea.routes.ts': '/api/v1/ideas',
        'me.routes.ts': '/api/v1/me',
        'email.routes.ts': '/api/v1/email',
        'image.routes.ts': '/api/v1/images',
        'note.routes.ts': '/api/v1/notes',
        'outcome.routes.ts': '/api/v1/outcomes',
        'review.routes.ts': '/api/v1/reviews',
        'mentor.routes.ts': '/api/v1/mentor',
        'milestone.routes.ts': '/api/v1/projects/:projectId/milestones',
        'resource-review.routes.ts': '/api/v1/resources/:resourceId/reviews',
        'tag.routes.ts': '/api/v1/tags',
        'db-info.routes.ts': '/api/v1/db-info',
        'monitor.routes.ts': '/api/v1/monitor'
      };
      
      basePath = routeMapping[routeName] || `/api/v1/${routeName.replace('.routes.ts', '').replace('.routes', '')}`;
      
      paths.push({
        path: `${basePath}${path}`,
        method: method.toLowerCase(),
        summary: summary || `${method.toUpperCase()} ${path}`,
        description,
        validatorName,
        tags: [getTagFromRouteName(routeName)]
      });
    }
    
  } catch (error) {
    console.warn(`⚠️  解析路由檔案 ${filePath} 失敗:`, error);
  }
  
  return paths;
}

/**
 * 根據路由檔名生成標籤
 */
function getTagFromRouteName(routeName: string): string {
  const mapping: Record<string, string> = {
    'auth.routes': 'Authentication',
    'user.routes': 'Users', 
    'resource.routes': 'Resources',
    'practice.routes': 'Practice',
    'project.routes': 'Projects',
    'comment.routes': 'Comments',
    'idea.routes': 'Ideas',
    'me.routes': 'Me',
    'email.routes': 'Email',
    'image.routes': 'Images',
    'note.routes': 'Notes',
    'outcome.routes': 'Outcomes',
    'review.routes': 'Reviews',
    'mentor.routes': 'Mentor',
    'milestone.routes': 'Milestones',
    'resource-review.routes': 'Resource Reviews',
    'db-info.routes': 'Database Info',
    'monitor.routes': 'System Monitor'
  };
  
  return mapping[routeName] || routeName.replace('.routes', '');
}

/**
 * 掃描路由定義
 */
async function scanRouteDefinitions(): Promise<any[]> {
  console.log('🔍 掃描路由定義...');
  
  const routesDir = path.join(__dirname, '../src/routes');
  const allPaths: any[] = [];
  
  if (!fs.existsSync(routesDir)) {
    console.warn('⚠️  routes 目錄不存在:', routesDir);
    return allPaths;
  }

  const files = fs.readdirSync(routesDir).filter(file => 
    file.endsWith('.routes.ts') || file.endsWith('.routes.js')
  );

  console.log(`📁 找到 ${files.length} 個路由檔案`);
  
  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const routeName = file;
    
    console.log(`📖 解析路由檔案: ${file}`);
    const filePaths = parseRouteFile(filePath, routeName);
    
    if (filePaths.length > 0) {
      allPaths.push(...filePaths);
      console.log(`  ✓ 找到 ${filePaths.length} 個路由`);
    }
  }
  
  console.log(`✅ 總共找到 ${allPaths.length} 個 API 路徑`);
  return allPaths;
}

/**
 * 生成 OpenAPI 3.0 規範
 */
async function generateOpenAPISpec(schemas: any, routes: any[]): Promise<any> {
  console.log('📝 生成 OpenAPI 規範...');
  
  // 從現有的 swagger.config.ts 取得基本資訊
  const swaggerConfigPath = path.join(__dirname, '../src/config/swagger.config.ts');
  let baseConfig: any = {};
  
  try {
    delete require.cache[require.resolve(swaggerConfigPath)];
    const configModule = require(swaggerConfigPath);
    baseConfig = configModule.default?.definition || configModule.swaggerOptions?.definition || {};
  } catch (error) {
    console.warn('⚠️  無法載入 swagger.config.ts，使用預設配置');
  }

  const openApiSpec = {
    openapi: '3.0.0',
    info: baseConfig.info || {
      title: 'DaoDao 資源管理 API',
      version: '1.0.0',
      description: '使用 Zod v4 自動生成的 API 文檔，提供資源管理、心得評價和標籤功能的 RESTful API'
    },
    servers: baseConfig.servers || [
      {
        url: 'http://localhost:4000',
        description: '本機開發'
      }
    ],
    components: {
      securitySchemes: baseConfig.components?.securitySchemes || {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用 JWT Token 進行身份驗證'
        }
      },
      schemas: {} as Record<string, any>,
      parameters: baseConfig.components?.parameters || {},
      responses: {
        ...baseConfig.components?.responses,
        // 標準錯誤回應定義
        BadRequestError: {
          description: '請求參數錯誤',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'VALIDATION_ERROR' },
                      message: { type: 'string', example: '輸入資料格式錯誤' },
                      details: { type: 'object' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        UnauthorizedError: {
          description: '未授權，需要登入',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'UNAUTHORIZED' },
                      message: { type: 'string', example: '請先登入' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: '禁止訪問，權限不足',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'FORBIDDEN' },
                      message: { type: 'string', example: '權限不足' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: '資源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'NOT_FOUND' },
                      message: { type: 'string', example: '找不到指定的資源' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        ConflictError: {
          description: '資源衝突',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'CONFLICT' },
                      message: { type: 'string', example: '資源已存在或衝突' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        InternalServerError: {
          description: '服務器內部錯誤',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'INTERNAL_ERROR' },
                      message: { type: 'string', example: '伺服器發生錯誤' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    paths: {} as Record<string, any>,
    tags: baseConfig.tags || []
  };

  // 將 Zod schemas 轉換為 OpenAPI components/schemas
  console.log('🔄 轉換 schemas...');
  let totalSchemas = 0;
  
  for (const [fileName, fileSchemas] of Object.entries(schemas) as [string, any][]) {
    for (const [schemaName, schema] of Object.entries(fileSchemas)) {
      const componentName = `${fileName}_${schemaName}`;
      openApiSpec.components.schemas[componentName] = schema;
      totalSchemas++;
    }
  }
  
  console.log(`✅ 轉換了 ${totalSchemas} 個 schemas`);

  // 生成 API paths
  console.log('🔄 生成 API paths...');
  let totalPaths = 0;
  
  for (const route of routes) {
    const pathKey = route.path.replace(/:\w+/g, (match: string) => `{${match.slice(1)}}`);
    
    if (!openApiSpec.paths[pathKey]) {
      openApiSpec.paths[pathKey] = {};
    }
    
    // 建立 OpenAPI operation 物件
    const operation: any = {
      tags: route.tags,
      summary: route.summary,
      operationId: `${route.method}${pathKey.replace(/[{}\/]/g, '_')}`,
      responses: {
        '200': {
          description: '成功回應',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '400': { $ref: '#/components/responses/BadRequestError' },
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '404': { $ref: '#/components/responses/NotFoundError' },
        '500': { $ref: '#/components/responses/InternalServerError' }
      }
    };
    
    if (route.description) {
      operation.description = route.description;
    }
    
    // 如果有 validator，添加 requestBody
    if (route.validatorName && (route.method === 'post' || route.method === 'put' || route.method === 'patch')) {
      // 尋找對應的 schema
      const schemaKey = Object.keys(openApiSpec.components.schemas).find(key => 
        key.includes(route.validatorName)
      );
      
      if (schemaKey) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaKey}` }
            }
          }
        };
      }
    }
    
    // 處理路徑參數
    const pathParams = route.path.match(/:(\w+)/g);
    if (pathParams) {
      operation.parameters = pathParams.map((param: string) => ({
        name: param.slice(1),
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: `${param.slice(1)} 參數`
      }));
    }
    
    // 添加認證要求（除了登入註冊等公開 API）
    if (!route.path.includes('login') && !route.path.includes('register') && !route.path.includes('health')) {
      operation.security = [{ bearerAuth: [] }];
    }
    
    openApiSpec.paths[pathKey][route.method] = operation;
    totalPaths++;
  }
  
  console.log(`✅ 生成了 ${totalPaths} 個 API 操作`);
  
  return openApiSpec;
}

/**
 * 主要執行函數
 */
async function main() {
  try {
    console.log('🚀 開始生成 Swagger/OpenAPI 文檔...');
    console.log('================================================');
    
    // 1. 載入 Zod schemas
    const schemas = await loadZodV4SchemasWithMetadata();
    
    // 2. 掃描路由定義
    const routes = await scanRouteDefinitions();
    
    // 3. 生成 OpenAPI 規範
    const openApiSpec = await generateOpenAPISpec(schemas, routes);
    
    // 4. 輸出文件
    const outputDir = path.join(__dirname, '..');
    const jsonPath = path.join(outputDir, 'openapi.json');
    const yamlPath = path.join(outputDir, 'openapi.yaml');
    
    console.log('💾 寫入文件...');
    
    // 寫入 JSON 格式
    fs.writeFileSync(jsonPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
    console.log(`✅ JSON: ${jsonPath}`);
    
    // 寫入 YAML 格式（簡單轉換）
    try {
      const yaml = require('js-yaml');
      fs.writeFileSync(yamlPath, yaml.dump(openApiSpec, { indent: 2 }), 'utf-8');
      console.log(`✅ YAML: ${yamlPath}`);
    } catch (error) {
      console.warn('⚠️  YAML 輸出失敗（需安裝 js-yaml）:', error);
    }
    
    console.log('================================================');
    console.log('🎉 Swagger/OpenAPI 文檔生成完成！');
    console.log(`📊 總計: ${Object.keys(openApiSpec.components.schemas).length} 個 schemas`);
    console.log(`🏷️  標籤: ${openApiSpec.tags.length} 個`);
    
  } catch (error) {
    console.error('❌ 生成失敗:', error);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

export { main, extractZodV4Metadata, loadZodV4SchemasWithMetadata };