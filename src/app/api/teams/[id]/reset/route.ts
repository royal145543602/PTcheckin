import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const bjNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const todayStr = bjNow.toISOString().split("T")[0];
  const { error, count } = await db.from("records").delete().eq("team_id", id).gte("time", `${todayStr}T00:00:00+08:00`).lte("time", `${todayStr}T23:59:59+08:00`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: count || 0 });
}
