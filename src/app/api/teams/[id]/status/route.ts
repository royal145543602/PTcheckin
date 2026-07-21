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

  // Fetch ALL today's records in one query
  const { data: allRecords } = await db.from("records")
    .select("member_id, type, time, signature")
    .eq("team_id", id)
    .gte("time", `${todayStr}T00:00:00+08:00`)
    .lte("time", `${todayStr}T23:59:59+08:00`)
    .order("time", { ascending: false });

  // Group records by member
  const recordsByMember = new Map<string, any[]>();
  for (const r of allRecords || []) {
    if (!recordsByMember.has(r.member_id)) recordsByMember.set(r.member_id, []);
    recordsByMember.get(r.member_id)!.push(r);
  }

  const membersWithStatus: MemberStatus[] = (members || []).map((m: any) => {
    const recs = recordsByMember.get(m.id) || [];
    if (recs.length === 0) {
      return { id: m.id, name: m.name, status: "none", lastCheckIn: null, lastCheckOut: null, lastSignatureIn: null, lastSignatureOut: null };
    }
    const lastRecord = recs[0];
    const lastIn = recs.find((r: any) => r.type === "in");
    const lastOut = recs.find((r: any) => r.type === "out");

    return {
      id: m.id, name: m.name,
      status: lastRecord.type === "in" ? "in" : "out",
      lastCheckIn: lastIn?.time || null,
      lastCheckOut: lastOut?.time || null,
      lastSignatureIn: lastIn?.signature ? JSON.parse(lastIn.signature) : null,
      lastSignatureOut: lastOut?.signature ? JSON.parse(lastOut.signature) : null,
    };
  });

  const present = membersWithStatus.filter((m) => m.status === "in").length;
  const gone = membersWithStatus.filter((m) => m.status === "out").length;
  const absent = membersWithStatus.filter((m) => m.status === "none").length;

  return NextResponse.json({
    team: { id: team.id, name: team.name, created_at: team.created_at },
    members: membersWithStatus,
    stats: { present, absent, gone, total: (members || []).length },
  });
}
