import { getLighthouseAiCredentialEncryptionConfig } from '../config/envelope-encryption.config';
import { AI_PROVIDER_PROBE_TIMEOUT_MS, AI_PROVIDER_PROBES, type AiCredentialProvider, type AiCredentialStatus } from '../constants/ai-provider';
import { LIGHTHOUSE_AUDIT_ACTIONS } from '../constants/audit-action';
import { ConflictError, ForbiddenError } from '../middleware/error.middleware';
import { writeLighthouseAudit } from '../utils/lighthouse-audit';
import type { OrganizationAiCredentialResponse, OrganizationAiCredentialTestResult, SetOrganizationAiCredentialInput } from '../validators/organization-ai-credential.validators';
import { decryptEnvelope, encryptEnvelope } from './envelope-encryption.service';
import { prisma } from './database/prisma.service';

/**
 * 組織自帶 AI API key（FRD FR-ORG-03、FR-OUT-02/08）。
 * - key 以 AES-256-GCM 信封存 organization_ai_credentials，AAD 綁 organization id；API 只回狀態與末四碼
 * - 測試連線打 provider 的列模型端點（不耗 token）；結果寫 status verified / invalid 與去識別化錯誤摘要
 * - resolveApiKey 給成果摘要（own_ai 模式）解密使用，不經 HTTP 回傳
 */

const select = {
  organization_id: true, provider: true, status: true, key_last4: true, last_tested_at: true, last_test_error: true, updated_at: true, updated_by: true
} as const;

type Row = { organization_id: number; provider: string; status: string; key_last4: string | null; last_tested_at: Date | null; last_test_error: string | null; updated_at: Date | null; updated_by: number | null };

const asProvider = (value: string): AiCredentialProvider => (value in AI_PROVIDER_PROBES ? (value as AiCredentialProvider) : 'openai');
const asStatus = (value: string): AiCredentialStatus => (['unset', 'set', 'verified', 'invalid', 'disabled'].includes(value) ? (value as AiCredentialStatus) : 'unset');

const aad = (organizationId: number): string => `lighthouse-ai-credential:v1:${organizationId}`;

const empty = (organizationId: number): OrganizationAiCredentialResponse => ({ organizationId, provider: 'openai', status: 'unset', keyLast4: null, lastTestedAt: null, lastTestError: null, updatedAt: null, updatedBy: null });

const map = (row: Row): OrganizationAiCredentialResponse => ({
  organizationId: row.organization_id, provider: asProvider(row.provider), status: asStatus(row.status), keyLast4: row.key_last4,
  lastTestedAt: row.last_tested_at, lastTestError: row.last_test_error, updatedAt: row.updated_at, updatedBy: row.updated_by
});

const assertOrganization = async (organizationId: number, userId: number): Promise<void> => {
  const member = await prisma.organization_members.findUnique({ where: { organization_id_user_id: { organization_id: organizationId, user_id: userId } }, select: { organization: { select: { status: true } } } });
  if (!member) throw new ForbiddenError('無權限存取此組織');
  if (member.organization.status !== 'active') throw new ForbiddenError('此組織目前已停權');
};

const get = async (organizationId: number, userId: number): Promise<OrganizationAiCredentialResponse> => {
  await assertOrganization(organizationId, userId);
  const row = await prisma.organization_ai_credentials.findUnique({ where: { organization_id: organizationId }, select });
  return row ? map(row) : empty(organizationId);
};

/** 存 key：覆寫舊 key、狀態回到 set（未測）、清掉上一筆測試結果（TP-ORG-04「輸入修改後上一筆連線狀態應被清除」） */
const set = async (organizationId: number, userId: number, input: SetOrganizationAiCredentialInput): Promise<OrganizationAiCredentialResponse> => {
  await assertOrganization(organizationId, userId);
  const envelope = encryptEnvelope(input.apiKey, aad(organizationId), getLighthouseAiCredentialEncryptionConfig());
  const now = new Date();
  const data = {
    provider: input.provider, api_key_ciphertext: envelope.ciphertext, encryption_iv: envelope.iv, encryption_auth_tag: envelope.authTag, encryption_version: envelope.version,
    key_last4: input.apiKey.slice(-4), status: 'set', last_tested_at: null, last_test_error: null, updated_by: userId, updated_at: now
  };
  const row = await prisma.$transaction(async tx => {
    const saved = await tx.organization_ai_credentials.upsert({
      where: { organization_id: organizationId },
      create: { organization_id: organizationId, ...data },
      update: data,
      select
    });
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_AI_CREDENTIAL_SET, 'organization', organizationId, {}, { provider: input.provider, keyLast4: data.key_last4 });
    return saved;
  });
  return map(row);
};

