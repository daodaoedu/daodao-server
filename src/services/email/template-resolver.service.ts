/**
 * 後台模板解析層（daodao#236）
 *
 * 所有寄信路徑原本都直接呼叫程式碼模板（*-template.ts），後台「信件管理」改的內容
 * 完全不影響寄出的信。這一層夾在中間：
 *
 *   DB 有該 slug 且 is_active = false → { skipped: true }，呼叫端不寄、記 email_logs status='skipped'
 *   DB 有該 slug 且 body 非空          → 用 DB 的 subject / preheader / body 做 {{變數}} 替換
 *   查無該 slug、body 空、或渲染失敗    → fallback 程式碼模板（行為與改動前完全相同）
 *
 * DB 查詢帶 5 分鐘 TTL cache（提出者確認），所以後台儲存後最多 5 分鐘生效。
 */

import { generateStandardEmail } from './base-template';
import { renderTemplate, type TemplateVariables } from './template-render';
import { loggerService } from '../logging/logger.service';
import { prisma } from '../database/prisma.service';
import type { EmailTemplateContent } from '../../types/email';

/** 模板快取 TTL：5 分鐘（daodao#236 AC-06） */
export const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * DB 查詢失敗時的短 TTL
 *
 * 失敗也要快取，否則週報／總結這種批次寄送會對每一位收件人重打一次失敗查詢；
 * 但不能用 5 分鐘——DB 恢復後要能很快回到讀後台模板。
 */
export const TEMPLATE_ERROR_CACHE_TTL_MS = 30 * 1000;

interface TemplateRow {
  slug: string;
  subject: string;
  preheader: string | null;
  body: string;
  is_active: boolean;
}

interface CacheEntry {
  row: TemplateRow | null;
  expiresAt: number;
}

/**
 * 一個 slug 的接線設定
 *
 * @template D 該類型信件的資料物件（既有 *EmailData / *EmailVariables 型別）
 */
export interface TemplateDescriptor<D> {
  /** email_templates.slug */
  slug: string;
  /** DB 模板渲染時的 <title>，沿用程式碼模板的值 */
  title: string;
  /** 資料物件 → 扁平 {{key}} 變數表，key 對齊 DB variables 欄位 */
  flatten: (data: D) => TemplateVariables;
  /** 退訂連結（DB 模板由 base-template 的 footer 使用） */
  unsubscribeUrl?: (data: D) => string | undefined;
  /** 查無模板／body 空／渲染失敗時使用的程式碼模板 */
  fallback: (data: D) => EmailTemplateContent;
}

export interface ResolvedTemplate extends EmailTemplateContent {
  skipped?: false;
  /** 這封信的內容來源，寫 log 與驗收用 */
  source: 'database' | 'code-fallback';
}

export interface SkippedTemplate {
  skipped: true;
  slug: string;
}

export type ResolveResult = ResolvedTemplate | SkippedTemplate;

export const isSkipped = (result: ResolveResult): result is SkippedTemplate =>
  (result as SkippedTemplate).skipped === true;

const cache = new Map<string, CacheEntry>();

const fetchTemplate = async (slug: string): Promise<TemplateRow | null> => {
  const cached = cache.get(slug);
  if (cached && cached.expiresAt > Date.now()) return cached.row;

  let row: TemplateRow | null = null;
  try {
    const found = await prisma.email_templates.findUnique({
      where: { slug },
      select: { slug: true, subject: true, preheader: true, body: true, is_active: true },
    });
    row = found ? { ...found, slug: found.slug as string } : null;
  } catch (error) {
    // DB 查不到不能讓信寄不出去：記 error 後走程式碼模板，並短暫快取失敗結果，
    // 避免批次寄送時每一位收件人都重打一次失敗查詢
    loggerService.error('[email-template] 查詢後台模板失敗，改用程式碼模板', {
      slug,
      error: error instanceof Error ? error.message : String(error),
    });
    cache.set(slug, { row: null, expiresAt: Date.now() + TEMPLATE_ERROR_CACHE_TTL_MS });
    return null;
  }

  cache.set(slug, { row, expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS });
  return row;
};

/**
 * 解析一封信的內容
 *
 * @param descriptor 該 slug 的接線設定
 * @param data 既有寄信路徑本來就備妥的資料物件
 */
export const resolveTemplate = async <D>(
  descriptor: TemplateDescriptor<D>,
  data: D
): Promise<ResolveResult> => {
  const { slug } = descriptor;
  const row = await fetchTemplate(slug);

  if (row && !row.is_active) {
    loggerService.info('[email-template] 模板已於後台停用，不寄送', { slug });
    return { skipped: true, slug };
  }

  if (row && row.body.trim().length > 0) {
    try {
      const variables = descriptor.flatten(data);
      const subject = renderTemplate(row.subject, variables, { slug, field: 'subject', escape: false }).text;
      const preheader = row.preheader
        ? renderTemplate(row.preheader, variables, { slug, field: 'preheader' }).text
        : '';
      const content = renderTemplate(row.body, variables, { slug, field: 'body' }).text;

      const rendered = generateStandardEmail({
        title: descriptor.title,
        subject,
        preheader,
        content,
        unsubscribeUrl: descriptor.unsubscribeUrl?.(data),
      });

      return { ...rendered, source: 'database' };
    } catch (error) {
      // 模板語法壞掉不該斷信：記 error 後走程式碼模板
      loggerService.error('[email-template] 後台模板渲染失敗，改用程式碼模板', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { ...descriptor.fallback(data), source: 'code-fallback' };
};

/** 後台儲存模板後可主動清掉，讓變更立即生效（目前未接，TTL 到期即可） */
export const invalidateTemplateCache = (slug?: string): void => {
  if (slug) {
    cache.delete(slug);
    return;
  }
  cache.clear();
};

export const __testing = {
  cache,
};
