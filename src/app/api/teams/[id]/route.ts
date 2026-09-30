import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { name } = await request.json();
  if (!name || typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  const { error } = await getDb().from("teams").update({ name: name.trim() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: team } = await getDb().from("teams").select("id, name, created_at").eq("id", id).single();
  return NextResponse.json(team);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { count, error: countError } = await getDb().from("records").select("id", { count: "exact", head: true }).eq("team_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if (count) return NextResponse.json({ error: "该团队有签到历史，不能删除" }, { status: 409 });
  const { error } = await getDb().from("teams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
