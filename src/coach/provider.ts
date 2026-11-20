import { z } from 'zod';
import { getClerkToken } from '../lib/clerkToken';
import {
  COACH_ENDPOINT, coachAccessSchema, coachAllowanceSchema, coachAnswerResponse, coachMessages, containsCoachKey, fitsInput,
  MAX_QUESTION_LENGTH, openRouterRequest, openRouterResponse, parseCoachIntent, personalProviderInfo,
  type CoachAllowance, type CoachInput, type PersonalConnection, type ToolDescription,
} from './protocol';

export { COACH_ENDPOINT, MAX_QUESTION_LENGTH } from './protocol';
export const COACH_FIXTURE = '/__coach_fixture';
export const COACH_API = '/api/coach';
const REQUEST_TIMEOUT_MS = 35_000;
const privateRequest = { credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer' } as const;

export type CoachTurn = {
  id: string;
  source: PersonalConnection | { provider: 'hosted' | 'fixture' };
  onAllowance?: (allowance: CoachAllowance) => void;
};

const responseSchema = z.object({
  data: z.unknown().optional(),
  allowance: coachAllowanceSchema.optional(),
  code: z.string().optional(),
  resetAt: z.iso.datetime({ offset: true }).optional(),
});

export class CoachRequestError extends Error {
  constructor(message: string, readonly code?: string, readonly resetAt?: string) {
    super(message);
  }
}

export async function loadCoachAccess() {
  try {
    const token = await getClerkToken();
    if (token) {
      const response = await fetch(COACH_API, {
        ...privateRequest, headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000),
      });
      if (response.ok) return coachAccessSchema.parse(await response.json());
    }
  } catch {
    // The chat access check must not interfere with onboarding or study data.
  }
  return { hosted: 'off', nativeKeys: false } as const;
}

function apiError(code: string | undefined, resetAt: string | undefined, source: CoachTurn['source']) {
  const provider = source.provider === 'hosted' || source.provider === 'fixture'
    ? 'the AI provider' : personalProviderInfo[source.provider].label;
  const messages: Record<string, string> = {
    daily_limit: 'You’ve used your free AI questions for today.',
    daily_budget: 'Study chat has reached its shared budget for today.',
    monthly_budget: 'Study chat has reached its shared budget for this month.',
    busy: 'A question is still being processed. Wait a moment and try again.',
    replay: 'That question was already submitted. Send it again if you want to start a new question.',
    unconfirmed: 'Could not confirm the reply. Retry this message to check whether it was submitted.',
    expired: 'This question can no longer be continued.',
    disabled: 'This AI connection is temporarily unavailable. The built-in study shortcuts are available.',
    signed_out: 'Sign in again to use Study chat.',
    provider_auth: source.provider === 'hosted' ? 'Hosted AI is temporarily unavailable.' : `${provider} rejected the connection. Check your key and project settings.`,
    provider_credit: source.provider === 'hosted' ? 'Hosted AI is temporarily unavailable.' : `Your ${provider} account has no available credit.`,
    provider_rate: `${provider} is limiting requests. Wait a moment and try again.`,
    invalid_reply: 'The provider returned an incomplete or unsupported reply.',
    invalid_input: 'This request couldn’t be sent. Try a shorter question without credentials.',
    timeout: 'The provider took too long to respond.',
  };
  const message = code && Object.hasOwn(messages, code) ? messages[code] : 'AI is temporarily unavailable. Try again in a moment.';
  return new CoachRequestError(message, code, resetAt);
}

