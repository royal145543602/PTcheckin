import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const from = searchParams.get("from") || new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const to = searchParams.get("to") || now.toISOString().split("T")[0];

  const { data: records, error } = await db.from("records")
    .select("id, type, time, signature, members!inner(name)")
    .eq("team_id", id)
    .gte("time", `${from}T00:00:00.000Z`)
    .lte("time", `${to}T23:59:59.999Z`)
    .order("time", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dayMap = new Map<string, any[]>();
  for (const r of records || []) {
    const date = r.time.split("T")[0];
    if (!dayMap.has(date)) dayMap.set(date, []);
    dayMap.get(date)!.push({
      id: r.id, memberName: (r as any).members?.name || "",
      type: r.type, time: r.time,
      signature: (() => { try { return r.signature ? JSON.parse(r.signature) : null; } catch { return null; } })(),
    });
  }

  const days = Array.from(dayMap.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([date, recs]) => ({ date, records: recs }));
  return NextResponse.json({ days });
}
