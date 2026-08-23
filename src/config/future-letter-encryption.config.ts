interface FutureLetterEncryptionConfig {
  activeVersion: string;
  keys: ReadonlyMap<string, Buffer>;
}

let cachedConfig: FutureLetterEncryptionConfig | null = null;

function decodeKey(version: string, encoded: unknown): Buffer {
  if (typeof encoded !== 'string' || encoded.length === 0) {
    throw new Error(`Future Letter encryption key ${version} must be a base64 string`);
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
    throw new Error(`Future Letter encryption key ${version} must decode to exactly 32 bytes`);
  }
  return key;
}

/** Parse and validate the versioned Future Letter AES-256-GCM keyring. */
export function getFutureLetterEncryptionConfig(): FutureLetterEncryptionConfig {
  if (cachedConfig) return cachedConfig;

  const activeVersion = process.env.FUTURE_LETTER_ACTIVE_KEY_VERSION;
  const serializedKeys = process.env.FUTURE_LETTER_ENCRYPTION_KEYS;
  if (!activeVersion || !serializedKeys) {
    throw new Error('FUTURE_LETTER_ACTIVE_KEY_VERSION and FUTURE_LETTER_ENCRYPTION_KEYS are required');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serializedKeys);
  } catch {
    throw new Error('FUTURE_LETTER_ENCRYPTION_KEYS must be valid JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FUTURE_LETTER_ENCRYPTION_KEYS must be a JSON object');
  }

  const keys = new Map(Object.entries(parsed).map(([version, key]) => [version, decodeKey(version, key)]));
  if (!keys.has(activeVersion)) {
    throw new Error(`Future Letter active key version ${activeVersion} is missing from the keyring`);
  }
  cachedConfig = { activeVersion, keys };
  return cachedConfig;
}

/** Fail fast during server startup when the Future Letter keyring is invalid. */
export function validateFutureLetterEncryptionConfig(): void {
  getFutureLetterEncryptionConfig();
}

/** Test-only cache reset for environment validation coverage. */
export function resetFutureLetterEncryptionConfigForTests(): void {
  cachedConfig = null;
}
