/** Extract a Google-verified Email before any email-based account lookup. */
export const getVerifiedGoogleEmail = (emails?: Array<{ value: string; verified?: boolean }>): string => {
  const email = emails?.find(candidate => candidate.verified === true)?.value.trim().toLowerCase();
  if (!email) throw new Error('Google profile must include a verified email');
  return email;
};
