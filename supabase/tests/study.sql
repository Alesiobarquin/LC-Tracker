CREATE OR REPLACE FUNCTION pg_temp.study_assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Study assertion failed: %', message; END IF; END $$;
CREATE OR REPLACE FUNCTION pg_temp.study_progress() RETURNS jsonb LANGUAGE SQL AS $$
SELECT jsonb_build_object('problem_id','two-sum','first_solved_at','2020-01-01T00:00:00Z',
 'last_reviewed_at','2020-01-01T00:00:00Z','next_review_at','2026-10-06T00:00:00Z',
 'review_count',0,'consecutive_threes',1,'consecutive_successes',1,'retired',false,'notes','Original notes',
 'history','[{"date":"2020-01-01T00:00:00Z","rating":4}]'::jsonb) $$;
CREATE OR REPLACE FUNCTION pg_temp.study_state() RETURNS jsonb LANGUAGE SQL AS $$
SELECT '{"version":1,"source":"legacy","recallIntervalDays":5,"codingIntervalDays":14,
 "nextRecallAt":"2026-10-11T00:00:00Z","nextCodingAt":"2026-10-08T00:00:00Z","lapses":0,
 "recallHistory":[{"id":"00000000-0000-4000-8000-000000000301","date":"2026-10-06T12:00:00Z",
 "elapsedSeconds":180,"outcome":"recalled","answer":"Approach and invariant","checkedAgainst":"notes"}]}'::jsonb $$;
CREATE OR REPLACE FUNCTION pg_temp.study_timing(sid uuid, r integer DEFAULT 4) RETURNS jsonb LANGUAGE SQL AS $$
SELECT jsonb_build_object('id',sid,'problem_id','two-sum','category','Arrays & Hashing',
 'recorded_at','2026-10-06T12:00:00Z','elapsed_seconds',180,'session_type','recall','rating',r) $$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"user_study","role":"authenticated"}', false);
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000300','import','{}',
 jsonb_build_object('progress',jsonb_build_array(pg_temp.study_progress())));
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000301','recall','{"progress":{"two-sum":1}}',
 jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.study_progress() || jsonb_build_object('study_state',pg_temp.study_state())),
 'timings',jsonb_build_array(pg_temp.study_timing('00000000-0000-4000-8000-000000000301')),'logDate','2026-10-06','isNew',false));
SELECT pg_temp.study_assert((SELECT history = '[{"date":"2020-01-01T00:00:00Z","rating":4}]' AND review_count=0 AND last_reviewed_at='2020-01-01T00:00:00Z'::timestamptz FROM public.problem_progress WHERE problem_id='two-sum'), 'recall never fabricates coding history');
SELECT pg_temp.study_assert((SELECT study_state = pg_temp.study_state() AND version=2 FROM public.problem_progress WHERE problem_id='two-sum'), 'recall state and revision committed');
SELECT pg_temp.study_assert((SELECT solved=0 AND reviewed=1 FROM public.activity_log), 'recall is practice, not a new solve');
SELECT pg_temp.study_assert((SELECT session_type='recall' FROM public.session_timings), 'modality retained');
SELECT pg_temp.study_assert((public.commit_user_change('00000000-0000-4000-8000-000000000301','recall','{"progress":{"two-sum":1}}','{"problemId":"two-sum"}')->>'duplicate')::boolean, 'lost-response replay returns receipt');
SELECT pg_temp.study_assert((SELECT reviewed=1 FROM public.activity_log), 'retry counted once');

-- A still-open older client cannot erase recall state by omitting the new column.
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000302','session','{"progress":{"two-sum":2}}',
 jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.study_progress()),'logDate','2026-10-06','isNew',false));
SELECT pg_temp.study_assert((SELECT study_state = pg_temp.study_state() AND version=3 FROM public.problem_progress WHERE problem_id='two-sum'), 'legacy client retains recall evidence');
DO $$ BEGIN
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000303','recall','{"progress":{"two-sum":2}}','{"problemId":"two-sum"}');
  RAISE EXCEPTION 'Expected revision conflict';
 EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000304','recall','{"progress":{"two-sum":3}}',
   jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.study_progress() || '{"study_state":[]}'::jsonb),'logDate','2026-10-06','isNew',false));
  RAISE EXCEPTION 'Expected invalid study state rejection';
 EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000305','recall','{"progress":{"two-sum":3}}',
   jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.study_progress() || '{"study_state":null}'::jsonb),
   'timings',jsonb_build_array(pg_temp.study_timing('00000000-0000-4000-8000-000000000305',9)),'logDate','2026-10-06','isNew',false));
  RAISE EXCEPTION 'Expected invalid timing rejection';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT pg_temp.study_assert((SELECT study_state=pg_temp.study_state() AND version=3 FROM public.problem_progress WHERE problem_id='two-sum'), 'downstream failure rolls back state');
SELECT pg_temp.study_assert((SELECT reviewed=2 FROM public.activity_log), 'failed recall never increments activity');
SELECT pg_temp.study_assert((SELECT count(*)=3 FROM public.user_write_receipts), 'failed recall has no receipt');
SELECT pg_temp.study_assert((public.export_user_data()->'progress'->0->'study_state')=pg_temp.study_state(), 'consistent backup includes recall answers');
SELECT set_config('request.jwt.claims', '{"sub":"user_study_other","role":"authenticated"}', false);
SELECT pg_temp.study_assert((SELECT count(*)=0 FROM public.problem_progress), 'recall answers isolated by account');
RESET ROLE;
SELECT 'Recall persistence, exact-once retry, rollback, legacy clients, backup, and RLS checks passed' AS result;
