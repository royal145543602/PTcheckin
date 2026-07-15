import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "checkin.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        is_preset INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('in', 'out')),
        time TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_records_team ON records(team_id);
      CREATE INDEX IF NOT EXISTS idx_records_member ON records(member_id);
    `);
  }
  return db;
}
