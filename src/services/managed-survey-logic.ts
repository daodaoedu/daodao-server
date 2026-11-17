import { z } from 'zod';
import { BadRequestError, ConflictError } from '@/middleware/error.middleware';
import type { ManagedQuestion } from '@/validators/managed-survey.validators';

export interface SurveyQuestionData {
  id: number; question_text: string; question_type: string; is_required: boolean; position: number;
  input_type: string; scale_min: number | null; scale_max: number | null; scale_min_label: string | null; scale_max_label: string | null;
  options: Array<{ id: number; option_text: string; position: number }>;
}
export interface SurveyAnswerData { question_id: number; answer_text?: string | null; selected_option_ids?: number[]; rating_value?: number | null; boolean_value?: boolean | null }

/** Validate lifecycle with archived as an explicitly terminal state. */
export function assertManagedTransition(current: string, next: string, questionCount: number): void {
  if (current === next) return;
  const transitions: Record<string, string[]> = { draft: ['active', 'archived'], active: ['closed', 'archived'], closed: ['active', 'archived'], archived: [] };
  if (!transitions[current]?.includes(next)) throw new ConflictError('無法進行此狀態變更；封存後不可重新開啟');
  if (next === 'active' && questionCount === 0) throw new BadRequestError('至少新增一題才能發布');
}

/** Compare semantic question content, ignoring transient ids and supplied positions. */
export function sameQuestionStructure(saved: SurveyQuestionData[], input: ManagedQuestion[]): boolean {
  const shape = (q: SurveyQuestionData | ManagedQuestion) => ({
    question_text: q.question_text, question_type: q.question_type, is_required: q.is_required,
    input_type: q.input_type ?? 'text', scale_min: q.scale_min ?? null, scale_max: q.scale_max ?? null,
    scale_min_label: q.scale_min_label ?? null, scale_max_label: q.scale_max_label ?? null,
    options: q.options.map(o => o.option_text),
  });
  return JSON.stringify(saved.map(shape)) === JSON.stringify(input.map(shape));
}

/** Validate every answer against the persisted question and normalize empty optional answers away. */
export function validateManagedAnswers(questions: SurveyQuestionData[], answers: SurveyAnswerData[]): SurveyAnswerData[] {
  const byId = new Map(questions.map(q => [q.id, q]));
  const seen = new Set<number>();
  const result: SurveyAnswerData[] = [];
  for (const answer of answers) {
    const q = byId.get(answer.question_id);
    if (!q || seen.has(q.id)) throw new BadRequestError('包含無效或重複的題目');
    seen.add(q.id);
    const selected = answer.selected_option_ids ?? [];
    const text = answer.answer_text?.trim() ?? '';
    let valid = false;
    let normalized: SurveyAnswerData = { question_id: q.id };
    if (q.question_type === 'text') {
      if (selected.length || answer.rating_value != null || answer.boolean_value != null) throw new BadRequestError('答案格式不符合文字題');
      if (text.length > 10000) throw new BadRequestError('文字答案過長');
      if (text && q.input_type === 'email' && !z.string().email().safeParse(text).success) throw new BadRequestError('請輸入有效的 Email');
      if (text && q.input_type === 'url') {
        let url: URL; try { url = new URL(text); } catch { throw new BadRequestError('請輸入有效的網址'); }
        if (!['http:', 'https:'].includes(url.protocol)) throw new BadRequestError('網址必須使用 http 或 https');
      }
      valid = !!text; normalized = { question_id: q.id, answer_text: text };
    } else if (['single_choice', 'multiple_choice', 'ranking'].includes(q.question_type)) {
      if (text || answer.rating_value != null || answer.boolean_value != null) throw new BadRequestError('答案格式不符合選擇題');
      const ids = new Set(q.options.map(o => o.id));
      if (new Set(selected).size !== selected.length || selected.some(id => !ids.has(id)) || (q.question_type === 'single_choice' && selected.length > 1)) throw new BadRequestError('包含無效或重複的選項');
      valid = selected.length > 0; normalized = { question_id: q.id, selected_option_ids: selected };
    } else if (q.question_type === 'rating' || q.question_type === 'scale') {
      if (text || selected.length || answer.boolean_value != null) throw new BadRequestError('答案格式不符合評分題');
      const value = answer.rating_value;
      if (value != null && (!Number.isInteger(value) || value < (q.question_type === 'rating' ? 1 : q.scale_min ?? 1) || value > (q.question_type === 'rating' ? 5 : q.scale_max ?? 10))) throw new BadRequestError('數值超出題目範圍');
      valid = value != null; normalized = { question_id: q.id, rating_value: value };
    } else if (q.question_type === 'yesno') {
      if (text || selected.length || answer.rating_value != null) throw new BadRequestError('答案格式不符合是非題');
      valid = typeof answer.boolean_value === 'boolean'; normalized = { question_id: q.id, boolean_value: answer.boolean_value };
    }
    if (valid) result.push(normalized);
  }
  const answered = new Set(result.map(a => a.question_id));
  if (questions.some(q => q.is_required && !answered.has(q.id))) throw new BadRequestError('請完成所有必填題目');
  return result;
}

/** Recompute statistics from valid persisted answers; missing answers never inflate denominators. */
export function computeManagedAnalytics(questions: SurveyQuestionData[], answers: SurveyAnswerData[]) {
  return questions.map(q => {
    const rows = answers.filter(a => a.question_id === q.id).filter(a => {
      try { return validateManagedAnswers([{ ...q, is_required: false }], [a]).length > 0; } catch { return false; }
    });
    let stats: Record<string, unknown> = {};
    if (q.question_type === 'rating' || q.question_type === 'scale') {
      const values = rows.flatMap(a => typeof a.rating_value === 'number' ? [a.rating_value] : []);
      stats = { avg: values.length ? values.reduce((s, n) => s + n, 0) / values.length : null, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
        distribution: Array.from({ length: (q.question_type === 'rating' ? 5 : q.scale_max ?? 10) - (q.question_type === 'rating' ? 1 : q.scale_min ?? 1) + 1 }, (_, i) => {
          const value = i + (q.question_type === 'rating' ? 1 : q.scale_min ?? 1); return { value, count: values.filter(n => n === value).length };
        }) };
    } else if (q.question_type === 'ranking') {
      stats = { rank_counts: q.options.map(o => {
        const ranks = rows.map(a => (a.selected_option_ids ?? []).indexOf(o.id) + 1).filter(n => n > 0);
        return { option_id: o.id, option_text: o.option_text, counts: q.options.map((_, i) => ranks.filter(n => n === i + 1).length), average_rank: ranks.length ? ranks.reduce((s, n) => s + n, 0) / ranks.length : null };
      }) };
    } else if (q.question_type === 'yesno') {
      stats = { true: rows.filter(a => a.boolean_value === true).length, false: rows.filter(a => a.boolean_value === false).length };
    } else if (q.question_type === 'text') {
      stats = { sample_answers: rows.map(a => a.answer_text) };
    } else {
      stats = { option_counts: q.options.map(o => { const count = rows.filter(a => a.selected_option_ids?.includes(o.id)).length;
        return { option_id: o.id, option_text: o.option_text, count, percentage: rows.length ? count / rows.length * 100 : 0 }; }) };
    }
    return { question_id: q.id, question_text: q.question_text, question_type: q.question_type, input_type: q.input_type, answer_count: rows.length, stats };
  });
}
