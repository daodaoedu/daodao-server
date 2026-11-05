import { createInvitationToken, hashInvitationToken, invitationToken, normalizeInvitationEmail } from '../organization-invitation-token.service';
import { getVerifiedGoogleEmail } from '../auth/verified-google-email';

describe('owner invitation tokens and verified Email boundary', () => {
  it('normalizes whitespace/case without folding provider aliases', () => {
    expect(normalizeInvitationEmail('  Owner+Team@Example.com ')).toBe('owner+team@example.com');
  });
  it('creates independently random links and can reconstruct the same delivery token', () => {
    const first = createInvitationToken();
    const second = createInvitationToken();
    expect(first.nonce).not.toBe(second.nonce);
    const token = invitationToken(first.nonce);
    expect(hashInvitationToken(token)).toBe(first.hash);
    expect(token).not.toBe(first.nonce);
    expect(first).not.toHaveProperty('token');
    expect(hashInvitationToken(invitationToken(second.nonce))).not.toBe(first.hash);
  });
  it('requires the signing secret and does not silently use a development key', () => {
    const secret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try { expect(() => invitationToken('nonce')).toThrow('JWT_SECRET'); }
    finally { process.env.JWT_SECRET = secret; }
  });
  it('rejects absent, unverified, or string-true Google email before account lookup', () => {
    expect(() => getVerifiedGoogleEmail()).toThrow('verified');
    expect(() => getVerifiedGoogleEmail([{ value: 'owner@example.com', verified: false }])).toThrow('verified');
    expect(() => getVerifiedGoogleEmail([{ value: 'owner@example.com' }])).toThrow('verified');
    expect(() => getVerifiedGoogleEmail([{ value: 'owner@example.com', verified: 'true' as unknown as boolean }])).toThrow('verified');
  });
  it('chooses a verified Google email and normalizes it', () => {
    expect(getVerifiedGoogleEmail([{ value: 'unsafe@example.com', verified: false }, { value: ' Owner@Example.com ', verified: true }])).toBe('owner@example.com');
  });
});
