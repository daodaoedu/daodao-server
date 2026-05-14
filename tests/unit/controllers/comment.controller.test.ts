import { CommentController } from '@/controllers/comment.controller';
import { commentService } from '@/services/comment.service';

jest.mock('@/services/comment.service', () => ({
  commentService: {
    createComment: jest.fn(),
  },
}));

describe('CommentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createComment forwards mentionedUserIds to the service', async () => {
    (commentService.createComment as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: 1,
        userId: 1,
        targetId: 'practice-1',
        targetType: 'practice',
        content: '@王小明 請看這個',
        visibility: 'public',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
        parent_id: null,
        user: {
          id: 'user-1',
          name: '留言者',
          roleList: [],
          photoURL: null,
          customId: null,
        },
        replies: [],
      },
      timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
    });

    const req = {
      user: { id: 1 },
      body: {
        targetType: 'practice',
        targetId: 'practice-1',
        content: '@王小明 請看這個',
        visibility: 'public',
        mentionedUserIds: [2],
      },
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    await new CommentController().createComment(req, res);

    expect(commentService.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        mentionedUserIds: [2],
      }),
    );
  });
});
