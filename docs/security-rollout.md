# Check-in security rollout

The public `/kiosk/<team-id>` and `/view/<team-id>` links remain available without a password. The site server owns the database secret key. The admin page and all management writes require a five-minute, signed, HttpOnly session cookie.

## Prerequisites

1. In the PTcheckin Supabase project, create a **secret** API key (`sb_secret_...`) under Settings → API Keys. Never put this key in source control, `wrangler.jsonc` `vars`, or a `NEXT_PUBLIC_` variable.
2. On the `ptcheckin` Cloudflare Worker, set these three **Secret** variables before deploying the new code:
   - `SUPABASE_SECRET_KEY`: the Supabase secret API key.
   - `ADMIN_PIN`: a new, unique password of at least eight characters. The old browser-only default `0000` is removed.
   - `ADMIN_SESSION_SECRET`: at least 32 random characters. This signs the five-minute admin cookie.
3. Keep `SUPABASE_URL` set to the PTcheckin project URL in `wrangler.jsonc`.

## Cutover

1. Deploy the new Worker. Confirm the admin page requires the new password, public kiosk and view links load, a public check-in succeeds, archiving and restoring a member work, and an unauthenticated management request returns 401.
2. Apply `lock-down-public-data.sql` in the same PTcheckin project. This enables RLS and removes direct Data API grants for `anon` and `authenticated`. The server's secret key continues to access the tables through the app's API routes.
3. Confirm the public kiosk still loads and can check in, the admin page can manage records after password entry, and a request to the Supabase Data API using only the old anon key cannot read or modify the three tables.
4. Compare the team, member, and record row counts with the pre-cutover snapshot. Do not disable the old anon key until every consumer has been checked for compatibility.

Never apply the lock-down SQL before the new Worker and its secrets are live: the current website uses the anon key and would lose database access.
