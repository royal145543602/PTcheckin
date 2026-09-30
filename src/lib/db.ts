import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let db: SupabaseClient<any, "public", any> | undefined;

export function getDb() {
  if (db) return db;
  const supabaseUrl = process.env.SUPABASE_URL;
  // Only API routes call this. Keep the key in a server-side secret,
  // never in NEXT_PUBLIC_* or a committed Wrangler vars block.
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase server credentials are not configured");
  db = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return db;
}

// Table creation SQL (run once in Supabase SQL Editor):
/*
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_preset INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE records (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('in', 'out')),
  time TEXT NOT NULL,
  signature TEXT
);

CREATE INDEX idx_records_team ON records(team_id);
CREATE INDEX idx_records_member ON records(member_id);
*/
