import '@/config/openapi-registry';
import { z } from 'zod';

export const surveyIdParams = z.object({ id: z.string().regex(/^[1-9]\d*$/) });
export const surveyResponseParams = surveyIdParams.extend({ responseId: z.string().regex(/^-?[1-9]\d*$/) });
export const surveyImageParams = z.object({ imageId: z.string().regex(/^[1-9]\d*$/) });
export const surveyListQuery = z.object({ status: z.enum(['draft', 'active', 'closed', 'archived']).optional(), q: z.string().optional(), limit: z.coerce.number().int().min(1).max(100).default(20), offset: z.coerce.number().int().min(0).default(0) });
export const surveyResponseListQuery = surveyListQuery.pick({ limit: true, offset: true });
const status = z.enum(['draft', 'active', 'closed', 'archived']);
const creator = z.object({ id: z.number().nullable(), email: z.string().nullable(), nickname: z.string().nullable() });
export const adminSurveyQuestionWire = z.object({ id: z.number().int(), question_text: z.string(), question_type: z.enum(['multiple_choice', 'single_choice', 'rating', 'text', 'yesno', 'scale', 'ranking']), is_required: z.boolean(), position: z.number().int(), input_type: z.enum(['text', 'email', 'url', 'textarea']), scale_min: z.number().int().nullable(), scale_max: z.number().int().nullable(), scale_min_label: z.string().nullable(), scale_max_label: z.string().nullable(), options: z.array(z.object({ id: z.number().int(), option_text: z.string(), position: z.number().int() })) }).openapi('AdminSurveyQuestionWire');
export const adminSurveyListItemWire = z.object({ id: z.number().int(), external_id: z.string(), title: z.string(), status, is_public: z.boolean(), is_anonymous: z.boolean(), managed_version: z.number().int().nullable(), tags: z.array(z.string()), view_count: z.number().int(), created_at: z.string().datetime(), response_count: z.number().int(), max_responses: z.number().int().nullable(), structure_locked: z.boolean(), creator }).openapi('AdminSurveyListItemWire');
export const adminSurveyDetailWire = adminSurveyListItemWire.extend({ description: z.string().nullable(), cover_url: z.string().nullable(), logo_url: z.string().nullable(), thank_you_message: z.string().nullable(), updated_at: z.string().datetime(), questions: z.array(adminSurveyQuestionWire) }).openapi('AdminSurveyDetailWire');
export const adminResponseListItemWire = z.object({ id: z.number().int(), user_id: z.number().int().nullable(), respondent_name: z.string().nullable(), completed_at: z.string().datetime(), answer_count: z.number().int() }).openapi('AdminSurveyResponseListItemWire');
export const adminResponseDetailWire = adminResponseListItemWire.extend({ answers: z.array(z.object({ question_id: z.number().int(), question_text: z.string(), question_type: z.string(), answer_text: z.string().nullable(), selected_option_ids: z.array(z.number().int()), selected_options: z.array(z.string()), rating_value: z.number().int().nullable(), boolean_value: z.boolean().nullable() })) }).openapi('AdminSurveyResponseDetailWire');
const statsWire = z.object({
  avg: z.number().nullable().optional(), min: z.number().nullable().optional(), max: z.number().nullable().optional(),
  distribution: z.array(z.object({ value: z.number(), count: z.number().int() })).optional(),
  option_counts: z.array(z.object({ option_id: z.number().int(), option_text: z.string(), count: z.number().int(), percentage: z.number().optional() })).optional(),
  rank_counts: z.array(z.object({ option_id: z.number().int(), option_text: z.string(), counts: z.array(z.number().int()), average_rank: z.number().nullable() })).optional(),
  sample_answers: z.array(z.string().nullable()).optional(), true: z.number().int().optional(), false: z.number().int().optional(),
});
export const adminAnalyticsWire = z.object({ survey_id: z.number().int(), response_count: z.number().int(), view_count: z.number().int(), avg_duration_seconds: z.number().nullable(), drop_off: z.array(z.object({ last_position: z.number().int(), count: z.number().int() })), per_question: z.array(z.object({ question_id: z.number().int(), question_text: z.string(), question_type: z.string(), input_type: z.string().optional(), answer_count: z.number().int(), stats: statsWire })) }).openapi('AdminSurveyAnalyticsWire');
export const adminImageWire = z.object({ id: z.number().int(), url: z.string().url(), created_by: z.number().int(), created_at: z.string().datetime() }).openapi('AdminSurveyImageWire');

/** Serialized success envelope; Date instances have already been JSON encoded as ISO strings. */
export function surveyEnvelope<T extends z.ZodType>(data: T) { return z.object({ success: z.literal(true), data, timestamp: z.string().datetime(), meta: z.record(z.string(), z.unknown()).optional() }); }
/** Preserve the existing admin offset pagination contract. */
export function surveyPageEnvelope<T extends z.ZodType>(item: T) { return surveyEnvelope(z.array(item)).extend({ pagination: z.object({ total: z.number().int(), limit: z.number().int(), offset: z.number().int(), hasMore: z.boolean() }) }); }
