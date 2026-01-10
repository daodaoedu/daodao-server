/**
 * Note Service
 * 便利貼服務層 - 處理便利貼相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import type {
  NoteCreateRequest,
  NoteUpdateRequest,
  NoteResponse
} from '../types/note.types';
import type { UserBasicInfo } from '../types/common.types';
import { ApiSuccessResponse, PaginatedApiResponse } from '../types/api-response.types';
import { createSuccessResponse, createPaginatedResponse } from '../utils/response-helper';
import { calculatePagination } from '../utils/pagination-helper';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware';
import tagService from './tag.service';

/**
 * 安全日期格式化處理
 */
const safeDateFormatter = (dateValue: Date | string | null | undefined): string => {
  try {
    if (!dateValue) return '無效日期';
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      return '無效日期';
    }
    return dateObj.toISOString().split('T')[0];
  } catch (e) {
    return '日期格式錯誤';
  }
};

/**
 * 獲取用戶標籤
 */
const getUserTagsFromNote = async (userId: number): Promise<string[]> => {
  const tags = await tagService.getEntityTags('user', userId);
  return tags.map(tag => tag.name);
};

/**
 * 格式化用戶資訊
 */
const formatUserInfo = async (user: Record<string, unknown>): Promise<UserBasicInfo | null> => {
  if (!user) return null;
  
  const userPositions = user.user_positions as Array<Record<string, unknown>> | undefined;
  const contacts = user.contacts as Record<string, unknown> | undefined;
  const basicInfo = user.basic_info as Record<string, unknown> | undefined;
  
  return {
    id: user.id as number,
    name: user.nickname as string,
    _id: user.external_id as string,
    roleList: userPositions?.map(up => {
      const position = up.position as Record<string, unknown> | undefined;
      return position?.name as string;
    }).filter(Boolean) || [],
    photoURL: contacts?.photo_url as string | null || null,
    educationStage: user.education_stage as string | null || null,
    tagList: await getUserTagsFromNote(user.id as number),
    selfIntroduction: basicInfo?.self_introduction as string | null || null
  };
};

/**
 * 格式化便利貼回應資料
 */
const formatNoteResponse = async (note: Record<string, unknown>, post: Record<string, unknown>): Promise<NoteResponse> => {
  const users = post.users as Record<string, unknown> | null;
  return {
    id: note.id as number,
    week: post.week as number,
    title: post.title as string,
    content: (note.content as string) || '',
    date: safeDateFormatter(post.date as Date | string | null | undefined),
    imgUrls: (note.image_urls as string[]) || [],
    videoUrls: (note.video_urls as string[]) || [],
    visibility: (post.visibility as string) || 'private',
    user: users ? await formatUserInfo(users) : null
  };
};

/**
 * 創建便利貼
 */
export const createNote = async (
  projectId: string,
  userId: number,
  noteData: NoteCreateRequest
): Promise<ApiSuccessResponse<NoteResponse>> => {
    return await prisma.$transaction(async (tx) => {
      const { week, title, date, content, imgUrls, videoUrls, visibility } = noteData;

      // 日期驗證
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new BadRequestError('無效的日期格式，請使用 YYYY-MM-DD 格式');
      }

      // 檢查專案是否存在
      const project = await tx.project.findUnique({
        where: { external_id: projectId }
      });

      if (!project) {
        throw new NotFoundError('專案不存在');
      }

        // 創建 Post
        const post = await tx.post.create({
          data: {
            project_id: project.id,
            user_id: userId,
            week,
            title,
            type: 'note',
            date: parsedDate,
            visibility: visibility || 'private'
          }
        });

        // 創建 Note
        const note = await tx.note.create({
          data: {
            post_id: post.id,
            content: content,
            image_urls: imgUrls ? (Array.isArray(imgUrls) ? imgUrls : [imgUrls]) : [],
            video_urls: videoUrls ? (Array.isArray(videoUrls) ? videoUrls : [videoUrls]) : [],
            visibility: visibility || 'private'
          }
        });

        // 獲取用戶資訊
        const userInfo = await tx.users.findUnique({
          where: { id: userId },
          include: {
            contacts: true,
            basic_info: true,
            user_positions: {
              include: {
                position: true
              }
            }
          }
        });

      const responseData = await formatNoteResponse(note, { ...post, users: userInfo });

      return createSuccessResponse(responseData, {
        message: '便利貼創建成功'
      });
    });
};

/**
 * 獲取專案的便利貼列表
 */
