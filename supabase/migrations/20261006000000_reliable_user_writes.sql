-- Apply before deploying the client that calls commit_user_change.
BEGIN;

ALTER TABLE public.problem_progress ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
ALTER TABLE public.sprint_state ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_progress, public.user_settings,
  public.sprint_state, public.session_timings, public.activity_log TO authenticated;

CREATE OR REPLACE FUNCTION public.bump_user_data_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.version := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE OLD.version + 1 END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['problem_progress', 'user_settings', 'sprint_state'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS bump_version ON public.%I', t);
    EXECUTE format('CREATE TRIGGER bump_version BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bump_user_data_version()', t);
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.user_write_receipts (
  user_id TEXT NOT NULL,
  operation_id UUID NOT NULL,
  kind TEXT NOT NULL,
  target TEXT,
  result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, operation_id)
);
ALTER TABLE public.user_write_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS own_receipts ON public.user_write_receipts;
CREATE POLICY own_receipts ON public.user_write_receipts FOR ALL TO authenticated
  USING (user_id = public.requesting_user_id()) WITH CHECK (user_id = public.requesting_user_id());
GRANT SELECT, INSERT ON public.user_write_receipts TO authenticated;

-- SECURITY INVOKER preserves table RLS. Never accept a caller-supplied user ID.
-- All related records and the retry receipt commit or roll back together.
CREATE OR REPLACE FUNCTION public.commit_user_change(
  p_operation_id UUID, p_kind TEXT, p_expected JSONB, p_payload JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  u TEXT := public.requesting_user_id();
  receipt public.user_write_receipts;
  row_data JSONB;
  v BIGINT;
  inserted INT := 0;
  changed INT;
  pid TEXT := p_payload ->> 'problemId';
  answer JSONB;
BEGIN
  IF u IS NULL OR p_operation_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and operation ID required' USING ERRCODE = '28000';
  END IF;
  IF p_payload ? 'clientUserId' AND p_payload ->> 'clientUserId' IS DISTINCT FROM u THEN
    RAISE EXCEPTION 'Account changed during save' USING ERRCODE = '28000';
  END IF;
  IF p_kind NOT IN ('session', 'settings', 'sprint', 'import', 'restore', 'remove') THEN
    RAISE EXCEPTION 'Invalid operation kind' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u, 0));
  SELECT * INTO receipt FROM public.user_write_receipts WHERE user_id = u AND operation_id = p_operation_id;
  IF FOUND THEN
    IF receipt.kind <> p_kind OR receipt.target IS DISTINCT FROM pid THEN
      RAISE EXCEPTION 'Operation ID already used for another action' USING ERRCODE = '22023';
    END IF;
    RETURN receipt.result || '{"duplicate":true}'::jsonb;
  END IF;

  -- Zero means a confirmed absent row, never a failed read or missing cache.
  IF p_expected ? 'settings' THEN
    SELECT version INTO v FROM public.user_settings WHERE user_id = u FOR UPDATE;
    IF COALESCE(v, 0) <> (p_expected ->> 'settings')::bigint THEN
      RAISE EXCEPTION 'Settings changed on another device; reload and retry' USING ERRCODE = '40001';
    END IF;
  END IF;
  IF p_expected ? 'sprint' THEN
    SELECT version INTO v FROM public.sprint_state WHERE user_id = u FOR UPDATE;
    IF COALESCE(v, 0) <> (p_expected ->> 'sprint')::bigint THEN
      RAISE EXCEPTION 'Sprint changed on another device; reload and retry' USING ERRCODE = '40001';
    END IF;
  END IF;
  FOR row_data IN SELECT jsonb_build_object('id', key, 'version', value) FROM jsonb_each(COALESCE(p_expected -> 'progress', '{}')) LOOP
    SELECT version INTO v FROM public.problem_progress WHERE user_id = u AND problem_id = row_data ->> 'id' FOR UPDATE;
    IF COALESCE(v, 0) <> (row_data ->> 'version')::bigint THEN
      RAISE EXCEPTION 'Progress changed on another device; reload and retry' USING ERRCODE = '40001';
    END IF;
  END LOOP;

  IF p_kind = 'remove' THEN
    DELETE FROM public.problem_progress WHERE user_id = u AND problem_id = pid;
  END IF;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'progress', '[]')) LOOP
    -- Ignore ownership and revision metadata supplied in imported JSON.
    row_data := row_data || jsonb_build_object('user_id', u, 'version', 1, 'updated_at', now());
    IF p_kind = 'import' THEN
      INSERT INTO public.problem_progress SELECT (jsonb_populate_record(NULL::public.problem_progress, row_data)).*
      ON CONFLICT (user_id, problem_id) DO NOTHING;
      GET DIAGNOSTICS changed = ROW_COUNT;
      inserted := inserted + changed;
    ELSE
      INSERT INTO public.problem_progress SELECT (jsonb_populate_record(NULL::public.problem_progress, row_data)).*
      ON CONFLICT (user_id, problem_id) DO UPDATE SET
        first_solved_at = EXCLUDED.first_solved_at, last_reviewed_at = EXCLUDED.last_reviewed_at,
        next_review_at = EXCLUDED.next_review_at, review_count = EXCLUDED.review_count,
        consecutive_threes = EXCLUDED.consecutive_threes, consecutive_successes = EXCLUDED.consecutive_successes,
        retired = EXCLUDED.retired, notes = EXCLUDED.notes, history = EXCLUDED.history;
    END IF;
  END LOOP;

  -- Settings schedule changes patch dates only; never replace rating histories.
  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'reviewDates', '[]')) LOOP
    UPDATE public.problem_progress SET next_review_at = (row_data ->> 'nextReviewAt')::timestamptz
    WHERE user_id = u AND problem_id = row_data ->> 'problemId';
  END LOOP;

  IF p_payload ? 'settings' THEN
    row_data := (p_payload -> 'settings') || jsonb_build_object('user_id', u, 'version', 1, 'updated_at', now());
    INSERT INTO public.user_settings SELECT (jsonb_populate_record(NULL::public.user_settings, row_data)).*
    ON CONFLICT (user_id) DO UPDATE SET onboarding_complete = EXCLUDED.onboarding_complete,
      leetcode_username = EXCLUDED.leetcode_username, target_interview_date = EXCLUDED.target_interview_date,
      settings_json = EXCLUDED.settings_json;
  END IF;

  IF p_payload ? 'sprint' THEN
    row_data := (p_payload -> 'sprint') || jsonb_build_object('user_id', u, 'version', 1, 'updated_at', now());
    INSERT INTO public.sprint_state SELECT (jsonb_populate_record(NULL::public.sprint_state, row_data)).*
    ON CONFLICT (user_id) DO UPDATE SET current_category = EXCLUDED.current_category,
      sprint_start_date = EXCLUDED.sprint_start_date, sprint_length = EXCLUDED.sprint_length,
      sprint_status = EXCLUDED.sprint_status, sprint_index = EXCLUDED.sprint_index,
      extension_days = EXCLUDED.extension_days, retro_problem_id = EXCLUDED.retro_problem_id,
      retro_attempted = EXCLUDED.retro_attempted, sprint_history = EXCLUDED.sprint_history;
  END IF;

  FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'timings', '[]')) LOOP
    row_data := row_data || jsonb_build_object('user_id', u);
    -- Do not silently accept an ID belonging to another user's session.
    INSERT INTO public.session_timings SELECT (jsonb_populate_record(NULL::public.session_timings, row_data)).*
    ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id
      WHERE public.session_timings.user_id = u;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed = 0 THEN
      RAISE EXCEPTION 'Session ID is unavailable' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  IF p_kind = 'session' THEN
    INSERT INTO public.activity_log (user_id, log_date, solved, reviewed)
    VALUES (u, (p_payload ->> 'logDate')::date,
      CASE WHEN (p_payload ->> 'isNew')::boolean THEN 1 ELSE 0 END,
      CASE WHEN (p_payload ->> 'isNew')::boolean THEN 0 ELSE 1 END)
    ON CONFLICT (user_id, log_date) DO UPDATE SET
      solved = public.activity_log.solved + EXCLUDED.solved,
      reviewed = public.activity_log.reviewed + EXCLUDED.reviewed;
  ELSE
    FOR row_data IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'activity', '[]')) LOOP
      INSERT INTO public.activity_log (user_id, log_date, solved, reviewed)
      VALUES (u, (row_data ->> 'log_date')::date, (row_data ->> 'solved')::int, (row_data ->> 'reviewed')::int)
      ON CONFLICT (user_id, log_date) DO UPDATE SET solved = EXCLUDED.solved, reviewed = EXCLUDED.reviewed;
    END LOOP;
  END IF;
  answer := jsonb_build_object('duplicate', false, 'imported', inserted);
  INSERT INTO public.user_write_receipts (user_id, operation_id, kind, target, result)
  VALUES (u, p_operation_id, p_kind, pid, answer);
  RETURN answer;
