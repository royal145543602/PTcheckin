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
  const [confirmModal, setConfirmModal] = useState<{ memberId: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; recordId: string } | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [undoMenu, setUndoMenu] = useState<{ memberId: string; name: string; x: number; y: number } | null>(null);
  const [lastBatch, setLastBatch] = useState<string[]>([]); // record IDs for batch undo

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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    if (batchMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(memberId)) next.delete(memberId); else next.add(memberId);
        return next;
      });
      return;
    }
    if (currentStatus === "in") {
      setConfirmModal({ memberId, name });
    } else if (currentStatus === "out") {
      // Show undo mini-menu - position near the click
      setUndoMenu({ memberId, name, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    } else {
      setSignModal({ memberId, name, currentStatus });
    }
  }

  async function handleUndoCheckout(memberId: string) {
    // Find and delete the last "out" record for this member today
    const bjNow = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
    const todayStr = bjNow.toISOString().split("T")[0];
    const res = await fetch(`/api/teams/${teamId}/records?from=${todayStr}&to=${todayStr}`);
    const data = await res.json();
    // Find today's records, get the out record
    const todayRecords = data.days[0]?.records || [];
    const lastOut = todayRecords.find((r: any) => r.type === "out" && r.memberName === status?.members.find(m => m.id === memberId)?.name);
    if (lastOut) {
      await fetch(`/api/records/${lastOut.id}`, { method: "DELETE" });
      setToast({ message: `已撤销签退`, recordId: lastOut.id });
    }
    setUndoMenu(null);
    await fetchStatus();
  }

  function handleConfirmSignOut() {
    if (!confirmModal) return;
    setSignModal({ memberId: confirmModal.memberId, name: confirmModal.name, currentStatus: "in" });
    setConfirmModal(null);
  }

  async function handleSignConfirm(signature: SignatureData | null) {
    if (!signModal || !teamId) return;
    const type = signModal.currentStatus === "in" ? "out" : "in";
    const res = await fetch(`/api/teams/${teamId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: signModal.memberId, type, signature }),
    });
    const record = await res.json();
    setSignModal(null);
    await fetchStatus();
    // Show toast
    const actionLabel = type === "in" ? "签到" : "签退";
    setToast({ message: `${signModal.name} 已${actionLabel}`, recordId: record.id });
  }

  async function handleBatch(action: "in" | "out") {
    if (!status) return;
    // Filter: only sign in those NOT already in, only sign out those who ARE in
    const validIds = Array.from(selectedIds).filter((id) => {
      const member = status.members.find((m) => m.id === id);
      if (!member) return false;
      if (action === "in") return member.status !== "in";  // skip already signed in
      return member.status === "in";  // only sign out those present
    });
    if (validIds.length === 0) {
      setBatchMode(false);
      return;
    }
    const records: string[] = [];
    for (const memberId of validIds) {
      const res = await fetch(`/api/teams/${teamId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, type: action, signature: null }),
      });
      const record = await res.json();
      records.push(record.id);
    }
    setLastBatch(records);
    const label = action === "in" ? "签到" : "签退";
    setToast({ message: `批量${label} ${validIds.length} 人`, recordId: records.join(",") });
    setBatchMode(false);
    await fetchStatus();
  }

  async function handleBatchUndo() {
    if (!toast || !toast.recordId.includes(",")) return;
    const ids = toast.recordId.split(",");
    for (const id of ids) {
      await fetch(`/api/records/${id}`, { method: "DELETE" });
    }
    setToast(null);
    setLastBatch([]);
    await fetchStatus();
  }

  async function handleUndo() {
    if (!toast) return;
    if (toast.recordId.includes(",")) {
      // Batch undo
      await handleBatchUndo();
    } else {
      // Single undo
      await fetch(`/api/records/${toast.recordId}`, { method: "DELETE" });
      setToast(null);
      await fetchStatus();
    }
  }

  const viewUrl = teamId ? `${window.location.origin}/view/${teamId}` : "";

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-xl">☰</button>
        <span className="text-sm font-medium">{timeStr}</span>
        {teamId && (
          <button onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }} className={`text-sm font-medium ${batchMode ? "text-blue-600" : "text-gray-500"}`}>
            {batchMode ? "取消" : "批量"}
          </button>
        )}
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
              <div key={m.id} className="relative">
                {batchMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(m.id)}
                      onChange={() => handleCardClick(m.id, m.name, m.status)}
                      className="w-5 h-5 accent-blue-600"
                    />
                  </div>
                )}
                <MemberCard
                  name={m.name}
                  status={m.status}
                  lastCheckIn={m.lastCheckIn}
                  lastCheckOut={m.lastCheckOut}
                  onClick={() => handleCardClick(m.id, m.name, m.status)}
                />
              </div>
            ))}
            <button
              onClick={() => setAddModalOpen(true)}
              className="min-h-[80px] sm:min-h-[100px] rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg font-medium hover:border-gray-400 transition-colors"
            >
              + 添加
            </button>
          </div>
          <StatsBar {...status.stats} />
          {batchMode && (
            <div className="bg-white border-t px-4 py-3 space-y-2">
              <div className="flex gap-2 justify-center">
                <button onClick={() => setSelectedIds(new Set(status?.members.map(m => m.id) || []))} className="text-xs text-blue-600 underline">
                  全选
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-400 underline">
                  全部取消
                </button>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => handleBatch("in")} disabled={selectedIds.size === 0} className="bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                  全部签到
                </button>
                <button onClick={() => handleBatch("out")} disabled={selectedIds.size === 0} className="bg-red-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                  全部签退
                </button>
              </div>
            </div>
          )}
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

      {/* Undo Checkout Mini Menu */}
      {undoMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setUndoMenu(null)}>
          <div className="absolute bg-white rounded-xl shadow-lg border p-2" style={{ left: undoMenu.x - 80, top: undoMenu.y - 40 }}>
            <button onClick={() => handleUndoCheckout(undoMenu.memberId)} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg">
              撤销签退
            </button>
            <button onClick={() => setUndoMenu(null)} className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100 rounded-lg">
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Confirm Sign-Out Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">确认签退</h3>
            <p className="text-sm text-gray-500 mb-4">{confirmModal.name} 确定要签退吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-gray-200 py-3 rounded-xl text-base font-medium">取消</button>
              <button onClick={handleConfirmSignOut} className="flex-1 bg-red-500 text-white py-3 rounded-xl text-base font-medium">确定签退</button>
            </div>
          </div>
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
      {/* Undo Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm">✅ {toast.message}</span>
          <button onClick={handleUndo} className="text-sm text-yellow-400 font-medium underline">撤销</button>
        </div>
      )}
    </main>
  );
}
