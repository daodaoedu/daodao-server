/**
 * 專案路由
 * 定義專案管理相關的 API 路由
 */

import { Router, RequestHandler } from 'express';
import { registry } from '../config/openapi-registry';
import {
  createProjectController,
  getProjectController,
  getProjectsController,
  updateProjectController,
  deleteProjectController,
  getProjectStatsController,
  getMyProjectsController,
  getPublicProjectsController,
  duplicateProjectController
} from '../controllers/project.controller';
import {
  createNote,
  getNotes,
  getMyNotes,
  getNoteDetail,
  updateNote,
  getPublicNotes,
  deleteNote
} from '../controllers/note.controller';
import {
  createReview,
  getReviews,
  getReviewDetail,
  updateReview,
  deleteReview
} from '../controllers/review.controller';
import {
  createOutcome,
  getOutcomes,
  getMyOutcomes,
  getOutcomeDetail,
  updateOutcome,
  deleteOutcome
} from '../controllers/outcome.controller';
import {
  createTaskController,
  getTasksController,
  getTaskController,
  updateTaskController,
  deleteTaskController
} from '../controllers/task.controller';
import {
  createMilestoneController,
  getMilestonesController,
  updateMilestoneController,
  deleteMilestoneController
} from '../controllers/milestone.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate, optionalAuth } from '../middleware/auth';
// import {
//   canCreateProject,
//   canUpdateProject,
//   canDeleteProject
// } from '../middleware/permission.middleware';
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  projectQuerySchema,
  duplicateProjectSchema,
  projectStatsQuerySchema,
  singleProjectResponseSchema,
  projectListResponseSchema,
  projectStatsSuccessResponseSchema,
  deleteProjectResponseSchema
} from '../validators/project.validators';
import {
  createNoteSchema,
  updateNoteSchema,
  noteParamsSchema,
  noteProjectParamsSchema,
  publicNotesQuerySchema,
  singleNoteResponseSchema,
  noteListResponseSchema,
  deleteNoteResponseSchema
} from '../validators/note.validators';
import {
  createReviewSchema,
  updateReviewSchema,
  reviewParamsSchema,
  reviewQuerySchema,
  singleReviewResponseSchema,
  reviewListResponseSchema,
  deleteReviewApiResponseSchema
} from '../validators/review.validators';
import {
  createOutcomeSchema,
  updateOutcomeSchema,
  outcomeParamsSchema,
  singleOutcomeResponseSchema,
  outcomeListResponseSchema,
  deleteOutcomeResponseSchema
} from '../validators/outcome.validators';
import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  taskMilestoneParamsSchema
} from '../validators/task.validators';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneParamsSchema,
  singleMilestoneResponseSchema,
  milestoneListResponseSchema,
  deleteMilestoneResponseSchema
} from '../validators/milestone.validators';

const router = Router();

// ============================================================================
// OpenAPI 路由定義（使用 registry.registerPath）
// ============================================================================

/**
 * GET /api/v1/projects - 獲取專案列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects',
  tags: ['Projects'],
  summary: '獲取專案列表',
  description: '獲取所有專案列表，支援分頁、過濾和搜尋。支援可選身份驗證以提供個人化內容。',
  request: {
    query: projectQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取專案列表',
      content: {
        'application/json': {
          schema: projectListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /projects
 * 獲取專案列表
 * 查詢參數：page, limit, status, is_public, user_id, search, sort_by, sort_order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/',
  optionalAuth,
  validate(projectQuerySchema, 'query'),
  getProjectsController as RequestHandler);

/**
 * GET /api/v1/projects/my - 獲取我的專案列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/my',
  tags: ['Projects'],
  summary: '獲取我的專案列表',
  description: '獲取當前用戶的所有專案列表',
  request: {
    query: projectQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取專案列表',
      content: {
        'application/json': {
          schema: projectListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /projects/my
 * 獲取我的專案列表
 * 查詢參數：page, limit, status, search, sort_by, sort_order
 * 需要身份驗證
 */
router.get('/my',
  authenticate,
  validate(projectQuerySchema, 'query'),
  getMyProjectsController as RequestHandler);

