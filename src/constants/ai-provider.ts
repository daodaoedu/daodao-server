/**
 * 組織自帶 AI API key 可選的 provider（值域沿 llm_models.provider 的子集，只列能用 key 直接驗證的雲端服務）。
 * 測試連線打各家最便宜的「列模型」端點，不消耗 token。
 */
export const AI_CREDENTIAL_PROVIDERS = ['openai', 'anthropic', 'gemini', 'groq', 'openrouter'] as const;
export type AiCredentialProvider = (typeof AI_CREDENTIAL_PROVIDERS)[number];

export const AI_CREDENTIAL_STATUSES = ['unset', 'set', 'verified', 'invalid', 'disabled'] as const;
export type AiCredentialStatus = (typeof AI_CREDENTIAL_STATUSES)[number];

export interface ProviderProbe {
  url: string;
  headers: (apiKey: string) => Record<string, string>;
}

export const AI_PROVIDER_PROBES: Record<AiCredentialProvider, ProviderProbe> = {
  openai: { url: 'https://api.openai.com/v1/models', headers: key => ({ Authorization: `Bearer ${key}` }) },
  anthropic: { url: 'https://api.anthropic.com/v1/models', headers: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }) },
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models', headers: key => ({ 'x-goog-api-key': key }) },
  groq: { url: 'https://api.groq.com/openai/v1/models', headers: key => ({ Authorization: `Bearer ${key}` }) },
  openrouter: { url: 'https://openrouter.ai/api/v1/models', headers: key => ({ Authorization: `Bearer ${key}` }) }
};

export const AI_PROVIDER_PROBE_TIMEOUT_MS = 10_000;
