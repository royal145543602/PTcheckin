import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const db = createClient(supabaseUrl, supabaseKey);

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
  is_preset INTEGER NOT NULL DEFAULT 0
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
