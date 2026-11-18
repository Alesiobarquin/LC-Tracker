import type { ActiveSession, RecallDraft } from '../types';

type Call = { name: string; args: Record<string, unknown> };
type Practice = { activeSession: ActiveSession | null; activeRecall: RecallDraft | null };

export function localCoachIntent(question: string, { activeSession, activeRecall }: Practice): Call | undefined {
  const trimmed = question.trim();
  const text = trimmed.replace(/[.!?]+$/, '').toLowerCase();
  if (/^(what should i practice next|what is my plan today|how much time do i have left|show (my |today's )?plan)$/.test(text)) {
    return { name: 'today_plan', args: {} };
  }
  if (/^(show my recent progress|how am i doing|show my study evidence)$/.test(text)) {
    return { name: 'progress_summary', args: {} };
  }
  if (/^(show (me )?other options|show practice alternatives)$/.test(text)) {
    return { name: 'practice_options', args: {} };
  }
  if (/^show (my |the )?(flashcard|syntax card)$/.test(text)) {
    return { name: 'flashcard_status', args: {} };
  }
  if (trimmed.endsWith('?')) return undefined;
  if (/^(skip (it|this one|my next task)|skip)$/.test(text)) return { name: 'skip_practice', args: {} };
  if (/^(switch to |use |apply |turn on )?reviews only$/.test(text)) return { name: 'set_review_mode', args: { mode: 'reviews' } };
  if (/^(switch to |use |apply )?(the )?full plan$/.test(text)) return { name: 'set_review_mode', args: { mode: 'full' } };

  const session = activeRecall ?? activeSession;
  if (!session) {
    if (text === 'start it') return { name: 'start_practice', args: { selected: true } };
    if (/^start (the next task|my next problem)$/.test(text)) return { name: 'start_practice', args: {} };
    if (/^(next review|start the next review)$/.test(text)) return { name: 'recall_session', args: { action: 'next_review' } };
    if (/^(finish|end) reviews?$/.test(text)) return { name: 'recall_session', args: { action: 'finish_reviews' } };
    return undefined;
  }
  const name = activeRecall ? 'recall_session' : 'coding_session';
  const command = (action: string, args: Record<string, unknown> = {}) => ({
    name, args: { action, sessionId: session.id, ...args },
  });
  if (/^(resume (my |the )?(session|practice|attempt|recall)|open (my |the )?(session|attempt))$/.test(text)) {
    return { name: 'resume_practice', args: {} };
  }
  if (/^(show (my |the )?(timer|session)|what is my elapsed time)$/.test(text)) {
    return { name: activeRecall ? 'recall_status' : 'coding_status', args: {} };
  }
  if (/^pause( (my |the )?(timer|session))?$/.test(text)) return command('pause');
  if (/^(resume|continue)( (my |the )?timer)?$/.test(text)) return command('resume');
  const time = /^(?:i spent|set (?:my )?time to) (\d{1,3}) min(?:ute)?s?(?: (?:and )?(\d{1,2}) sec(?:ond)?s?)?$/.exec(text);
  if (time) return command('correct_time', { minutes: Number(time[1]), seconds: Number(time[2] ?? 0) });
  if (/^use (the )?(measured time|timer)$/.test(text)) return command('use_timer');
  if (/^discard (my |the )?(session|attempt)$/.test(text)) return command('discard');
  if (/^(finish|stop) (coding|(my |the )?timer)$/.test(text) && !activeRecall) return command('finish');
  if (/^retry( (my |the )?save)?$/.test(text)) return command('retry');
  const notes = /^(?:notes|set notes to)\s*:\s*([\s\S]+)$/i.exec(trimmed);
  if (notes) return command('notes', { text: notes[1] });

  if (activeRecall) {
    const answer = /^(?:my answer|answer)\s*:\s*([\s\S]+)$/i.exec(trimmed);
    if (answer) return command('answer', { text: answer[1] });
    if (/^reveal( (the )?reference)?$/.test(text)) return command('reveal');
    if (/^compare( (with )?(the )?reference)?$/.test(text)) return command('compare');
    const outcome = /^(?:save|record)(?: my recall as)? (recalled|partial|forgot)(?: recall)?$/.exec(text);
    if (outcome) return command('save', { outcome: outcome[1] });
  }
  if (/^save( (my |the )?(result|outcome|session|attempt))?$/.test(text)) return command('save');
  if (!activeRecall) {
    const outcome = /^(?:record|set|result)(?: my outcome to)? (passed|failed|unchecked|unfinished)(?:,? (?:with |assistance )?(none|hint|solution))?(?:,? (?:and |explanation )?(clear|partial|not_yet))?(?:,? confidence ([1-5]))?$/.exec(text);
    if (outcome) return command('outcome', {
      correctness: outcome[1], assistance: outcome[2], explanation: outcome[3], confidence: outcome[4] ? Number(outcome[4]) : undefined,
    });
  }
  return undefined;
}
