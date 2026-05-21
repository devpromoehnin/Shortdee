-- Phase 2.2 -- Sync Supabase auth.users into public.users, and enable RLS.

-- ── User-sync trigger ───────────────────────────────────────────
-- Creates a public.users row whenever someone signs up via Supabase Auth.
-- public.users.id is TEXT and mirrors auth.users.id so the two stay linked.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "creditsResetAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────────────
-- The API gateway connects as the table owner and bypasses RLS; these
-- policies are defence-in-depth against direct access with anon keys.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_user_select" ON public.users
  FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "own_user_update" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid()::text = id);

CREATE POLICY "own_live_streams" ON public.live_streams
  FOR ALL TO authenticated USING (auth.uid()::text = "userId");

CREATE POLICY "own_clips" ON public.clips
  FOR ALL TO authenticated USING (auth.uid()::text = "userId");

CREATE POLICY "own_usage_logs" ON public.usage_logs
  FOR ALL TO authenticated USING (auth.uid()::text = "userId");

CREATE POLICY "own_social_accounts" ON public.social_accounts
  FOR ALL TO authenticated USING (auth.uid()::text = "userId");

CREATE POLICY "own_subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (auth.uid()::text = "userId");

CREATE POLICY "own_moments" ON public.moments
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.live_streams ls
      WHERE ls.id = "liveStreamId" AND ls."userId" = auth.uid()::text
    )
  );
