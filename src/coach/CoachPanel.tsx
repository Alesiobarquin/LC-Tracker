import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { TextArea } from '../components/ui/Field';
import { useStore } from '../store/useStore';
import { useCoachTools } from './commands';
import { localCoachIntent } from './localIntent';
import { CoachIcon } from './CoachLauncher';
import {
  chooseCoachIntent, CoachRequestError, MAX_QUESTION_LENGTH, summarizeCoachEvidence,
} from './provider';

import { COACH_FIXTURE_MODE, useCoachConnection } from './connection';

const KEY_IN_CHAT = /sk-or-v1-[A-Za-z0-9_-]{10,}/i;
const actionSchema = z.object({ label: z.string().min(1).max(140), name: z.string(), args: z.record(z.string(), z.unknown()).optional() });
const resultSchema = z.object({
  message: z.string(),
  data: z.unknown().optional(),
  modelData: z.unknown().optional(),
  actions: z.array(actionSchema).max(10).optional(),
});
type Action = z.infer<typeof actionSchema>;
type ToolResult = z.infer<typeof resultSchema>;
type Message = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  practice: string | undefined;
  data?: unknown;
  context?: string;
  actions?: Action[];
  scope: string;
  receipt?: boolean;
  preview?: boolean;
};

function practiceScope(state: ReturnType<typeof useStore.getState>) {
  if (state.activeRecall) return `recall:${state.activeRecall.id}:${state.activeRecall.revealed}:${state.activeRecall.compared}`;
  if (state.activeSession) return `coding:${state.activeSession.id}:${state.activeSession.practiceKind}`;
}

