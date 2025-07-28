/**
 * Project Service
 * 專案服務層 - 處理專案相關的業務邏輯
 */

import { prisma } from './database/prisma.service';
import '../utils/error-handler';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectResponse,
  ProjectQueryParams,
  ProjectServiceResult,
  ProjectStats
} from '../types/project.types';
import type { motivation_t, strategy_t, outcome_t, day_enum } from '../../generated/prisma';

/**
 * 專案資料型別定義（包含關聯資料）
 */
interface ProjectWithIncludes {
  id: number;
  external_id: string | null;
  user_id: number;
  img_url: string | null;
  title: string;
  description: string | null;
  motivation: unknown;
  motivation_description: string | null;
  goal: string | null;
  content: string | null;
  strategy: unknown;
  strategy_description: string | null;
  resource: string | null;
  outcome: unknown;
  outcome_description: string | null;
  is_public: boolean | null;
  status: string | null;
  start_date: Date | null;
  end_date: Date | null;
  interval: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  version: number | null;
  users?: {
    id: number;
    nickname: string | null;
    external_id: string | null;
    contacts?: {
      photo_url: string | null;
    } | null;
    user_positions?: Array<{
      position: {
        name: string;
      };
    }>;
  } | null;
  milestone?: Array<{
    id: number;
    position: number | null;
    name: string | null;
    description: string | null;
    start_date: Date | null;
    end_date: Date | null;
    is_completed: boolean | null;
    task?: Array<{
      id: number;
      name: string | null;
      position: number;
      description: string | null;
      days_of_week: unknown;
      is_completed: boolean | null;
    }>;
  }>;
}

/**
 * 格式化專案回應資料
 */
const formatProjectResponse = (project: ProjectWithIncludes): ProjectResponse => {
  return {
    id: project.external_id || '',
    userId: project.user_id,
    imgUrl: project.img_url,
    title: project.title,
    description: project.description || "",
    motivation: project.motivation,
    motivationDescription: project.motivation_description,
    goal: project.goal,
    content: project.content,
    strategy: project.strategy,
    strategyDescription: project.strategy_description,
    resources: project.resource,
    outcome: project.outcome,
    outcomeDescription: project.outcome_description,
    isPublic: project.is_public ?? true,
    status: project.status || 'Not Started',
    startDate: project.start_date,
    endDate: project.end_date,
    interval: project.interval,
    createdAt: project.created_at || new Date(),
    updatedAt: project.updated_at || new Date(),
    version: project.version || 1,
    user: project.users ? {
      id: project.users.id,
      name: project.users.nickname,
      _id: project.users.external_id,
      roleList: project.users.user_positions?.map(up => up.position?.name) || [],
      photoURL: project.users.contacts?.photo_url,
    } : null,
    milestones: project.milestone?.map(m => ({
      id: m.id,
      position: m.position || 0,
      name: m.name || '',
      description: m.description || "",
      startDate: m.start_date,
      endDate: m.end_date,
      isCompleted: m.is_completed || false,
      tasks: m.task?.map(t => ({
        id: t.id,
        name: t.name || '',
        position: t.position,
        description: t.description || "",
        daysOfWeek: t.days_of_week,
        isCompleted: t.is_completed || false
      })) || []
    })) || []
  };
};

