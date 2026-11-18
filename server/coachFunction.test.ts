import { randomUUID } from 'node:crypto';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import coach from '../api/coach';
import { COACH_ENDPOINT, type CoachInput } from '../src/coach/protocol';

const site = 'https://lc-tracker.test';
const issuer = 'https://clerk.lc-tracker.test';
const publicKey = 'sk-or-v1-public-fixture-credential';
const ownerKey = 'sk-or-v1-owner-fixture-credential';
const question: CoachInput = {
  step: 'intent', question: 'Explain my latest practice.', context: '',
  tools: [{ name: 'today_plan', kind: 'read', description: 'Read today’s plan.' }],
};
const choice = { calls: [{ name: 'today_plan', arguments: '{}' }], clarification: '' };
const resetAt = '2026-11-30T00:00:00.000Z';
let signing: Awaited<ReturnType<typeof generateKeyPair>>;
let jwks: { keys: Record<string, unknown>[] };
let sent: { url: string; headers: Headers; body: string }[];
let claim: { code: string; allowance?: { remaining: number; resetAt: string }; resetAt?: string };
let usageCost: number | undefined;
let ledgerUp: boolean;

async function session(sub = 'user_learner', azp = site, iss = issuer, expired = false) {
  return new SignJWT({ sid: 'sess_test', azp }).setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'test' })
    .setIssuer(iss).setSubject(sub).setIssuedAt().setNotBefore('0s').setExpirationTime(expired ? '-1m' : '1m')
    .sign(signing.privateKey);
}

function invoke(token: string, input?: unknown, origin = site) {
  return coach.fetch(new Request(site + '/api/coach', {
    method: input ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Origin: origin },
    body: input ? JSON.stringify(input) : undefined,
  }));
}

beforeAll(async () => {
  signing = await generateKeyPair('RS256');
  jwks = { keys: [{ ...await exportJWK(signing.publicKey), kid: 'test' }] };
});

