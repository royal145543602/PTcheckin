import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  const { error } = await db.from("teams").update({ name: name.trim() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: team } = await db.from("teams").select("id, name, created_at").eq("id", id).single();
  return NextResponse.json(team);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await db.from("teams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
