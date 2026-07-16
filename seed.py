"""Seed database with test data using proper UTF-8 encoding."""
import sqlite3
import uuid
from datetime import datetime, timezone

conn = sqlite3.connect("checkin.db")
conn.execute("PRAGMA journal_mode = WAL")
conn.execute("PRAGMA foreign_keys = ON")

# Create tables
conn.executescript("""
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
""")

team_id = str(uuid.uuid4())
now = datetime.now(timezone.utc).isoformat()

conn.execute("INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)",
             (team_id, "足球A队", now))

members = ["小明", "小红", "小刚", "小丽", "小强"]
member_ids = []
for name in members:
    mid = str(uuid.uuid4())
    member_ids.append(mid)
    conn.execute("INSERT INTO members (id, team_id, name, is_preset) VALUES (?, ?, ?, 1)",
                 (mid, team_id, name))

# No pre-existing records - each day starts fresh with everyone grey
conn.commit()

# Verify (use repr to avoid terminal encoding issues)
rows = conn.execute("SELECT id, name, hex(name) FROM members").fetchall()
for r in rows:
    print(f"  {r[0][:8]}: hex={r[2]}")
conn.close()
print("SEED_OK")
