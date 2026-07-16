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

  // Today in Beijing time (UTC+8)
  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = bjNow.toISOString().split("T")[0];

  const membersWithStatus: MemberStatus[] = members.map((m: any) => {
    const todayRecords = db.prepare(
      "SELECT type, time, signature FROM records WHERE member_id = ? AND date(time, '+08:00') = ? ORDER BY time DESC, rowid DESC"
    ).all(m.id, todayStr) as any[];

    if (todayRecords.length === 0) {
      return { id: m.id, name: m.name, status: "none", lastCheckIn: null, lastCheckOut: null, lastSignatureIn: null, lastSignatureOut: null };
    }

    const lastRecord = todayRecords[0];
    const lastIn = todayRecords.find((r: any) => r.type === "in");
    const lastOut = todayRecords.find((r: any) => r.type === "out");

    const lastCheckIn = lastIn?.time || null;
    const lastCheckOut = lastOut?.time || null;
    const lastSignatureIn = lastIn?.signature ? JSON.parse(lastIn.signature) : null;
    const lastSignatureOut = lastOut?.signature ? JSON.parse(lastOut.signature) : null;

    const status = lastRecord.type === "in" ? "in" : "out";

    return { id: m.id, name: m.name, status, lastCheckIn, lastCheckOut, lastSignatureIn, lastSignatureOut };
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
