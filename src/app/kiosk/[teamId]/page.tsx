"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import MemberCard from "@/components/MemberCard";
import AddMemberModal from "@/components/AddMemberModal";
import SignatureModal from "@/components/SignatureModal";
import StatsBar from "@/components/StatsBar";
import Sidebar from "@/components/Sidebar";
import AnimatedModal from "@/components/AnimatedModal";
import { IconMenu } from "@/components/icons";
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

export default function KioskPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  const [status, setStatus] = useState<TeamStatus | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [signModal, setSignModal] = useState<{ memberId: string; name: string; currentStatus: "in" | "out" | "none" } | null>(null);
  // Confirm tap before acting (anti-mis-tap)
  const [tapTarget, setTapTarget] = useState<{ memberId: string; name: string; currentStatus: "in" | "out" | "none"; x: number; y: number } | null>(null);
  const undoStackRef = useRef<{ recordIds: string[]; label: string }[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // GSAP card stagger entrance (first load only)
  const hasStaggered = useRef(false);
  useGSAP(() => {
    if (!gridRef.current || !status?.members.length) return;
    if (!hasStaggered.current) {
      hasStaggered.current = true;
      gsap.fromTo(".member-card",
        { autoAlpha: 0, y: 16, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, stagger: { each: 0.03, from: "start" }, ease: "gsap-quart-out" }
      );
    }
  }, { dependencies: [status?.members.length] });

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

  // Load data
  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    setTeams(await res.json());
  }, []);

  useEffect(() => { fetchTeams(); }, []);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/members`);
    setMembers(await res.json());
  }, [teamId]);

  useEffect(() => { fetchMembers(); }, [teamId]);

  const fetchStatus = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/status`);
    setStatus(await res.json());
  }, [teamId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleAddMember(name: string) {
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

  // Tap: show confirm first (anti-mis-tap)
  function handleCardTap(memberId: string, name: string, currentStatus: "in" | "out" | "none") {
    setTapTarget({ memberId, name, currentStatus, x: 0, y: 0 });
  }

  function handleConfirmTap() {
    if (!tapTarget) return;
    const { memberId, name, currentStatus } = tapTarget;
    if (currentStatus === "in") {
      setSignModal({ memberId, name, currentStatus });
    } else {
      setSignModal({ memberId, name, currentStatus });
    }
    setTapTarget(null);
  }

  async function handleSignConfirm(signature: SignatureData | null) {
    if (!signModal) return;
    const type = signModal.currentStatus === "in" ? "out" : "in";
    const res = await fetch(`/api/teams/${teamId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: signModal.memberId, type, signature }),
    });
    const record = await res.json();
    setSignModal(null);
    await fetchStatus();
    // Track undo
    const actionLabel = type === "in" ? "签到" : "签退";
    undoStackRef.current = [{ recordIds: [record.id], label: `${signModal.name} ${actionLabel}` }, ...undoStackRef.current].slice(0, 20);
    setUndoCount(undoStackRef.current.length);
  }

  async function handleUndo(index: number) {
    const entry = undoStackRef.current[index];
    if (!entry) return;
    for (const id of entry.recordIds) {
      await fetch(`/api/records/${id}`, { method: "DELETE" });
    }
    undoStackRef.current = undoStackRef.current.filter((_, i) => i !== index);
    setUndoCount(undoStackRef.current.length);
    await fetchStatus();
  }

  if (!status) {
    return (
      <main className="flex items-center justify-center min-h-screen relative z-10" style={{ background: "var(--bg)" }}>
        <p className="text-[var(--muted)] text-lg">加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative" style={{ background: "var(--bg)", zIndex: 1 }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] relative z-10" style={{ background: "var(--bg-card)" }}>
        <button onClick={() => setSidebarOpen(true)} className="text-xl text-[var(--muted)] hover:text-[var(--green)] transition-colors"><IconMenu size={20} /></button>
        <div className="text-center">
          <span className="text-sm font-medium text-[var(--text)]/85 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>
            {status.team.name}
          </span>
        </div>
        <span className="text-xs text-[var(--dim)]">{timeStr}</span>
      </div>

      {/* Sub header — tap instruction */}
      <div className="text-center py-2 px-4 border-b border-[var(--border)] bg-[var(--green-dim)]">
        <span className="text-xs text-[var(--green)]">点击卡片签到 / 签退</span>
      </div>

      {/* Cards grid */}
      <div ref={gridRef} className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
        {status.members.map((m) => (
          <div key={m.id} className="member-card">
            <MemberCard
              name={m.name}
              status={m.status}
              lastCheckIn={m.lastCheckIn}
              lastCheckOut={m.lastCheckOut}
              onClick={() => handleCardTap(m.id, m.name, m.status)}
            />
          </div>
        ))}
      </div>

      <StatsBar {...status.stats} />

      {/* Tap confirmation popup */}
      <AnimatedModal show={tapTarget !== null} onClose={() => setTapTarget(null)}>
        <div className="text-center">
          <p className="text-3xl font-bold mb-2 text-[var(--text)]">{tapTarget?.name}</p>
          <p className="text-sm text-[var(--muted)] mb-5">
            {tapTarget?.currentStatus === "in" ? "当前在场，确认签退？" : tapTarget?.currentStatus === "out" ? "已签退，重新签到？" : "点击确认签到"}
          </p>
          <div className="flex gap-3">
            <button onClick={() => setTapTarget(null)} className="flex-1 py-3 rounded-xl text-base font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">取消</button>
            <button onClick={handleConfirmTap} className={`flex-1 py-3 rounded-xl text-base font-bold text-white hover:brightness-110 transition-all ${tapTarget?.currentStatus === "in" ? "bg-[#e83030]" : "bg-[var(--green)]"}`}>
              {tapTarget?.currentStatus === "in" ? "签退" : "签到"}
            </button>
          </div>
        </div>
      </AnimatedModal>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        teams={teams}
        selectedTeamId={teamId as string}
        onSelectTeam={() => {}}
        members={members}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        onCreateTeam={async () => {}}
        onRenameTeam={async () => {}}
        onDeleteTeam={async () => {}}
        undoStack={undoStackRef.current}
        onUndo={handleUndo}
        batchMode={false}
        onToggleBatch={() => {}}
        onAddMemberClick={() => setAddModalOpen(true)}
        viewUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/view/${teamId}`}
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
    </main>
  );
}
