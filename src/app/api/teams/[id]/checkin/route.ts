import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await params;
  const { memberId, type, signature } = await request.json();
  if (!memberId || !type || !["in", "out"].includes(type)) return NextResponse.json({ error: "参数无效" }, { status: 400 });

  const { data: member } = await db.from("members").select("id").eq("id", memberId).eq("team_id", teamId).single();
  if (!member) return NextResponse.json({ error: "成员不存在" }, { status: 404 });

  const recordId = uuidv4();
  const time = new Date().toISOString();
  const sigStr = signature ? JSON.stringify(signature) : null;

  const { error } = await db.from("records").insert({ id: recordId, member_id: memberId, team_id: teamId, type, time, signature: sigStr });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: recordId, memberId, teamId, type, time, signature: sigStr }, { status: 201 });
}