END;
$$;
REVOKE ALL ON FUNCTION public.commit_user_change(UUID, TEXT, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commit_user_change(UUID, TEXT, JSONB, JSONB) TO authenticated;

-- Read all user tables under the same advisory lock used by writes: consistent backups.
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE u TEXT := public.requesting_user_id(); result JSONB;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u, 0));
  SELECT jsonb_build_object(
    'settings', (SELECT to_jsonb(s) FROM public.user_settings s WHERE user_id = u),
    'progress', COALESCE((SELECT jsonb_agg(p ORDER BY problem_id) FROM public.problem_progress p WHERE user_id = u), '[]'),
    'activity', COALESCE((SELECT jsonb_agg(a ORDER BY log_date) FROM public.activity_log a WHERE user_id = u), '[]'),
    'timings', COALESCE((SELECT jsonb_agg(t ORDER BY recorded_at DESC, id DESC) FROM public.session_timings t WHERE user_id = u), '[]'),
    'sprint', (SELECT to_jsonb(s) FROM public.sprint_state s WHERE user_id = u)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.export_user_data() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;

-- Ensure the tables used by the client are published, without assuming dashboard state.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['problem_progress', 'user_settings', 'activity_log', 'session_timings', 'sprint_state'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END;
$$;
COMMIT;
