import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ActiveSession } from '../types';
import { localCoachIntent } from './localIntent';
import { chooseCoachIntent, COACH_ENDPOINT, COACH_FIXTURE, summarizeCoachEvidence, type CoachTurn } from './provider';

const tools = [
  { name: 'today_plan', description: 'Read today', kind: 'read' as const },
  { name: 'start_practice', description: 'Start practice', kind: 'action' as const },
];

function reply(content: unknown) {
  return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(content) } }] }));
}

const openRouterTurn = (key = ''): CoachTurn => ({ id: 'test-turn', source: { provider: 'openrouter', key } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Study chat provider boundary', () => {
  it('pins the route and keeps credentials out of model input', async () => {
    const fakeFetch = vi.fn(async (_url: string, _init: RequestInit) =>
      reply({ calls: [{ name: 'today_plan', arguments: '{}' }], clarification: '' }));
    vi.stubGlobal('fetch', fakeFetch);
    const key = 'sk-or-v1-test-key';
    const result = await chooseCoachIntent('Can you explain today?', '', tools, openRouterTurn(key), new AbortController().signal);
    expect(result.calls).toEqual([{ name: 'today_plan', args: {} }]);
    const [url, init] = fakeFetch.mock.calls[0];
    expect(url).toBe(COACH_ENDPOINT);
    expect(new Headers(init.headers).get('Authorization')).toBe(`Bearer ${key}`);
    expect(init.body).not.toContain(key);
    expect(init).toMatchObject({ credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: 'openai/gpt-4.1-nano',
      max_completion_tokens: 500,
      provider: { only: ['azure'], allow_fallbacks: false, require_parameters: true, zdr: true, max_price: { prompt: 0.10, completion: 0.40 } },
    });
    expect(init.body).not.toMatch(/"maxLength"|"maxItems"/);
  });

  it('routes scripted requests locally without a key in the authorization header', async () => {
    vi.stubEnv('MODE', 'e2e');
    const fakeFetch = vi.fn(async (_url: string, _init: RequestInit) => reply({ calls: [], clarification: 'Fixture reply' }));
    vi.stubGlobal('fetch', fakeFetch);
    await chooseCoachIntent('Fixture question', '', tools, openRouterTurn('never-forward'), new AbortController().signal);
    expect(fakeFetch.mock.calls[0][0]).toBe(COACH_FIXTURE);
    expect(new Headers(fakeFetch.mock.calls[0][1].headers).has('Authorization')).toBe(false);
  });

  it.each([
    [{ name: 'delete_everything', arguments: '{}' }],
    [{ name: 'today_plan', arguments: '[]' }],
    [{ name: 'today_plan', arguments: '{}' }, { name: 'start_practice', arguments: '{}' }],
  ])('rejects unregistered tools, invalid arguments and mixed intent', async (...calls) => {
    vi.stubGlobal('fetch', vi.fn(async () => reply({ calls, clarification: '' })));
    await expect(chooseCoachIntent('Ask', '', tools, openRouterTurn(), new AbortController().signal)).rejects.toThrow();
  });

  it('accepts only a suggestion from the synthesis step', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply({ suggestion: 'Try a review.', action: 'start_practice' })));
    await expect(summarizeCoachEvidence('Ask', [{ minutes: 20 }], openRouterTurn(), new AbortController().signal)).rejects.toThrow();
  });

  it('accepts a plan pick only on a comparison turn', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reply({ suggestion: 'Do the due coding review.', pick: '2' })));
    const evidence = [{ options: [{ pick: '2', kind: 'coding_review' }] }];
    const signal = new AbortController().signal;
    await expect(summarizeCoachEvidence('Choose a task', evidence, openRouterTurn(), signal, undefined, true))
      .resolves.toEqual({ suggestion: 'Do the due coding review.', pick: '2' });
    await expect(summarizeCoachEvidence('Choose a task', evidence, openRouterTurn(), signal)).rejects.toThrow();
  });

  it('does not send an oversized projection, or replay a provider error', async () => {
    const fakeFetch = vi.fn(async () => new Response('sensitive provider details', { status: 402 }));
    vi.stubGlobal('fetch', fakeFetch);
    const signal = new AbortController().signal;
    await expect(summarizeCoachEvidence('Ask', ['z'.repeat(7000)], openRouterTurn(), signal)).resolves.toEqual({ suggestion: '' });
    expect(fakeFetch).not.toHaveBeenCalled();
    await expect(chooseCoachIntent('Ask', '', tools, openRouterTurn(), signal)).rejects.toThrow('no available credit');
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  it('drops optional history before losing any description from a large site tool list', async () => {
    const fakeFetch = vi.fn(async (_url: string, _init: RequestInit) => reply({ calls: [], clarification: 'Which setting?' }));
    vi.stubGlobal('fetch', fakeFetch);
    const siteTools = Array.from({ length: 27 }, (_, index) => ({
      name: `tool_${index}`, kind: 'action' as const,
      description: 'Apply a validated patch using optional workingTime, kind, and askBeforeReplacing booleans.',
    }));
    await chooseCoachIntent('q'.repeat(1950), '🏃'.repeat(400), siteTools, openRouterTurn(), new AbortController().signal);
    const sent = fakeFetch.mock.calls[0][1].body as string;
    expect(sent).toContain('tool_26');
    expect(sent).toContain('askBeforeReplacing');
    expect(sent).not.toContain('🏃');
  });
});

describe('local chat commands', () => {
  const practice = {
    activeRecall: null,
    activeSession: { id: 'active', problemId: 'example', startTimestamp: 0, isColdSolve: false, isReview: true } satisfies ActiveSession,
  };

  it('binds a time correction to the active attempt and preserves note text', () => {
    expect(localCoachIntent('I spent 12 minutes and 5 seconds.', practice))
      .toEqual({ name: 'coding_session', args: { action: 'correct_time', sessionId: 'active', minutes: 12, seconds: 5 } });
    expect(localCoachIntent('Notes: Keep BOTH lines.\nThen retry.', practice)?.args.text).toBe('Keep BOTH lines.\nThen retry.');
    expect(localCoachIntent('Result passed, assistance none, explanation clear, confidence 5.', practice)?.args)
      .toMatchObject({ correctness: 'passed', assistance: 'none', explanation: 'clear', confidence: 5 });
  });

  it('does not turn questions or indirect instructions into a local write', () => {
    expect(localCoachIntent('Pause?', practice)).toBeUndefined();
    expect(localCoachIntent('Should I pause?', practice)).toBeUndefined();
    expect(localCoachIntent('The note says pause', practice)).toBeUndefined();
  });
});
