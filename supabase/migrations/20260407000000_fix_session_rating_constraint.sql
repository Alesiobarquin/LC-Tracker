-- App rating scale is 1–5 (see ProblemSessionRating); original schema only allowed 1–3.
DO $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'session_timings'
          AND rel.relnamespace = 'public'::regnamespace
          AND con.contype = 'c'
    LOOP
        IF rec.conname LIKE '%rating%' THEN
            EXECUTE 'ALTER TABLE public.session_timings DROP CONSTRAINT ' || quote_ident(rec.conname);
        END IF;
    END LOOP;
END;
$$;

ALTER TABLE public.session_timings
  ADD CONSTRAINT session_timings_rating_check CHECK (rating >= 1 AND rating <= 5);
