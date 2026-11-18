BEGIN;
SET LOCAL timezone = 'America/New_York';

CREATE FUNCTION pg_temp.coach_claim(
  id uuid, subject text, funding text DEFAULT 'free', step text DEFAULT 'intent', fingerprint text DEFAULT 'fingerprint'
) RETURNS jsonb LANGUAGE sql AS $$
  SELECT public.claim_coach_turn(id, subject, funding, fingerprint, step,
    CASE WHEN funding IN ('free', 'owner') THEN 2000 ELSE 0 END, 10000, 15000, 2)
$$;

DO $$
DECLARE
  first_id uuid := gen_random_uuid();
  second_id uuid := gen_random_uuid();
  held_id uuid := gen_random_uuid();
  result jsonb;
BEGIN
  IF has_function_privilege('authenticated', 'public.claim_coach_turn(uuid,text,text,text,text,integer,integer,integer,integer)', 'EXECUTE')
      OR has_function_privilege('anon', 'public.settle_coach_step(uuid,text,bigint,boolean)', 'EXECUTE')
      OR has_schema_privilege('service_role', 'coach_private', 'USAGE') THEN
    RAISE EXCEPTION 'The allowance ledger and RPCs have unexpected grants';
  END IF;

  result := pg_temp.coach_claim(first_id, 'user_a');
  IF result->>'code' <> 'ok' OR result#>>'{allowance,remaining}' <> '1'
    OR (result#>>'{allowance,resetAt}')::timestamptz <> date_trunc('day', now(), 'UTC') + interval '24 hours' THEN
    RAISE EXCEPTION 'Free allowance or UTC reset is incorrect';
  END IF;
  IF pg_temp.coach_claim(first_id, 'user_a')->>'code' <> 'replay'
    OR pg_temp.coach_claim(first_id, 'user_b')->>'code' <> 'replay'
    OR pg_temp.coach_claim(gen_random_uuid(), 'user_a', 'gemini')->>'code' <> 'busy'
    OR pg_temp.coach_claim(first_id, 'user_a', 'free', 'answer')->>'code' <> 'expired' THEN
    RAISE EXCEPTION 'An intent was replayed, overlapped, or continued before settlement';
  END IF;
  IF NOT public.settle_coach_step(first_id, 'intent', 875, true)
    OR public.settle_coach_step(first_id, 'intent', 0, true) THEN
    RAISE EXCEPTION 'Intent settlement did not happen exactly once';
  END IF;
  IF pg_temp.coach_claim(first_id, 'user_b', 'free', 'answer')->>'code' <> 'expired'
    OR pg_temp.coach_claim(first_id, 'user_a', 'owner', 'answer')->>'code' <> 'expired'
    OR pg_temp.coach_claim(first_id, 'user_a', 'free', 'answer', 'different question or key')->>'code' <> 'expired'
    OR pg_temp.coach_claim(first_id, 'user_a', 'free', 'answer')->>'code' <> 'ok'
    OR pg_temp.coach_claim(first_id, 'user_a', 'free', 'answer')->>'code' <> 'expired' THEN
    RAISE EXCEPTION 'A continuation was not bound to the original turn and allowed exactly once';
  END IF;
  IF NOT public.settle_coach_step(first_id, 'answer', NULL, false) THEN
    RAISE EXCEPTION 'The second step was not settled';
  END IF;
  IF (SELECT spent_micros FROM coach_private.turns WHERE id = first_id) <> 2875 THEN
    RAISE EXCEPTION 'An unconfirmed provider charge did not keep its worst-case cost';
  END IF;
  UPDATE coach_private.turns SET started_at = started_at - interval '3 seconds' WHERE id = first_id;
  result := pg_temp.coach_claim(second_id, 'user_a');
  IF result->>'code' <> 'ok' OR result#>>'{allowance,remaining}' <> '0' THEN RAISE EXCEPTION 'Second free turn rejected'; END IF;
  PERFORM public.settle_coach_step(second_id, 'intent', 500, false);
  UPDATE coach_private.turns SET started_at = started_at - interval '3 seconds' WHERE id = second_id;
  IF pg_temp.coach_claim(gen_random_uuid(), 'user_a')->>'code' <> 'daily_limit'
    OR pg_temp.coach_claim(gen_random_uuid(), 'user_a', 'owner')->>'code' <> 'ok' THEN
    RAISE EXCEPTION 'Daily allowance or owner exemption failed';
  END IF;

  IF pg_temp.coach_claim(held_id, 'user_held')->>'code' <> 'ok'
    OR pg_temp.coach_claim(gen_random_uuid(), 'user_other')->>'code' <> 'daily_budget' THEN
    RAISE EXCEPTION 'Reservation failed to protect the last part of the daily budget';
  END IF;
  PERFORM public.settle_coach_step(held_id, 'intent', 625, true);
  UPDATE coach_private.turns SET started_at = started_at - interval '91 seconds' WHERE id = held_id;
  IF pg_temp.coach_claim(held_id, 'user_held', 'free', 'answer')->>'code' <> 'expired'
    OR pg_temp.coach_claim(gen_random_uuid(), 'user_other')->>'code' <> 'ok' THEN
    RAISE EXCEPTION 'The expired, unused answer reservation did not release safely';
  END IF;

  UPDATE coach_private.turns SET started_at = date_trunc('month', now(), 'UTC') - interval '1 second'
    WHERE funding = 'free';
  IF pg_temp.coach_claim(gen_random_uuid(), 'user_a', 'claude')->>'code' <> 'busy'
    OR pg_temp.coach_claim(gen_random_uuid(), 'user_reset')->>'code' <> 'ok' THEN
    RAISE EXCEPTION 'UTC rollover or per-account busy limit failed';
  END IF;
END;
$$;
SELECT 'Study Chat quota, account isolation, reservation, and exact-once settlement passed.' AS result;
ROLLBACK;
