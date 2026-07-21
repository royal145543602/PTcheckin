"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { gsap, useGSAP, useReducedMotion } from "@/lib/gsap";
import MemberCard from "@/components/MemberCard";
import AddMemberModal from "@/components/AddMemberModal";
import SignatureModal from "@/components/SignatureModal";
import StatsBar from "@/components/StatsBar";
import HistoryDayList from "@/components/HistoryDayList";
import SignatureViewer from "@/components/SignatureViewer";
import Sidebar from "@/components/Sidebar";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import AnimatedModal from "@/components/AnimatedModal";
import Hamburger from "@/components/Hamburger";
import { IconUndo, IconBatch, IconCheckIn, IconHistory, IconSelectAll, IconDeselect, IconFootball, IconSignOut } from "@/components/icons";
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
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  type UndoEntry = { recordIds: string[]; label: string };
  const undoRef = useRef<UndoEntry[]>([]);
  const undoingRef = useRef<Set<number>>(new Set());
  const [undoStack, setUndoStack] = useState<UndoEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = JSON.parse(localStorage.getItem("undoStack") || "[]");
      const savedDate = localStorage.getItem("undoStackDate");
      const bjToday = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      if (savedDate !== bjToday) return [];
      return saved;
    } catch { return []; }
  });

  const batchPanelRef = useRef<HTMLDivElement>(null);
  const [historyDays, setHistoryDays] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [sigViewer, setSigViewer] = useState<{ name: string; strokes: SignatureData; label: string } | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [batchConfirm, setBatchConfirm] = useState<{ action: "in" | "out"; validIds: string[]; skipped: number; valid: number } | null>(null);

  // ── GSAP tab transition ──
  const tabContentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Choreographed entrance ──
  const reduceMotion = useReducedMotion();
  // FOUC gate: pre-hide cards before GSAP reveals them
  useEffect(() => {
    document.documentElement.classList.add("js-ready");
  }, []);

  useGSAP(() => {
    if (!tabContentRef.current) return;
    if (reduceMotion) { gsap.set([tabContentRef.current, ".member-card"], { autoAlpha: 1 }); return; }
    const tabChanged = lastTabRef.current !== tab;
    lastTabRef.current = tab;
    const tl = gsap.timeline();
    if (tabChanged) {
      tl.fromTo(tabContentRef.current, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.28, ease: "expo.out" });
    }
    if (hasStaggered.current || !status?.members?.length) return;
    hasStaggered.current = true;
    tl.fromTo(".member-card",
      { autoAlpha: 0, y: 20, scale: 0.94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, stagger: { each: 0.025, from: "start" }, ease: "expo.out", clearProps: "transform" },
      tabChanged ? "-=0.12" : "0"
    );
  }, { dependencies: [tab, status?.members?.length, reduceMotion] });

  // ── GSAP card stagger entrance (first load only) ──
  const hasStaggered = useRef(false);
  const lastTabRef = useRef(tab);

  // ── Batch panel slide ──
  useGSAP(() => {
    const el = batchPanelRef.current;
    if (!el) return;
    if (batchMode) {
      gsap.fromTo(el, { y: 24, autoAlpha: 0, display: "none" }, { y: 0, autoAlpha: 1, display: "block", duration: 0.35, ease: "expo.out" });
    } else {
      gsap.to(el, { y: 16, autoAlpha: 0, display: "none", duration: 0.2, ease: "power3.in" });
    }
  }, { dependencies: [batchMode], scope: batchPanelRef });

  // Card stagger is handled by the choreographed timeline above (lines 85-103)

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
  useEffect(() => { undoRef.current = undoStack; }, [undoStack]);

  useEffect(() => {
    if (teamId) localStorage.setItem("lastTeamId", teamId);
    setBatchMode(false);
    setSelectedIds(new Set());
  }, [teamId]);

  const fetchMembers = useCallback(async () => {
    if (!teamId) return;
    const res = await fetch(`/api/teams/${teamId}/members`);
    setMembers(await res.json());
  }, [teamId]);

  useEffect(() => { fetchMembers(); }, [teamId]);

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
    } else {
      setSignModal({ memberId, name, currentStatus });
    }
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
    if (!res.ok) { setToastMsg("操作失败，请重试"); return; }
    const record = await res.json();
    if (!record.id) { setToastMsg("操作失败，请重试"); return; }
    setSignModal(null);
    await fetchStatus();
    const actionLabel = type === "in" ? "签到" : "签退";
    const entry: UndoEntry = { recordIds: [record.id], label: `${signModal.name} ${actionLabel}` };
    setUndoStack(prev => {
      const next = [entry, ...prev].slice(0, 20);
      localStorage.setItem("undoStack", JSON.stringify(next));
      const bjToday = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      localStorage.setItem("undoStackDate", bjToday);
      return next;
    });
  }

  async function handleBatch(action: "in" | "out") {
    if (!status) return;
    const validIds = Array.from(selectedIds).filter((id) => {
      const member = status.members.find((m) => m.id === id);
      if (!member) return false;
      if (action === "in") return member.status === "none";
      return member.status === "in";
    });
    const skipped = selectedIds.size - validIds.length;
    if (validIds.length === 0) { setToastMsg(action === "in" ? "所选成员无需签到" : "所选成员无需签退"); return; }
    if (skipped > 0) {
      setBatchConfirm({ action, validIds, skipped, valid: validIds.length });
      return;
    }
    await executeBatch(action, validIds);
  }

  async function executeBatch(action: "in" | "out", validIds: string[]) {
    const records: string[] = [];
    for (const memberId of validIds) {
      const res = await fetch(`/api/teams/${teamId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, type: action, signature: null }),
      });
      if (!res.ok) continue;
      const record = await res.json();
      if (record.id) records.push(record.id);
    }
    if (records.length === 0) { setToastMsg("操作失败"); return; }
    const label = action === "in" ? "签到" : "签退";
    const entry: UndoEntry = { recordIds: records, label: `批量${label} ${validIds.length} 人` };
    setUndoStack(prev => {
      const next = [entry, ...prev].slice(0, 20);
      localStorage.setItem("undoStack", JSON.stringify(next));
      const bjToday = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split("T")[0];
      localStorage.setItem("undoStackDate", bjToday);
      return next;
    });
    setSelectedIds(new Set());
    await fetchStatus();
  }

  function handleResetTodayClick() {
    setResetConfirm(true);
  }
  async function handleResetToday() {
    setResetConfirm(false);
    if (!teamId) return;
    await fetch(`/api/teams/${teamId}/reset`, { method: "POST" });
    setUndoStack([]);
    localStorage.removeItem("undoStack");
    await fetchStatus();
  }

  async function handleUndo(index: number) {
    if (undoStack.length === 0) return;
    if (undoingRef.current.has(index)) return;
    const entry = undoRef.current[index];
    if (!entry) return;
    undoingRef.current = new Set(undoingRef.current).add(index);
    for (const id of entry.recordIds) {
      try { await fetch(`/api/records/${id}`, { method: "DELETE" }); } catch {}
    }
    undoingRef.current.delete(index);
    const undoLabel = entry.label;
    setUndoStack(prev => {
      const next = prev.filter((_, i) => i !== index);
      undoRef.current = next;
      localStorage.setItem("undoStack", JSON.stringify(next));
      if (next.length === 0) localStorage.removeItem("undoStackDate");
      return next;
    });
    await fetchStatus();
    setToastMsg(`已撤销 ${undoLabel}`);
  }

  const viewUrl = teamId ? `${window.location.origin}/view/${teamId}` : "";
  const teamName = status?.team.name || teams.find(t => t.id === teamId)?.name || "";

  return (
    <main className="min-h-screen flex flex-col relative" style={{ background: "var(--bg)", zIndex: 1 }}>
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-4" style={{ background: "#0a1a0f", color: "#fff" }}>
        <Hamburger open={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="text-center flex-1 mx-4">
          {teamName && (
            <span className="text-lg font-black tracking-wide block leading-tight text-white" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>
              {teamName}
            </span>
          )}
          <span className="text-[10px] text-white/60 block uppercase tracking-widest">{timeStr}</span>
        </div>
        <div className="w-8 h-8" />
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-2 px-4 py-3 relative z-10" style={{ background: "#0d1f13" }}>
        <button
          onClick={() => setTab("checkin")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${tab === "checkin" ? "bg-[#00e85c] text-black" : "text-white/50 hover:text-white"}`}
          style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}
        ><IconCheckIn size={16} /> 签到</button>
        <button
          onClick={() => setTab("history")}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${tab === "history" ? "bg-[#00e85c] text-black" : "text-white/50 hover:text-white"}`}
          style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}
        ><IconHistory size={16} /> 历史</button>
        <div className="flex-1" />
        {teamId && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleUndo(0)} disabled={undoStack.length === 0} className="text-xs px-2 py-1.5 rounded-full text-white/60 hover:text-[#00e85c] border border-white/15 hover:border-[#00e85c] transition-all flex items-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed">
              <IconUndo size={13} /> 撤回
            </button>
            <button
              onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${batchMode ? "bg-[#00e85c] text-black" : "text-white/60 hover:text-white border border-white/20"}`}
            >
              <IconBatch size={13} /> {batchMode ? "完成" : "批量"}
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* No team state */}
        {!teamId && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center glass-card p-10 rounded-2xl">
              <div className="text-[var(--green)] mb-4"><IconFootball size={64} /></div>
              <p className="text-[var(--muted)] mb-6 text-lg font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>创建第一个团队</p>
              <form onSubmit={createTeam} className="flex gap-2">
                <input
                  className="input-pt text-sm"
                  placeholder="输入团队名称"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <button type="submit" className="bg-[var(--green)] text-white px-6 py-2 rounded-full text-sm font-bold hover:brightness-110 transition-all whitespace-nowrap">创建</button>
              </form>
            </div>
          </div>
        )}

        {/* Check-in Tab */}
        <div ref={tabContentRef} style={{ display: teamId && tab === "checkin" ? "flex" : "none", flex: 1, flexDirection: "column" }}>
          {status && (
            <>
              <div ref={gridRef} className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                {status.members.map((m) => (
                  <div key={m.id} className="member-card">
                    <MemberCard
                      name={m.name}
                      status={m.status}
                      lastCheckIn={m.lastCheckIn}
                      lastCheckOut={m.lastCheckOut}
                      onClick={() => handleCardClick(m.id, m.name, m.status)}
                      showCheckbox={batchMode}
                      checked={selectedIds.has(m.id)}
                    />
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 z-20">
                <StatsBar {...status.stats} />
              </div>

              {/* Batch controls */}
              <div ref={batchPanelRef} className="px-5 py-4" style={{ background: "#0a1a0f", borderTop: "1px solid rgba(255,255,255,0.06)", display: batchMode ? "block" : "none" }}>
                <div className="flex gap-4">
                  {/* Left — big square action buttons */}
                  <div className="flex gap-3 flex-[2]">
                    <button onClick={() => handleBatch("in")} disabled={selectedIds.size === 0} className="flex-1 aspect-square rounded-2xl bg-[#00e85c] text-black font-bold disabled:opacity-30 hover:brightness-110 transition-all flex flex-col items-center justify-center gap-0.5">
                      <IconCheckIn size={22} />
                      <span className="text-xs leading-tight">全部<br/>签到</span>
                    </button>
                    <button onClick={() => handleBatch("out")} disabled={selectedIds.size === 0} className="flex-1 aspect-square rounded-2xl bg-[#e83030] text-white font-bold disabled:opacity-30 hover:brightness-110 transition-all flex flex-col items-center justify-center gap-0.5">
                      <IconSignOut size={22} />
                      <span className="text-xs leading-tight">全部<br/>签退</span>
                    </button>
                  </div>
                  {/* Right — select buttons stacked, filling same height */}
                  <div className="flex flex-col gap-2 flex-1">
                    <button onClick={() => setSelectedIds(new Set(status?.members.map(m => m.id) || []))} className="flex-1 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-1.5"><IconSelectAll size={16} /> 全选</button>
                    <button onClick={() => setSelectedIds(new Set())} className="flex-1 bg-white/5 text-white/60 rounded-xl text-sm font-bold hover:bg-white/15 hover:text-white/80 transition-all flex items-center justify-center gap-1.5"><IconDeselect size={16} /> 取消</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* History Tab */}
        <div style={{ display: teamId && tab === "history" ? "block" : "none", flex: 1, padding: "1rem" }}>
          <HistoryDayList
            days={historyDays}
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onViewSignature={(name, strokes, label) => setSigViewer({ name, strokes, label })}
          />
        </div>
      </div>


      {/* ── Confirm Sign-Out Modal ── */}
      <AnimatedModal show={confirmModal !== null} onClose={() => setConfirmModal(null)}>
        <h3 className="text-lg font-bold mb-2 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>确认签退</h3>
        <p className="text-sm text-[var(--muted)] mb-4">{confirmModal?.name} 确定要签退吗？</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 rounded-xl text-base font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">取消</button>
          <button onClick={handleConfirmSignOut} className="flex-1 bg-[#e83030] text-white py-3 rounded-xl text-base font-bold hover:brightness-110 transition-all">确定签退</button>
        </div>
      </AnimatedModal>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        teams={teams}
        selectedTeamId={teamId}
        onSelectTeam={setTeamId}
        members={members}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        onCreateTeam={async (name) => {
          await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
          await fetchTeams();
        }}
        onRenameTeam={async (id, name) => {
          await fetch(`/api/teams/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
          await fetchTeams();
        }}
        onDeleteTeam={async (id) => {
          await fetch(`/api/teams/${id}`, { method: "DELETE" });
          setTeamId(null);
          await fetchTeams();
          setMembers([]);
        }}
        undoStack={undoStack}
        onUndo={handleUndo}
        batchMode={batchMode}
        onToggleBatch={() => { setBatchMode(!batchMode); setSelectedIds(new Set()); }}
        onAddMemberClick={() => setAddModalOpen(true)}
        viewUrl={viewUrl}
        onResetToday={handleResetTodayClick}
      />

      <AddMemberModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddMember} />

      <SignatureModal
        isOpen={signModal !== null}
        onClose={() => setSignModal(null)}
        onConfirm={handleSignConfirm}
        memberName={signModal?.name || ""}
        actionType={signModal?.currentStatus === "in" ? "out" : "in"}
      />

      {/* Signature viewer */}
      <AnimatedModal show={sigViewer !== null} onClose={() => setSigViewer(null)}>
        <h3 className="text-lg font-bold mb-3 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{sigViewer?.name} - {sigViewer?.label}</h3>
        <SignatureViewer strokes={sigViewer?.strokes || []} />
        <button onClick={() => setSigViewer(null)} className="mt-4 w-full py-2 rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">关闭</button>
      </AnimatedModal>

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Batch confirm */}
      {batchConfirm && (
        <ConfirmModal
          title={batchConfirm.action === "in" ? "批量签到" : "批量签退"}
          message={batchConfirm.action === "in"
            ? `${batchConfirm.skipped} 人已到场或已签退，确定仅为剩余 ${batchConfirm.valid} 人签到？`
            : `${batchConfirm.skipped} 人不在场，确定仅为剩余 ${batchConfirm.valid} 人签退？`}
          confirmLabel="确定"
          onConfirm={async () => {
            const { action, validIds } = batchConfirm;
            setBatchConfirm(null);
            await executeBatch(action, validIds);
          }}
          onCancel={() => setBatchConfirm(null)}
        />
      )}

      {/* Reset confirm */}
      {resetConfirm && (
        <ConfirmModal
          title="重置今日记录"
          message="确定要重置今日所有签到记录吗？此操作不可撤销。"
          confirmLabel="重置"
          danger
          onConfirm={handleResetToday}
          onCancel={() => setResetConfirm(false)}
        />
      )}
    </main>
  );
}