function displayLabel(value: string) {
  const words = value.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function CoachFacts({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (depth === 4 || value == null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="break-words">{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value).slice(0, 1200)}</span>;
  }
  if (Array.isArray(value)) {
    return <ol className="space-y-2">{value.slice(0, 10).map((item, index) => (
      <li className="border-b border-line pb-2 last:border-0" key={index}><CoachFacts value={item} depth={depth + 1} /></li>
    ))}</ol>;
  }
  if (typeof value !== 'object') return null;
  return <dl className="space-y-1">
    {Object.entries(value).filter(([, item]) => item != null).slice(0, 15).map(([key, item]) => (
      <div className="py-0.5" key={key}>
        <dt className="text-xs text-muted">{displayLabel(key)}</dt>
        <dd><CoachFacts value={item} depth={depth + 1} /></dd>
      </div>
    ))}
  </dl>;
}

export function CoachPanel({ visible, owner, children }: { visible: boolean; owner: string; children: ReactNode }) {
  const tools = useCoachTools();
  const location = useLocation();
  const { apiKey } = useCoachConnection();
  const activePractice = useStore(practiceScope);
  const practice = activePractice ?? (/^\/(recall|timer)\/[^/]+/.test(location.pathname) ? 'practice-route' : undefined);
  const scope = `${location.key}:${practice ?? 'workspace'}`;
  const latest = useRef({ owner, scope, visible, tools, apiKey });
  latest.current = { owner, scope, visible, tools, apiKey };
  const questionId = useId();
  const composer = useRef<HTMLTextAreaElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const request = useRef<AbortController | null>(null);
  const runningCommand = useRef(false);
  const messageId = useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(() => ({ text: '', practice }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'model' | 'command' | null>(null);

  useEffect(() => {
    setError('');
    return () => request.current?.abort();
  }, [owner, scope, visible]);

  const hadKey = useRef(Boolean(apiKey));
  useEffect(() => {
    if (!apiKey && hadKey.current) clearChat();
    hadKey.current = Boolean(apiKey);
  }, [apiKey]);

  const question = draft.practice === practice ? draft.text : '';
  const displayMessages = messages.filter((message) => message.practice === practice || message.receipt);
  const visibleTools = Object.entries(tools).filter(([, tool]) => !practice || tool.duringPractice);
  const liveResults = visibleTools.flatMap(([name, tool]) => {
    const result = resultSchema.safeParse(tool.live);
    return result.success ? [{ name, result: result.data }] : [];
  });
  const lastMessageId = displayMessages.at(-1)?.id;
  useLayoutEffect(() => {
    if (visible && followLatest.current && history.current) {
      history.current.scrollTop = history.current.scrollHeight;
    }
  }, [visible, lastMessageId, busy]);
  useEffect(() => {
    if (visible) composer.current?.focus({ preventScroll: true });
  }, [visible]);

  function setQuestion(text: string) {
    setDraft({ text, practice });
  }

  function addMessage(
    role: Message['role'], text: string, result?: ToolResult,
    options: { receipt?: boolean; scope?: string; preview?: boolean } = {},
  ) {
    const id = ++messageId.current;
    setMessages((previous) => [...previous, {
      id, role, text, practice, scope, data: result?.data, actions: result?.actions,
      context: result?.modelData === undefined ? undefined : JSON.stringify(result.modelData).slice(0, 1200),
      ...options,
    }]);
  }

  const currentOwner = () => latest.current.owner === owner && useStore.getState().sessionUserId === owner;
  const currentScope = () => latest.current.scope === scope && practiceScope(useStore.getState()) === activePractice;

  async function runTool(action: Pick<Action, 'name' | 'args'>) {
    const tool = Object.hasOwn(latest.current.tools, action.name) ? latest.current.tools[action.name] : undefined;
    if (!tool || !currentOwner() || !currentScope() || (practice && !tool.duringPractice) || tool.available?.(action.args ?? {}) === false) {
      throw new CoachRequestError('That action is unavailable here. Ask again from the current screen.');
    }
    const result = resultSchema.safeParse(await tool.run(action.args ?? {}));
    if (!result.success) throw new CoachRequestError('The action returned an unsupported result.');
    return result.data;
  }

  async function runAction(action: Action, consumed?: number) {
    if (request.current || runningCommand.current) return;
    const tool = latest.current.tools[action.name];
    runningCommand.current = true;
    setBusy('command');
    setError('');
    if (consumed !== undefined) {
      setMessages((previous) => previous.map((message) => message.id === consumed ? { ...message, actions: undefined } : message));
    }
    try {
      const result = await runTool(action);
      if (currentOwner()) {
        if (currentScope()) addMessage('assistant', result.message, result);
        else if (tool?.kind !== 'read') {
          const stillPracticing = practiceScope(useStore.getState());
          const message = stillPracticing && !tool?.duringPractice && action.name !== 'start_practice'
            ? 'The requested command returned. Check the current workspace.'
            : result.message;
          const details = !practice && !stillPracticing ? result : undefined;
          addMessage('assistant', message, details, { receipt: !details, scope: latest.current.scope });
        }
      }
    } catch (failure) {
      if (currentOwner()) setError(failure instanceof CoachRequestError ? failure.message : 'The app could not confirm that action. Check the current screen before retrying.');
    } finally {
      runningCommand.current = false;
      setBusy(null);
    }
  }

  async function send() {
    const text = question.trim();
    if (!text || request.current || runningCommand.current || !currentOwner()) return;
    if (KEY_IN_CHAT.test(text)) {
      setError('Remove the API key from your message before sending.');
      return;
    }
    const local = localCoachIntent(text, useStore.getState());
    const localAction = local && visibleTools.some(([name]) => name === local.name) ? local : null;
    if (!localAction && !practice && !apiKey && !COACH_FIXTURE_MODE) {
      setError(location.pathname === '/onboarding'
        ? 'Open the optional Study chat setup on the final onboarding step.'
        : 'Connect an OpenRouter key in Settings → Study chat to ask custom questions.');
      return;
    }
    setError('');
    followLatest.current = true;
    setQuestion('');
    addMessage('user', text);
    if (localAction) {
      await runAction({ ...localAction, label: displayLabel(localAction.name) });
      return;
    }
    if (practice) {
      addMessage('assistant', 'During practice, try “Show my timer”, “Pause”, “I spent 12 minutes”, “Save my result”, or “Resume my session”.');
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy('model');
    const canApply = () => !controller.signal.aborted && latest.current.visible && latest.current.apiKey === apiKey && currentOwner() && currentScope();
    try {
      const descriptions = visibleTools.map(([name, tool]) => ({
        name, description: tool.description, kind: tool.kind ?? 'action' as const,
      }));
      const previous = displayMessages.flatMap((message) =>
        message.role === 'user' ? [message.text] : message.context ? [message.context] : []);
      const intent = await chooseCoachIntent(text, previous, descriptions, apiKey, controller.signal);
      if (!canApply()) return;
      const results: unknown[] = [];
      for (const call of intent.calls) {
        if (!canApply()) return;
        if (descriptions.find((tool) => tool.name === call.name)?.kind !== 'read') {
          const label = displayLabel(call.name);
          addMessage('assistant', 'Review this request before applying it.', {
            message: label,
            data: Object.keys(call.args).length ? { operation: label, ...call.args } : { operation: label },
            actions: [{ ...call, label: `Apply ${label.toLowerCase()}` }],
          }, { preview: true });
          return;
        }
        const result = await runTool(call);
        if (!canApply()) return;
        addMessage('assistant', result.message, result);
        if (result.modelData !== undefined) results.push(result.modelData);
      }
      if (results.length) {
        const suggestion = await summarizeCoachEvidence(text, results, apiKey, controller.signal);
        if (canApply() && suggestion) addMessage('assistant', suggestion);
      } else if (!intent.calls.length && intent.clarification) {
        addMessage('assistant', intent.clarification);
      }
    } catch (failure) {
      if (canApply()) {
        setDraft((current) => current.text ? current : { text, practice });
        setError(failure instanceof CoachRequestError ? failure.message : 'Study chat could not finish that request. Try again.');
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(null);
      }
    }
  }

  function clearChat() {
    request.current?.abort();
    request.current = null;
    setBusy(null);
    setMessages([]);
    followLatest.current = true;
    setError('');
    setQuestion('');
  }

  function renderActions(actions: Action[] | undefined, consumed?: number) {
    const available = actions?.filter((action) => visibleTools.some(([name, tool]) =>
      name === action.name && tool.available?.(action.args ?? {}) !== false));
    return available?.length ? (
      <div className="flex flex-wrap gap-2">
        {available.map((action, index) => (
          <Button key={index} size="sm" disabled={!!busy} onClick={() => void runAction(action, consumed)}>{action.label}</Button>
        ))}
      </div>
    ) : null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col text-sm text-body">
      <div
        ref={history}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3"
        onScroll={event => {
          const { scrollHeight, clientHeight, scrollTop } = event.currentTarget;
          followLatest.current = scrollHeight - clientHeight - scrollTop < 48;
        }}
      >
        {children}
        {liveResults.length > 0 && (
          <section aria-label="Live workspace" className="space-y-2 border-b border-line pb-3">
            {liveResults.map(({ name, result }) => (
              <div key={name} className="space-y-2">
                <p className="text-foreground">{result.message}</p>
                {renderActions(result.actions)}
              </div>
            ))}
          </section>
        )}

        <div aria-label="Study chat messages" role="log" aria-live="polite" className="flex min-w-0 flex-col gap-4">
          {displayMessages.map((message, index) => (
            message.role === 'user' ? (
              <article key={message.id} aria-label="You" className="ml-auto w-fit max-w-[88%] space-y-1 rounded-lg rounded-tr-sm border border-line bg-muted-surface px-3 py-2">
                <p aria-hidden="true" className="text-xs font-semibold text-muted">You</p>
                <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground">{message.text}</p>
              </article>
            ) : (
              <article key={message.id} aria-label="Study chat" className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-2">
                {displayMessages[index - 1]?.role !== 'assistant' ? (
                  <CoachIcon size={18} className="mt-0.5 text-accent" aria-hidden="true" />
                ) : <span aria-hidden="true" />}
                <div className="min-w-0 space-y-2">
                  {displayMessages[index - 1]?.role !== 'assistant' && <p aria-hidden="true" className="text-xs font-semibold text-foreground">Study chat</p>}
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-foreground">{message.text}</p>
                  {message.data != null && (message.preview ? (
                    <div className="rounded-md border border-line bg-muted-surface p-2 text-xs"><CoachFacts value={message.data} /></div>
                  ) : (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted">Details</summary>
                      <div className="mt-2 rounded-md border border-line bg-muted-surface p-2"><CoachFacts value={message.data} /></div>
                    </details>
                  ))}
                  {message.scope === scope && renderActions(message.actions, message.id)}
                </div>
              </article>
            )
          ))}
        </div>

        {!displayMessages.length && !practice && (
          <div className="flex flex-wrap gap-2" aria-label="Suggested questions">
            {['What should I practice next?', 'Show my recent progress', 'Show other options'].map((prompt) => (
              <Button key={prompt} size="sm" onClick={() => {
                setQuestion(prompt);
                composer.current?.focus();
              }}>{prompt}</Button>
            ))}
          </div>
        )}
        {practice && !displayMessages.length && (
          <p className="text-xs text-muted">Practice controls are available in chat. Try “Show my timer” or “Pause”.</p>
        )}
      </div>
      <form className="shrink-0 space-y-2 border-t border-line bg-surface px-4 py-3" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        <label htmlFor={questionId} className="sr-only">Message</label>
        <div className="flex items-end gap-2">
          <TextArea
            ref={composer}
            id={questionId}
            rows={2}
            className="min-w-0 bg-canvas"
            maxLength={MAX_QUESTION_LENGTH}
            value={question}
            placeholder={practice ? 'Show my timer' : 'Ask about your study plan'}
            onChange={(event) => setQuestion(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey ||
                event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
              event.preventDefault();
              if (!event.repeat) event.currentTarget.form?.requestSubmit();
            }}
          />
          <Button size="icon" className="shrink-0 rounded-md" variant="primary" type="submit" aria-label="Send" title="Send message" disabled={!!busy || !question.trim()}>
            <ArrowUp size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="flex min-h-6 flex-wrap items-center gap-x-2 text-xs">
          {busy === 'model' && <Button size="sm" onClick={() => { request.current?.abort(); }}>Stop</Button>}
          <button type="button" className="quiet-action py-1 text-xs" disabled={busy === 'command'} onClick={clearChat}>New chat</button>
          {busy && <span role="status" className="text-xs text-muted">{busy === 'command' ? 'Applying…' : 'Waiting for a reply…'}</span>}
          <span className="ml-auto hidden text-[11px] text-subtle sm:inline">Shift+Enter for a new line</span>
        </div>
      </form>
    </div>
  );
}
