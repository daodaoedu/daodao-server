import { canViewCommentSubject, countVisiblePracticeComments } from '../comment-visibility';

const practices = [{ id: 140, user_id: 306 }, { id: 141, user_id: 400 }];
const row = (id: number, user_id: number, visibility: string, parent_id: number | null = null, target_id = 140) =>
  ({ id, user_id, visibility, parent_id, target_id, target_type: 'practice' });
const discussion = [
  row(1, 301, 'private'), row(2, 306, 'public', 1),
  row(3, 310, 'public'), row(4, 301, 'public', 3),
  row(5, 310, 'private'), row(6, 310, 'public', 999),
  row(7, 310, 'public', 3, 141),
];

it.each([
  ['anonymous', undefined, 2],
  ['peer', { id: 320, role: 'User' }, 2],
  ['author', { id: 301, role: 'Admin' }, 4],
  ['target owner', { id: 306, role: 'User' }, 5],
  ['another private author', { id: 310, role: 'User' }, 3],
  ['mentor with relation', { id: 500, role: '4' }, 5],
  ['unrelated mentor', { id: 501, role: '4' }, 2],
  ['nonmentor with relation', { id: 500, role: 'User' }, 2],
])('counts exactly renderable comments for %s', (_name, viewer, expected) => {
  const participants = new Set(viewer?.id === 500 ? [301, 310] : []);
  expect(countVisiblePracticeComments(practices, discussion, viewer, participants)[140]).toBe(expected);
  expect(countVisiblePracticeComments(practices, discussion, viewer, participants)[141] ?? 0).toBe(0);
});
it('does not count private-parent replies even when the reply is public or authored by the viewer', () => {
  expect(countVisiblePracticeComments(practices, [row(1, 301, 'private'), row(2, 310, 'public', 1)], { id: 310, role: 'User' })).toEqual({});
});
it('shares the comments API individual permissions without granting access to organization admins', () => {
  const privateComment = row(1, 301, 'private');
  expect(canViewCommentSubject(privateComment, { id: 320, role: 'Admin' }, 306)).toBe(false);
  expect(canViewCommentSubject(privateComment, { id: 301, role: 'User' }, 306)).toBe(true);
  expect(canViewCommentSubject(privateComment, { id: 306, role: 'User' }, 306)).toBe(true);
  expect(canViewCommentSubject(privateComment, { id: 500, role: '4' }, 306, new Set([301]))).toBe(true);
});

it('treats a null visibility as private, matching the comments API', () => {
  const comment = { ...row(1, 301, 'private'), visibility: null };
  expect(countVisiblePracticeComments(practices, [comment])[140] ?? 0).toBe(0);
  expect(countVisiblePracticeComments(practices, [comment], { id: 306, role: 'User' })[140]).toBe(1);
});
