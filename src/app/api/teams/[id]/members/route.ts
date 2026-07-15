import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const members = db.prepare(
    "SELECT id, team_id as teamId, name, is_preset as isPreset FROM members WHERE team_id = ? ORDER BY name"
  ).all(id);
  return NextResponse.json(members);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, isPreset } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "名字不能为空" }, { status: 400 });
  }
  const db = getDb();
  const team = db.prepare("SELECT id FROM teams WHERE id = ?").get(id);
  if (!team) return NextResponse.json({ error: "团队不存在" }, { status: 404 });

  const memberId = uuidv4();
  const preset = isPreset !== false ? 1 : 0;
  db.prepare("INSERT INTO members (id, team_id, name, is_preset) VALUES (?, ?, ?, ?)").run(memberId, id, name.trim(), preset);
  const member = db.prepare(
    "SELECT id, team_id as teamId, name, is_preset as isPreset FROM members WHERE id = ?"
  ).get(memberId);
  return NextResponse.json(member, { status: 201 });
}