export const getNotes = async (
  projectId: string
): Promise<ApiSuccessResponse<NoteResponse[]>> => {
    const project = await prisma.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

      const notes = await prisma.note.findMany({
        where: {
          post: {
            project_id: project.id,
            type: 'note'
          }
        },
        include: {
          post: {
            include: {
              users: {
                include: {
                  contacts: true,
                  basic_info: true,
                  user_positions: {
                    include: {
                      position: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          id: 'asc'
        }
      });

    const formattedNotes = await Promise.all(
      notes
        .filter(note => note.post)
        .map(note => formatNoteResponse(note as Record<string, unknown>, note.post as Record<string, unknown>))
    );

    return createSuccessResponse(formattedNotes, {
      totalCount: formattedNotes.length
    });
};

/**
 * 獲取用戶的便利貼列表
 */
export const getMyNotes = async (
  userId: number
): Promise<ApiSuccessResponse<NoteResponse[]>> => {
    const notes = await prisma.note.findMany({
      where: {
        post: {
          project: {
            user_id: userId
          }
        }
      },
      include: {
        post: {
          include: {
            project: true,
            users: {
              include: {
                contacts: true,
                basic_info: true,
                user_positions: {
                  include: {
                    position: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedNotes = await Promise.all(
      notes
        .filter(note => note.post && note.post.project)
        .map(note => formatNoteResponse(note, note.post as Record<string, unknown>))
    );

    return createSuccessResponse(formattedNotes, {
      totalCount: formattedNotes.length
    });
};

/**
 * 獲取便利貼詳情
 */
export const getNoteDetail = async (
  projectId: string,
  noteId: number
): Promise<ApiSuccessResponse<NoteResponse>> => {
    const project = await prisma.project.findUnique({
      where: { external_id: projectId }
    });

    if (!project) {
      throw new NotFoundError('專案不存在');
    }

      const note = await prisma.note.findFirst({
        where: { 
          id: noteId,
          post: {
            project_id: project.id
          }
        },
        include: {
          post: {
            include: {
              users: {
                include: {
                  contacts: true,
                  basic_info: true,
                  user_positions: {
                    include: {
                      position: true
                    }
                  }
                }
              }
            }
          }
        }
      });

    if (!note || !note.post) {
      throw new NotFoundError('便利貼不存在');
    }

    const responseData = await formatNoteResponse(note, note.post);

    return createSuccessResponse(responseData);
};

/**
 * 更新便利貼
 */
export const updateNote = async (
  projectId: string,
  noteId: number,
  updateData: NoteUpdateRequest
): Promise<ApiSuccessResponse<NoteResponse>> => {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { external_id: projectId }
      });

      if (!project) {
        throw new NotFoundError('專案不存在');
      }

      const note = await tx.note.findFirst({
        where: { 
          id: noteId,
          post: {
            project_id: project.id
          }
        },
        include: {
          post: true
        }
      });

      if (!note || !note.post) {
        throw new NotFoundError('便利貼不存在');
      }

        const { week, title, content, date, imgUrls, videoUrls, visibility } = updateData;

        // 更新 Post 資料
        const postUpdates: Record<string, unknown> = {};
        if (week !== undefined) postUpdates.week = week;
        if (title !== undefined) postUpdates.title = title;
      if (date !== undefined) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new BadRequestError('無效的日期格式，請使用 YYYY-MM-DD 格式');
        }
        postUpdates.date = parsedDate;
      }
        if (visibility !== undefined) postUpdates.visibility = visibility;

        if (Object.keys(postUpdates).length > 0) {
          await tx.post.update({
            where: { id: note.post.id },
            data: postUpdates
          });
        }

        // 更新 Note 資料
        const noteUpdates: Record<string, unknown> = {};
        if (content !== undefined) noteUpdates.content = content;
        if (imgUrls !== undefined) {
          noteUpdates.image_urls = Array.isArray(imgUrls) ? imgUrls : [imgUrls];
        }
        if (videoUrls !== undefined) {
          noteUpdates.video_urls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
        }

        if (Object.keys(noteUpdates).length > 0) {
          await tx.note.update({
            where: { id: noteId },
            data: noteUpdates
          });
        }

        // 獲取更新後的資料
        const updatedNote = await tx.note.findFirst({
          where: { id: noteId },
          include: {
            post: {
              include: {
                users: {
                  include: {
                    contacts: true,
                    basic_info: true,
                    user_positions: {
                      include: {
                        position: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

      if (!updatedNote || !updatedNote.post) {
        throw new BadRequestError('更新後無法獲取便利貼資料');
      }

      const responseData = await formatNoteResponse(updatedNote, updatedNote.post);

      return createSuccessResponse(responseData, {
        message: '便利貼更新成功'
      });
    });
};

/**
 * 獲取公開便利貼列表（分頁）
 */
export const getPublicNotes = async (
  page = 1,
  pageSize = 10
): Promise<PaginatedApiResponse<NoteResponse>> => {
    const offset = (page - 1) * pageSize;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: {
          post: {
            visibility: 'public'
          }
        },
        include: {
          post: {
            include: {
              users: {
                include: {
                  contacts: true,
                  basic_info: true,
                  user_positions: {
                    include: {
                      position: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          id: 'asc'
        },
        take: pageSize,
        skip: offset
      }),
      prisma.note.count({
        where: {
          post: {
            visibility: 'public'
          }
        }
      })
    ]);

    const formattedNotes = await Promise.all(
      notes
        .filter(note => note.post)
        .map(note => formatNoteResponse(note as Record<string, unknown>, note.post as Record<string, unknown>))
    );

    const paginationInfo = calculatePagination(page, pageSize, total);

    return createPaginatedResponse(formattedNotes, paginationInfo);
};

/**
 * 刪除便利貼
 */
export const deleteNote = async (
  projectId: string,
  noteId: number
): Promise<ApiSuccessResponse<void>> => {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { external_id: projectId }
      });

      if (!project) {
        throw new NotFoundError('專案不存在');
      }

      const note = await tx.note.findFirst({
        where: { 
          id: noteId,
          post: {
            project_id: project.id
          }
        },
        include: {
          post: true
        }
      });

      if (!note || !note.post) {
        throw new NotFoundError('便利貼不存在');
      }

      // 刪除便利貼（會級聯刪除相關的 post）
      await tx.note.delete({
        where: { id: noteId }
      });

      return createSuccessResponse(undefined, {
        message: '便利貼已刪除'
      });
    });
};

// 匯出服務對象
export const noteService = {
  createNote,
  getNotes,
  getMyNotes,
  getNoteDetail,
  updateNote,
  getPublicNotes,
  deleteNote
} as const;