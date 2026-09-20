/**
 * 後台模板的 {{變數}} 渲染
 *
 * 用 Handlebars（logic-less，與 SendGrid Dynamic Templates／Firebase Trigger Email
 * 的後台模板同一套語法）而不是自己寫 regex，理由：
 * - DB 既有的 {{key}} 本來就是 Handlebars 子集，行為相容
 * - 預設 HTML escape（等同 escapeHtml），營運貼進帶特殊字元的文案不會破版或造成 XSS
 * - 之後要接清單型信件（通知摘要）可以直接用 {{#each}}，不用再換引擎
 *
 * 與純 Handlebars 的差異：未知變數不會被渲染成空字串，而是保留原字串 {{key}} 並記 warn。
 * 後台把模板改壞（打錯變數名）時，信仍然寄得出去，且從信件內容就看得出哪個變數沒接上。
 */

import Handlebars from 'handlebars';
import { loggerService } from '../logging/logger.service';
import { escapeHtml, sanitizeUrl } from '../../utils/sanitize';

/** 扁平變數表：key 對齊 email_templates.variables 欄位 */
export type TemplateVariables = Record<string, string | Handlebars.SafeString>;

/**
 * 連結類變數的值
 *
 * Handlebars 的預設跳脫會把 `=` 變成 `&#x3D;`，query string 連結雖然仍能解析，
 * 但信件原始碼難讀、部分舊版郵件客戶端也處理不佳。這裡先用既有的 sanitizeUrl
 * 擋掉 javascript: 之類的協議，再用 escapeHtml 做屬性跳脫（只處理 & < > " '），
 * 最後包成 SafeString 讓 Handlebars 不要二次跳脫。
 */
export const safeUrlVariable = (url: string | undefined | null): Handlebars.SafeString =>
  new Handlebars.SafeString(url ? escapeHtml(sanitizeUrl(url)) : '');

export interface RenderResult {
  text: string;
  /** 模板引用、但變數表沒有提供的 key（已保留原字串） */
  unknownKeys: string[];
}

/** 編譯結果快取：同一段模板字串只編譯一次 */
const compiledCache = new Map<string, HandlebarsTemplateDelegate>();
const MAX_COMPILED_CACHE = 200;

const compile = (template: string): HandlebarsTemplateDelegate => {
  const cached = compiledCache.get(template);
  if (cached) return cached;

  const fn = Handlebars.compile(template, { noEscape: false, strict: false });
  if (compiledCache.size >= MAX_COMPILED_CACHE) compiledCache.clear();
  compiledCache.set(template, fn);
  return fn;
};

/**
 * 掃 AST 取出模板引用到的簡單變數 key（{{a}}、{{a.b}}）
 *
 * 只收單純的變數引用：帶參數的 helper（{{formatDate x}}）與 block（{{#each}}）
 * 交給 Handlebars 自己處理，不列入未知變數判斷。
 */
export const collectTemplateKeys = (template: string): string[] => {
  const keys = new Set<string>();

  const walk = (node: hbs.AST.Node | null | undefined): void => {
    if (!node) return;

    switch (node.type) {
      case 'Program': {
        (node as hbs.AST.Program).body.forEach(walk);
        break;
      }
      case 'MustacheStatement': {
        const stmt = node as hbs.AST.MustacheStatement;
        const isPlainPath =
          stmt.path.type === 'PathExpression' &&
          stmt.params.length === 0 &&
          stmt.hash === undefined;
        if (isPlainPath) keys.add((stmt.path as hbs.AST.PathExpression).original);
        break;
      }
      case 'BlockStatement': {
        const block = node as hbs.AST.BlockStatement;
        walk(block.program);
        walk(block.inverse);
        break;
      }
      default:
        break;
    }
  };

  try {
    walk(Handlebars.parse(template));
  } catch (error) {
    // 模板語法壞掉時不在這裡爆，交給 renderTemplate 的 try/catch 決定 fallback
    loggerService.warn('[email-template] 無法解析模板 AST', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [...keys];
};

/**
 * 以變數表渲染模板字串
 *
 * @param template 後台儲存的模板字串（subject / preheader / body 都走這裡）
 * @param variables 扁平變數表
 * @param context 記 log 用的識別資訊（slug、欄位）
 */
export const renderTemplate = (
  template: string,
  variables: TemplateVariables,
  context: { slug: string; field: string }
): RenderResult => {
  const referenced = collectTemplateKeys(template);
  const unknownKeys = referenced.filter(key => !(key in variables));

  // 未知變數原樣保留：把 {{key}} 本身當成值餵回去，Handlebars 的 HTML escape
  // 不會動到大括號，所以輸出就是原字串
  const renderContext: Record<string, unknown> = { ...variables };
  for (const key of unknownKeys) {
    if (!key.includes('.')) {
      renderContext[key] = `{{${key}}}`;
      continue;
    }
    // 巢狀路徑（{{a.b}}）要組出對應物件才取得到；根名稱已被扁平變數佔用時跳過，
    // 此時 Handlebars 會渲染成空字串，warn log 仍會提示
    const [root, ...rest] = key.split('.');
    if (typeof renderContext[root] === 'string') continue;
    let cursor = (renderContext[root] ??= {}) as Record<string, unknown>;
    rest.forEach((segment, index) => {
      if (index === rest.length - 1) {
        cursor[segment] = `{{${key}}}`;
        return;
      }
      cursor = (cursor[segment] ??= {}) as Record<string, unknown>;
    });
  }

  if (unknownKeys.length > 0) {
    loggerService.warn('[email-template] 模板含未定義變數，已保留原字串', {
      slug: context.slug,
      field: context.field,
      unknownKeys,
    });
  }

  const text = compile(template)(renderContext);
  return { text, unknownKeys };
};

/** 測試用：清掉編譯快取 */
export const clearCompiledTemplateCache = (): void => {
  compiledCache.clear();
};
