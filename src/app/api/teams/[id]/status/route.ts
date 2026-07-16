import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { MemberStatus } from "@/lib/types";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const team = db.prepare("SELECT id, name, created_at as createdAt FROM teams WHERE id = ?").get(id) as any;
  if (!team) return NextResponse.json({ error: "团队不存在" }, { status: 404 });

  const members = db.prepare(
    "SELECT id, team_id as teamId, name, is_preset as isPreset FROM members WHERE team_id = ? ORDER BY name"
  ).all(id) as any[];

  const membersWithStatus: MemberStatus[] = members.map((m: any) => {
    const lastRecord = db.prepare(
      "SELECT type, time FROM records WHERE member_id = ? ORDER BY time DESC, rowid DESC LIMIT 1"
    ).get(m.id) as any;

    if (!lastRecord) {
      return { id: m.id, name: m.name, status: "none", lastCheckIn: null, lastCheckOut: null, lastSignatureIn: null, lastSignatureOut: null };
    }

    const allRecords = db.prepare(
      "SELECT type, time FROM records WHERE member_id = ? ORDER BY time DESC"
    ).all(m.id) as any[];

    const lastCheckIn = allRecords.find((r: any) => r.type === "in")?.time || null;
    const lastCheckOut = allRecords.find((r: any) => r.type === "out")?.time || null;

    const status = lastRecord.type === "in" ? "in" : "out";

    return { id: m.id, name: m.name, status, lastCheckIn, lastCheckOut, lastSignatureIn: null, lastSignatureOut: null };
  });

  const present = membersWithStatus.filter((m) => m.status === "in").length;
  const gone = membersWithStatus.filter((m) => m.status === "out").length;
  const absent = membersWithStatus.filter((m) => m.status === "none").length;

  return NextResponse.json({
    team,
    members: membersWithStatus,
    stats: { present, absent, gone, total: members.length },
  });
}
