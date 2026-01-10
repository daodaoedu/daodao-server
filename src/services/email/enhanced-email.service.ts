/**
 * 郵件配置管理
 * 統一管理所有郵件相關的配置
 */

export interface EmailConfig {
  // SMTP 配置
  smtp: {
    service: string;
    auth: {
      user: string;
      pass: string;
    };
  };
  
  // 發送者配置
  sender: {
    name: string;
    email: string;
  };
  
  // URL 配置
  urls: {
    frontend: string;
    backend: string;
  };
  
  // 重試配置
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * 驗證必要的環境變數
 */
function validateEnvironment(): void {
  const required = ['EMAIL_ADDRESS', 'EMAIL_PASSWORD', 'FRONTEND_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必要的郵件環境變數: ${missing.join(', ')}`);
  }
}

/**
 * 創建郵件配置
 */
export function createEmailConfig(): EmailConfig {
  validateEnvironment();
  
  return {
    smtp: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ADDRESS || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    },
    
    sender: {
      name: '島島阿學',
      email: process.env.EMAIL_ADDRESS || ''
    },
    
    urls: {
      frontend: process.env.FRONTEND_URL || '',
      backend: process.env.BACKEND_URL || 'http://localhost:3000'
    },
    
    retry: {
      maxAttempts: 3,
      backoffMs: 1000
    }
  };
}

/**
 * 獲取郵件配置（延遲初始化）
 */
export function getEmailConfig(): EmailConfig {
  return createEmailConfig();
}

// 導出默認配置實例（僅在需要時使用）
export const emailConfig = (() => {
  try {
    return createEmailConfig();
  } catch (error) {
    console.warn('郵件配置初始化失敗，將在實際使用時重試:', error instanceof Error ? error.message : String(error));
    return null;
  }
})();

// Re-export the email service as enhancedEmailService for compatibility
export { emailService as enhancedEmailService } from './email.service';