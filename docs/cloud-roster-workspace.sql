-- New workspace is independent of the existing team/member/history tables.
CREATE TABLE IF NOT EXISTS public.roster_workspace (
  id text PRIMARY KEY CHECK (id = 'main'),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(document) = 'object')
);
ALTER TABLE public.roster_workspace ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.roster_workspace FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.roster_workspace TO service_role;
INSERT INTO public.roster_workspace (id, document) VALUES ('main', '{"groups":[],"people":[],"sessions":[],"places":[],"requests":[],"logs":[],"rules":[],"records":[]}') ON CONFLICT (id) DO NOTHING;

-- Shared rate limits for all Worker instances; only the server may execute.
CREATE TABLE IF NOT EXISTS public.roster_request_limits (id text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS roster_request_limits_expiry ON public.roster_request_limits(expires_at);
ALTER TABLE public.roster_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.roster_request_limits FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.roster_allow_request(request_key text, request_limit integer, window_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ DECLARE hits integer; BEGIN DELETE FROM public.roster_request_limits WHERE expires_at < now(); INSERT INTO public.roster_request_limits(id,count,expires_at) VALUES(request_key,1,now()+make_interval(secs=>window_seconds)) ON CONFLICT(id) DO UPDATE SET count=public.roster_request_limits.count+1 RETURNING count INTO hits; RETURN hits <= request_limit; END; $$;
REVOKE ALL ON FUNCTION public.roster_allow_request(text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.roster_allow_request(text,integer,integer) TO service_role;
