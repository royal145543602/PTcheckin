import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await params;
  const { memberId, type, signature } = await request.json();

  if (!memberId || !type || !["in", "out"].includes(type)) {
    return NextResponse.json({ error: "参数无效" }, { status: 400 });
  }

  const db = getDb();
  const member = db.prepare("SELECT id FROM members WHERE id = ? AND team_id = ?").get(memberId, teamId);
  if (!member) return NextResponse.json({ error: "成员不存在" }, { status: 404 });

  const recordId = uuidv4();
  const time = new Date().toISOString();
  const sigStr = signature ? JSON.stringify(signature) : null;

  db.prepare(
    "INSERT INTO records (id, member_id, team_id, type, time, signature) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(recordId, memberId, teamId, type, time, sigStr);

  const record = db.prepare(
    "SELECT id, member_id as memberId, team_id as teamId, type, time, signature FROM records WHERE id = ?"
  ).get(recordId);
  return NextResponse.json(record, { status: 201 });
}
