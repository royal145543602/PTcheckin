import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const team = db.prepare("SELECT id, name, created_at as createdAt FROM teams WHERE id = ?").get(id);
  if (!team) return NextResponse.json({ error: "团队不存在" }, { status: 404 });
  return NextResponse.json(team);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  }
  const db = getDb();
  const result = db.prepare("UPDATE teams SET name = ? WHERE id = ?").run(name.trim(), id);
  if (result.changes === 0) return NextResponse.json({ error: "团队不存在" }, { status: 404 });
  const team = db.prepare("SELECT id, name, created_at as createdAt FROM teams WHERE id = ?").get(id);
  return NextResponse.json(team);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM teams WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "团队不存在" }, { status: 404 });
  return NextResponse.json({ success: true });
}
