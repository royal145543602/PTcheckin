import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const { data: teams, error } = await db.from("teams").select("id, name, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "团队名称不能为空" }, { status: 400 });
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const { error } = await db.from("teams").insert({ id, name: name.trim(), created_at: createdAt });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id, name: name.trim(), created_at: createdAt }, { status: 201 });
}
