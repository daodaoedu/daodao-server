import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EnvelopeEncryptionConfig } from '../config/envelope-encryption.config';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export interface EncryptedEnvelope {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  version: string;
}

export interface StoredEnvelope {
  ciphertext: Uint8Array | null;
  iv: Uint8Array | null;
  authTag: Uint8Array | null;
  version: string | null;
}

/** 加密一段文字；aad 綁定擁有者（例如 organization id），換了擁有者密文就解不開 */
export function encryptEnvelope(plaintext: string, aad: string, config: EnvelopeEncryptionConfig): EncryptedEnvelope {
  const key = config.keys.get(config.activeVersion);
  if (!key) throw new Error(`Active encryption key version ${config.activeVersion} is unavailable`);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return { ciphertext, iv, authTag: cipher.getAuthTag(), version: config.activeVersion };
}

export function decryptEnvelope(stored: StoredEnvelope, aad: string, config: EnvelopeEncryptionConfig): string {
  const { ciphertext, iv, authTag, version } = stored;
  if (!ciphertext || !iv || !authTag || !version) throw new Error('Encrypted envelope is incomplete');
  const key = config.keys.get(version);
  if (!key) throw new Error(`Encryption key version ${version} is unavailable`);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv));
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(Buffer.from(authTag));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]).toString('utf8');
}
