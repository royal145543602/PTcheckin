-- Run once in Supabase SQL Editor before deploying the archive feature.
-- Existing members and check-in records are left untouched.
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_members_team_active ON public.members (team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_members_team_archived ON public.members (team_id) WHERE deleted_at IS NOT NULL;

-- Plan B: if the application cannot be updated immediately, prevent future
-- accidental hard deletes from silently cascading through check-in history.
-- Apply separately only if you need the database guard. The app's archive flow
-- does not require this constraint change.
-- ALTER TABLE public.records DROP CONSTRAINT records_member_id_fkey;
-- ALTER TABLE public.records ADD CONSTRAINT records_member_id_fkey
--   FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE RESTRICT;
