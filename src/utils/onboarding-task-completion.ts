const getResponseData = (body: unknown): Record<string, unknown> | undefined => {
  if (!body || typeof body !== 'object') return undefined;
  const data = (body as Record<string, unknown>).data;
  return data && typeof data === 'object' ? data as Record<string, unknown> : undefined;
};

export const isCreatedPracticeResponse = (body: unknown): boolean => {
  const data = getResponseData(body);
  return data?.status === 'not_started' || data?.status === 'active';
};

/** 拆段批次建立：第一段為非草稿即視為完成「建立實踐」任務 */
export const isBatchCreatedPracticeResponse = (body: unknown): boolean => {
  const data = getResponseData(body);
  const practices = data?.practices;
  if (!Array.isArray(practices) || practices.length === 0) return false;
  const first = practices[0] as Record<string, unknown> | undefined;
  return first?.status === 'not_started' || first?.status === 'active';
};

export const isFirstCheckInResponse = (body: unknown): boolean => {
  const data = getResponseData(body);
  return data?.isFirstCheckIn === true;
};

export const isInspirationCommentTarget = (targetType: unknown): boolean => {
  return targetType === 'practice' || targetType === 'checkin';
};
