-- Applied to PTcheckin as migration prevent_hard_delete_of_checkin_history.
-- Prevent a direct member or team delete from cascading into signatures/history.
ALTER TABLE public.records DROP CONSTRAINT records_member_id_fkey;
ALTER TABLE public.records ADD CONSTRAINT records_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE RESTRICT;
ALTER TABLE public.records DROP CONSTRAINT records_team_id_fkey;
ALTER TABLE public.records ADD CONSTRAINT records_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE RESTRICT;
