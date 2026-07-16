"use client";

import { useState, useEffect, useCallback } from "react";
import MemberCard from "@/components/MemberCard";
import AddMemberModal from "@/components/AddMemberModal";
import SignatureModal from "@/components/SignatureModal";
import StatsBar from "@/components/StatsBar";
import HistoryDayList from "@/components/HistoryDayList";
import SignatureViewer from "@/components/SignatureViewer";
import Sidebar from "@/components/Sidebar";
import type { SignatureData } from "@/lib/types";

interface Team { id: string; name: string; createdAt: string; }
interface Member { id: string; teamId: string; name: string; isPreset: boolean; }
interface MemberStatus {
  id: string; name: string; status: "in" | "out" | "none";
  lastCheckIn: string | null; lastCheckOut: string | null;
  lastSignatureIn: SignatureData | null; lastSignatureOut: SignatureData | null;
}
interface TeamStatus {
  team: Team;
  members: MemberStatus[];
  stats: { present: number; absent: number; gone: number; total: number };
}

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [tab, setTab] = useState<"checkin" | "history">("checkin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  const [status, setStatus] = useState<TeamStatus | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [signModal, setSignModal] = useState<{ memberId: string; name: string; currentStatus: "in" | "out" | "none" } | null>(null);

  const [historyDays, setHistoryDays] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [sigViewer, setSigViewer] = useState<{ name: string; strokes: SignatureData; label: string } | null>(null);
  const [newTeamName, setNewTeamName] = useState("");

  // Clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
      setTimeStr(`${bj.getFullYear()}年${bj.getMonth() + 1}月${bj.getDate()}日 周${weekdays[bj.getDay()]} ${String(bj.getHours()).padStart(2, "0")}:${String(bj.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  // Load teams
  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
    const saved = localStorage.getItem("lastTeamId");
    if (saved && data.some((t: Team) => t.id === saved)) {
      setTeamId(saved);
    } else if (data.length > 0) {
      setTeamId(data[0].id);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, []);

  useEffect(() => {
    if (teamId) localStorage.setItem("lastTeamId", teamId);
  }, [teamId]);

  const fetchMembers = useCallback(async () => {
    if (!teamId) return;
    const res = await fetch(`/api/teams/${teamId}/members`);
    setMembers(await res.json());
  }, [teamId]);

  useEffect(() => { fetchMembers(); }, [teamId]);

  // Check-in status
  const fetchStatus = useCallback(async () => {
    if (!teamId) return;
    const res = await fetch(`/api/teams/${teamId}/status`);
    setStatus(await res.json());
  }, [teamId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // History
  const fetchHistory = useCallback(async () => {
    if (!teamId) return;
    const res = await fetch(`/api/teams/${teamId}/records?from=${dateFrom}&to=${dateTo}`);
    const data = await res.json();
    setHistoryDays(data.days || []);
  }, [teamId, dateFrom, dateTo]);

  useEffect(() => { if (tab === "history") fetchHistory(); }, [fetchHistory, tab]);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    setNewTeamName("");
    await fetchTeams();
  }

  async function handleAddMember(name: string) {
    if (!teamId) return;
    await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isPreset: false }),
    });
    await Promise.all([fetchMembers(), fetchStatus()]);
  }

  async function handleDeleteMember(memberId: string) {
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    await Promise.all([fetchMembers(), fetchStatus()]);
  }

  function handleCardClick(memberId: string, name: string, currentStatus: "in" | "out" | "none") {
    setSignModal({ memberId, name, currentStatus });
  }

  async function handleSignConfirm(signature: SignatureData | null) {
    if (!signModal || !teamId) return;
    const type = signModal.currentStatus === "in" ? "out" : "in";
    await fetch(`/api/teams/${teamId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: signModal.memberId, type, signature }),
    });
    setSignModal(null);
    await fetchStatus();
  }

  const viewUrl = teamId ? `${window.location.origin}/view/${teamId}` : "";

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
        <span className="text-sm font-medium">{timeStr}</span>
        <div className="w-8" />
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b flex">
        <button
          onClick={() => setTab("checkin")}
          className={`flex-1 py-2.5 text-sm font-medium ${tab === "checkin" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          签到
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-2.5 text-sm font-medium ${tab === "history" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          历史
        </button>
      </div>

      {/* No team state */}
      {!teamId && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-gray-400 mb-4">还没有团队</p>
            <form onSubmit={createTeam} className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="输入团队名称"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">创建</button>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Tab */}
      {teamId && tab === "checkin" && status && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
            {status.members.map((m) => (
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
              onClick={() => setAddModalOpen(true)}
              className="min-h-[80px] sm:min-h-[100px] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg font-medium hover:border-gray-400 transition-colors"
            >
              + 添加
            </button>
          </div>
          <StatsBar {...status.stats} />
        </div>
      )}

      {/* History Tab */}
      {teamId && tab === "history" && (
        <div className="flex-1 p-4">
          <HistoryDayList
            days={historyDays}
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onViewSignature={(name, strokes, label) => setSigViewer({ name, strokes, label })}
          />
        </div>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        teams={teams}
        selectedTeamId={teamId}
        onSelectTeam={setTeamId}
        members={members}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        viewUrl={viewUrl}
      />

      <AddMemberModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddMember}
      />

      <SignatureModal
        isOpen={signModal !== null}
        onClose={() => setSignModal(null)}
        onConfirm={handleSignConfirm}
        memberName={signModal?.name || ""}
        actionType={signModal?.currentStatus === "in" ? "out" : "in"}
      />

      {sigViewer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSigViewer(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">{sigViewer.name} - {sigViewer.label}</h3>
            <SignatureViewer strokes={sigViewer.strokes} />
            <button onClick={() => setSigViewer(null)} className="mt-4 w-full bg-gray-200 py-2 rounded-xl text-sm font-medium">关闭</button>
          </div>
        </div>
      )}
    </main>
  );
}
