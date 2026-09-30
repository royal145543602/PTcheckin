import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const archived = new URL(_request.url).searchParams.get("archived") === "1";
  let query = db.from("members").select("id, name").eq("team_id", id).order("name");
  query = archived ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  const { data: members, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(members);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "名字不能为空" }, { status: 400 });
  const memberId = uuidv4();
  const { error } = await db.from("members").insert({ id: memberId, team_id: id, name: name.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: memberId, name: name.trim() }, { status: 201 });
}
