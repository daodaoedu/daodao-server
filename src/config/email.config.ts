/**
 * 郵件配置管理
 * 統一管理所有郵件相關的配置
 */

export interface EmailConfig {
  // SMTP 配置
  smtp: {
    service: 'gmail';
    auth: {
      user: string;
      pass: string;
    };
  } | {
    host: string;
    port: number;
    secure: boolean;
  };

  // 發送者配置
  sender: {
    name: string;
    email: string;
  };

  // URL 配置
  urls: {
    frontend: string;
    website: string;
    backend: string;
  };

  // 重試配置
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };

  // 批量發送配置
  bulk: {
    delayMs: number;       // 每封郵件之間的延遲（毫秒）
    batchSize: number;     // 批次大小
    maxConcurrent: number; // 最大並發數
  };
}

/**
 * 驗證必要的環境變數
 */
function validateEnvironment(env: NodeJS.ProcessEnv): void {
  const required = ['EMAIL_ADDRESS', 'FRONTEND_URL'];
  if (!env.SMTP_HOST) required.push('EMAIL_PASSWORD');
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必要的郵件環境變數: ${missing.join(', ')}`);
  }
}

/**
 * 創建郵件配置
 */
export function createEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  validateEnvironment(env);

  let smtp: EmailConfig['smtp'];
  if (env.SMTP_HOST) {
    const portText = env.SMTP_PORT ?? '1025';
    const port = Number(portText);
    if (!/^[0-9]+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SMTP_PORT 必須是 1 到 65535 的整數');
    }
    const secureText = env.SMTP_SECURE ?? 'false';
    if (secureText !== 'true' && secureText !== 'false') {
      throw new Error('SMTP_SECURE 必須是 true 或 false');
    }
    smtp = { host: env.SMTP_HOST, port, secure: secureText === 'true' };
  } else {
    smtp = {
      service: 'gmail',
      auth: { user: env.EMAIL_ADDRESS || '', pass: env.EMAIL_PASSWORD || '' },
    };
  }
  
  return {
    smtp,

    sender: {
      name: '島島阿學',
      email: env.EMAIL_ADDRESS || ''
    },
    
    urls: {
      frontend: env.FRONTEND_URL || '',
      website: env.WEBSITE_URL || 'https://daodao.so',
      backend: env.BACKEND_URL || 'http://localhost:3000'
    },
    
    retry: {
      maxAttempts: 3,
      backoffMs: 1000
    },

    bulk: {
      delayMs: Number(env.EMAIL_BULK_DELAY_MS) || 100,
      batchSize: Number(env.EMAIL_BATCH_SIZE) || 10,
      maxConcurrent: Number(env.EMAIL_MAX_CONCURRENT) || 3
    }
  };
}

// 使用 getter 函數而不是立即初始化
export function getEmailConfig(): EmailConfig {
  return createEmailConfig();
}

// 導出默認配置實例（僅在需要時使用，初始化失敗時為 null）
export const emailConfig = ((): EmailConfig | null => {
  try {
    return createEmailConfig();
  } catch (error) {
    console.warn('郵件配置初始化失敗，將在實際使用時重試:', error instanceof Error ? error.message : String(error));
    return null;
  }
})();