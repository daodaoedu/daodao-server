import { assertManagedTransition, computeManagedAnalytics, sameQuestionStructure, validateManagedAnswers, SurveyQuestionData } from '../managed-survey-logic';
import { managedQuestionSchema, managedSurveyCreateSchema, managedSurveyUpdateSchema } from '@/validators/managed-survey.validators';

const question = (overrides: Partial<SurveyQuestionData> = {}): SurveyQuestionData => ({ id: 1, question_type: 'text', question_text: '回答', input_type: 'text', is_required: false, position: 0, scale_min: null, scale_max: null, scale_min_label: null, scale_max_label: null, options: [], ...overrides });

describe('managed questionnaire acceptance', () => {
  it('does not synthesize create defaults during a partial save', () => {
    expect(managedSurveyUpdateSchema.parse({ thank_you_message: '謝謝' })).toEqual({ thank_you_message: '謝謝' });
    expect(managedSurveyUpdateSchema.parse({})).toEqual({});
  });
  it('allows a zero-question draft while requiring a real title and valid choice/scale settings', () => {
    expect(managedSurveyCreateSchema.parse({ title: '問卷' }).questions).toEqual([]);
    expect(managedSurveyCreateSchema.safeParse({ title: ' ' }).success).toBe(false);
    expect(managedSurveyCreateSchema.safeParse({ title: '問卷', logo_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(managedQuestionSchema.safeParse({ question_text: '選擇', question_type: 'ranking', options: [] }).success).toBe(false);
    expect(managedQuestionSchema.safeParse({ question_text: '量表', question_type: 'scale', scale_min: 1, scale_max: 1 }).success).toBe(false);
  });
  it('publishes only nonempty drafts, closes and reopens, and treats archival as terminal', () => {
    expect(() => assertManagedTransition('draft', 'active', 0)).toThrow('至少');
    expect(() => assertManagedTransition('draft', 'active', 1)).not.toThrow();
    expect(() => assertManagedTransition('active', 'closed', 1)).not.toThrow();
    expect(() => assertManagedTransition('closed', 'active', 1)).not.toThrow();
    expect(() => assertManagedTransition('active', 'draft', 1)).toThrow();
    expect(() => assertManagedTransition('archived', 'active', 1)).toThrow('封存');
  });
  it('validates required content rather than answer row presence and accepts false/zero values', () => {
    expect(() => validateManagedAnswers([question({ is_required: true })], [{ question_id: 1, answer_text: '   ' }])).toThrow('必填');
    expect(validateManagedAnswers([question()], [{ question_id: 1, answer_text: '' }])).toEqual([]);
    expect(validateManagedAnswers([question({ question_type: 'yesno', is_required: true })], [{ question_id: 1, boolean_value: false }])[0].boolean_value).toBe(false);
    expect(validateManagedAnswers([question({ question_type: 'scale', scale_min: -2, scale_max: 2 })], [{ question_id: 1, rating_value: 0 }])[0].rating_value).toBe(0);
  });
  it('rejects unknown/duplicate question and option ids and mixed answer shapes', () => {
    const choice = question({ question_type: 'single_choice', options: [{ id: 2, option_text: 'A', position: 0 }, { id: 3, option_text: 'B', position: 1 }] });
    for (const answers of [[{ question_id: 99 }], [{ question_id: 1 }, { question_id: 1 }], [{ question_id: 1, selected_option_ids: [99] }], [{ question_id: 1, selected_option_ids: [2, 2] }], [{ question_id: 1, selected_option_ids: [2, 3] }], [{ question_id: 1, selected_option_ids: [2], answer_text: 'injected' }]]) expect(() => validateManagedAnswers([choice], answers)).toThrow();
  });
  it('validates email, http URLs, star bounds, and configured scale bounds', () => {
    expect(() => validateManagedAnswers([question({ input_type: 'email' })], [{ question_id: 1, answer_text: 'invalid' }])).toThrow('Email');
    expect(() => validateManagedAnswers([question({ input_type: 'url' })], [{ question_id: 1, answer_text: 'javascript:alert(1)' }])).toThrow();
    expect(validateManagedAnswers([question({ input_type: 'url' })], [{ question_id: 1, answer_text: ' https://example.com/a ' }])[0].answer_text).toBe('https://example.com/a');
    expect(() => validateManagedAnswers([question({ question_type: 'rating' })], [{ question_id: 1, rating_value: 0 }])).toThrow('範圍');
    expect(() => validateManagedAnswers([question({ question_type: 'scale', scale_min: -2, scale_max: 2 })], [{ question_id: 1, rating_value: 3 }])).toThrow('範圍');
  });
  it('compares meaning rather than ids/default positions, but detects reordered choices and changed requirements', () => {
    const saved = question({ question_type: 'ranking', options: [{ id: 55, option_text: 'A', position: 0 }, { id: 66, option_text: 'B', position: 1 }] });
    const input = managedQuestionSchema.parse({ ...saved, id: 999, position: 22, options: saved.options.map(o => ({ ...o, id: o.id + 100 })) });
    expect(sameQuestionStructure([saved], [input])).toBe(true);
    expect(sameQuestionStructure([saved], [{ ...input, is_required: true }])).toBe(false);
    expect(sameQuestionStructure([saved], [{ ...input, options: [...input.options].reverse() }])).toBe(false);
  });
  it('computes ranking positions and average rank using only respondents who ranked that option', () => {
    const q = question({ question_type: 'ranking', options: [{ id: 2, option_text: 'A', position: 0 }, { id: 3, option_text: 'B', position: 1 }] });
    expect(computeManagedAnalytics([q], [{ question_id: 1, selected_option_ids: [3, 2] }, { question_id: 1, selected_option_ids: [2] }, { question_id: 1, selected_option_ids: [] }])[0]).toMatchObject({ answer_count: 2, stats: { rank_counts: [{ option_id: 2, counts: [1, 1], average_rank: 1.5 }, { option_id: 3, counts: [1, 0], average_rank: 1 }] } });
  });
  it('uses valid answered respondents as multi-choice denominator and returns null empty averages', () => {
    const q = question({ question_type: 'multiple_choice', options: [{ id: 2, option_text: 'A', position: 0 }, { id: 3, option_text: 'B', position: 1 }] });
    expect(computeManagedAnalytics([q], [{ question_id: 1, selected_option_ids: [2, 3] }, { question_id: 1, selected_option_ids: [2] }, { question_id: 1 }])[0]).toMatchObject({ answer_count: 2, stats: { option_counts: [{ count: 2, percentage: 100 }, { count: 1, percentage: 50 }] } });
    expect(computeManagedAnalytics([question({ question_type: 'rating' })], [])[0].stats).toMatchObject({ avg: null, min: null, max: null, distribution: [{ value: 1, count: 0 }, { value: 2, count: 0 }, { value: 3, count: 0 }, { value: 4, count: 0 }, { value: 5, count: 0 }] });
  });
});
