-- PostgREST 14 retries SQLSTATE 40001 internally without refreshing RPC inputs.
-- Application revision conflicts must return HTTP 409 instead of entering that loop.
BEGIN;
DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_functiondef('public.commit_user_change(uuid,text,jsonb,jsonb)'::regprocedure)
    INTO definition;
  IF position('ERRCODE = ''40001''' IN definition) > 0 THEN
    EXECUTE replace(definition, 'ERRCODE = ''40001''', 'ERRCODE = ''PT409''');
  ELSIF position('ERRCODE = ''PT409''' IN definition) = 0 THEN
    RAISE EXCEPTION 'Unknown commit_user_change conflict definition; inspect before applying';
  END IF;
END $$;
COMMIT;
