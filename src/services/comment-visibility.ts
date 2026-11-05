import type { AuthUser } from '../types/comment.types';

export interface CommentVisibilitySubject {
  id: number;
  user_id: number;
  target_id: number;
  target_type: string;
  visibility: string | null;
  parent_id: number | null;
}

/** The same individual-comment permissions used by the comments API. */
export function canViewCommentSubject(
  comment: Pick<CommentVisibilitySubject, 'user_id' | 'visibility'>,
  viewer: AuthUser | null | undefined,
  targetOwnerId: number,
  mentorParticipantIds: ReadonlySet<number> = new Set(),
): boolean {
  if (comment.visibility === 'public') return true;
  if (!viewer?.id) return false;
  return Number(comment.user_id) === Number(viewer.id)
    || Number(targetOwnerId) === Number(viewer.id)
    || (viewer.role === '4' && mentorParticipantIds.has(Number(comment.user_id)));
}

/** Count only nodes that can actually appear in the two-level comments tree. */
export function countVisiblePracticeComments(
  practices: ReadonlyArray<{ id: number; user_id: number }>,
  comments: ReadonlyArray<CommentVisibilitySubject>,
  viewer?: AuthUser | null,
  mentorParticipantIds: ReadonlySet<number> = new Set(),
): Record<number, number> {
  const owners = new Map(practices.map(practice => [practice.id, practice.user_id]));
  const byId = new Map(comments.map(comment => [comment.id, comment]));
  const counts: Record<number, number> = {};
  for (const comment of comments) {
    const owner = owners.get(comment.target_id);
    if (owner === undefined || comment.target_type !== 'practice'
      || !canViewCommentSubject(comment, viewer, owner, mentorParticipantIds)) continue;
    if (comment.parent_id !== null) {
      const parent = byId.get(comment.parent_id);
      if (!parent || parent.parent_id !== null || parent.target_type !== comment.target_type
        || parent.target_id !== comment.target_id
        || !canViewCommentSubject(parent, viewer, owner, mentorParticipantIds)) continue;
    }
    counts[comment.target_id] = (counts[comment.target_id] ?? 0) + 1;
  }
  return counts;
}
