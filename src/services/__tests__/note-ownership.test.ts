import express, { ErrorRequestHandler } from 'express';
import request from 'supertest';
import { prismaMock } from '@tests/utils/prisma-mock';

jest.mock('@/services/database/prisma.service', () => ({ prisma: prismaMock }));
jest.mock('@/services/tag.service', () => ({ __esModule: true, default: { getEntityTags: jest.fn().mockResolvedValue([]) } }));

import { updateNote, deleteNote } from '@/services/note.service';
import { updateNote as updateHandler, deleteNote as deleteHandler } from '@/controllers/note.controller';

const ownerId = 17;
const outsiderId = 29;
const projectId = 'project-note-owner';
const noteId = 4;
const changes = { title: '中文 NEW 標題 ', content: '中文 NEW 內容 ', visibility: 'public' as const };

/** Stateful persistence fixture: use real service/controller code, replacing only database I/O. */
type FixturePost = { id: number; project_id: number; user_id: number; title: string; visibility: string; week: number; date: Date; users: null };
type FixtureNote = { id: number; post: FixturePost; content: string; image_urls: string[]; video_urls: string[] };
type Fixture = { state: { note: FixtureNote | null }; post: FixturePost; note: FixtureNote };

const fixture = (visibility = 'private'): Fixture => {
  const post = { id: 8, project_id: 3, user_id: ownerId, title: 'original', visibility, week: 1, date: new Date('2026-11-07'), users: null };
  const note = { id: noteId, post, content: 'original', image_urls: [], video_urls: [] };
  const state = { note: note as typeof note | null };
  prismaMock.$transaction.mockImplementation(async (callback: unknown) => {
    if (typeof callback !== 'function') throw new Error('Expected interactive transaction');
    return callback(prismaMock);
  });
  prismaMock.project.findUnique.mockResolvedValue({ id: 3 } as never);
  prismaMock.note.findFirst.mockImplementation((args) => {
    const scope = args?.where?.post;
    const scopedProject = scope && 'project_id' in scope ? scope.project_id : undefined;
    return Promise.resolve(state.note && (scopedProject === undefined || scopedProject === post.project_id) ? state.note : null) as never;
  });
  prismaMock.post.update.mockImplementation((args) => {
    Object.assign(post, args.data);
    return Promise.resolve(post) as never;
  });
  prismaMock.note.update.mockImplementation((args) => {
    Object.assign(note, args.data);
    return Promise.resolve(note) as never;
  });
  prismaMock.note.delete.mockImplementation(() => {
    state.note = null;
    return Promise.resolve(note) as never;
  });
  return { state, post, note };
};

/** Assert authorization occurs before any persisted mutation, including Post-only fields. */
const expectNoWrites = (): void => {
  expect(prismaMock.post.update).not.toHaveBeenCalled();
  expect(prismaMock.note.update).not.toHaveBeenCalled();
  expect(prismaMock.note.delete).not.toHaveBeenCalled();
};

/** Mount actual handlers with explicit authenticated numeric identity, independent of body/query. */
const makeApp = (identity?: number | string): express.Express => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (identity !== undefined) Object.assign(req, { user: { id: identity } });
    next();
  });
  app.put('/projects/:projectId/notes/:noteId', updateHandler);
  app.delete('/projects/:projectId/notes/:noteId', deleteHandler);
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  };
  app.use(errors);
  return app;
};

const url = `/projects/${projectId}/notes/${noteId}`;

describe('note owner authorization', () => {
  test.each(['private', 'public'])('nonowner cannot update %s note or its Post', async (visibility) => {
    const { state, post, note } = fixture(visibility);
    await expect(updateNote(projectId, noteId, changes, outsiderId)).rejects.toMatchObject({ statusCode: 403 });
    expectNoWrites();
    expect(state.note).toBe(note);
    expect(post).toMatchObject({ title: 'original', visibility });
    expect(note.content).toBe('original');
  });

  test.each(['private', 'public'])('nonowner cannot delete %s note', async (visibility) => {
    const { state, note } = fixture(visibility);
    await expect(deleteNote(projectId, noteId, outsiderId)).rejects.toMatchObject({ statusCode: 403 });
    expectNoWrites();
    expect(state.note).toBe(note);
  });

  test('owner can persist title, content and visibility', async () => {
    const { post, note } = fixture();
    const response = await updateNote(projectId, noteId, changes, ownerId);
    expect(response.data).toMatchObject(changes);
    expect(post).toMatchObject({ title: changes.title, visibility: changes.visibility });
    expect(note.content).toBe(changes.content);
  });

  test('owner can delete their note', async () => {
    const { state } = fixture();
    await expect(deleteNote(projectId, noteId, ownerId)).resolves.toMatchObject({ success: true, data: null });
    expect(state.note).toBeNull();
    expect(prismaMock.note.delete).toHaveBeenCalledTimes(1);
  });

  test.each(['missing project', 'missing note', 'different project'])('%s preserves 404 for both writes', async (scenario) => {
    fixture();
    if (scenario === 'missing project') prismaMock.project.findUnique.mockResolvedValue(null);
    if (scenario === 'missing note') prismaMock.note.findFirst.mockResolvedValue(null);
    if (scenario === 'different project') prismaMock.project.findUnique.mockResolvedValue({ id: 99 } as never);
    await expect(updateNote(projectId, noteId, changes, outsiderId)).rejects.toMatchObject({ statusCode: 404 });
    await expect(deleteNote(projectId, noteId, outsiderId)).rejects.toMatchObject({ statusCode: 404 });
    expectNoWrites();
  });

  test.each(['put', 'delete'] as const)('HTTP %s rejects nonowner despite body/query claiming owner', async (method) => {
    const { state, post } = fixture();
    const response = await request(makeApp(outsiderId))[method](`${url}?userId=${ownerId}`).send({ ...changes, userId: ownerId, user_id: ownerId });
    expect(response.status).toBe(403);
    expectNoWrites();
    expect(state.note).not.toBeNull();
    expect(post.title).toBe('original');
  });

  test.each(['put', 'delete'] as const)('HTTP %s accepts authenticated numeric owner', async (method) => {
    const { state, post, note } = fixture();
    const response = await request(makeApp(ownerId))[method](url).send(changes);
    expect(response.status).toBe(200);
    if (method === 'delete') {
      expect(response.body.data).toBeNull();
      expect(state.note).toBeNull();
    }
    else {
      expect(response.body.data).toMatchObject(changes);
      expect(post.title).toBe(changes.title);
      expect(note.content).toBe(changes.content);
    }
  });

  test.each([undefined, String(ownerId)])('HTTP missing or nonnumeric identity %s stays 401', async (identity) => {
    fixture();
    for (const method of ['put', 'delete'] as const) {
      expect((await request(makeApp(identity))[method](url).send(changes)).status).toBe(401);
    }
    expectNoWrites();
  });
});
