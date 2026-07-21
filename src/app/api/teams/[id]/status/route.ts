import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { MemberStatus } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: team } = await db.from("teams").select("id, name, created_at").eq("id", id).single();
  if (!team) return NextResponse.json({ error: "团队不存在" }, { status: 404 });

  const { data: members } = await db.from("members").select("id, name").eq("team_id", id).order("name");

  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = bjNow.toISOString().split("T")[0];
  const todayStart = `${todayStr}T00:00:00.000Z`;

  const membersWithStatus: MemberStatus[] = [];
  for (const m of members || []) {
    const { data: todayRecords } = await db.from("records")
      .select("type, time, signature")
      .eq("member_id", m.id)
      .gte("time", `${todayStr}T00:00:00+08:00`)
      .lte("time", `${todayStr}T23:59:59+08:00`)
      .order("time", { ascending: false })
      .limit(1);

    const records = todayRecords || [];

    if (records.length === 0) {
      membersWithStatus.push({ id: m.id, name: m.name, status: "none", lastCheckIn: null, lastCheckOut: null, lastSignatureIn: null, lastSignatureOut: null });
      continue;
    }

    const lastRecord = records[0];
    const lastIn = records.find((r: any) => r.type === "in");
    const lastOut = records.find((r: any) => r.type === "out");

    membersWithStatus.push({
      id: m.id, name: m.name,
      status: lastRecord.type === "in" ? "in" : "out",
      lastCheckIn: lastIn?.time || null,
      lastCheckOut: lastOut?.time || null,
      lastSignatureIn: lastIn?.signature ? JSON.parse(lastIn.signature) : null,
      lastSignatureOut: lastOut?.signature ? JSON.parse(lastOut.signature) : null,
    });
  }

  const present = membersWithStatus.filter((m) => m.status === "in").length;
  const gone = membersWithStatus.filter((m) => m.status === "out").length;
  const absent = membersWithStatus.filter((m) => m.status === "none").length;

  return NextResponse.json({
    team: { id: team.id, name: team.name, created_at: team.created_at },
    members: membersWithStatus,
    stats: { present, absent, gone, total: (members || []).length },
  });
}
