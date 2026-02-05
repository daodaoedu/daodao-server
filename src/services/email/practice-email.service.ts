/**
 * Practice Email Service
 *
 * 主題實踐郵件發送服務
 * 包含 8 種郵件類型 (PE01-PE08) 的發送邏輯
 *
 * @see docs/practice-mvp/backend-implementation-plan.md
 * @see docs/practice-mvp/practice-email-templates.md
 * @see docs/practice-mvp/practice-email-spec.md
 */

import { prisma } from '../database/prisma.service';
import { loggerService } from '../logging/logger.service';
import { generateStandardEmail, generateCtaButton, generateDivider, generateAuthorSection, EMAIL_COLORS } from './base-template';
import { createEmailLog, hasEmailBeenSent, getEntityEmailLogs } from './email-log.service';
import type {
  PracticeEmailCode,
  WeeklySummaryEmailCode,
  FinalSummaryEmailCode,
  PracticeCreatedEmailVariables,
  FirstCheckInEmailVariables,
  WeeklySummaryEmailVariables,
  FinalSummaryEmailVariables
} from '../../types/email/practice.types';
import type { EmailTemplateContent } from '../../types/email';
import { EMAIL_TYPES, EMAIL_STATUS } from '../../types/email';

const prismaClient = prisma;

// ============================================================================
// 即時郵件
// ============================================================================

/**
 * 發送實踐建立確認郵件 (PE01)
 */
