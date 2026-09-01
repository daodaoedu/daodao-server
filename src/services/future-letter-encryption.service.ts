import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { getFutureLetterEncryptionConfig } from '../config/future-letter-encryption.config';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export interface FutureLetterContent {
  currentSelf: string;
  message: string;
}

export interface EncryptedFutureLetterContent {
  contentCiphertext: Buffer;
  encryptionIv: Buffer;
  encryptionAuthTag: Buffer;
  encryptionVersion: string;
}

export interface StoredFutureLetterCiphertext {
  content_ciphertext: Uint8Array | null;
  encryption_iv: Uint8Array | null;
  encryption_auth_tag: Uint8Array | null;
  encryption_version: string | null;
}

function associatedData(userId: number, externalId: string): Buffer {
  return Buffer.from(`future-letter:v1:${userId}:${externalId}`, 'utf8');
}

/** Encrypt both private text fields as one authenticated payload. */
export function encryptFutureLetterContent(
  content: FutureLetterContent,
  userId: number,
  externalId: string,
): EncryptedFutureLetterContent {
  const { activeVersion, keys } = getFutureLetterEncryptionConfig();
  const key = keys.get(activeVersion);
  if (!key) throw new Error(`Future Letter active key version ${activeVersion} is unavailable`);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(associatedData(userId, externalId));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(content), 'utf8'),
    cipher.final(),
  ]);
  return {
    contentCiphertext: ciphertext,
    encryptionIv: iv,
    encryptionAuthTag: cipher.getAuthTag(),
    encryptionVersion: activeVersion,
  };
}

/** Decrypt and authenticate an owner-scoped Future Letter payload. */
export function decryptFutureLetterContent(
  stored: StoredFutureLetterCiphertext,
  userId: number,
  externalId: string,
): FutureLetterContent {
  const { keys } = getFutureLetterEncryptionConfig();
  const { content_ciphertext: ciphertext, encryption_iv: iv, encryption_auth_tag: authTag, encryption_version: version } = stored;
  if (!ciphertext || !iv || !authTag || !version) throw new Error('Future Letter encrypted content is incomplete');
  const key = keys.get(version);
  if (!key) throw new Error(`Future Letter encryption key version ${version} is unavailable`);

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv));
  decipher.setAAD(associatedData(userId, externalId));
  decipher.setAuthTag(Buffer.from(authTag));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext)),
    decipher.final(),
  ]).toString('utf8');
  const parsed = JSON.parse(plaintext) as Partial<FutureLetterContent>;
  if (typeof parsed.currentSelf !== 'string' || typeof parsed.message !== 'string') {
    throw new Error('Future Letter decrypted content has an invalid shape');
  }
  return { currentSelf: parsed.currentSelf, message: parsed.message };
}
