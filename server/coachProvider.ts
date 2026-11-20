import { z } from 'zod';
import {
  COACH_ENDPOINT, coachAnswerResponse, coachOutputSchema, containsCoachKey, MAX_OUTPUT_TOKENS,
  openRouterRequest, openRouterResponse, parseCoachIntent,
  type CoachInput, type CoachMessages, type PersonalProvider,
} from '../src/coach/protocol.js';

// The 6 KB text limit leaves ample room for the fixed schema and message framing.
// Reserve for 18,000 input tokens at $0.10/M and 500 output tokens at $0.40/M.
export const MAX_OPENROUTER_STEP_MICROS = 2000;

const geminiResponse = z.object({
  candidates: z.array(z.object({
    finishReason: z.literal('STOP'),
    content: z.object({ parts: z.array(z.object({ text: z.string().max(6000) })).length(1) }),
  })).length(1),
});
const claudeResponse = z.object({
  stop_reason: z.literal('end_turn'),
  content: z.array(z.object({ type: z.literal('text'), text: z.string().max(6000) })).length(1),
});
const openRouterUsage = z.object({ usage: z.object({ cost: z.number().min(0).max(1000) }) });

export class CoachProviderError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export async function runCoachProvider(provider: PersonalProvider, key: string, input: CoachInput, messages: CoachMessages) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const schema = coachOutputSchema(input);
  const [system, ...content] = messages;
  let url: string;
  let body: unknown;
  switch (provider) {
    case 'openrouter':
      url = COACH_ENDPOINT;
      body = openRouterRequest(input, messages);
      headers.Authorization = `Bearer ${key}`;
      break;
    case 'gemini':
      url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
      headers['x-goog-api-key'] = key;
      body = {
        systemInstruction: { parts: [{ text: system.content }] },
        contents: [{ role: 'user', parts: content.map(message => ({ text: message.content })) }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          thinkingConfig: { thinkingLevel: 'MINIMAL' },
        },
      };
      break;
    case 'claude':
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = key;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: 'claude-haiku-4-5-20251001', max_tokens: MAX_OUTPUT_TOKENS,
        system: system.content, messages: content,
        output_config: { format: { type: 'json_schema', schema } },
      };
      break;
  }

  const signal = AbortSignal.timeout(16_000);
  try {
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal, redirect: 'error' });
    if (!response.ok) {
      const code = { 401: 'provider_auth', 403: 'provider_auth', 402: 'provider_credit', 429: 'provider_rate' }[response.status];
      throw new CoachProviderError(code ?? 'provider_unavailable');
    }
    const result: unknown = await response.json();
    const text = provider === 'openrouter' ? openRouterResponse.parse(result).choices[0].message.content
      : provider === 'gemini' ? geminiResponse.parse(result).candidates[0].content.parts[0].text
      : claudeResponse.parse(result).content[0].text;
    if (containsCoachKey(text, key)) throw new CoachProviderError('invalid_reply');
    const data: unknown = JSON.parse(text);
    const canSummarize = input.step === 'intent' && parseCoachIntent(data, input.tools).canSummarize;
    if (input.step === 'answer') coachAnswerResponse(input).parse(data);
    const usage = provider === 'openrouter' ? openRouterUsage.safeParse(result) : undefined;
    return { data, canSummarize, costMicros: usage?.success ? Math.ceil(usage.data.usage.cost * 1_000_000) : null };
  } catch (error) {
    if (error instanceof CoachProviderError) throw error;
    if (signal.aborted) throw new CoachProviderError('timeout');
    if (error instanceof z.ZodError || error instanceof SyntaxError || error instanceof Error && error.message === 'Invalid tool combination') {
      throw new CoachProviderError('invalid_reply');
    }
    throw new CoachProviderError('provider_unavailable');
  }
}
