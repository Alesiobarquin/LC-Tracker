-- Additive: retain every existing history, rating, date, and retirement flag.
BEGIN;
ALTER TABLE public.problem_progress ADD COLUMN IF NOT EXISTS study_state JSONB;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='problem_progress_study_state_object' AND conrelid='public.problem_progress'::regclass) THEN
    ALTER TABLE public.problem_progress ADD CONSTRAINT problem_progress_study_state_object
      CHECK (study_state IS NULL OR jsonb_typeof(study_state) = 'object');
  END IF;
END $$;
-- No interview is a supported state. Existing targets are retained.
ALTER TABLE public.user_settings ALTER COLUMN target_interview_date SET DEFAULT '';

DO $$
DECLARE definition text; original text;
BEGIN
  SELECT pg_get_functiondef('public.commit_user_change(uuid,text,jsonb,jsonb)'::regprocedure) INTO definition;
  IF position('ERRCODE = ''PT409''' IN definition) = 0 THEN
    RAISE EXCEPTION 'Apply the PostgREST conflict-status repair before the study migration';
  END IF;
  original := definition;
  definition := replace(definition,
    'IF p_kind NOT IN (''session'', ''settings'', ''sprint'', ''import'', ''restore'', ''remove'') THEN',
    'IF p_kind NOT IN (''session'', ''recall'', ''settings'', ''sprint'', ''import'', ''restore'', ''remove'') THEN');
  IF definition = original AND position('''recall'', ''settings''' IN definition) = 0 THEN RAISE EXCEPTION 'Unrecognized operation-kind guard'; END IF;
  original := definition;
  definition := replace(definition,
    'retired = EXCLUDED.retired, notes = EXCLUDED.notes, history = EXCLUDED.history;',
    'retired = EXCLUDED.retired, notes = EXCLUDED.notes, history = EXCLUDED.history,
        study_state = CASE WHEN row_data ? ''study_state'' THEN EXCLUDED.study_state ELSE public.problem_progress.study_state END;');
  IF definition = original AND position('study_state = CASE WHEN row_data' IN definition) = 0 THEN RAISE EXCEPTION 'Unrecognized progress upsert'; END IF;
  original := definition;
  definition := replace(definition, 'IF p_kind = ''session'' THEN', 'IF p_kind IN (''session'', ''recall'') THEN');
  IF definition = original AND position('IF p_kind IN (''session'', ''recall'') THEN' IN definition) = 0 THEN RAISE EXCEPTION 'Unrecognized activity update'; END IF;
  EXECUTE definition;
END $$;
-- SECURITY INVOKER, RLS, revision checks, grants, and retry receipts are retained.
NOTIFY pgrst, 'reload schema';
COMMIT;
