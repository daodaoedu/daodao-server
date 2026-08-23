/** Future letter lifecycle states. */
export const FUTURE_LETTER_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  DELIVERED: 'delivered',
  DELETED: 'deleted',
} as const;

export type FutureLetterStatus = typeof FUTURE_LETTER_STATUS[keyof typeof FUTURE_LETTER_STATUS];

/** Public related-practice representation. */
export interface FutureLetterPractice {
  id: string | null;
  title: string;
}

/** Public future-letter API representation. */
export interface FutureLetterEntity {
  id: string;
  currentSelf: string | null;
  message: string | null;
  status: FutureLetterStatus;
  deliverAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  practiceId: string | null;
  practice: FutureLetterPractice | null;
  createdAt: string;
  updatedAt: string;
}

/** Paginated future-letter result. */
export interface FutureLetterPage {
  items: FutureLetterEntity[];
  page: number;
  limit: number;
  total: number;
}

/** A normalized entry in the learning timeline. */
export interface TimelineEntry {
  type: 'check-in' | 'milestone' | 'letter' | 'learning-dna';
  title: string;
  description: string | null;
  date: string;
  meta: Record<string, string | number | null>;
}

/** Cursor-paginated learning timeline result. */
export interface TimelinePage {
  items: TimelineEntry[];
  nextCursor: string | null;
}
