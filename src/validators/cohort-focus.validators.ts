import { z } from 'zod';
import '../config/openapi-registry';
const personSchema = z.object({
  userId: z.number().int(), nickname: z.string().nullable(), avatar: z.string().nullable(),
  practiceId: z.number().int().openapi({ description: '該參與者在本場次的實踐；點擊可開打卡紀錄抽屜' }),
  practiceTitle: z.string(),
  messageCount: z.number().int().nonnegative().openapi({ description: '帶領人已對此參與者送出的訊息數；0 顯示「尚未送出」' })
});
export const cohortFocusResponseSchema = z.object({
  needsEncouragement: z.array(personSchema.extend({
    lastCheckinAt: z.date(), lastCheckinDate: z.date().openapi({ description: '最後打卡日（checkin_date）' }),
    lastCheckinPreview: z.string().nullable(),
    interruptedDays: z.number().int().nonnegative().openapi({ description: '距離上次打卡的天數，純事實不帶警示' })
  })),
  celebrations: z.array(personSchema.extend({
    moment: z.enum(['first_checkin', 'return_after_break', 'month_milestone']),
    momentDescription: z.string().openapi({ description: '值得慶祝的時刻文案' }),
    occurredAt: z.date(), firstCheckinAt: z.date().openapi({ description: '首次打卡日' })
  }))
});