export class ProjectService {
  /**
   * 創建專案
   */
  async createProject(
    userId: number, 
    projectData: ProjectCreateRequest
  ): Promise<ProjectServiceResult<ProjectResponse>> {
    return await prisma.$transaction(async (tx) => {
      try {
        // 檢查用戶是否存在
        const user = await tx.users.findUnique({
          where: { id: userId },
          include: { roles: true }
        });

        if (!user) {
          return {
            success: false,
            error: '用戶不存在'
          };
        }

        // 角色和數量驗證（參考原有邏輯）
        if (user.role_id === 2) {
          return {
            success: false,
            error: '此角色無權新增學習計畫'
          };
        }

        if (user.role_id === 3) {
          const projectCount = await tx.project.count({
            where: { user_id: userId }
          });

          if (projectCount >= 3) {
            return {
              success: false,
              error: '已達最大學習計畫數量限制（3個）'
            };
          }
        }

        // 驗證必填字段
        if (!projectData.title) {
          return {
            success: false,
            error: '缺少必要欄位'
          };
        }

        // 驗證日期
        if (projectData.start_date && projectData.end_date && 
            new Date(projectData.start_date) >= new Date(projectData.end_date)) {
          return {
            success: false,
            error: '結束日期必須晚於開始日期'
          };
        }

        // 創建專案
        const project = await tx.project.create({
          data: {
            user_id: userId,
            img_url: projectData.imgUrl,
            title: projectData.title,
            description: projectData.description,
            motivation: projectData.motivation ? { set: projectData.motivation as motivation_t[] } : undefined,
            motivation_description: projectData.motivationDescription,
            goal: projectData.goal,
            content: projectData.content,
            strategy: projectData.strategy ? { set: projectData.strategy as strategy_t[] } : undefined,
            strategy_description: projectData.strategyDescription,
            resource: projectData.resources,
            outcome: projectData.outcome ? { set: projectData.outcome as outcome_t[] } : undefined,
            outcome_description: projectData.outcomeDescription,
            is_public: projectData.isPublic ?? true,
            status: projectData.status || 'Not Started',
            start_date: projectData.start_date ? new Date(projectData.start_date) : null,
            end_date: projectData.end_date ? new Date(projectData.end_date) : null,
            interval: projectData.interval,
            created_by: userId,
            updated_by: userId
          }
        });

        // 創建里程碑（如果有的話）
        if (projectData.milestones && projectData.milestones.length > 0) {
          for (const milestoneData of projectData.milestones) {
            const milestone = await tx.milestone.create({
              data: {
                project_id: project.id,
                position: milestoneData.position,
                name: milestoneData.name,
                description: milestoneData.description,
                start_date: milestoneData.startDate ? new Date(milestoneData.startDate) : new Date(),
                end_date: milestoneData.endDate ? new Date(milestoneData.endDate) : new Date(),
                is_completed: milestoneData.isCompleted || false
              }
            });

            // 創建任務（如果有的話）
            if (milestoneData.tasks && milestoneData.tasks.length > 0) {
              await tx.task.createMany({
                data: milestoneData.tasks.map(taskData => ({
                  milestone_id: milestone.id,
                  position: taskData.position,
                  name: taskData.name,
                  description: taskData.description,
                  days_of_week: taskData.daysOfWeek ? { set: taskData.daysOfWeek as day_enum[] } : undefined,
                  is_completed: taskData.isCompleted || false
                }))
              });
            }
          }
        }

        // 獲取完整的專案資料
        const createdProject = await this.getProjectById(project.external_id || '', userId);
        
        if (!createdProject.success || !createdProject.data) {
          return {
            success: false,
            error: '創建後無法獲取專案資料'
          };
        }
        
        return {
          success: true,
          data: createdProject.data,
          message: '專案創建成功'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '創建專案失敗'
        };
      }
    });
  }

  /**
   * 根據 ID 獲取專案
   */
  async getProjectById(
    projectId: string, 
    userId?: number
  ): Promise<ProjectServiceResult<ProjectResponse>> {
    try {
      // 構建查詢條件
      const whereClause: Record<string, unknown> = { external_id: projectId };
      
      // 如果不是專案擁有者，只能查看公開專案
      if (userId) {
        whereClause.OR = [
          { user_id: userId },
          { is_public: true }
        ];
      } else {
        whereClause.is_public = true;
      }

      const project = await prisma.project.findFirst({
        where: whereClause,
        include: {
          users: {
            include: {
              contacts: true,
              user_positions: {
                include: {
                  position: true
                }
              }
            }
          },
          milestone: {
            where: { is_deleted: false },
            orderBy: { position: 'asc' },
            include: {
              task: {
                where: { is_deleted: false },
                orderBy: { position: 'asc' }
              }
            }
          }
        }
      });

      if (!project) {
        return {
          success: false,
          error: '專案不存在或無權限存取'
        };
      }

      const formattedProject = formatProjectResponse(project);

      return {
        success: true,
        data: formattedProject
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取專案失敗'
      };
    }
  }

  /**
   * 獲取專案列表
   */
  async getProjects(
    queryParams: ProjectQueryParams,
    userId?: number
  ): Promise<ProjectServiceResult<{ projects: ProjectResponse[]; total: number; page: number; limit: number }>> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        is_public,
        user_id,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = queryParams;

