import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await params;
  if (Number(request.headers.get("content-length") || 0) > 100_000) {
    return NextResponse.json({ error: "签名资料过大" }, { status: 413 });
  }
  const body = await request.json().catch(() => null);
  const { memberId, type, signature } = body || {};
  if (typeof memberId !== "string" || !["in", "out"].includes(type)) return NextResponse.json({ error: "参数无效" }, { status: 400 });

  const { data: member } = await getDb().from("members").select("id").eq("id", memberId).eq("team_id", teamId).is("deleted_at", null).single();
  if (!member) return NextResponse.json({ error: "成员不存在" }, { status: 404 });

  const recordId = uuidv4();
  const time = new Date().toISOString();
  const sigStr = signature ? JSON.stringify(signature) : null;
  if (sigStr && sigStr.length > 100_000) return NextResponse.json({ error: "签名资料过大" }, { status: 413 });

  const { error } = await getDb().from("records").insert({ id: recordId, member_id: memberId, team_id: teamId, type, time, signature: sigStr });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: recordId, memberId, teamId, type, time, signature: sigStr }, { status: 201 });
}
