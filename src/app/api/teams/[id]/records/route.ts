import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const db = getDb();

  const team = db.prepare("SELECT id FROM teams WHERE id = ?").get(id);
  if (!team) return NextResponse.json({ error: "团队不存在" }, { status: 404 });

  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const defaultTo = now.toISOString().split("T")[0];
  const from = searchParams.get("from") || defaultFrom;
  const to = searchParams.get("to") || defaultTo;

  const records = db.prepare(`
    SELECT r.id, r.type, r.time, r.signature, m.name as memberName
    FROM records r
    JOIN members m ON r.member_id = m.id
    WHERE r.team_id = ? AND date(r.time) >= ? AND date(r.time) <= ?
    ORDER BY r.time DESC
  `).all(id, from, to) as any[];

  const dayMap = new Map<string, any[]>();
  for (const r of records) {
    const date = r.time.split("T")[0];
    if (!dayMap.has(date)) dayMap.set(date, []);
    dayMap.get(date)!.push({
      id: r.id,
      memberName: r.memberName,
      type: r.type,
      time: r.time,
      signature: r.signature ? JSON.parse(r.signature) : null,
    });
  }

  const days = Array.from(dayMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, recs]) => ({ date, records: recs }));

  return NextResponse.json({ days });
}
