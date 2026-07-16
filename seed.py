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

now = datetime.now(timezone.utc).isoformat()

# Team A
ta_id = str(uuid.uuid4())
conn.execute("INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)",
             (ta_id, "足球A队", now))
for name in ["小明", "小红", "小刚", "小丽", "小强"]:
    conn.execute("INSERT INTO members (id, team_id, name, is_preset) VALUES (?, ?, ?, 1)",
                 (str(uuid.uuid4()), ta_id, name))

# Team B
tb_id = str(uuid.uuid4())
conn.execute("INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)",
             (tb_id, "足球B队", now))
for name in ["小华", "小花", "小林"]:
    conn.execute("INSERT INTO members (id, team_id, name, is_preset) VALUES (?, ?, ?, 1)",
                 (str(uuid.uuid4()), tb_id, name))

conn.commit()

rows = conn.execute("SELECT t.name, COUNT(m.id) FROM teams t LEFT JOIN members m ON m.team_id = t.id GROUP BY t.id").fetchall()
for r in rows:
    print(f"  {r[0]}: {r[1]} members")
conn.close()
print("SEED_OK")