beforeEach(() => {
  vi.stubEnv('COACH_ALLOWED_ORIGINS', site);
  vi.stubEnv('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_' + Buffer.from('clerk.lc-tracker.test$').toString('base64'));
  vi.stubEnv('VITE_SUPABASE_URL', 'https://fixture.supabase.test');
  vi.stubEnv('COACH_SUPABASE_SECRET_KEY', 'sb_secret_fake');
  vi.stubEnv('COACH_HOSTED_ENABLED', 'true');
  vi.stubEnv('COACH_OPENROUTER_API_KEY', publicKey);
  vi.stubEnv('COACH_OWNER_OPENROUTER_API_KEY', ownerKey);
  vi.stubEnv('COACH_OWNER_USER_ID', 'user_owner');
  vi.stubEnv('COACH_MONTHLY_BUDGET_MICROS', '5000000');
  claim = { code: 'ok' };
  ledgerUp = true;
  usageCost = 0.0001244;
  sent = [];
  vi.stubGlobal('fetch', vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = String(input);
    const body = String(init?.body ?? '');
    sent.push({ url, body, headers: new Headers(init?.headers) });
    if (url.endsWith('/jwks.json')) return Response.json(jwks);
    if (url.endsWith('/claim_coach_turn')) return Response.json(claim, { status: ledgerUp ? 200 : 503 });
    if (url.endsWith('/settle_coach_step')) return Response.json(true);
    if (url === COACH_ENDPOINT) {
      const step = JSON.parse(body).response_format.json_schema.name;
      const content = JSON.stringify(step === 'answer' ? { suggestion: 'Try a timed review.' } : choice);
      return Response.json({ choices: [{ finish_reason: 'stop', message: { content } }], usage: { cost: usageCost } });
    }
    if (url.startsWith('https://generativelanguage.googleapis.com/')) {
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(choice) }] } }] });
    }
    if (url === 'https://api.anthropic.com/v1/messages') {
      return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(choice) }] });
    }
    throw new Error('Unexpected fetch');
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Study Chat function', () => {
  it('accepts only a current Clerk session from the configured origin and issuer', async () => {
    const input = { provider: 'hosted', turnId: randomUUID(), input: question };
    expect((await invoke('unsigned', input)).status).toBe(401);
    expect((await invoke(await session('user_owner', 'https://another.test'), input)).status).toBe(401);
    expect((await invoke(await session('user_owner', site, 'https://another-issuer.test'), input)).status).toBe(401);
    expect((await invoke(await session('user_owner', site, issuer, true), input)).status).toBe(401);
    expect((await invoke(await session(), input, 'https://another.test')).status).toBe(403);
    expect(sent.every(call => call.url === issuer + '/.well-known/jwks.json')).toBe(true);
  });

  it('reserves before model use, settles in integer microdollars, and binds the two steps', async () => {
    claim = { code: 'ok', allowance: { remaining: 1, resetAt } };
    const id = randomUUID();
    const token = await session();
    const result = await invoke(token, { provider: 'hosted', turnId: id, input: question });
    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toBe('no-store');
    expect(await result.json()).toEqual({ data: choice, allowance: claim.allowance });
    const [reserved, model, settled] = sent.filter(call => !call.url.endsWith('/jwks.json'));
    const reservation = JSON.parse(reserved.body);
    expect(reservation).toMatchObject({
      p_id: id, p_step: 'intent', p_user_id: 'user_learner', p_funding: 'free',
      p_monthly_budget_micros: 5_000_000, p_daily_budget_micros: 1_000_000, p_step_micros: 2000, p_daily_limit: 2,
    });
    expect(reserved.body).not.toContain(question.question);
    expect(reserved.headers.get('apikey')).toBe('sb_secret_fake');
    expect(model.url).toBe(COACH_ENDPOINT);
    expect(model.headers.get('Authorization')).toBe(`Bearer ${publicKey}`);
    expect(model.body).not.toMatch(/user_learner|public-fixture|settle_coach/);
    expect(JSON.parse(model.body)).toMatchObject({
      model: 'openai/gpt-4.1-nano', max_completion_tokens: 500,
      provider: { only: ['azure'], allow_fallbacks: false, data_collection: 'deny', zdr: true },
    });
    expect(JSON.parse(settled.body)).toEqual({ p_id: id, p_step: 'intent', p_cost_micros: 125, p_can_summarize: true });

    sent.length = 0;
    const answer = await invoke(token, {
      provider: 'hosted', turnId: id, input: { step: 'answer', question: question.question, evidence: [{ minutes: 20 }] },
    });
    expect(await answer.json()).toMatchObject({ data: { suggestion: 'Try a timed review.' } });
    expect(JSON.parse(sent[0].body)).toMatchObject({ p_id: id, p_step: 'answer', p_fingerprint: reservation.p_fingerprint });
  });

  it('fails closed on quota, replay, ledger outage, and disabled second steps', async () => {
    const token = await session();
    const input = { provider: 'hosted', turnId: randomUUID(), input: question };
    claim = { code: 'daily_limit', resetAt, allowance: { remaining: 0, resetAt } };
    const limited = await invoke(token, input);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual(claim);
    claim = { code: 'replay' };
    expect((await invoke(token, input)).status).toBe(409);
    ledgerUp = false;
    expect((await invoke(token, input)).status).toBe(503);
    vi.stubEnv('COACH_HOSTED_ENABLED', 'false');
    expect((await invoke(token, { ...input, input: { step: 'answer', question: question.question, evidence: [{}] } })).status).toBe(503);
    expect(sent.some(call => call.url === COACH_ENDPOINT)).toBe(false);
  });

  it('uses separate owner credentials only for the verified owner account and retains unknown cost', async () => {
    const token = await session('user_owner');
    expect(await (await invoke(token)).json()).toEqual({ hosted: 'owner', nativeKeys: true });
    usageCost = undefined;
    expect((await invoke(token, { provider: 'hosted', turnId: randomUUID(), input: question })).status).toBe(200);
    const [reserved, model, settled] = sent.filter(call => !call.url.endsWith('/jwks.json'));
    expect(JSON.parse(reserved.body)).toMatchObject({ p_funding: 'owner', p_monthly_budget_micros: 0 });
    expect(model.headers.get('Authorization')).toBe(`Bearer ${ownerKey}`);
    expect(JSON.parse(settled.body)).toMatchObject({ p_cost_micros: null });
    vi.stubEnv('COACH_OWNER_OPENROUTER_API_KEY', publicKey);
    expect(await (await invoke(token)).json()).toEqual({ hosted: 'off', nativeKeys: true });
  });

  it.each([
    { provider: 'gemini', key: 'AIza_Gemini_fixture_credential_0123', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent', header: 'x-goog-api-key' },
    { provider: 'claude', key: 'sk-ant-api03-claude-fixture-credential', endpoint: 'https://api.anthropic.com/v1/messages', header: 'x-api-key' },
  ])('routes the $provider key only to that provider, including when hosted access is off', async ({ provider, key, endpoint, header }) => {
    vi.stubEnv('COACH_HOSTED_ENABLED', 'false');
    const token = await session();
    const input = { provider, key, turnId: randomUUID(), input: question };
    const result = await invoke(token, input);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ data: choice });
    const [reserved, model] = sent.filter(call => !call.url.endsWith('/jwks.json'));
    expect(JSON.parse(reserved.body)).toMatchObject({ p_funding: provider, p_step_micros: 0 });
    expect(sent.every(call => !call.body.includes(key))).toBe(true);
    expect(model.url).toBe(endpoint);
    expect(model.headers.get(header)).toBe(key);

    sent.length = 0;
    expect((await invoke(token, { ...input, input: { ...question, question: key } })).status).toBe(400);
    expect((await invoke(token, { ...input, apiKey: publicKey })).status).toBe(400);
    expect(sent).toHaveLength(0);
  });
});
