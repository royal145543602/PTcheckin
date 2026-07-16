"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import MemberCard from "@/components/MemberCard";
import AddMemberModal from "@/components/AddMemberModal";
import SignatureModal from "@/components/SignatureModal";
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

export default function KioskPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [data, setData] = useState<TeamStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [signModal, setSignModal] = useState<{ memberId: string; name: string; currentStatus: "in" | "out" | "none" } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/status`);
      if (!res.ok) throw new Error("加载失败");
      setData(await res.json());
      setError("");
    } catch {
      setError("无法加载团队数据");
    }
  }, [teamId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  function handleCardClick(memberId: string, name: string, currentStatus: "in" | "out" | "none") {
    setSignModal({ memberId, name, currentStatus });
  }

  async function handleSignConfirm(signature: import("@/lib/types").SignatureData | null) {
    if (!signModal) return;
    const type = signModal.currentStatus === "in" ? "out" : "in";
    try {
      await fetch(`/api/teams/${teamId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: signModal.memberId, type, signature }),
      });
      setSignModal(null);
      await fetchStatus();
    } catch {
      setError("操作失败，请重试");
    }
  }

  async function handleAddMember(name: string) {
    await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isPreset: false }),
    });
    await fetchStatus();
  }

  if (error && !data) {
    return <main className="flex items-center justify-center min-h-screen"><p className="text-red-500">{error}</p></main>;
  }
  if (!data) {
    return <main className="flex items-center justify-center min-h-screen"><p className="text-gray-400">加载中...</p></main>;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">{data.team.name}</h1>
        <a href="/admin" className="text-sm text-gray-500 underline">管理</a>
      </div>

      {/* Error toast */}
      {error && <div className="bg-red-100 text-red-700 text-center py-2 text-sm">{error}</div>}

      {/* Member Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
        {data.members.map((m) => (
          <MemberCard
            key={m.id}
            name={m.name}
            status={m.status}
            lastCheckIn={m.lastCheckIn}
            lastCheckOut={m.lastCheckOut}
            onClick={() => handleCardClick(m.id, m.name, m.status)}
          />
        ))}
        <button
          onClick={() => setModalOpen(true)}
          className="min-h-[80px] sm:min-h-[100px] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg font-medium hover:border-gray-400 transition-colors"
        >
          + 添加
        </button>
      </div>

      {/* Stats */}
      <StatsBar {...data.stats} />

      <AddMemberModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAddMember} />

      <SignatureModal
        isOpen={signModal !== null}
        onClose={() => setSignModal(null)}
        onConfirm={handleSignConfirm}
        memberName={signModal?.name || ""}
        actionType={signModal?.currentStatus === "in" ? "out" : "in"}
      />
    </main>
  );
}
