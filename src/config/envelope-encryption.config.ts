/**
 * 通用 AES-256-GCM 版本化 keyring 設定（沿 future-letter-encryption.config 的格式）：
 * - `<PREFIX>_ENCRYPTION_KEYS`：JSON 物件 { "<version>": "<base64 32 bytes>" }
 * - `<PREFIX>_ACTIVE_KEY_VERSION`：目前加密用的版本（預設 v1）
 */
export interface EnvelopeEncryptionConfig {
  activeVersion: string;
  keys: ReadonlyMap<string, Buffer>;
}

const cache = new Map<string, EnvelopeEncryptionConfig>();

function decodeKey(label: string, version: string, encoded: unknown): Buffer {
  if (typeof encoded !== 'string' || encoded.length === 0) {
    throw new Error(`${label} encryption key ${version} must be a base64 string`);
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
    throw new Error(`${label} encryption key ${version} must decode to exactly 32 bytes`);
  }
  return key;
}

export interface EnvelopeKeyringSource {
  /** 人看的名稱，只用在錯誤訊息 */
  label: string;
  keysEnv: string;
  activeVersionEnv: string;
  /** 主要 env 未設定時退回的 env（讓既有部署不用先加設定就能啟動） */
  fallbackKeysEnv?: string;
  fallbackActiveVersionEnv?: string;
}

export function loadEnvelopeEncryptionConfig(source: EnvelopeKeyringSource): EnvelopeEncryptionConfig {
  const cached = cache.get(source.keysEnv);
  if (cached) return cached;

  const usingFallback = !process.env[source.keysEnv] && source.fallbackKeysEnv && process.env[source.fallbackKeysEnv];
  const serializedKeys = usingFallback ? process.env[source.fallbackKeysEnv as string] : process.env[source.keysEnv];
  const activeVersion = (usingFallback ? process.env[source.fallbackActiveVersionEnv ?? ''] : process.env[source.activeVersionEnv]) || 'v1';
  if (!serializedKeys) {
    throw new Error(`${source.keysEnv} is required`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedKeys);
  } catch {
    throw new Error(`${source.keysEnv} must be valid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source.keysEnv} must be a JSON object`);
  }
  const keys = new Map(Object.entries(parsed).map(([version, key]) => [version, decodeKey(source.label, version, key)]));
  if (!keys.has(activeVersion)) {
    throw new Error(`${source.label} active key version ${activeVersion} is missing from the keyring`);
  }
  const config = { activeVersion, keys };
  cache.set(source.keysEnv, config);
  return config;
}

/**
 * 組織自帶 AI API key 的 keyring（migration 089 organization_ai_credentials）。
 * 未設定 LIGHTHOUSE_AI_CREDENTIAL_* 時退回 FUTURE_LETTER_*，AAD 不同所以密文不互通；
 * 正式環境建議另配一組 key，見 .env.example。
 */
export const LIGHTHOUSE_AI_CREDENTIAL_KEYRING: EnvelopeKeyringSource = {
  label: 'Lighthouse AI credential',
  keysEnv: 'LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS',
  activeVersionEnv: 'LIGHTHOUSE_AI_CREDENTIAL_ACTIVE_KEY_VERSION',
  fallbackKeysEnv: 'FUTURE_LETTER_ENCRYPTION_KEYS',
  fallbackActiveVersionEnv: 'FUTURE_LETTER_ACTIVE_KEY_VERSION'
};

export function getLighthouseAiCredentialEncryptionConfig(): EnvelopeEncryptionConfig {
  return loadEnvelopeEncryptionConfig(LIGHTHOUSE_AI_CREDENTIAL_KEYRING);
}

/** Test-only cache reset. */
export function resetEnvelopeEncryptionConfigForTests(): void {
  cache.clear();
}