/** 清除 key：回到 unset，密文一併清空（CHECK unset_means_empty） */
const clear = async (organizationId: number, userId: number): Promise<OrganizationAiCredentialResponse> => {
  await assertOrganization(organizationId, userId);
  const existing = await prisma.organization_ai_credentials.findUnique({ where: { organization_id: organizationId }, select: { id: true, status: true } });
  if (!existing || existing.status === 'unset') return empty(organizationId);
  const row = await prisma.$transaction(async tx => {
    const saved = await tx.organization_ai_credentials.update({
      where: { organization_id: organizationId },
      data: { api_key_ciphertext: null, encryption_iv: null, encryption_auth_tag: null, encryption_version: null, key_last4: null, status: 'unset', last_tested_at: null, last_test_error: null, updated_by: userId, updated_at: new Date() },
      select
    });
    await writeLighthouseAudit(tx, userId, LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_AI_CREDENTIAL_CLEARED, 'organization', organizationId, { status: existing.status }, { status: 'unset' });
    return saved;
  });
  return map(row);
};

/** 解密取回明文 key；未設定／停用回 null。只給 server 內部（成果摘要）用 */
const resolveApiKey = async (organizationId: number): Promise<{ provider: AiCredentialProvider; apiKey: string } | null> => {
  const row = await prisma.organization_ai_credentials.findUnique({
    where: { organization_id: organizationId },
    select: { provider: true, status: true, api_key_ciphertext: true, encryption_iv: true, encryption_auth_tag: true, encryption_version: true }
  });
  if (!row || row.status === 'unset' || row.status === 'disabled' || !row.api_key_ciphertext) return null;
  const apiKey = decryptEnvelope(
    { ciphertext: row.api_key_ciphertext, iv: row.encryption_iv, authTag: row.encryption_auth_tag, version: row.encryption_version },
    aad(organizationId),
    getLighthouseAiCredentialEncryptionConfig()
  );
  return { provider: asProvider(row.provider), apiKey };
};

/** 錯誤摘要去識別化：不帶 key、截 200 字 */
const summarizeError = (message: string): string => message.replace(/(sk|key)[-_][A-Za-z0-9]{6,}/g, '***').slice(0, 200);

/** 打 provider 列模型端點驗證 key；只看 HTTP 狀態，不解析內容 */
const probeProvider = async (provider: AiCredentialProvider, apiKey: string): Promise<{ ok: boolean; error: string | null }> => {
  const probe = AI_PROVIDER_PROBES[provider];
  try {
    const res = await fetch(probe.url, { method: 'GET', headers: probe.headers(apiKey), signal: AbortSignal.timeout(AI_PROVIDER_PROBE_TIMEOUT_MS) });
    if (res.ok) return { ok: true, error: null };
    if (res.status === 401 || res.status === 403) return { ok: false, error: `API key 無效或無權限（HTTP ${res.status}）` };
    return { ok: false, error: `provider 回應 HTTP ${res.status}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: summarizeError(/abort|timeout/i.test(message) ? `連線逾時（${AI_PROVIDER_PROBE_TIMEOUT_MS / 1000} 秒）` : message) };
  }
};

/** 測試連線（TP-ORG-03/04）：空 key 回 409「請先輸入 API key 再測試」；結果寫回 status */
const test = async (organizationId: number, userId: number): Promise<OrganizationAiCredentialTestResult> => {
  await assertOrganization(organizationId, userId);
  const resolved = await resolveApiKey(organizationId);
  if (!resolved) throw new ConflictError('請先輸入 API key 再測試。');
  const result = await probeProvider(resolved.provider, resolved.apiKey);
  const row = await prisma.organization_ai_credentials.update({
    where: { organization_id: organizationId },
    data: { status: result.ok ? 'verified' : 'invalid', last_tested_at: new Date(), last_test_error: result.error, updated_at: new Date() },
    select
  });
  await writeLighthouseAudit(prisma, userId, LIGHTHOUSE_AUDIT_ACTIONS.ORGANIZATION_AI_CREDENTIAL_TESTED, 'organization', organizationId, {}, { provider: resolved.provider, ok: result.ok, error: result.error });
  return { ...map(row), ok: result.ok, message: result.ok ? '連線測試成功' : `連線測試失敗：${result.error ?? '未知錯誤'}` };
};

export const organizationAiCredentialService = { get, set, clear, test, resolveApiKey };
