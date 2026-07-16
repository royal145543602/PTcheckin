"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import StatsBar from "@/components/StatsBar";
import SignatureViewer from "@/components/SignatureViewer";
import HistoryDayList from "@/components/HistoryDayList";

interface MemberStatus {
  id: string; name: string; status: "in" | "out" | "none";
  lastCheckIn: string | null; lastCheckOut: string | null;
  lastSignatureIn?: import("@/lib/types").SignatureData;
  lastSignatureOut?: import("@/lib/types").SignatureData;
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
  const [historyModal, setHistoryModal] = useState<{ memberId: string; name: string } | null>(null);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [hFrom, setHFrom] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [hTo, setHTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [sigViewer, setSigViewer] = useState<{ name: string; strokes: import("@/lib/types").SignatureData; label: string } | null>(null);

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

  const fetchMemberHistory = useCallback(async () => {
    if (!historyModal) return;
    const res = await fetch(`/api/members/${historyModal.memberId}/records?from=${hFrom}&to=${hTo}`);
    const data = await res.json();
    setMemberHistory(data.days || []);
  }, [historyModal, hFrom, hTo]);

  useEffect(() => { fetchMemberHistory(); }, [fetchMemberHistory]);

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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{badge.text}</span>
                {m.lastSignatureIn && (
                  <button onClick={() => setSigViewer({ name: m.name, strokes: m.lastSignatureIn!, label: "签到签名" })} className="text-xs text-blue-600 underline">
                    查看签名
                  </button>
                )}
                {m.lastSignatureOut && (
                  <button onClick={() => setSigViewer({ name: m.name, strokes: m.lastSignatureOut!, label: "签退签名" })} className="text-xs text-blue-600 underline">
                    查看签退
                  </button>
                )}
                <button onClick={() => setHistoryModal({ memberId: m.id, name: m.name })} className="text-xs text-blue-600 underline">
                  查看历史
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <StatsBar {...data.stats} />

      {sigViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSigViewer(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">{sigViewer.name} - {sigViewer.label}</h3>
            <SignatureViewer strokes={sigViewer.strokes} />
            <button onClick={() => setSigViewer(null)} className="mt-4 w-full bg-gray-200 py-2 rounded-xl text-sm font-medium">
              关闭
            </button>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">{historyModal.name} - 签到历史</h3>
            <HistoryDayList
              days={memberHistory}
              from={hFrom}
              to={hTo}
              onFromChange={setHFrom}
              onToChange={setHTo}
              onViewSignature={(name, strokes, label) => setSigViewer({ name, strokes, label })}
              showMemberName={false}
            />
            <button onClick={() => setHistoryModal(null)} className="mt-4 w-full bg-gray-200 py-2 rounded-xl text-sm font-medium">关闭</button>
          </div>
        </div>
      )}
    </main>
  );
}
