import { createHmac } from 'node:crypto';
import { z } from 'zod';
import { verifyCoachUser } from '../server/coachAuth.js';
import { CoachProviderError, MAX_OPENROUTER_STEP_MICROS, runCoachProvider } from '../server/coachProvider.js';
import {
  coachAllowanceSchema, coachApiInputSchema, coachMessages, containsCoachKey, fitsInput,
  FREE_QUESTIONS_PER_DAY, validCoachKey, type CoachAccess,
} from '../src/coach/protocol.js';

const MAX_BODY_BYTES = 12_000;
const MAX_FREE_DAILY_MICROS = 1_000_000;
const claimSchema = z.object({
  code: z.enum(['ok', 'daily_limit', 'daily_budget', 'monthly_budget', 'busy', 'replay', 'expired', 'disabled']),
  allowance: coachAllowanceSchema.optional(),
  resetAt: z.iso.datetime({ offset: true }).optional(),
});

function json(status: number, data: unknown, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

async function readCoachBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) throw new Error();
  const reader = request.body?.getReader();
  if (!reader) throw new Error();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return JSON.parse(text + decoder.decode());
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      void reader.cancel().catch(() => {});
      throw new Error();
    }
    text += decoder.decode(value, { stream: true });
  }
}

async function coachRequest(request: Request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json(405, { code: 'method_not_allowed' }, { Allow: 'GET, POST' });
  }
  const origins = (process.env.COACH_ALLOWED_ORIGINS ?? '').split(',').map(origin => origin.trim()).filter(Boolean);
  const databaseUrl = process.env.VITE_SUPABASE_URL;
  const databaseKey = process.env.COACH_SUPABASE_SECRET_KEY;
  if (!origins.length || !databaseUrl || !databaseKey) {
    return request.method === 'GET'
      ? json(200, { hosted: 'off', nativeKeys: false })
      : json(503, { code: 'disabled' });
  }
  const origin = request.headers.get('Origin') ?? undefined;
  if ((request.method === 'POST' && !origin) || (origin && !origins.includes(origin))) {
    return json(403, { code: 'signed_out' });
  }
  const userId = await verifyCoachUser(request.headers.get('Authorization') ?? undefined, origins, origin);
  if (!userId) return json(401, { code: 'signed_out' });

  const owner = userId === process.env.COACH_OWNER_USER_ID;
  const publicKey = process.env.COACH_OPENROUTER_API_KEY ?? '';
  const ownerKey = process.env.COACH_OWNER_OPENROUTER_API_KEY ?? '';
  const monthlyBudget = Number(process.env.COACH_MONTHLY_BUDGET_MICROS);
  const hostedKey = owner ? ownerKey : publicKey;
  const configuredBudget = Number.isSafeInteger(monthlyBudget) && monthlyBudget >= 2 * MAX_OPENROUTER_STEP_MICROS && monthlyBudget <= 1_000_000_000;
  const hostedAvailable = process.env.COACH_HOSTED_ENABLED === 'true' && validCoachKey('openrouter', hostedKey)
    && (owner ? ownerKey !== publicKey : configuredBudget);
  const access: CoachAccess = { hosted: hostedAvailable ? owner ? 'owner' : 'free' : 'off', nativeKeys: true };
  if (request.method === 'GET') return json(200, access);

  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    return json(415, { code: 'invalid_input' });
  }
  const parsed = coachApiInputSchema.safeParse(await readCoachBody(request).catch(() => null));
  if (!parsed.success) return json(400, { code: 'invalid_input' });

  const { provider, turnId, input } = parsed.data;
  if (provider === 'hosted' && !hostedAvailable) return json(503, { code: 'disabled' });
  const upstream = provider === 'hosted' ? 'openrouter' : provider;
  const key = parsed.data.provider === 'hosted' ? hostedKey : parsed.data.key;
  let messages: ReturnType<typeof coachMessages>;
  try { messages = coachMessages(input); }
  catch { return json(400, { code: 'invalid_input' }); }
  if (!validCoachKey(upstream, key) || !fitsInput(messages) || containsCoachKey(JSON.stringify(messages), key)) {
    return json(400, { code: 'invalid_input' });
  }

  async function rpc(name: 'claim_coach_turn' | 'settle_coach_step', data: unknown) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: databaseKey! };
    if (!databaseKey!.startsWith('sb_secret_')) headers.Authorization = `Bearer ${databaseKey}`;
    const response = await fetch(new URL(`/rest/v1/rpc/${name}`, databaseUrl), {
      method: 'POST', headers, body: JSON.stringify(data), signal: AbortSignal.timeout(3000), redirect: 'error',
    });
    if (!response.ok) throw new Error();
    return response.json();
  }

  try {
    const funding = provider === 'hosted' ? owner ? 'owner' : 'free' : provider;
    const stepMicros = provider === 'hosted' ? MAX_OPENROUTER_STEP_MICROS : 0;
    // This binds the second call to the original question and funding key without storing either.
    const fingerprint = createHmac('sha256', key).update(turnId).update(input.question).digest('hex');
    const claim = claimSchema.parse(await rpc('claim_coach_turn', {
      p_id: turnId, p_user_id: userId, p_funding: funding, p_fingerprint: fingerprint, p_step: input.step,
      p_step_micros: stepMicros,
      p_daily_budget_micros: funding === 'free' ? Math.min(MAX_FREE_DAILY_MICROS, monthlyBudget) : 0,
      p_monthly_budget_micros: funding === 'free' ? monthlyBudget : 0,
      p_daily_limit: FREE_QUESTIONS_PER_DAY,
    }));
    if (claim.code !== 'ok') {
      const status = claim.code === 'disabled' ? 503 : claim.code === 'replay' || claim.code === 'expired' ? 409 : 429;
      return json(status, claim);
    }
    const allowance = claim.allowance;
    let result: Awaited<ReturnType<typeof runCoachProvider>> | undefined;
    let code = 'provider_unavailable';
    try {
      result = await runCoachProvider(upstream, key, input, messages);
    } catch (error) {
      if (error instanceof CoachProviderError) code = error.code;
    }
    const cost = result?.costMicros ?? null;
    const costMismatch = cost !== null && cost > stepMicros;
    const settled = await rpc('settle_coach_step', {
      p_id: turnId, p_step: input.step, p_cost_micros: cost, p_can_summarize: result?.canSummarize === true && !costMismatch,
    });
    if (settled !== true) return json(503, { code: 'unconfirmed', allowance });
    if (costMismatch) return json(503, { code: 'disabled', allowance });
    if (!result) return json(code === 'timeout' ? 504 : 502, { code, allowance });
    return json(200, { data: result.data, allowance });
  } catch {
    return json(503, { code: 'unconfirmed' });
  }
}

export default { fetch: coachRequest };
