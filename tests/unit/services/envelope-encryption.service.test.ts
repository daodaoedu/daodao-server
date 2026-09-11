import { getLighthouseAiCredentialEncryptionConfig, loadEnvelopeEncryptionConfig, resetEnvelopeEncryptionConfigForTests } from '@/config/envelope-encryption.config';
import { decryptEnvelope, encryptEnvelope } from '@/services/envelope-encryption.service';

const KEY_V1 = Buffer.alloc(32, 1).toString('base64');
const KEY_V2 = Buffer.alloc(32, 2).toString('base64');

describe('envelope encryption (organization AI credential keyring)', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; resetEnvelopeEncryptionConfigForTests(); });

  it('round-trips with the active key and binds the ciphertext to the AAD', () => {
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS = JSON.stringify({ v1: KEY_V1 });
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ACTIVE_KEY_VERSION = 'v1';
    const config = getLighthouseAiCredentialEncryptionConfig();
    const envelope = encryptEnvelope('sk-secret-1234', 'org:1', config);
    expect(envelope.ciphertext.toString('utf8')).not.toContain('sk-secret');
    expect(decryptEnvelope({ ciphertext: envelope.ciphertext, iv: envelope.iv, authTag: envelope.authTag, version: envelope.version }, 'org:1', config)).toBe('sk-secret-1234');
    expect(() => decryptEnvelope({ ciphertext: envelope.ciphertext, iv: envelope.iv, authTag: envelope.authTag, version: envelope.version }, 'org:2', config)).toThrow();
  });

  it('falls back to the Future Letter keyring when the lighthouse keyring is not configured', () => {
    delete process.env.LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS;
    process.env.FUTURE_LETTER_ENCRYPTION_KEYS = JSON.stringify({ v1: KEY_V1, v2: KEY_V2 });
    process.env.FUTURE_LETTER_ACTIVE_KEY_VERSION = 'v2';
    const config = getLighthouseAiCredentialEncryptionConfig();
    expect(config.activeVersion).toBe('v2');
    expect(config.keys.size).toBe(2);
  });

  it('rejects keys that are not 32 bytes and a missing active version', () => {
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS = JSON.stringify({ v1: Buffer.alloc(16, 1).toString('base64') });
    expect(() => getLighthouseAiCredentialEncryptionConfig()).toThrow(/32 bytes/);
    resetEnvelopeEncryptionConfigForTests();
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS = JSON.stringify({ v1: KEY_V1 });
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ACTIVE_KEY_VERSION = 'v9';
    expect(() => loadEnvelopeEncryptionConfig({ label: 'x', keysEnv: 'LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS', activeVersionEnv: 'LIGHTHOUSE_AI_CREDENTIAL_ACTIVE_KEY_VERSION' })).toThrow(/v9/);
  });
});
