-- Apply only after the deployed app has SUPABASE_SECRET_KEY,
-- ADMIN_PIN, and ADMIN_SESSION_SECRET set as server-side secrets, and
-- the new app has passed live admin and public check-in smoke tests.
-- This intentionally gives no direct Data API access to anon/authenticated.
-- Public check-in continues through the app's scoped API routes.

BEGIN;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.teams FROM anon, authenticated;
REVOKE ALL ON public.members FROM anon, authenticated;
REVOKE ALL ON public.records FROM anon, authenticated;

COMMIT;