      const skip = (page - 1) * limit;
      const whereClause: Record<string, unknown> = {};

      // 狀態篩選
      if (status) {
        whereClause.status = status;
      }

      // 公開性篩選
      if (is_public !== undefined) {
        whereClause.is_public = is_public;
      }

      // 使用者篩選
      if (user_id) {
        whereClause.user_id = user_id;
      }

      // 如果沒有指定使用者且沒有登入，只顯示公開專案
      if (!userId && !user_id) {
        whereClause.is_public = true;
      }

      // 搜尋功能
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { goal: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where: whereClause,
          include: {
            users: {
              include: {
                contacts: true,
                user_positions: {
                  include: {
                    position: true
                  }
                }
              }
            },
            milestone: {
              where: { is_deleted: false },
              orderBy: { position: 'asc' },
              include: {
                task: {
                  where: { is_deleted: false },
                  orderBy: { position: 'asc' }
                }
              }
            }
          },
          orderBy: { [sort_by]: sort_order.toLowerCase() as 'asc' | 'desc' },
          take: limit,
          skip
        }),
        prisma.project.count({ where: whereClause })
      ]);

      const formattedProjects = projects.map(project => formatProjectResponse(project));

      return {
        success: true,
        data: {
          projects: formattedProjects,
          total,
          page,
          limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取專案列表失敗'
      };
    }
  }

  /**
   * 更新專案
   */
  async updateProject(
    projectId: string,
    userId: number,
    updateData: ProjectUpdateRequest
  ): Promise<ProjectServiceResult<ProjectResponse>> {
    try {
      const project = await prisma.project.findFirst({
        where: { 
          external_id: projectId,
          user_id: userId
        }
      });

      if (!project) {
        return {
          success: false,
          error: '專案不存在或無權限修改'
        };
      }

      const updateDataWithDates = {
        ...updateData,
        updated_by: userId,
        start_date: updateData.start_date ? new Date(updateData.start_date) : undefined,
        end_date: updateData.end_date ? new Date(updateData.end_date) : undefined,
        motivation: updateData.motivation ? { set: updateData.motivation as motivation_t[] } : undefined,
        strategy: updateData.strategy ? { set: updateData.strategy as strategy_t[] } : undefined,
        outcome: updateData.outcome ? { set: updateData.outcome as outcome_t[] } : undefined
      };
      
      await prisma.project.update({
        where: { id: project.id },
        data: updateDataWithDates
      });

      const updatedProject = await this.getProjectById(projectId, userId);

      return {
        success: true,
        data: updatedProject.data,
        message: '專案更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新專案失敗'
      };
    }
  }

  /**
   * 刪除專案
   */
  async deleteProject(
    projectId: string,
    userId: number
  ): Promise<ProjectServiceResult<void>> {
    try {
      const project = await prisma.project.findFirst({
        where: { 
          external_id: projectId,
          user_id: userId
        }
      });

      if (!project) {
        return {
          success: false,
          error: '專案不存在或無權限刪除'
        };
      }

      await prisma.project.delete({
        where: { id: project.id }
      });

      return {
        success: true,
        message: '專案刪除成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '刪除專案失敗'
      };
    }
  }

  /**
   * 獲取專案統計資訊
   */
  async getProjectStats(userId?: number): Promise<ProjectServiceResult<ProjectStats>> {
    try {
      const whereClause: Record<string, unknown> = {};
      if (userId) {
        whereClause.user_id = userId;
      } else {
        whereClause.is_public = true;
      }

      const [
        total_projects,
        ongoing_projects,
        completed_projects,
        not_started_projects,
        canceled_projects
      ] = await Promise.all([
        prisma.project.count({ where: whereClause }),
        prisma.project.count({ where: { ...whereClause, status: 'Ongoing' } }),
        prisma.project.count({ where: { ...whereClause, status: 'Completed' } }),
        prisma.project.count({ where: { ...whereClause, status: 'Not Started' } }),
        prisma.project.count({ where: { ...whereClause, status: 'Canceled' } })
      ]);

      return {
        success: true,
        data: {
          total_projects,
          ongoing_projects,
          completed_projects,
          not_started_projects,
          canceled_projects
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '獲取統計資訊失敗'
      };
    }
  }
}

// 匯出服務實例
export const projectService = new ProjectService();