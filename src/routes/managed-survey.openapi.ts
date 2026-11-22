import { z } from 'zod';
import { registry } from '@/config/openapi-registry';
import { managedSurveyCreateSchema, managedSurveyUpdateSchema, managedSurveyResponseSchema, managedStatusSchema } from '@/validators/managed-survey.validators';
import { adminSurveyDetailWire, adminSurveyListItemWire, adminResponseDetailWire, adminResponseListItemWire, adminAnalyticsWire, adminImageWire, surveyEnvelope, surveyPageEnvelope, surveyIdParams, surveyResponseParams, surveyImageParams, surveyListQuery, surveyResponseListQuery } from '@/validators/managed-survey-wire.validators';

const auth = [{ bearerAuth: [] }];
const errors = { 400: { description: '欄位或題目設定無效' }, 401: { description: '需要登入' }, 403: { description: '需要管理員權限；場次匿名回饋必須由獨立入口查看' }, 404: { description: '問卷或回應不存在' }, 409: { description: '已有歷史回應的題目/匿名設定不可更改；封存為終態' } };
/** Describe real JSON content instead of documenting successful bodies as empty responses. */
function json<T extends z.ZodType>(schema: T, description = '操作成功') { return { description, content: { 'application/json': { schema } } }; }
const base = { tags: ['Admin Survey'], security: auth };
const managedWriteResponse = surveyEnvelope(managedSurveyResponseSchema);
registry.registerPath({ ...base, method: 'post', path: '/api/v1/admin/surveys', summary: '建立正式問卷草稿', request: { body: { required: true, content: { 'application/json': { schema: managedSurveyCreateSchema } } } }, responses: { 201: json(managedWriteResponse, '草稿建立成功（managed_version=1）'), ...errors } });
registry.registerPath({ ...base, method: 'put', path: '/api/v1/admin/surveys/{id}', summary: '儲存問卷（舊問卷保留舊欄位契約）', request: { params: surveyIdParams, body: { required: true, content: { 'application/json': { schema: managedSurveyUpdateSchema } } } }, responses: { 200: json(z.union([managedWriteResponse, surveyEnvelope(z.object({ id: z.number().int(), updated: z.literal(true) }))])), ...errors } });
registry.registerPath({ ...base, method: 'patch', path: '/api/v1/admin/surveys/{id}/status', summary: '發布、關閉、重開或封存問卷', request: { params: surveyIdParams, body: { required: true, content: { 'application/json': { schema: managedStatusSchema } } } }, responses: { 200: json(z.union([managedWriteResponse, surveyEnvelope(z.object({ id: z.number().int(), status: managedStatusSchema.shape.status, updated_at: z.string().datetime() }))])), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys', summary: '搜尋及篩選問卷', request: { query: surveyListQuery }, responses: { 200: json(surveyPageEnvelope(adminSurveyListItemWire)), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys/{id}', summary: '讀取問卷詳情（managed_version可為null，保留舊問卷）', request: { params: surveyIdParams }, responses: { 200: json(surveyEnvelope(adminSurveyDetailWire)), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys/{id}/responses', summary: '讀取分頁回應者列表（匿名不回傳會員資料）', request: { params: surveyIdParams, query: surveyResponseListQuery }, responses: { 200: json(surveyPageEnvelope(adminResponseListItemWire)), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys/{id}/responses/{responseId}', summary: '讀取逐題回應', request: { params: surveyResponseParams }, responses: { 200: json(surveyEnvelope(adminResponseDetailWire)), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys/{id}/analytics', summary: '從有效保存答案重算題目分析', request: { params: surveyIdParams }, responses: { 200: json(surveyEnvelope(adminAnalyticsWire)), ...errors } });
registry.registerPath({ ...base, method: 'get', path: '/api/v1/admin/surveys/images', summary: '讀取目前管理員的三張圖片庫', responses: { 200: json(surveyEnvelope(z.array(adminImageWire))), ...errors } });
registry.registerPath({ ...base, method: 'post', path: '/api/v1/admin/surveys/images', summary: '上傳8MiB以內PNG/JPEG/WebP圖片', request: { body: { required: true, content: { 'multipart/form-data': { schema: z.object({ file: z.string().openapi({ type: 'string', format: 'binary' }) }) } } } }, responses: { 201: json(surveyEnvelope(adminImageWire)), ...errors, 429: { description: '圖片操作過於頻繁' } } });
for (const [path, params] of [
  ['/api/v1/admin/surveys/{id}', surveyIdParams],
  ['/api/v1/admin/surveys/{id}/responses/{responseId}', surveyResponseParams],
  ['/api/v1/admin/surveys/images/{imageId}', surveyImageParams],
] as const) registry.registerPath({ ...base, method: 'delete', path, summary: '刪除問卷/回應或移除庫項（不刪引用圖片）', request: { params }, responses: { 204: { description: '刪除成功，無回應內容' }, ...errors } });
