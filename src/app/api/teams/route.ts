import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const db = getDb();
  const teams = db.prepare("SELECT id, name, created_at as createdAt FROM teams ORDER BY created_at DESC").all();
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "团队名称不能为空" }, { status: 400 });
  }
  const db = getDb();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)").run(id, name.trim(), createdAt);
  const team = db.prepare("SELECT id, name, created_at as createdAt FROM teams WHERE id = ?").get(id);
  return NextResponse.json(team, { status: 201 });
}