export async function sendPracticeCreatedEmail(
  practiceId: number,
  userId: number
): Promise<void> {
  try {
    // 取得實踐和用戶資訊
    const [practice, user] = await Promise.all([
      prismaClient.practices.findUnique({
        where: { id: practiceId }
      }),
      prismaClient.users.findUnique({
        where: { id: userId },
        include: {
          contacts: true
        }
      })
    ]);

    if (!practice || !user) {
      loggerService.warn('Practice or user not found for PE01', { practiceId, userId });
      return;
    }

    const email = user.contacts?.email;
    if (!email) {
      loggerService.warn('User has no email for PE01', { userId });
      return;
    }

    // 準備郵件變數
    const startDate = practice.start_date?.toISOString().split('T')[0] || '未設定';
    const durationDays = practice.duration_days ?? 30;
    const frequencyMinDays = practice.frequency_min_days ?? 1;
    const frequencyMaxDays = practice.frequency_max_days ?? 7;

    // 計算結束日期
    const endDate = practice.start_date
      ? new Date(practice.start_date.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : '未設定';

    // 計算目標打卡次數
    const targetCheckIns = Math.floor(durationDays / frequencyMaxDays);

    const variables: PracticeCreatedEmailVariables = {
      code: 'PE01',
      userName: user.nickname || '學習者',
      userEmail: email,
      practiceTitle: practice.title,
      practiceId: practice.external_id || String(practiceId),
      practiceUrl: `${process.env.FRONTEND_URL}/practices/${practice.external_id}`,
      startDate,
      endDate,
      durationDays,
      frequencyMinDays,
      frequencyMaxDays,
      targetCheckIns,
      action: practice.practice_action || undefined
    };

    // === 去重複檢查 ===
    const alreadySent = await hasEmailBeenSent({
      userId,
      emailType: EMAIL_TYPES.PRACTICE_CREATED,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: 'PE01'
    });

    if (alreadySent) {
      loggerService.info('Skipping duplicate PE01 email', { practiceId, userId });
      return;
    }

    // 生成郵件內容
    const emailContent = generatePracticeCreatedEmailContent(variables);

    // 發送郵件
    await sendEmail(email, emailContent.subject, emailContent.html);

    // 記錄到 email_logs
    await createEmailLog({
      userId,
      emailType: EMAIL_TYPES.PRACTICE_CREATED,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: 'PE01',
      subject: emailContent.subject,
      status: EMAIL_STATUS.SENT
    });

    loggerService.info('PE01 email sent', { practiceId, userId, email });

  } catch (error) {
    loggerService.error('Failed to send PE01 email', {
      practiceId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 發送首次打卡鼓勵郵件 (PE02)
 */
export async function sendFirstCheckInEmail(
  practiceId: number,
  userId: number
): Promise<void> {
  try {
    const [practice, user] = await Promise.all([
      prismaClient.practices.findUnique({
        where: { id: practiceId }
      }),
      prismaClient.users.findUnique({
        where: { id: userId },
        include: {
          contacts: true
        }
      })
    ]);

    if (!practice || !user) {
      loggerService.warn('Practice or user not found for PE02', { practiceId, userId });
      return;
    }

    const email = user.contacts?.email;
    if (!email) {
      loggerService.warn('User has no email for PE02', { userId });
      return;
    }

    // === 去重複檢查 ===
    const alreadySent = await hasEmailBeenSent({
      userId,
      emailType: EMAIL_TYPES.PRACTICE_FIRST_CHECKIN,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: 'PE02'
    });

    if (alreadySent) {
      loggerService.info('Skipping duplicate PE02 email', { practiceId, userId });
      return;
    }

    const variables: FirstCheckInEmailVariables = {
      code: 'PE02',
      userName: user.nickname || '學習者',
      userEmail: email,
      practiceTitle: practice.title,
      practiceId: practice.external_id || String(practiceId),
      practiceUrl: `${process.env.FRONTEND_URL}/practices/${practice.external_id}`,
      checkInDate: new Date().toISOString().split('T')[0],
      progressPercentage: Number(practice.progress_percentage) || 50,
      encouragement: '太棒了！你邁出了第一步，這是最重要的開始！'
    };

    const emailContent = generateFirstCheckInEmailContent(variables);
    await sendEmail(email, emailContent.subject, emailContent.html);

    // 記錄到 email_logs
    await createEmailLog({
      userId,
      emailType: EMAIL_TYPES.PRACTICE_FIRST_CHECKIN,
      entityType: 'practice',
      entityId: practiceId,
      emailCode: 'PE02',
      subject: emailContent.subject,
      status: EMAIL_STATUS.SENT
    });

    loggerService.info('PE02 email sent', { practiceId, userId, email });

  } catch (error) {
    loggerService.error('Failed to send PE02 email', {
      practiceId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ============================================================================
// 週報郵件
// ============================================================================

/**
 * 發送週報郵件 (PE03-PE06)
 */
export async function sendWeeklySummaryEmail(
  emailCode: WeeklySummaryEmailCode,
  practiceId: number,
  userId: number
): Promise<void> {
  try {
    const [practice, user] = await Promise.all([
      prismaClient.practices.findUnique({
        where: { id: practiceId }
      }),
      prismaClient.users.findUnique({
        where: { id: userId },
        include: {
          contacts: true
        }
      })
    ]);

    if (!practice || !user) {
      loggerService.warn('Practice or user not found for weekly summary', { emailCode, practiceId, userId });
      return;
    }

    const email = user.contacts?.email;
    if (!email) {
      loggerService.warn('User has no email for weekly summary', { userId });
      return;
    }

    // 計算本週打卡統計（統一使用 UTC）
    const now = new Date();
    const weekStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 7,
      0, 0, 0, 0
    ));

    const [weeklyCheckIns, totalCheckIns, latestCheckIn] = await Promise.all([
      prismaClient.practice_checkins.findMany({
        where: {
          practice_id: practiceId,
          checkin_date: { gte: weekStart }
        },
        orderBy: { checkin_date: 'desc' }
      }),
      prismaClient.practice_checkins.count({
        where: { practice_id: practiceId }
      }),
      prismaClient.practice_checkins.findFirst({
        where: {
          practice_id: practiceId,
          note: { not: null }
        },
        orderBy: { checkin_date: 'desc' }
      })
    ]);

    const variables: WeeklySummaryEmailVariables = {
      code: emailCode,
      userName: user.nickname || '學習者',
      userEmail: email,
      practiceTitle: practice.title,
      practiceId: practice.external_id || String(practiceId),
      practiceUrl: `${process.env.FRONTEND_URL}/practices/${practice.external_id}`,
      weeklyCount: weeklyCheckIns.length,
      totalCount: totalCheckIns,
      weeklyNoteSnippet: latestCheckIn?.note?.substring(0, 100) || undefined,
      progressPercentage: Number(practice.progress_percentage) || 0
    };

    const emailContent = generateWeeklySummaryEmailContent(emailCode, variables);
    await sendEmail(email, emailContent.subject, emailContent.html);

    loggerService.info('Weekly summary email sent', { emailCode, practiceId, userId, email });

  } catch (error) {
    loggerService.error('Failed to send weekly summary email', {
      emailCode,
      practiceId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 批次發送待處理的週報
 *
 * 週報類型判斷邏輯：
 * - PE03: 當週有打卡且有文字記錄
 * - PE04: 當週有打卡但無文字記錄
 * - PE05: 從建立至今從未打卡
 * - PE06: 當週無打卡但累積有打卡
 *
 * 保護機制：
 * - 新用戶緩衝：建立不滿 48 小時跳過首次週報
 * - 靜默邏輯：連續 3 週無活動後停止週報
 * - 去重複：使用 email_logs 檢查是否已發送
 */
export async function sendPendingWeeklySummaries(): Promise<void> {
  try {
    loggerService.info('Starting weekly summary batch');

    // 計算時間範圍（統一使用 UTC）
    const now = new Date();
    const threeWeeksAgo = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 21,
      0, 0, 0, 0
    ));

    const weekStart = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 7,
      0, 0, 0, 0
    ));

    // 一次性查詢所有進行中的實踐，並載入打卡資料（優化 N+1 查詢）
    const activePractices = await prismaClient.practices.findMany({
      where: {
        status: 'active'
      },
      include: {
        users: {
          include: {
            contacts: true
          }
        },
        // 載入所有打卡資料，在記憶體中過濾
        practice_checkins: {
          orderBy: { checkin_date: 'desc' }
        }
      }
    });

    loggerService.info('Found practices for weekly summary', { count: activePractices.length });

    // 為每個實踐判斷並發送適當的週報類型
    for (const practice of activePractices) {
      try {
        // === 保護機制 1: 新用戶緩衝（建立不滿 48 小時跳過） ===
        const practiceCreatedAt = practice.created_at || new Date();
        const hoursSinceCreation = (Date.now() - practiceCreatedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCreation < 48) {
          loggerService.info('Skipping weekly summary for new practice (< 48 hours)', {
            practiceId: practice.id,
            hoursSinceCreation
          });
          continue;
        }

        // === 保護機制 2: 靜默邏輯（連續 3 週無活動後停止） ===
        // 使用已載入的打卡資料，在記憶體中過濾（避免額外查詢）
        const recentCheckIns = practice.practice_checkins.filter(
          c => c.checkin_date && c.checkin_date >= threeWeeksAgo
        ).length;

        // 檢查過去 3 週是否有發送過週報且用戶都沒有打卡
        const recentWeeklySummaryLogs = await getEntityEmailLogs({
          entityType: 'practice',
          entityId: practice.id,
          emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY
        });

        const recentInactiveSummaries = recentWeeklySummaryLogs.filter(log => {
          const logDate = log.sent_at || log.created_at;
          return logDate && logDate >= threeWeeksAgo &&
                 (log.email_code === 'PE05' || log.email_code === 'PE06');
        });

        // 如果過去 3 週都沒有打卡，且已經發了 3 封無活動週報，停止發送
        if (recentCheckIns === 0 && recentInactiveSummaries.length >= 3) {
          loggerService.info('Silencing weekly summary for inactive practice (3+ weeks)', {
            practiceId: practice.id,
            inactiveSummaryCount: recentInactiveSummaries.length
          });
          continue;
        }

        // === 計算打卡統計（使用已載入的資料，避免額外查詢） ===
        // 本週打卡（含文字）
        const weeklyCheckInsWithNote = practice.practice_checkins.filter(
          c => c.checkin_date && c.checkin_date >= weekStart && c.note
        );

        // 本週打卡（總數）
        const weeklyCheckInsTotal = practice.practice_checkins.filter(
          c => c.checkin_date && c.checkin_date >= weekStart
        ).length;

        // 累計打卡（總數）
        const totalCheckIns = practice.practice_checkins.length;

        // === 決定郵件類型 ===
        let emailCode: PracticeEmailCode;

        if (weeklyCheckInsTotal > 0) {
          // 本週有打卡
          if (weeklyCheckInsWithNote.length > 0) {
            // 有文字記錄 → PE03
            emailCode = 'PE03';
          } else {
            // 無文字記錄 → PE04
            emailCode = 'PE04';
          }
        } else {
          // 本週無打卡
          if (totalCheckIns === 0) {
            // 從建立至今從未打卡 → PE05
            emailCode = 'PE05';
          } else {
            // 當週無打卡但累積有打卡 → PE06
            emailCode = 'PE06';
          }
        }

        // === 保護機制 3: 去重複檢查 ===
        const alreadySent = await hasEmailBeenSent({
          userId: practice.user_id,
          emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY,
          entityType: 'practice',
          entityId: practice.id,
          emailCode
        });

        if (alreadySent) {
          loggerService.info('Skipping duplicate weekly summary', {
            practiceId: practice.id,
            emailCode
          });
          continue;
        }

        // 發送週報
        await sendWeeklySummaryEmail(emailCode, practice.id, practice.user_id);

        // 記錄到 email_logs
        await createEmailLog({
          userId: practice.user_id,
          emailType: EMAIL_TYPES.PRACTICE_WEEKLY_SUMMARY,
          entityType: 'practice',
          entityId: practice.id,
          emailCode,
          subject: `週報 - ${practice.title}`,
          status: EMAIL_STATUS.SENT
        });

      } catch (error) {
        loggerService.error('Failed to send weekly summary for practice', {
          practiceId: practice.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    loggerService.info('Weekly summary batch completed');

  } catch (error) {
    loggerService.error('Failed to process weekly summaries', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ============================================================================
// 結束總結郵件
// ============================================================================

/**
 * 發送結束總結郵件 (PE07-PE08)
 */
export async function sendFinalSummaryEmail(
  emailCode: FinalSummaryEmailCode,
  practiceId: number,
  userId: number
): Promise<void> {
  try {
    const [practice, user] = await Promise.all([
      prismaClient.practices.findUnique({
        where: { id: practiceId }
      }),
      prismaClient.users.findUnique({
        where: { id: userId },
        include: {
          contacts: true
        }
      })
    ]);

    if (!practice || !user) {
      loggerService.warn('Practice or user not found for final summary', { emailCode, practiceId, userId });
      return;
    }

    const email = user.contacts?.email;
    if (!email) {
      loggerService.warn('User has no email for final summary', { userId });
      return;
    }

    // 取得打卡統計和最佳筆記
    const [totalCheckIns, bestNote] = await Promise.all([
      prismaClient.practice_checkins.count({
        where: { practice_id: practiceId }
      }),
      prismaClient.practice_checkins.findFirst({
        where: {
          practice_id: practiceId,
          note: { not: null }
        },
        orderBy: { checkin_date: 'desc' }
      })
    ]);

    const durationDays = practice.duration_days ?? 30;
    const frequencyMinDays = practice.frequency_min_days ?? 1;
    const targetCheckIns = Math.ceil(durationDays / 7 * frequencyMinDays);

    const variables: FinalSummaryEmailVariables = {
      code: emailCode,
      userName: user.nickname || '學習者',
      userEmail: email,
      practiceTitle: practice.title,
      practiceId: practice.external_id || String(practiceId),
      practiceUrl: `${process.env.FRONTEND_URL}/practices/${practice.external_id}`,
      durationDays,
      totalCheckIns,
      targetCheckIns,
      progressPercentage: Number(practice.progress_percentage) || 0,
      bestNoteSnippet: bestNote?.note?.substring(0, 150) || undefined,
      bestNoteDate: bestNote?.checkin_date?.toISOString().split('T')[0]
    };

    const emailContent = generateFinalSummaryEmailContent(emailCode, variables);
    await sendEmail(email, emailContent.subject, emailContent.html);

    loggerService.info('Final summary email sent', { emailCode, practiceId, userId, email });

  } catch (error) {
    loggerService.error('Failed to send final summary email', {
      emailCode,
      practiceId,
      userId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * 批次發送待處理的結束總結
 *
 * 結束總結類型：
 * - PE07: 實踐結束，有打卡記錄
 * - PE08: 實踐結束，無打卡記錄
 *
 * 保護機制：
 * - 去重複：使用 email_logs 檢查是否已發送
 */
export async function sendPendingFinalSummaries(): Promise<void> {
  try {
    loggerService.info('Starting final summary batch');

    // 查詢今天結束的實踐
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // 一次性查詢所有進行中的實踐，並載入打卡資料（優化 N+1 查詢）
    const activePractices = await prismaClient.practices.findMany({
      where: {
        status: 'active'
      },
      include: {
        users: {
          include: {
            contacts: true
          }
        },
        practice_checkins: true
      }
    });

    // 過濾今天結束的實踐
    const endingToday = activePractices.filter(practice => {
      if (!practice.start_date) return false;
      const durationDays = practice.duration_days ?? 30;
      const endDate = new Date(practice.start_date.getTime() + durationDays * 24 * 60 * 60 * 1000);
      return endDate >= today && endDate < tomorrow;
    });

    loggerService.info('Found practices ending today', { count: endingToday.length });

    for (const practice of endingToday) {
      try {
        // 使用已載入的打卡資料（避免額外查詢）
        const totalCheckIns = practice.practice_checkins.length;

        // 決定郵件類型：有打卡 → PE07，無打卡 → PE08
        const emailCode: PracticeEmailCode = totalCheckIns > 0 ? 'PE07' : 'PE08';

        // === 保護機制: 去重複檢查 ===
        const alreadySent = await hasEmailBeenSent({
          userId: practice.user_id,
          emailType: EMAIL_TYPES.PRACTICE_FINAL_SUMMARY,
          entityType: 'practice',
          entityId: practice.id,
          emailCode
        });

        if (alreadySent) {
          loggerService.info('Skipping duplicate final summary', {
            practiceId: practice.id,
            emailCode
          });
          continue;
        }

        // 發送結束總結
        await sendFinalSummaryEmail(emailCode, practice.id, practice.user_id);

        // 記錄到 email_logs
        await createEmailLog({
          userId: practice.user_id,
          emailType: EMAIL_TYPES.PRACTICE_FINAL_SUMMARY,
          entityType: 'practice',
          entityId: practice.id,
          emailCode,
          subject: `實踐總結 - ${practice.title}`,
          status: EMAIL_STATUS.SENT
        });

        // 更新實踐狀態
        const durationDays = practice.duration_days ?? 30;
        const frequencyMaxDays = practice.frequency_max_days ?? 7;
        const targetCheckIns = Math.floor(durationDays / frequencyMaxDays);
        const reachedTarget = totalCheckIns >= targetCheckIns;

        await prismaClient.practices.update({
          where: { id: practice.id },
          data: {
            status: reachedTarget ? 'completed' : 'archived',
            updated_at: new Date()
          }
        });

        loggerService.info('Final summary sent and practice status updated', {
          practiceId: practice.id,
          emailCode,
          newStatus: reachedTarget ? 'completed' : 'archived'
        });

      } catch (error) {
        loggerService.error('Failed to send final summary for practice', {
          practiceId: practice.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    loggerService.info('Final summary batch completed');

  } catch (error) {
    loggerService.error('Failed to process final summaries', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// ============================================================================
// 郵件內容生成
// ============================================================================

/**
 * 生成 PE01 郵件內容
 * @see docs/practice-mvp/practice-email-templates.md Section 2
 */
function generatePracticeCreatedEmailContent(
  variables: PracticeCreatedEmailVariables
): EmailTemplateContent {
  const {
    userName,
    practiceTitle,
    practiceUrl,
    startDate,
    durationDays,
    frequencyMinDays,
    frequencyMaxDays,
    action
  } = variables;

  const frequencyText = frequencyMinDays === frequencyMaxDays
    ? `${frequencyMinDays} 天`
    : `${frequencyMinDays}-${frequencyMaxDays} 天`;

  // 取得實踐行動描述（若有）
  const actionText = action || '學習';

  const content = `
    <!-- Greeting -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${EMAIL_COLORS.textHeading}; line-height: 150%;">
            Hello ${userName},
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            很高興看到你開啟了新的主題實踐：<strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong>。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            從 <strong>${startDate}</strong> 開始的 <strong>${durationDays}</strong> 天中，
            你計劃每週有 <strong>${frequencyText}</strong> 來進行 <strong>${actionText}</strong>。
          </p>
        </td>
      </tr>
    </table>

    <!-- Quote Block: 20% 進度說明 -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="border-left: 4px solid ${EMAIL_COLORS.brandOrange}; padding: 14px 18px; background-color: ${EMAIL_COLORS.bgQuote};">
                <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
                  我們認為決定開始已經是付出行動，你的「意圖」同樣值得被視覺化，
                  所以你會發現你現在已有 <strong style="color: ${EMAIL_COLORS.brandOrange};">20% 的進度</strong> ✨
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Body Text -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            同時也期待你的<strong>第一次打卡分享</strong>，每當你為這個主題付出一點點行動，
            無論多微小，<strong>記得回到島島阿學進行「打卡」</strong>，藉由每一次留下的紀錄，
            看見自己的成長和進步，相信這在實踐結束後會是很棒的收獲。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 180%;">
            我們也會在每7天寄出打卡記錄摘要，幫助你回顧過去幾天的收獲與成長！
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    ${generateCtaButton({
      text: '前往我的實踐',
      url: practiceUrl,
      color: 'orange'
    })}

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  return generateStandardEmail({
    title: '島島阿學 - 主題實踐',
    subject: '開啟你的小而美學習生活提案',
    preheader: `恭喜開啟「${practiceTitle}」主題實踐，你已擁有 20% 的進度！`,
    content
  });
}

/**
 * 生成 PE02 郵件內容
 * @see docs/practice-mvp/practice-email-templates.md Section 3
 */
function generateFirstCheckInEmailContent(
  variables: FirstCheckInEmailVariables
): EmailTemplateContent {
  const {
    userName,
    practiceTitle,
    practiceUrl
  } = variables;

  const content = `
    <!-- Greeting -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
            Hi ${userName},
          </h2>
        </td>
      </tr>
    </table>

    <!-- Intro -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            剛剛收到你在 <strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong> 的第一則打卡紀錄，真的很替你開心！
          </p>
        </td>
      </tr>
    </table>

    <!-- 50% Progress Block -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #E8F8F7; padding: 20px; border-radius: 12px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; line-height: 1.6;">
            所謂「好的開始是成功的一半」，在第一則打卡後你的進度來到 <strong style="color: ${EMAIL_COLORS.brandOrange}; font-size: 20px;">50%</strong>，
            是不是離達成目標更躍進一大步了呢？
          </p>
        </td>
      </tr>
    </table>

    <!-- 分享意義說明 -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            每則紀錄的意義，或許比你想像的還要大。當你寫下你的想法和感受時，你也同時在幫助其他人！
          </p>
        </td>
      </tr>
    </table>

    <!-- 三點意義 -->
    <table role="presentation" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary};">
            <strong>✨ 提供靈感：</strong>你的觀點，可能剛好解開了某個人卡關已久的難題。
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary};">
            <strong>🤝 創造共鳴：</strong>當你分享困惑或挑戰時，會讓正在經歷同樣狀況的人感到我不孤單。
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary};">
            <strong>🎇 激盪火花：</strong>一個微小的想法，經常能引發其他人更深層的思考與對話。
          </p>
        </td>
      </tr>
    </table>

    <!-- 鼓勵文字 -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 16px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 600; line-height: 1.6;">
            不要擔心不夠完美，最真實的紀錄，往往最有力量。
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="text-block" style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
            謝謝你，我們很期待你的持續分享。
          </p>
        </td>
      </tr>
    </table>

    ${generateDivider()}
    ${generateAuthorSection()}
  `;

  return generateStandardEmail({
    title: '島島阿學 - 主題實踐',
    subject: `你在 ${practiceTitle} 的第一步 ✨`,
    preheader: `剛剛收到你的第一則打卡紀錄，真的很替你開心！`,
    content
  });
}

/**
 * 生成週報郵件內容 (PE03-PE06)
 * @see docs/practice-mvp/practice-email-templates.md Section 4-7
 *
 * PE03: 當週有打卡且有文字記錄
 * PE04: 當週有打卡但無文字記錄
 * PE05: 從建立至今從未打卡
 * PE06: 當週無打卡但累積有打卡
 */
function generateWeeklySummaryEmailContent(
  emailCode: PracticeEmailCode,
  variables: WeeklySummaryEmailVariables
): EmailTemplateContent {
  const {
    userName,
    practiceTitle,
    practiceUrl,
    weeklyCount,
    totalCount,
    weeklyNoteSnippet
  } = variables;

  let subject: string;
  let preheader: string;
  let content: string;

  switch (emailCode) {
    case 'PE03': // 週回顧（有打卡且有文字）
      subject = `${practiceTitle} 每週回顧：看見生活中的成長微光 ✨`;
      preheader = `這週你完成了 ${weeklyCount} 次打卡，累積 ${totalCount} 則記錄！`;
      content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
          Hi ${userName},
        </h2>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          這個星期的你好嗎？
        </p>

        <!-- 統計區塊 -->
        <div style="background-color: #F5F5F5; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary};">
            📊 你的足跡
          </p>
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; line-height: 1.6;">
            這一週，你進行了 <strong style="color: ${EMAIL_COLORS.brandCyan}; font-size: 24px;">${weeklyCount}</strong> 次打卡。<br>
            至目前為止，累積了 <strong style="color: ${EMAIL_COLORS.brandOrange}; font-size: 24px;">${totalCount}</strong> 則打卡紀錄！
          </p>
        </div>

        <!-- Highlight 區塊 -->
        <div style="background-color: #FFF8F0; border-left: 4px solid ${EMAIL_COLORS.brandOrange}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_COLORS.brandOrange}; font-weight: 600;">
            💡 本週的打卡 Highlight
          </p>
          <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; font-style: italic; line-height: 1.6;">
            "${weeklyNoteSnippet}..."
          </p>
        </div>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          看著這段文字，現在的你，有沒有產生新的想法呢？
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
          每一個微小的步伐，都在累積前往理想生活的里程，請繼續保持這份前進的動能！
        </p>

        ${generateCtaButton({ text: '查看我的實踐 >', url: practiceUrl, color: 'cyan' })}

        ${generateDivider()}
        ${generateAuthorSection()}
      `;
      break;

    case 'PE04': // 週回顧（有打卡但無文字）- 與 PE03 相同但移除 Highlight 區塊
      subject = `${practiceTitle} 每週回顧：看見生活中的成長微光 ✨`;
      preheader = `這週你完成了 ${weeklyCount} 次打卡，繼續加油！`;
      content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
          Hi ${userName},
        </h2>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          這個星期的你好嗎？
        </p>

        <!-- 統計區塊 -->
        <div style="background-color: #F5F5F5; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_COLORS.textSecondary};">
            📊 你的足跡
          </p>
          <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; line-height: 1.6;">
            這一週，你進行了 <strong style="color: ${EMAIL_COLORS.brandCyan}; font-size: 24px;">${weeklyCount}</strong> 次打卡。<br>
            至目前為止，累積了 <strong style="color: ${EMAIL_COLORS.brandOrange}; font-size: 24px;">${totalCount}</strong> 則打卡紀錄！
          </p>
        </div>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
          每一個微小的步伐，都在累積前往理想生活的里程，請繼續保持這份前進的動能！
        </p>

        ${generateCtaButton({ text: '查看我的實踐 >', url: practiceUrl, color: 'cyan' })}

        ${generateDivider()}
        ${generateAuthorSection()}
      `;
      break;

    case 'PE05': // 週回顧（從建立至今從未打卡）
      subject = '看不見的成長，也在悄悄發生';
      preheader = `在「${practiceTitle}」的旅程中，我們相信你正在醞釀`;
      content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
          Hi ${userName},
        </h2>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          這週在 <strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong> 的頁面上，雖然沒有新增的打卡紀錄，
          但我們相信，這段看似沒有進行的時間，其實是學習過程中的「醞釀期」。
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          若你發現原本規劃的執行日期和時段不符合你目前的生活步調，
          歡迎回到島島阿學進行修改。
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
          想轉換一下心情嗎？回來看看別人在做什麼！
        </p>

        ${generateCtaButton({ text: '探索更多實踐', url: `${process.env.FRONTEND_URL}/practices`, color: 'orange' })}

        ${generateDivider()}
        ${generateAuthorSection()}
      `;
      break;

    case 'PE06': // 週回顧（當週無打卡但累積有打卡）
    default:
      subject = `關於 ${practiceTitle} 的下一步 🛤️`;
      preheader = `我們在這裡，隨時歡迎你回來`;
      content = `
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
          Hi ${userName},
        </h2>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          發現你這週還沒有在 <strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong> 留下打卡記錄。
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          寫這封信，主要是想關心目前的節奏是否還適合你？
          我們知道「生活」往往比「計畫」更多變。
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          如果真的提不起勁行動，先回來看看其他夥伴在做什麼，
          或許就能找回一點點感覺。
        </p>

        <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
          我們依然在這裡，隨時歡迎你回來。
        </p>

        ${generateCtaButton({ text: '回到我的實踐', url: practiceUrl, color: 'cyan' })}

        ${generateDivider()}
        ${generateAuthorSection()}
      `;
      break;
  }

  return generateStandardEmail({
    title: '島島阿學 - 每週回顧',
    subject,
    preheader,
    content
  });
}

/**
 * 生成結束總結郵件內容 (PE07-PE08)
 * @see docs/practice-mvp/practice-email-templates.md Section 8-9
 *
 * PE07: 實踐結束，有打卡記錄
 * PE08: 實踐結束，無打卡記錄
 */
function generateFinalSummaryEmailContent(
  emailCode: PracticeEmailCode,
  variables: FinalSummaryEmailVariables
): EmailTemplateContent {
  const {
    userName,
    practiceTitle,
    durationDays,
    totalCheckIns,
    bestNoteSnippet,
    bestNoteDate
  } = variables;

  let subject: string;
  let preheader: string;
  let content: string;

  if (emailCode === 'PE07') {
    // PE07: 完成總結（有打卡）
    subject = `這是你的 ${practiceTitle} 成長足跡`;
    preheader = `為期 ${durationDays} 天的旅程告一段落，你完成了 ${totalCheckIns} 次打卡！`;
    content = `
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
        Hi ${userName},
      </h2>

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        時間過得好快，為期 <strong>${durationDays}</strong> 天的 <strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong> 實踐旅程，告一段落了。
      </p>

      <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        現在的你和開始那天相比，心裡是否多了一些篤定，或是裝進了一些新的風景呢？
      </p>

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        雖然說很多時候我們無法量化成長。但我們幫你總結了這段時間裡，你留下的珍貴足跡。
      </p>

      ${bestNoteSnippet ? `
      <!-- 最佳筆記區塊 -->
      <div style="background-color: #FFF8F0; border-left: 4px solid ${EMAIL_COLORS.brandOrange}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${EMAIL_COLORS.brandOrange}; font-weight: 600;">
          💡 還記得那一刻的想法嗎？
        </p>
        <p style="margin: 0 0 8px; font-size: 13px; color: ${EMAIL_COLORS.textSecondary};">
          在 ${bestNoteDate} 那天，你寫下了這段話：
        </p>
        <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; font-style: italic; line-height: 1.6;">
          "${bestNoteSnippet}..."
        </p>
      </div>
      ` : ''}

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        這一個篇章結束了，但學習生活持續進行。
      </p>

      <p style="margin: 0 0 8px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        <strong>🔄 延續動能：</strong>如果意猶未盡，你可以調整目標，開啟新一輪的實踐。
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        <strong>🌱 探索新領域：</strong>帶著這次的經驗，去嘗試另一個領域！
      </p>

      <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
        謝謝你，讓我們參與了這段旅程。
      </p>

      ${generateCtaButton({ text: '開始新的實踐', url: `${process.env.FRONTEND_URL}/practices/new`, color: 'orange' })}

      ${generateDivider()}
      ${generateAuthorSection()}
    `;
  } else {
    // PE08: 完成總結（無打卡）
    subject = `關於 ${practiceTitle}`;
    preheader = `為期 ${durationDays} 天的週期告一段落，我們隨時歡迎你回來`;
    content = `
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: ${EMAIL_COLORS.textHeading};">
        Hi ${userName},
      </h2>

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        為期 <strong>${durationDays}</strong> 天的 <strong style="color: ${EMAIL_COLORS.brandCyan};">${practiceTitle}</strong> 週期，在今天告一段落了。
      </p>

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        我們將每一個主題實踐視為一個「小而美的生活提案」，
        是為了讓你的生活多一種風味，而不是多一份負擔。
      </p>

      <!-- 鼓勵區塊 -->
      <div style="border-left: 4px solid ${EMAIL_COLORS.brandCyan}; background-color: ${EMAIL_COLORS.bgQuote}; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
          沒有「執行」不代表浪費，有時候，光是「把這件事放在心上」，
          就已經是一種微小的改變。
        </p>
      </div>

      <p style="margin: 0 0 16px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
        接下來，你可以怎麼做呢？
      </p>

      <p style="margin: 0 0 8px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        <strong>🌱 重新給自己一個輕盈的開始：</strong>如果你覺得時機對了，歡迎隨時重新開啟。
        這次，試著只給自己一個「微小到不可能失敗」的目標？
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; color: ${EMAIL_COLORS.textPrimary}; line-height: 1.6;">
        <strong>👀 看看別人在做什麼：</strong>需要一些靈感嗎？回來看看其他夥伴在做什麼，
        或許能找到一些想法。
      </p>

      <p style="margin: 0 0 24px; font-size: 16px; color: ${EMAIL_COLORS.textHeading}; font-weight: 500; line-height: 1.6;">
        用舒服的節奏，探索學習生活。
      </p>

      ${generateCtaButton({ text: '探索更多實踐', url: `${process.env.FRONTEND_URL}/practices`, color: 'cyan' })}

      ${generateDivider()}
      ${generateAuthorSection()}
    `;
  }

  return generateStandardEmail({
    title: '島島阿學 - 實踐總結',
    subject,
    preheader,
    content
  });
}

// ============================================================================
// 輔助函數
// ============================================================================

/**
 * 發送郵件（使用現有的郵件服務）
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    // 使用現有的郵件服務
    const { emailService } = await import('./email.service');
    const result = await emailService.sendEmail({
      to,
      subject,
      html
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    loggerService.error('Failed to send email', {
      to,
      subject,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