/**
 * GET /api/v1/projects/public - 獲取公開專案列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/public',
  tags: ['Projects'],
  summary: '獲取公開專案列表',
  description: '獲取所有公開專案列表，支援可選身份驗證以提供個人化內容',
  request: {
    query: projectQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取公開專案列表',
      content: {
        'application/json': {
          schema: projectListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /projects/public
 * 獲取公開專案列表
 * 查詢參數：page, limit, status, search, sort_by, sort_order
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/public',
  optionalAuth,
  validate(projectQuerySchema, 'query'),
  getPublicProjectsController as RequestHandler);

/**
 * GET /api/v1/projects/stats - 獲取專案統計資訊
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/stats',
  tags: ['Projects'],
  summary: '獲取專案統計資訊',
  description: '獲取專案統計數據，包括各狀態的專案數量',
  request: {
    query: projectStatsQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取統計資訊',
      content: {
        'application/json': {
          schema: projectStatsSuccessResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /projects/stats
 * 獲取專案統計資訊
 * 查詢參數：user_id（可選）
 * 支援可選身份驗證
 */
router.get('/stats',
  optionalAuth,
  validate(projectStatsQuerySchema, 'query'),
  getProjectStatsController as RequestHandler);

/**
 * GET /api/v1/projects/{id} - 獲取專案詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: '獲取專案詳情',
  description: '根據專案 UUID 獲取專案的詳細資訊',
  request: {
    params: projectParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取專案詳情',
      content: {
        'application/json': {
          schema: singleProjectResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /projects/:id
 * 獲取專案詳情
 * 路徑參數：id - 專案 ID
 * 支援可選身份驗證（用於個人化內容）
 */
router.get('/:id',
  optionalAuth,
  validate(projectParamsSchema, 'params'),
  getProjectController as RequestHandler);

/**
 * POST /api/v1/projects - 創建新專案
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects',
  tags: ['Projects'],
  summary: '創建新專案',
  description: '創建一個新的專案',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '專案創建成功',
      content: {
        'application/json': {
          schema: singleProjectResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /projects
 * 創建新專案
 * 請求體：CreateProjectRequest
 * 需要身份驗證和創建專案權限
 */
router.post('/',
  authenticate,
  // canCreateProject(),
  validate(createProjectSchema, 'body'),
  createProjectController as RequestHandler);

/**
 * PUT /api/v1/projects/{id} - 更新專案
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: '更新專案',
  description: '更新指定專案的資料（需要權限或擁有權）',
  request: {
    params: projectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateProjectSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '專案更新成功',
      content: {
        'application/json': {
          schema: singleProjectResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * PUT /projects/:id
 * 更新專案
 * 路徑參數：id - 專案 ID
 * 請求體：UpdateProjectRequest
 * 需要身份驗證和更新專案權限或擁有權
 */
router.put('/:id',
  authenticate,
  // canUpdateProject(),
  validate(projectParamsSchema, 'params'),
  validate(updateProjectSchema, 'body'),
  updateProjectController as RequestHandler);

/**
 * DELETE /api/v1/projects/{id} - 刪除專案
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: '刪除專案',
  description: '刪除指定的專案（需要權限或擁有權）',
  request: {
    params: projectParamsSchema
  },
  responses: {
    200: {
      description: '專案已成功刪除',
      content: {
        'application/json': {
          schema: deleteProjectResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    403: { $ref: '#/components/responses/ForbiddenError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /projects/:id
 * 刪除專案
 * 路徑參數：id - 專案 ID
 * 需要身份驗證和刪除專案權限或擁有權
 */
router.delete('/:id',
  authenticate,
  // canDeleteProject(),
  validate(projectParamsSchema, 'params'),
  deleteProjectController as RequestHandler);

/**
 * POST /api/v1/projects/{id}/duplicate - 複製專案
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{id}/duplicate',
  tags: ['Projects'],
  summary: '複製專案',
  description: '複製指定的專案，可選擇設定新專案標題',
  request: {
    params: projectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: duplicateProjectSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '專案複製成功',
      content: {
        'application/json': {
          schema: singleProjectResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * POST /projects/:id/duplicate
 * 複製專案
 * 路徑參數：id - 要複製的專案 ID
 * 請求體：DuplicateProjectRequest（可選）
 * 需要身份驗證和創建專案權限
 */
router.post('/:id/duplicate',
  authenticate,
  // canCreateProject(),
  validate(projectParamsSchema, 'params'),
  validate(duplicateProjectSchema, 'body'),
  duplicateProjectController as RequestHandler);

