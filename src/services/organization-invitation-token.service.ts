import { createHash, createHmac, randomBytes } from 'crypto';

/** Normalize Email without provider-specific alias folding. */
export const normalizeInvitationEmail = (email: string): string => email.trim().toLowerCase();

/** Reconstruct a delivery token from a random nonce without storing the token. */
export const invitationToken = (nonce: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return createHmac('sha256', secret).update(`organization-owner-invitation:v1:${nonce}`).digest('hex');
};

/** Store only a one-way lookup hash and a nonce independent of the signing key. */
export const createInvitationToken = () => {
  const nonce = randomBytes(32).toString('hex');
  const token = invitationToken(nonce);
  return { nonce, hash: hashInvitationToken(token) };
};

/** Hash an incoming token for a bounded database lookup. */
export const hashInvitationToken = (token: string): string => createHash('sha256').update(token).digest('hex');
