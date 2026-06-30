const getResponseData = (body: unknown): Record<string, unknown> | undefined => {
  if (!body || typeof body !== 'object') return undefined;
  const data = (body as Record<string, unknown>).data;
  return data && typeof data === 'object' ? data as Record<string, unknown> : undefined;
};

export const isCreatedPracticeResponse = (body: unknown): boolean => {
  const data = getResponseData(body);
  return data?.status === 'not_started' || data?.status === 'active';
};

export const isFirstCheckInResponse = (body: unknown): boolean => {
  const data = getResponseData(body);
  return data?.isFirstCheckIn === true;
};

export const isInspirationCommentTarget = (targetType: unknown): boolean => {
  return targetType === 'practice' || targetType === 'checkin';
};