// 取得用戶的便利貼和學習成果列表
router.get('/outcomes/me', authenticate, getMyOutcomes as RequestHandler);
router.get('/notes/me', authenticate, getMyNotes as RequestHandler);
router.get('/notes/public', validate(publicNotesQuerySchema, 'query'), getPublicNotes as RequestHandler);

// ============================================================================
// 里程碑相關 OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/projects/{projectId}/milestones - 創建里程碑
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{projectId}/milestones',
  tags: ['Milestones'],
  summary: '創建里程碑',
  description: '為指定專案創建新的里程碑',
  request: {
    params: noteProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createMilestoneSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '里程碑創建成功',
      content: {
        'application/json': {
          schema: singleMilestoneResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/{projectId}/milestones - 獲取里程碑列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/milestones',
  tags: ['Milestones'],
  summary: '獲取里程碑列表',
  description: '獲取指定專案的所有里程碑',
  request: {
    params: noteProjectParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取里程碑列表',
      content: {
        'application/json': {
          schema: milestoneListResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * PUT /api/v1/projects/{projectId}/milestones/{milestoneId} - 更新里程碑
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{projectId}/milestones/{milestoneId}',
  tags: ['Milestones'],
  summary: '更新里程碑',
  description: '更新指定里程碑的資料',
  request: {
    params: milestoneParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateMilestoneSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '里程碑更新成功',
      content: {
        'application/json': {
          schema: singleMilestoneResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/projects/{projectId}/milestones/{milestoneId} - 刪除里程碑
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{projectId}/milestones/{milestoneId}',
  tags: ['Milestones'],
  summary: '刪除里程碑',
  description: '刪除指定的里程碑',
  request: {
    params: milestoneParamsSchema
  },
  responses: {
    200: {
      description: '里程碑刪除成功',
      content: {
        'application/json': {
          schema: deleteMilestoneResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// 里程碑相關路由
router.post('/:projectId/milestones', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createMilestoneSchema, 'body'), createMilestoneController as RequestHandler);
router.get('/:projectId/milestones', validate(noteProjectParamsSchema, 'params'), getMilestonesController as RequestHandler);
router.put('/:projectId/milestones/:milestoneId', authenticate, validate(milestoneParamsSchema, 'params'), validate(updateMilestoneSchema, 'body'), updateMilestoneController as RequestHandler);
router.delete('/:projectId/milestones/:milestoneId', authenticate, validate(milestoneParamsSchema, 'params'), deleteMilestoneController as RequestHandler);

// 任務相關路由
router.post('/:projectId/milestones/:milestoneId/tasks', authenticate, validate(taskMilestoneParamsSchema, 'params'), validate(createTaskSchema, 'body'), createTaskController as RequestHandler);
router.get('/:projectId/milestones/:milestoneId/tasks', validate(taskMilestoneParamsSchema, 'params'), getTasksController as RequestHandler);
router.get('/:projectId/milestones/:milestoneId/tasks/:taskId', validate(taskParamsSchema, 'params'), getTaskController as RequestHandler);
router.put('/:projectId/milestones/:milestoneId/tasks/:taskId', authenticate, validate(taskParamsSchema, 'params'), validate(updateTaskSchema, 'body'), updateTaskController as RequestHandler);
router.delete('/:projectId/milestones/:milestoneId/tasks/:taskId', authenticate, validate(taskParamsSchema, 'params'), deleteTaskController as RequestHandler);

// ============================================================================
// 便利貼相關 OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/projects/{projectId}/notes - 創建便利貼
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{projectId}/notes',
  tags: ['Notes'],
  summary: '創建便利貼',
  description: '為指定專案創建新的學習筆記便利貼',
  request: {
    params: noteProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createNoteSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '便利貼創建成功',
      content: {
        'application/json': {
          schema: singleNoteResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/{projectId}/notes - 獲取便利貼列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/notes',
  tags: ['Notes'],
  summary: '獲取便利貼列表',
  description: '獲取指定專案的所有學習筆記便利貼',
  request: {
    params: noteProjectParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取便利貼列表',
      content: {
        'application/json': {
          schema: noteListResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/projects/{projectId}/notes/{noteId} - 獲取便利貼詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/notes/{noteId}',
  tags: ['Notes'],
  summary: '獲取便利貼詳情',
  description: '獲取指定便利貼的詳細資料',
  request: {
    params: noteParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取便利貼詳情',
      content: {
        'application/json': {
          schema: singleNoteResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * PUT /api/v1/projects/{projectId}/notes/{noteId} - 更新便利貼
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{projectId}/notes/{noteId}',
  tags: ['Notes'],
  summary: '更新便利貼',
  description: '更新指定便利貼的資料',
  request: {
    params: noteParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateNoteSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '便利貼更新成功',
      content: {
        'application/json': {
          schema: singleNoteResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/projects/{projectId}/notes/{noteId} - 刪除便利貼
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{projectId}/notes/{noteId}',
  tags: ['Notes'],
  summary: '刪除便利貼',
  description: '刪除指定的便利貼',
  request: {
    params: noteParamsSchema
  },
  responses: {
    200: {
      description: '便利貼刪除成功',
      content: {
        'application/json': {
          schema: deleteNoteResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/notes/me - 獲取我的便利貼
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/notes/me',
  tags: ['Notes'],
  summary: '獲取我的便利貼',
  description: '獲取當前用戶所有的學習筆記便利貼',
  responses: {
    200: {
      description: '成功獲取我的便利貼列表',
      content: {
        'application/json': {
          schema: noteListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/notes/public - 獲取公開便利貼
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/notes/public',
  tags: ['Notes'],
  summary: '獲取公開便利貼',
  description: '獲取所有公開的學習筆記便利貼，支援分頁',
  request: {
    query: publicNotesQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取公開便利貼列表',
      content: {
        'application/json': {
          schema: noteListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

// 便利貼相關路由
router.post('/:projectId/notes', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createNoteSchema, 'body'), createNote as RequestHandler);
router.get('/:projectId/notes/', validate(noteProjectParamsSchema, 'params'), getNotes as RequestHandler);
router.get('/:projectId/notes/:noteId', validate(noteParamsSchema, 'params'), getNoteDetail as RequestHandler);
router.put('/:projectId/notes/:noteId', authenticate, validate(noteParamsSchema, 'params'), validate(updateNoteSchema, 'body'), updateNote as RequestHandler);
router.delete('/:projectId/notes/:noteId', authenticate, validate(noteParamsSchema, 'params'), deleteNote as RequestHandler);

// ============================================================================
// 學習成果相關 OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/projects/{projectId}/outcomes - 創建學習成果
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{projectId}/outcomes',
  tags: ['Outcomes'],
  summary: '創建學習成果',
  description: '為指定專案創建新的學習成果記錄',
  request: {
    params: noteProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createOutcomeSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '學習成果創建成功',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/{projectId}/outcomes - 獲取學習成果列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/outcomes',
  tags: ['Outcomes'],
  summary: '獲取學習成果列表',
  description: '獲取指定專案的所有學習成果記錄',
  request: {
    params: noteProjectParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取學習成果列表',
      content: {
        'application/json': {
          schema: outcomeListResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/projects/{projectId}/outcomes/{outcomeId} - 獲取學習成果詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/outcomes/{outcomeId}',
  tags: ['Outcomes'],
  summary: '獲取學習成果詳情',
  description: '獲取指定學習成果的詳細資料',
  request: {
    params: outcomeParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取學習成果詳情',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * PUT /api/v1/projects/{projectId}/outcomes/{outcomeId} - 更新學習成果
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{projectId}/outcomes/{outcomeId}',
  tags: ['Outcomes'],
  summary: '更新學習成果',
  description: '更新指定學習成果的資料',
  request: {
    params: outcomeParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateOutcomeSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '學習成果更新成功',
      content: {
        'application/json': {
          schema: singleOutcomeResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/projects/{projectId}/outcomes/{outcomeId} - 刪除學習成果
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{projectId}/outcomes/{outcomeId}',
  tags: ['Outcomes'],
  summary: '刪除學習成果',
  description: '刪除指定的學習成果記錄',
  request: {
    params: outcomeParamsSchema
  },
  responses: {
    200: {
      description: '學習成果刪除成功',
      content: {
        'application/json': {
          schema: deleteOutcomeResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/outcomes/me - 獲取我的學習成果
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/outcomes/me',
  tags: ['Outcomes'],
  summary: '獲取我的學習成果',
  description: '獲取當前用戶所有的學習成果記錄',
  responses: {
    200: {
      description: '成功獲取我的學習成果列表',
      content: {
        'application/json': {
          schema: outcomeListResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// 學習成果相關路由
router.post('/:projectId/outcomes', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createOutcomeSchema, 'body'), createOutcome as RequestHandler);
router.get('/:projectId/outcomes', validate(noteProjectParamsSchema, 'params'), getOutcomes as RequestHandler);
router.get('/:projectId/outcomes/:outcomeId', validate(outcomeParamsSchema, 'params'), getOutcomeDetail as RequestHandler);
router.put('/:projectId/outcomes/:outcomeId', authenticate, validate(outcomeParamsSchema, 'params'), validate(updateOutcomeSchema, 'body'), updateOutcome as RequestHandler);
router.delete('/:projectId/outcomes/:outcomeId', authenticate, validate(outcomeParamsSchema, 'params'), deleteOutcome as RequestHandler);

// ============================================================================
// 覆盤相關 OpenAPI 路由定義
// ============================================================================

/**
 * POST /api/v1/projects/{projectId}/reviews - 創建覆盤
 */
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects/{projectId}/reviews',
  tags: ['Reviews'],
  summary: '創建覆盤',
  description: '為指定專案創建新的學習覆盤記錄',
  request: {
    params: noteProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: createReviewSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: '覆盤創建成功',
      content: {
        'application/json': {
          schema: singleReviewResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * GET /api/v1/projects/{projectId}/reviews - 獲取覆盤列表
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/reviews',
  tags: ['Reviews'],
  summary: '獲取覆盤列表',
  description: '獲取指定專案的所有學習覆盤記錄，支援查詢過濾',
  request: {
    params: noteProjectParamsSchema,
    query: reviewQuerySchema
  },
  responses: {
    200: {
      description: '成功獲取覆盤列表',
      content: {
        'application/json': {
          schema: reviewListResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * GET /api/v1/projects/{projectId}/reviews/{reviewId} - 獲取覆盤詳情
 */
registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{projectId}/reviews/{reviewId}',
  tags: ['Reviews'],
  summary: '獲取覆盤詳情',
  description: '獲取指定覆盤的詳細資料',
  request: {
    params: reviewParamsSchema
  },
  responses: {
    200: {
      description: '成功獲取覆盤詳情',
      content: {
        'application/json': {
          schema: singleReviewResponseSchema
        }
      }
    },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  }
});

/**
 * PUT /api/v1/projects/{projectId}/reviews/{reviewId} - 更新覆盤
 */
registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{projectId}/reviews/{reviewId}',
  tags: ['Reviews'],
  summary: '更新覆盤',
  description: '更新指定覆盤的資料',
  request: {
    params: reviewParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateReviewSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: '覆盤更新成功',
      content: {
        'application/json': {
          schema: singleReviewResponseSchema
        }
      }
    },
    400: { $ref: '#/components/responses/BadRequestError' },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

/**
 * DELETE /api/v1/projects/{projectId}/reviews/{reviewId} - 刪除覆盤
 */
registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{projectId}/reviews/{reviewId}',
  tags: ['Reviews'],
  summary: '刪除覆盤',
  description: '刪除指定的覆盤記錄',
  request: {
    params: reviewParamsSchema
  },
  responses: {
    200: {
      description: '覆盤刪除成功',
      content: {
        'application/json': {
          schema: deleteReviewApiResponseSchema
        }
      }
    },
    401: { $ref: '#/components/responses/UnauthorizedError' },
    404: { $ref: '#/components/responses/NotFoundError' },
    500: { $ref: '#/components/responses/InternalServerError' }
  },
  security: [{ bearerAuth: [] }]
});

// 覆盤相關路由
router.post('/:projectId/reviews', authenticate, validate(noteProjectParamsSchema, 'params'), validate(createReviewSchema, 'body'), createReview as RequestHandler);
router.get('/:projectId/reviews', validate(noteProjectParamsSchema, 'params'), validate(reviewQuerySchema, 'query'), getReviews as RequestHandler);
router.get('/:projectId/reviews/:reviewId', validate(reviewParamsSchema, 'params'), getReviewDetail as RequestHandler);
router.put('/:projectId/reviews/:reviewId', authenticate, validate(reviewParamsSchema, 'params'), validate(updateReviewSchema, 'body'), updateReview as RequestHandler);
router.delete('/:projectId/reviews/:reviewId', authenticate, validate(reviewParamsSchema, 'params'), deleteReview as RequestHandler);

// ============================================================================
// Express 路由定義完成
// ============================================================================

export default router;