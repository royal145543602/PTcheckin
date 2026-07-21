import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = bjNow.toISOString().split("T")[0];

  const result = db.prepare(
    "DELETE FROM records WHERE team_id = ? AND date(time, '+08:00') = ?"
  ).run(id, todayStr);

  return NextResponse.json({ deleted: result.changes });
}
