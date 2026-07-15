"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import StatsBar from "@/components/StatsBar";

interface MemberStatus {
  id: string; name: string; status: "in" | "out" | "none";
  lastCheckIn: string | null; lastCheckOut: string | null;
}
interface TeamStatus {
  team: { id: string; name: string; createdAt: string };
  members: MemberStatus[];
  stats: { present: number; absent: number; gone: number; total: number };
}

export default function ViewPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [data, setData] = useState<TeamStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/status`);
      if (!res.ok) return;
      setData(await res.json());
      setLastUpdate(new Date().toLocaleTimeString("zh-CN"));
    } catch {}
  }, [teamId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!data) {
    return <main className="flex items-center justify-center min-h-screen"><p className="text-gray-400">加载中...</p></main>;
  }

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const statusBadge = (status: "in" | "out" | "none", checkIn: string | null, checkOut: string | null) => {
    if (status === "in") return { color: "bg-green-500", text: `签到 ${formatTime(checkIn)}` };
    if (status === "out") return { color: "bg-red-400", text: `已走 ${formatTime(checkOut)}` };
    return { color: "bg-gray-300", text: "未到" };
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">{data.team.name}</h1>
        <button onClick={fetchStatus} className="text-sm text-blue-600 underline">刷新</button>
      </div>

      {lastUpdate && <div className="text-center text-xs text-gray-400 py-1">最后更新: {lastUpdate}</div>}

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-2">
        {data.members.map((m) => {
          const badge = statusBadge(m.status, m.lastCheckIn, m.lastCheckOut);
          return (
            <div key={m.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${badge.color}`} />
                <span className="text-lg font-medium">{m.name}</span>
              </div>
              <span className="text-sm text-gray-500">{badge.text}</span>
            </div>
          );
        })}
      </div>

      <StatsBar {...data.stats} />
    </main>
  );
}
