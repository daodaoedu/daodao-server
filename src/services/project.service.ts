/**
 * Project Service
 * 專案服務層 - 處理專案相關的業務邏輯
 */

import { Op } from 'sequelize';
import { 
  Project, 
  Milestone, 
  Task, 
  Post, 
  Note, 
  Outcome, 
  Review, 
  User, 
  Contact 
} from '../models';
import type {
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectResponse,
  ProjectQueryParams,
  ProjectServiceResult,
  ProjectStats
} from '../types/project.types';

export class ProjectService {
  /**
   * 創建專案
   */
  async createProject(
    userId: number, 
    projectData: ProjectCreateRequest
  ): Promise<ProjectServiceResult<ProjectResponse>> {
    try {
      const createData = {
        ...projectData,
        user_id: userId,
        created_by: userId,
        updated_by: userId,
        start_date: projectData.start_date ? new Date(projectData.start_date) : undefined,
        end_date: projectData.end_date ? new Date(projectData.end_date) : undefined
      };
      
      const project = await Project.create(createData);

      const createdProject = await this.getProjectById(project.external_id, userId);
      
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
  }

  /**
   * 根據 ID 獲取專案
   */
  async getProjectById(
    projectId: string, 
    userId?: number
  ): Promise<ProjectServiceResult<ProjectResponse>> {
    try {
      const whereClause: Record<string, unknown> = { external_id: projectId };
      
      // 如果不是專案擁有者，只能查看公開專案
      if (userId) {
        whereClause[Op.or] = [
          { user_id: userId },
          { is_public: true }
        ];
      } else {
        whereClause.is_public = true;
      }

      const project = await Project.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            include: [
              {
                model: Contact,
                as: 'contact'
              }
            ]
          },
          {
            model: Milestone,
            as: 'milestones',
            where: { is_deleted: false },
            required: false,
            order: [['position', 'ASC']],
            include: [
              {
                model: Task,
                as: 'tasks',
                where: { is_deleted: false },
                required: false,
                order: [['position', 'ASC']]
              }
            ]
          },
          {
            model: Post,
            as: 'posts',
            required: false,
            order: [['created_at', 'DESC']],
            include: [
              {
                model: Note,
                as: 'note',
                required: false
              },
              {
                model: Outcome,
                as: 'outcome',
                required: false
              },
              {
                model: Review,
                as: 'review',
                required: false
              }
            ]
          }
        ]
      });

      if (!project) {
        return {
          success: false,
          error: '專案不存在或無權限存取'
        };
      }

      const formattedProject = this.formatProjectResponse(project);

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

      const offset = (page - 1) * limit;
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
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { goal: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Project.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            include: [
              {
                model: Contact,
                as: 'contact'
              }
            ]
          }
        ],
        order: [[sort_by, sort_order]],
        limit,
        offset
      });

      const formattedProjects = rows.map(project => this.formatProjectResponse(project));

      return {
        success: true,
        data: {
          projects: formattedProjects,
          total: count,
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
      const project = await Project.findOne({
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
        end_date: updateData.end_date ? new Date(updateData.end_date) : undefined
      };
      
      await project.update(updateDataWithDates);

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
      const project = await Project.findOne({
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

      await project.destroy();

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
        Project.count({ where: whereClause }),
        Project.count({ where: { ...whereClause, status: 'Ongoing' } }),
        Project.count({ where: { ...whereClause, status: 'Completed' } }),
        Project.count({ where: { ...whereClause, status: 'Not Started' } }),
        Project.count({ where: { ...whereClause, status: 'Canceled' } })
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

  /**
   * 格式化專案回應資料
   */
  private formatProjectResponse(project: Project): ProjectResponse {
    const projectJson = project.toJSON();

    return {
      id: projectJson.id,
      external_id: projectJson.external_id,
      user_id: projectJson.user_id,
      img_url: projectJson.img_url,
      title: projectJson.title,
      description: projectJson.description || '',
      motivation: projectJson.motivation,
      motivation_description: projectJson.motivation_description,
      goal: projectJson.goal,
      content: projectJson.content,
      strategy: projectJson.strategy,
      strategy_description: projectJson.strategy_description,
      resource: projectJson.resource,
      outcome: projectJson.outcome,
      outcome_description: projectJson.outcome_description,
      is_public: projectJson.is_public,
      status: projectJson.status,
      start_date: projectJson.start_date,
      end_date: projectJson.end_date,
      interval: projectJson.interval,
      created_at: projectJson.created_at,
      created_by: projectJson.created_by,
      updated_at: projectJson.updated_at,
      updated_by: projectJson.updated_by,
      version: projectJson.version,
      milestones: projectJson.milestones?.map((m: unknown) => {
        const milestone = m as Record<string, unknown>;
        return {
        id: milestone.id,
        project_id: milestone.project_id,
        position: milestone.position,
        name: milestone.name,
        description: milestone.description || '',
        start_date: milestone.start_date,
        end_date: milestone.end_date,
        is_completed: milestone.is_completed,
        is_deleted: milestone.is_deleted,
        created_at: milestone.created_at,
        updated_at: milestone.updated_at,
        tasks: (milestone.tasks as unknown[])?.map((t: unknown) => {
          const task = t as Record<string, unknown>;
          return {
          id: task.id,
          milestone_id: task.milestone_id,
          position: task.position,
          name: task.name,
          description: task.description || '',
          days_of_week: task.days_of_week,
          is_completed: task.is_completed,
          is_deleted: task.is_deleted,
          created_at: task.created_at,
          updated_at: task.updated_at
        }}) || []
        };
      }) || [],
      posts: (projectJson.posts as unknown[])?.map((p: unknown) => {
        const post = p as Record<string, unknown>;
        return {
        id: post.id,
        project_id: post.project_id,
        user_id: post.user_id,
        type: post.type,
        week: post.week,
        title: post.title,
        date: post.date,
        visibility: post.visibility,
        status: post.status,
        created_at: post.created_at,
        updated_at: post.updated_at,
        note: post.note,
        outcome: post.outcome,
        review: post.review
        };
      }) || []
    };
  }
}

// 匯出服務實例
export const projectService = new ProjectService();