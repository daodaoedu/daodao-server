import {
  getFutureLetterEncryptionConfig,
  resetFutureLetterEncryptionConfigForTests,
} from '@/config/future-letter-encryption.config';
import {
  decryptFutureLetterContent,
  encryptFutureLetterContent,
} from '@/services/future-letter-encryption.service';

const userId = 42;
const letterId = '550e8400-e29b-41d4-a716-446655440000';

describe('Future Letter authenticated encryption', () => {
  const originalVersion = process.env.FUTURE_LETTER_ACTIVE_KEY_VERSION;
  const originalKeys = process.env.FUTURE_LETTER_ENCRYPTION_KEYS;

  afterEach(() => {
    process.env.FUTURE_LETTER_ACTIVE_KEY_VERSION = originalVersion;
    process.env.FUTURE_LETTER_ENCRYPTION_KEYS = originalKeys;
    resetFutureLetterEncryptionConfigForTests();
  });

  it('round-trips both content fields without storing plaintext', () => {
    const content = { currentSelf: '現在的我', message: '給未來的話' };
    const encrypted = encryptFutureLetterContent(content, userId, letterId);
    expect(encrypted.contentCiphertext.toString('utf8')).not.toContain(content.currentSelf);
    expect(decryptFutureLetterContent({
      content_ciphertext: encrypted.contentCiphertext,
      encryption_iv: encrypted.encryptionIv,
      encryption_auth_tag: encrypted.encryptionAuthTag,
      encryption_version: encrypted.encryptionVersion,
    }, userId, letterId)).toEqual(content);
  });

  it('rejects tampering and cross-owner ciphertext substitution', () => {
    const encrypted = encryptFutureLetterContent({ currentSelf: 'secret', message: '' }, userId, letterId);
    const stored = {
      content_ciphertext: Buffer.from(encrypted.contentCiphertext),
      encryption_iv: encrypted.encryptionIv,
      encryption_auth_tag: encrypted.encryptionAuthTag,
      encryption_version: encrypted.encryptionVersion,
    };
    stored.content_ciphertext[0] ^= 1;
    expect(() => decryptFutureLetterContent(stored, userId, letterId)).toThrow();
    expect(() => decryptFutureLetterContent({ ...stored, content_ciphertext: encrypted.contentCiphertext }, userId + 1, letterId)).toThrow();
  });

  it('validates a versioned 32-byte base64 keyring and rejects missing active keys', () => {
    process.env.FUTURE_LETTER_ACTIVE_KEY_VERSION = 'missing';
    process.env.FUTURE_LETTER_ENCRYPTION_KEYS = JSON.stringify({ v1: Buffer.alloc(32).toString('base64') });
    resetFutureLetterEncryptionConfigForTests();
    expect(() => getFutureLetterEncryptionConfig()).toThrow('active key version missing');
  });
});
