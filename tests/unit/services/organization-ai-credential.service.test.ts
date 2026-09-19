import { prismaMock, setupTransactionMock } from '@tests/utils/prisma-mock';
jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
import { organizationAiCredentialService } from '@/services/organization-ai-credential.service';
import { resetEnvelopeEncryptionConfigForTests } from '@/config/envelope-encryption.config';
import { ConflictError } from '@/middleware/error.middleware';

const allow = () => prismaMock.organization_members.findUnique.mockResolvedValue({ organization: { status: 'active' } } as never);
const saved = { ...process.env };
const fetchMock = jest.fn();

describe('organizationAiCredentialService', () => {
  beforeEach(() => {
    setupTransactionMock();
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ENCRYPTION_KEYS = JSON.stringify({ v1: Buffer.alloc(32, 7).toString('base64') });
    process.env.LIGHTHOUSE_AI_CREDENTIAL_ACTIVE_KEY_VERSION = 'v1';
    resetEnvelopeEncryptionConfigForTests();
    global.fetch = fetchMock as never;
    fetchMock.mockReset();
  });
  afterEach(() => { process.env = { ...saved }; });

  it('returns an unset placeholder when the organization has no credential row', async () => {
    allow(); prismaMock.organization_ai_credentials.findUnique.mockResolvedValue(null);
    expect(await organizationAiCredentialService.get(1, 42)).toEqual(expect.objectContaining({ organizationId: 1, status: 'unset', keyLast4: null }));
  });

  it('stores only the encrypted envelope and last4, resets the test result, and never returns the key', async () => {
    allow();
    prismaMock.organization_ai_credentials.upsert.mockImplementation((async (args: { create: Record<string, unknown> }) => ({ organization_id: 1, provider: args.create.provider, status: args.create.status, key_last4: args.create.key_last4, last_tested_at: null, last_test_error: null, updated_at: new Date(), updated_by: 42 })) as never);
    const result = await organizationAiCredentialService.set(1, 42, { provider: 'openai', apiKey: 'sk-test-abcdef1234' });
    const call = prismaMock.organization_ai_credentials.upsert.mock.calls[0][0] as { create: Record<string, unknown> };
    expect(call.create.api_key_ciphertext).toBeInstanceOf(Buffer);
    expect((call.create.api_key_ciphertext as Buffer).toString('utf8')).not.toContain('sk-test');
    expect(call.create).toEqual(expect.objectContaining({ key_last4: '1234', status: 'set', last_tested_at: null, last_test_error: null, encryption_version: 'v1' }));
    expect(JSON.stringify(result)).not.toContain('sk-test');
    expect(result).toEqual(expect.objectContaining({ status: 'set', keyLast4: '1234', provider: 'openai' }));
  });

  it('decrypts the stored key for internal use and refuses when unset or disabled', async () => {
    allow();
    let stored: Record<string, unknown> = {};
    prismaMock.organization_ai_credentials.upsert.mockImplementation((async (args: { create: Record<string, unknown> }) => { stored = args.create; return { ...args.create, organization_id: 1, updated_at: null, updated_by: 42 }; }) as never);
    await organizationAiCredentialService.set(1, 42, { provider: 'groq', apiKey: 'gsk_secret_value_9999' });
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue(stored as never);
    expect(await organizationAiCredentialService.resolveApiKey(1)).toEqual({ provider: 'groq', apiKey: 'gsk_secret_value_9999' });
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue({ ...stored, status: 'disabled' } as never);
    expect(await organizationAiCredentialService.resolveApiKey(1)).toBeNull();
  });

  it('refuses to test an empty key with the FRD wording', async () => {
    allow(); prismaMock.organization_ai_credentials.findUnique.mockResolvedValue(null);
    await expect(organizationAiCredentialService.test(1, 42)).rejects.toThrow('請先輸入 API key 再測試。');
    await expect(organizationAiCredentialService.test(1, 42)).rejects.toBeInstanceOf(ConflictError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks the credential verified on a 2xx probe and invalid on 401, without leaking the key in the error', async () => {
    allow();
    let stored: Record<string, unknown> = {};
    prismaMock.organization_ai_credentials.upsert.mockImplementation((async (args: { create: Record<string, unknown> }) => { stored = args.create; return { ...args.create, organization_id: 1, updated_at: null, updated_by: 42 }; }) as never);
    await organizationAiCredentialService.set(1, 42, { provider: 'anthropic', apiKey: 'sk-ant-secret-000000' });
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue(stored as never);
    prismaMock.organization_ai_credentials.update.mockImplementation((async (args: { data: Record<string, unknown> }) => ({ organization_id: 1, provider: 'anthropic', key_last4: '0000', updated_at: null, updated_by: 42, ...args.data })) as never);

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    const ok = await organizationAiCredentialService.test(1, 42);
    expect(ok).toEqual(expect.objectContaining({ ok: true, status: 'verified', lastTestError: null }));
    expect(fetchMock).toHaveBeenCalledWith('https://api.anthropic.com/v1/models', expect.objectContaining({ headers: expect.objectContaining({ 'x-api-key': 'sk-ant-secret-000000' }) }));

    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const bad = await organizationAiCredentialService.test(1, 42);
    expect(bad).toEqual(expect.objectContaining({ ok: false, status: 'invalid' }));
    expect(bad.lastTestError).toContain('401');
    expect(JSON.stringify(bad)).not.toContain('sk-ant');
  });

  it('clears the key back to unset and wipes the envelope columns', async () => {
    allow();
    prismaMock.organization_ai_credentials.findUnique.mockResolvedValue({ id: 1, status: 'verified' } as never);
    prismaMock.organization_ai_credentials.update.mockResolvedValue({ organization_id: 1, provider: 'openai', status: 'unset', key_last4: null, last_tested_at: null, last_test_error: null, updated_at: null, updated_by: 42 } as never);
    const result = await organizationAiCredentialService.clear(1, 42);
    expect(result.status).toBe('unset');
    expect(prismaMock.organization_ai_credentials.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ api_key_ciphertext: null, encryption_iv: null, encryption_auth_tag: null, encryption_version: null, key_last4: null, status: 'unset' }) }));
  });
});
