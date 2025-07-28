/**
 * Prisma 錯誤處理工具
 * 提供 Prisma 錯誤的映射和分類功能
 */

import { 
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError
} from '@prisma/client/runtime/library';

/**
 * Prisma 錯誤代碼映射
 */
export interface PrismaErrorMapping {
  code: string;
  httpStatusCode: number;
  errorType: string;
  message: string;
}

/**
 * Prisma 錯誤代碼映射表
 */
export const PRISMA_ERROR_MAPPINGS: Record<string, PrismaErrorMapping> = {
  // 唯一約束違反
  P2002: {
    code: 'DUPLICATE_RESOURCE',
    httpStatusCode: 409,
    errorType: 'conflict',
    message: '資料衝突，資源已存在'
  },
  // 外鍵約束違反
  P2003: {
    code: 'INVALID_REFERENCE',
    httpStatusCode: 400,
    errorType: 'bad_request',
    message: '關聯資料不存在'
  },
  // 記錄不存在
  P2025: {
    code: 'RESOURCE_NOT_FOUND',
    httpStatusCode: 404,
    errorType: 'not_found',
    message: '找不到指定的資源'
  },
  // 連接逾時
  P1008: {
    code: 'DATABASE_TIMEOUT',
    httpStatusCode: 503,
    errorType: 'service_unavailable',
    message: '資料庫連接逾時'
  },
  // 資料庫不存在
  P1003: {
    code: 'DATABASE_NOT_FOUND',
    httpStatusCode: 503,
    errorType: 'service_unavailable',
    message: '資料庫不存在'
  },
  // 認證失敗
  P1000: {
    code: 'DATABASE_AUTH_FAILED',
    httpStatusCode: 503,
    errorType: 'service_unavailable',
    message: '資料庫認證失敗'
  },
  // 資料過長
  P2000: {
    code: 'DATA_TOO_LONG',
    httpStatusCode: 400,
    errorType: 'bad_request',
    message: '資料長度超過限制'
  },
  // 必填欄位為空
  P2011: {
    code: 'REQUIRED_FIELD_MISSING',
    httpStatusCode: 400,
    errorType: 'bad_request',
    message: '必填欄位不能為空'
  },
  // 檢查約束違反
  P2006: {
    code: 'CHECK_CONSTRAINT_VIOLATION',
    httpStatusCode: 400,
    errorType: 'bad_request',
    message: '資料不符合檢查約束'
  }
};

/**
 * 檢查是否為 Prisma 已知請求錯誤
 */
export function isPrismaKnownRequestError(error: unknown): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError;
}

/**
 * 檢查是否為 Prisma 未知請求錯誤
 */
export function isPrismaUnknownRequestError(error: unknown): error is PrismaClientUnknownRequestError {
  return error instanceof PrismaClientUnknownRequestError;
}

/**
 * 檢查是否為 Prisma 驗證錯誤
 */
export function isPrismaValidationError(error: unknown): error is PrismaClientValidationError {
  return error instanceof PrismaClientValidationError;
}

/**
 * 檢查是否為 Prisma 初始化錯誤
 */
export function isPrismaInitializationError(error: unknown): error is PrismaClientInitializationError {
  return error instanceof PrismaClientInitializationError;
}

/**
 * 檢查是否為 Prisma Rust Panic 錯誤
 */
export function isPrismaRustPanicError(error: unknown): error is PrismaClientRustPanicError {
  return error instanceof PrismaClientRustPanicError;
}

/**
 * 檢查是否為任何 Prisma 錯誤
 */
export function isPrismaError(error: unknown): boolean {
  return (
    isPrismaKnownRequestError(error) ||
    isPrismaUnknownRequestError(error) ||
    isPrismaValidationError(error) ||
    isPrismaInitializationError(error) ||
    isPrismaRustPanicError(error)
  );
}

/**
 * 根據 Prisma 錯誤代碼獲取錯誤映射
 */
export function getPrismaErrorMapping(code: string): PrismaErrorMapping {
  return PRISMA_ERROR_MAPPINGS[code] || {
    code: 'DATABASE_ERROR',
    httpStatusCode: 500,
    errorType: 'internal_server_error',
    message: '資料庫操作失敗'
  };
}

/**
 * 分類 Prisma 錯誤類型
 */