async function complete(input: CoachInput, turn: CoachTurn, signal: AbortSignal): Promise<unknown> {
  signal.throwIfAborted();
  const messages = coachMessages(input);
  if (!fitsInput(messages)) {
    throw new CoachRequestError('This request is too large. Try asking about one part of your study plan.');
  }
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = AbortSignal.any([signal, timeout]);
  const { source } = turn;
  if (containsCoachKey(JSON.stringify(messages), 'key' in source ? source.key : undefined)) {
    throw new CoachRequestError('Remove the API key from your message before sending.');
  }
  const backend = source.provider !== 'openrouter' && source.provider !== 'fixture';
  try {
    if (source.provider === 'openrouter' || (import.meta.env.MODE === 'e2e' && source.provider === 'fixture')) {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const options = {
        ...privateRequest, method: 'POST', headers, signal: requestSignal,
        body: JSON.stringify(openRouterRequest(input, messages)),
      };
      let response: Response;
      if (import.meta.env.MODE === 'e2e') {
        response = await fetch(COACH_FIXTURE, options);
        if (response.status === 404 || response.headers.get('Content-Type')?.includes('text/html')) {
          return input.step === 'intent'
            ? { calls: [], clarification: 'Try “What should I practice next?” or “Show my recent progress” in this preview.' }
            : { suggestion: 'Use the next eligible task to build on your recorded practice.', ...(input.replan && { pick: 'keep' }) };
        }
      } else if (source.provider === 'openrouter') {
        headers.set('Authorization', `Bearer ${source.key}`);
        response = await fetch(COACH_ENDPOINT, options);
      } else {
        throw new CoachRequestError('AI is unavailable.');
      }
      if (!response.ok) {
        const code = { 401: 'provider_auth', 403: 'provider_auth', 402: 'provider_credit', 429: 'provider_rate' }[response.status];
        throw apiError(code, undefined, source);
      }
      const envelope = openRouterResponse.parse(await response.json());
      return JSON.parse(envelope.choices[0].message.content);
    }
    if (source.provider === 'fixture') throw new CoachRequestError('AI is unavailable.');
    const token = await getClerkToken().catch(() => null);
    if (!token) throw apiError('signed_out', undefined, source);
    requestSignal.throwIfAborted();
    const response = await fetch(COACH_API, {
      ...privateRequest, method: 'POST', signal: requestSignal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ provider: source.provider, turnId: turn.id, input, ...('key' in source ? { key: source.key } : {}) }),
    });
    const result = responseSchema.safeParse(await response.json().catch(() => null));
    if (!result.success) throw apiError(input.step === 'intent' ? 'unconfirmed' : undefined, undefined, source);
    const { data, allowance, code, resetAt } = result.data;
    if (allowance) turn.onAllowance?.(allowance);
    if (!response.ok) throw apiError(code, resetAt, source);
    return data;
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof CoachRequestError) throw error;
    if (error instanceof SyntaxError || error instanceof z.ZodError) throw apiError('invalid_reply', undefined, source);
    if (backend && input.step === 'intent') throw apiError('unconfirmed', undefined, source);
    throw apiError(timeout.aborted ? 'timeout' : undefined, undefined, source);
  }
}

export async function chooseCoachIntent(
  question: string, context: string, tools: ToolDescription[], turn: CoachTurn, signal: AbortSignal, replan?: true,
) {
  if (question.length > MAX_QUESTION_LENGTH) throw new CoachRequestError('Shorten your message and try again.');
  const input: CoachInput = { step: 'intent', question, context, tools, replan };
  if (!fitsInput(coachMessages(input))) input.context = '';
  const result = await complete(input, turn, signal);
  try {
    return parseCoachIntent(result, tools);
  } catch {
    throw apiError('invalid_reply', undefined, turn.source);
  }
}

export async function summarizeCoachEvidence(
  question: string, evidence: unknown[], turn: CoachTurn, signal: AbortSignal, context?: string, replan?: true,
): Promise<{ suggestion: string; pick?: string }> {
  if (!evidence.length || evidence.length > 2) return { suggestion: '' };
  const input: CoachInput = { step: 'answer', question, evidence, context, replan };
  if (input.context && !fitsInput(coachMessages(input))) delete input.context;
  if (!fitsInput(coachMessages(input))) {
    if (replan) throw new CoachRequestError('Try a shorter message so there’s room to compare the eligible tasks.');
    return { suggestion: '' };
  }
  const result = coachAnswerResponse(input).safeParse(await complete(input, turn, signal));
  if (!result.success) throw apiError('invalid_reply', undefined, turn.source);
  return result.data;
}
