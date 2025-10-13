ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public validate tokens" ON public.tokens;
CREATE POLICY "Allow public validate tokens" ON public.tokens
FOR SELECT USING (
  used_flag = false
  AND expires_at >= now()
);

DROP FUNCTION IF EXISTS public.validate_token_rpc(TEXT);
CREATE OR REPLACE FUNCTION public.validate_token_rpc(p_token TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(
    (
      SELECT to_jsonb(t) FROM (
        SELECT id, token, entries_count, expires_at, used_flag
        FROM public.tokens
        WHERE lower(token) = lower(p_token)
          AND used_flag = false
          AND expires_at >= now()
        LIMIT 1
      ) t
    ),
    '{}'::jsonb
  );
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_token_rpc(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_token_rpc(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.use_token_rpc(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.use_token_rpc(p_token TEXT, p_user_id UUID)
RETURNS JSONB AS $$
  WITH updated AS (
    UPDATE public.tokens
    SET used_flag = true,
        used_by_user_id = p_user_id,
        used_at = now()
    WHERE lower(token) = lower(p_token)
      AND used_flag = false
    RETURNING id, token, entries_count, expires_at, used_flag, used_by_user_id, used_at
  )
  SELECT COALESCE((SELECT to_jsonb(u) FROM updated u LIMIT 1), '{}'::jsonb);
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.use_token_rpc(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.use_token_rpc(TEXT, UUID) TO authenticated;

-- RPC to compute how many entries a user still needs to create based on used tokens
DROP FUNCTION IF EXISTS public.get_user_pending_entries(UUID);
CREATE OR REPLACE FUNCTION public.get_user_pending_entries(p_user_id UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'pending_count',
    GREATEST(
      COALESCE((SELECT SUM(entries_count) FROM public.tokens WHERE used_by_user_id = p_user_id AND used_flag = true), 0)
      -
      COALESCE((SELECT COUNT(*) FROM public.entries WHERE user_id = p_user_id), 0),
      0
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_pending_entries(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_pending_entries(UUID) TO authenticated;