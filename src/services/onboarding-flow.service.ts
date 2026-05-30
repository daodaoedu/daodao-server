import { prisma } from './database/prisma.service';

export interface ActiveFlowStep {
  id: number;
  questionText: string;
  questionType: 'single' | 'multi' | 'text';
  options: string[];
  fieldKey?: string;
  sortOrder: number;
}

export interface ActiveFlow {
  id: number;
  name: string;
  steps: ActiveFlowStep[];
}

export const getActiveFlow = async (): Promise<ActiveFlow | null> => {
  const flows = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT id, name FROM onboarding_flows WHERE is_enabled = true ORDER BY created_at DESC LIMIT 1
  `;

  if (!flows.length) return null;
  const flow = flows[0];

  const steps = await prisma.$queryRaw<Array<{
    id: number;
    question_text: string;
    question_type: string;
    options: unknown;
    field_key: string | null;
    sort_order: number;
  }>>`
    SELECT id, question_text, question_type, options, field_key, sort_order
    FROM onboarding_steps
    WHERE flow_id = ${flow.id}
    ORDER BY sort_order
  `;

  return {
    id: flow.id,
    name: flow.name,
    steps: steps.map((s) => ({
      id: s.id,
      questionText: s.question_text,
      questionType: s.question_type as 'single' | 'multi' | 'text',
      options: Array.isArray(s.options) ? (s.options as string[]) : [],
      fieldKey: s.field_key ?? undefined,
      sortOrder: s.sort_order,
    })),
  };
};

export const recordResponse = async (
  userId: number,
  flowId: number,
  stepId: number,
  answer: string[],
): Promise<void> => {
  await prisma.$executeRaw`
    INSERT INTO onboarding_responses (user_id, flow_id, step_id, answer, completed_at)
    VALUES (${userId}, ${flowId}, ${stepId}, ${JSON.stringify(answer)}::jsonb, NOW())
    ON CONFLICT (user_id, step_id) DO UPDATE SET answer = ${JSON.stringify(answer)}::jsonb, completed_at = NOW()
  `;
};