export function categorizePrismaError(error: unknown): {
  statusCode: number;
  message: string;
  errorCode: string;
  errorType: string;
  details?: Record<string, string>;
} {
  // 處理 Prisma 已知請求錯誤
  if (isPrismaKnownRequestError(error)) {
    const mapping = getPrismaErrorMapping(error.code);
    
    // 特殊處理唯一約束錯誤，提取欄位資訊
    if (error.code === 'P2002' && error.meta?.target) {
      const fields = Array.isArray(error.meta.target) ? error.meta.target : [error.meta.target];
      const fieldNames = fields.join(', ');
      return {
        statusCode: mapping.httpStatusCode,
        message: `${mapping.message}: ${fieldNames}`,
        errorCode: mapping.code,
        errorType: mapping.errorType,
        details: {
          fields: fieldNames,
          constraint: 'unique'
        }
      };
    }
    
    // 特殊處理外鍵約束錯誤
    if (error.code === 'P2003' && error.meta?.field_name) {
      return {
        statusCode: mapping.httpStatusCode,
        message: `${mapping.message}: ${error.meta.field_name}`,
        errorCode: mapping.code,
        errorType: mapping.errorType,
        details: {
          field: error.meta.field_name as string,
          constraint: 'foreign_key'
        }
      };
    }
    
    return {
      statusCode: mapping.httpStatusCode,
      message: mapping.message,
      errorCode: mapping.code,
      errorType: mapping.errorType
    };
  }
  
  // 處理 Prisma 驗證錯誤
  if (isPrismaValidationError(error)) {
    return {
      statusCode: 400,
      message: '資料驗證失敗',
      errorCode: 'VALIDATION_ERROR',
      errorType: 'bad_request'
    };
  }
  
  // 處理 Prisma 初始化錯誤
  if (isPrismaInitializationError(error)) {
    return {
      statusCode: 503,
      message: '資料庫初始化失敗',
      errorCode: 'DATABASE_INITIALIZATION_ERROR',
      errorType: 'service_unavailable'
    };
  }
  
  // 處理 Prisma Rust Panic 錯誤
  if (isPrismaRustPanicError(error)) {
    return {
      statusCode: 500,
      message: '資料庫引擎錯誤',
      errorCode: 'DATABASE_ENGINE_ERROR',
      errorType: 'internal_server_error'
    };
  }
  
  // 處理 Prisma 未知請求錯誤
  if (isPrismaUnknownRequestError(error)) {
    return {
      statusCode: 500,
      message: '未知的資料庫錯誤',
      errorCode: 'UNKNOWN_DATABASE_ERROR',
      errorType: 'internal_server_error'
    };
  }
  
  // 不是 Prisma 錯誤，返回預設值
  return {
    statusCode: 500,
    message: '內部伺服器錯誤',
    errorCode: 'INTERNAL_SERVER_ERROR',
    errorType: 'internal_server_error'
  };
}

/**
 * 生成 Prisma 錯誤訊息
 */
export function generatePrismaErrorMessage(error: unknown): string {
  if (isPrismaKnownRequestError(error)) {
    const mapping = getPrismaErrorMapping(error.code);
    
    // 根據錯誤代碼生成特定訊息
    switch (error.code) {
      case 'P2002':
        if (error.meta?.target) {
          const fields = Array.isArray(error.meta.target) ? error.meta.target : [error.meta.target];
          return `${mapping.message}: ${fields.join(', ')}`;
        }
        return mapping.message;
      
      case 'P2003':
        if (error.meta?.field_name) {
          return `${mapping.message}: ${error.meta.field_name}`;
        }
        return mapping.message;
      
      case 'P2025':
        if (error.meta?.cause) {
          return `${mapping.message}: ${error.meta.cause}`;
        }
        return mapping.message;
      
      default:
        return mapping.message;
    }
  }
  
  if (isPrismaValidationError(error)) {
    return '資料驗證失敗';
  }
  
  if (isPrismaInitializationError(error)) {
    return '資料庫初始化失敗';
  }
  
  if (isPrismaRustPanicError(error)) {
    return '資料庫引擎錯誤';
  }
  
  if (isPrismaUnknownRequestError(error)) {
    return '未知的資料庫錯誤';
  }
  
  return '內部伺服器錯誤';
}