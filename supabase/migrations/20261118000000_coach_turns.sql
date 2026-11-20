CREATE SCHEMA coach_private;
REVOKE ALL ON SCHEMA coach_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE coach_private.turns (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  funding text NOT NULL CHECK (funding IN ('free', 'owner', 'gemini', 'claude')),
  started_at timestamptz NOT NULL,
  claimed_at timestamptz NOT NULL,
  fingerprint text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('intent_running', 'answer_ready', 'answer_running', 'done')),
  step_micros integer NOT NULL CHECK (step_micros >= 0),
  held_micros integer NOT NULL CHECK (held_micros >= 0),
  spent_micros bigint NOT NULL DEFAULT 0 CHECK (spent_micros >= 0),
  cost_mismatch boolean NOT NULL DEFAULT false
);
ALTER TABLE coach_private.turns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON coach_private.turns FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX coach_turn_user_time ON coach_private.turns (user_id, started_at);
CREATE INDEX coach_turn_time ON coach_private.turns (started_at);

CREATE FUNCTION public.claim_coach_turn(
  p_id uuid, p_user_id text, p_funding text, p_fingerprint text, p_step text,
  p_step_micros integer, p_daily_budget_micros integer, p_monthly_budget_micros integer,
  p_daily_limit integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_turn coach_private.turns%ROWTYPE;
  v_now timestamptz;
  v_day timestamptz;
  v_month timestamptz;
  v_day_spend bigint;
  v_month_spend bigint;
  v_mismatch boolean;
  v_used integer;
  v_hold integer := 2 * p_step_micros;
  v_allowance jsonb;
BEGIN
  -- Serialize admission and accounting across Vercel instances. Never hold a lock during inference.
  PERFORM pg_advisory_xact_lock(20261118, 1);
  v_now := clock_timestamp();
  v_day := date_trunc('day', v_now, 'UTC');
  v_month := date_trunc('month', v_now, 'UTC');
  SELECT * INTO v_turn FROM coach_private.turns WHERE id = p_id;

  IF p_step = 'answer' THEN
    IF NOT FOUND OR v_turn.user_id <> p_user_id OR v_turn.funding <> p_funding
       OR v_turn.fingerprint <> p_fingerprint OR v_turn.stage <> 'answer_ready'
       OR v_turn.started_at <= v_now - interval '90 seconds' THEN
      RETURN jsonb_build_object('code', 'expired');
    END IF;
    IF p_funding = 'free' AND EXISTS (
      SELECT 1 FROM coach_private.turns WHERE funding = 'free' AND cost_mismatch AND started_at >= v_month
    ) THEN
      RETURN jsonb_build_object('code', 'disabled');
    END IF;
  ELSIF p_step <> 'intent' OR FOUND THEN
    RETURN jsonb_build_object('code', 'replay');
  END IF;

  IF EXISTS (SELECT 1 FROM coach_private.turns
    WHERE user_id = p_user_id AND (started_at > v_now - interval '2 seconds' AND id <> p_id
      OR stage IN ('intent_running', 'answer_running') AND claimed_at > v_now - interval '35 seconds')) THEN
    RETURN jsonb_build_object('code', 'busy');
  END IF;
  IF p_step = 'answer' THEN
    UPDATE coach_private.turns SET stage = 'answer_running', claimed_at = v_now WHERE id = p_id;
    RETURN jsonb_build_object('code', 'ok');
  END IF;

  IF p_funding = 'free' THEN
    SELECT count(*) INTO v_used FROM coach_private.turns
      WHERE funding = 'free' AND user_id = p_user_id AND started_at >= v_day;
    v_allowance := jsonb_build_object('remaining', greatest(p_daily_limit - v_used, 0), 'resetAt', v_day + interval '24 hours');
    IF v_used >= p_daily_limit THEN
      RETURN jsonb_build_object('code', 'daily_limit', 'allowance', v_allowance, 'resetAt', v_day + interval '24 hours');
    END IF;

    SELECT coalesce(sum(total) FILTER (WHERE started_at >= v_day), 0),
           coalesce(sum(total), 0), coalesce(bool_or(cost_mismatch), false)
      INTO v_day_spend, v_month_spend, v_mismatch
      FROM (
        SELECT started_at, cost_mismatch, spent_micros + CASE
          WHEN stage = 'answer_ready' AND started_at <= v_now - interval '90 seconds' THEN 0
          ELSE held_micros
        END AS total
        FROM coach_private.turns WHERE funding = 'free' AND started_at >= v_month
      ) month_turns;
    IF v_mismatch THEN RETURN jsonb_build_object('code', 'disabled'); END IF;
    IF v_month_spend + v_hold > p_monthly_budget_micros THEN
      RETURN jsonb_build_object('code', 'monthly_budget', 'resetAt', (v_month AT TIME ZONE 'UTC' + interval '1 month') AT TIME ZONE 'UTC');
    END IF;
    IF v_day_spend + v_hold > p_daily_budget_micros THEN
      RETURN jsonb_build_object('code', 'daily_budget', 'resetAt', v_day + interval '24 hours');
    END IF;
    v_allowance := v_allowance || jsonb_build_object('remaining', p_daily_limit - v_used - 1);
  END IF;

  -- Keep only the metadata needed for current accounting and recent reconciliation.
  DELETE FROM coach_private.turns WHERE started_at < v_now - interval '35 days';
  INSERT INTO coach_private.turns (id, user_id, funding, started_at, claimed_at, fingerprint, stage, step_micros, held_micros)
    VALUES (p_id, p_user_id, p_funding, v_now, v_now, p_fingerprint, 'intent_running', p_step_micros, v_hold);
  RETURN jsonb_strip_nulls(jsonb_build_object('code', 'ok', 'allowance', v_allowance));
END;
$$;

CREATE FUNCTION public.settle_coach_step(
  p_id uuid, p_step text, p_cost_micros bigint, p_can_summarize boolean
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(20261118, 1);
  UPDATE coach_private.turns SET
    spent_micros = spent_micros + coalesce(p_cost_micros, step_micros),
    held_micros = CASE WHEN p_can_summarize AND p_step = 'intent' THEN step_micros ELSE 0 END,
    stage = CASE WHEN p_can_summarize AND p_step = 'intent' THEN 'answer_ready' ELSE 'done' END,
    cost_mismatch = cost_mismatch OR coalesce(p_cost_micros > step_micros, false)
  WHERE id = p_id AND stage = CASE p_step WHEN 'intent' THEN 'intent_running' WHEN 'answer' THEN 'answer_running' END;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_coach_turn(uuid, text, text, text, text, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_coach_step(uuid, text, bigint, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_coach_turn(uuid, text, text, text, text, integer, integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_coach_step(uuid, text, bigint, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';
