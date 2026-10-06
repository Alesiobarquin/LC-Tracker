CREATE FUNCTION pg_temp.assert_true(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Assertion failed: %', message; END IF; END $$;
CREATE FUNCTION pg_temp.progress_row(pid text, reviews integer DEFAULT 0) RETURNS jsonb LANGUAGE SQL AS $$
SELECT jsonb_build_object('problem_id', pid, 'first_solved_at', '2026-10-01T00:00:00Z',
 'last_reviewed_at', '2026-10-06T00:00:00Z', 'next_review_at', '2026-10-09T00:00:00Z',
 'review_count', reviews, 'consecutive_threes', 0, 'consecutive_successes', 1,
 'retired', false, 'notes', NULL, 'history', jsonb_build_array(jsonb_build_object('date', '2026-10-06T00:00:00Z', 'rating', 3))) $$;
CREATE FUNCTION pg_temp.timing_row(sid uuid, rating integer DEFAULT 3) RETURNS jsonb LANGUAGE SQL AS $$
SELECT jsonb_build_object('id', sid, 'problem_id', 'two-sum', 'category', 'Arrays & Hashing',
 'recorded_at', '2020-01-01T00:00:00Z', 'elapsed_seconds', 120, 'session_type', 'new', 'rating', rating) $$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"user_test","role":"authenticated"}', false);
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000001', 'session',
 '{"settings":0,"sprint":0,"progress":{"two-sum":0}}',
 jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.progress_row('two-sum')),
 'timings',jsonb_build_array(pg_temp.timing_row('00000000-0000-4000-8000-000000000001')), 'logDate','2026-10-06','isNew',true));
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.problem_progress), 'single progress write');
SELECT pg_temp.assert_true((SELECT solved=1 AND reviewed=0 FROM public.activity_log), 'single activity increment');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.session_timings), 'timing committed');

-- A retry after a lost success response returns the receipt before stale-version checks.
SELECT pg_temp.assert_true((public.commit_user_change('00000000-0000-4000-8000-000000000001', 'session',
 '{"settings":0,"sprint":0,"progress":{"two-sum":0}}', '{"problemId":"two-sum"}') ->> 'duplicate')::boolean,
 'replay returns receipt');
SELECT pg_temp.assert_true((SELECT solved=1 FROM public.activity_log), 'replay never increments');
SELECT pg_temp.assert_true((SELECT version=1 FROM public.problem_progress), 'replay never updates revision');

-- A downstream constraint failure must roll back progress, timing, activity, and receipt.
DO $$ BEGIN
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000002','session', '{"progress":{"two-sum":1}}',
   jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.progress_row('two-sum',1)),
    'timings',jsonb_build_array(pg_temp.timing_row('00000000-0000-4000-8000-000000000002',9)), 'logDate','2026-10-06','isNew',false));
  RAISE EXCEPTION 'Expected timing constraint failure';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT pg_temp.assert_true((SELECT review_count=0 AND version=1 FROM public.problem_progress), 'progress rolled back');
SELECT pg_temp.assert_true((SELECT count(*)=1 FROM public.user_write_receipts), 'failed transaction has no receipt');

DO $$ BEGIN
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000003','session', '{"progress":{"two-sum":0}}', '{"problemId":"two-sum"}');
  RAISE EXCEPTION 'Expected stale revision failure';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
END $$;
SELECT pg_temp.assert_true((SELECT solved=1 AND reviewed=0 FROM public.activity_log), 'conflict has no side effects');

SELECT public.commit_user_change('00000000-0000-4000-8000-000000000004','session', '{"progress":{"two-sum":1}}',
 jsonb_build_object('problemId','two-sum','progress',jsonb_build_array(pg_temp.progress_row('two-sum',1)), 'logDate','2026-10-06','isNew',false));
SELECT pg_temp.assert_true((SELECT solved=1 AND reviewed=1 FROM public.activity_log), 'increment preserves existing counts');
SELECT pg_temp.assert_true((SELECT version=2 FROM public.problem_progress), 'revision increments');

-- Insert-only imports cannot erase an existing review history.
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000005','import','{}',
 jsonb_build_object('progress',jsonb_build_array(pg_temp.progress_row('two-sum'),pg_temp.progress_row('3sum'))));
SELECT pg_temp.assert_true((SELECT review_count=1 FROM public.problem_progress WHERE problem_id='two-sum'), 'import preserves reviews');
SELECT pg_temp.assert_true((SELECT count(*)=2 FROM public.problem_progress), 'import adds missing problem');

-- An invalid restore must roll back a settings write performed before the bad timing.
DO $$ BEGIN
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000006','restore','{}',
   jsonb_build_object('settings',jsonb_build_object('onboarding_complete',true,'leetcode_username','test',
    'target_interview_date','2027-01-01','settings_json','{}'::jsonb),
    'timings',jsonb_build_array(pg_temp.timing_row('00000000-0000-4000-8000-000000000006',9))));
  RAISE EXCEPTION 'Expected restore constraint failure';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.user_settings), 'restore rolled back all tables');
SELECT pg_temp.assert_true(jsonb_array_length(public.export_user_data()->'timings')=1, 'backup includes old sessions');

-- Ownership in a JSON import is overwritten with the verified JWT subject.
SELECT public.commit_user_change('00000000-0000-4000-8000-000000000007','import','{}',
 jsonb_build_object('progress',jsonb_build_array(pg_temp.progress_row('valid-parentheses') || '{"user_id":"user_other"}')));
SELECT pg_temp.assert_true((SELECT user_id='user_test' FROM public.problem_progress WHERE problem_id='valid-parentheses'), 'JWT determines ownership');
SELECT set_config('request.jwt.claims', '{"sub":"user_other","role":"authenticated"}', false);
SELECT pg_temp.assert_true((SELECT count(*)=0 FROM public.problem_progress), 'RLS hides another account');
SELECT pg_temp.assert_true(jsonb_array_length(public.export_user_data()->'timings')=0, 'export respects RLS');
DO $$ BEGIN
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000008','restore','{}',
   jsonb_build_object('timings',jsonb_build_array(pg_temp.timing_row('00000000-0000-4000-8000-000000000001'))));
  RAISE EXCEPTION 'Expected cross-account timing denial';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM public.export_user_data();
  RAISE EXCEPTION 'Expected anonymous export denial';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.commit_user_change('00000000-0000-4000-8000-000000000009','import','{}','{}');
  RAISE EXCEPTION 'Expected anonymous write denial';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'Atomic saves, duplicate retries, version conflicts, import preservation, restore rollback, full export, and RLS isolation passed' AS result;
