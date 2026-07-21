"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import StatsBar from "@/components/StatsBar";
import SignatureViewer from "@/components/SignatureViewer";
import HistoryDayList from "@/components/HistoryDayList";
import AnimatedModal from "@/components/AnimatedModal";
import { IconRefresh, IconSignature, IconHistory } from "@/components/icons";
import type { SignatureData } from "@/lib/types";
import { useT } from "@/i18n";

interface MemberStatus {
  id: string; name: string; status: "in" | "out" | "none";
  lastCheckIn: string | null; lastCheckOut: string | null;
  lastSignatureIn?: SignatureData;
  lastSignatureOut?: SignatureData;
}
interface TeamStatus {
  team: { id: string; name: string; createdAt: string };
  members: MemberStatus[];
  stats: { present: number; absent: number; gone: number; total: number };
}

export default function ViewPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { t } = useT();
  const [data, setData] = useState<TeamStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");
  const [historyModal, setHistoryModal] = useState<{ memberId: string; name: string } | null>(null);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [hFrom, setHFrom] = useState(() => {
    const d = new Date(Date.now() - 7 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [hTo, setHTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [sigViewer, setSigViewer] = useState<{ name: string; strokes: SignatureData; label: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Stagger entrance for member list
  useGSAP(() => {
    if (!listRef.current || !data?.members.length) return;
    gsap.fromTo(".view-member",
      { autoAlpha: 0, x: -12 },
      { autoAlpha: 1, x: 0, duration: 0.3, stagger: { each: 0.04, from: "start" }, ease: "gsap-quart-out", clearProps: "all" }
    );
  }, { dependencies: [data?.members.length], scope: listRef });

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
    return (
      <main className="flex items-center justify-center min-h-screen relative z-10" style={{ background: "var(--bg)" }}>
        <p className="text-[var(--muted)] text-lg">{t.loading}</p>
      </main>
    );
  }

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const statusBadge = (status: "in" | "out" | "none", checkIn: string | null, checkOut: string | null) => {
    if (status === "in") return { dot: "bg-[var(--green)] shadow-[0_0_8px_rgba(0,128,51,0.4)]", text: `${t.checkInLabel} ${formatTime(checkIn)}`, textColor: "text-[var(--green)]" };
    if (status === "out") return { dot: "bg-orange-400", text: `${t.gone} ${formatTime(checkOut)}`, textColor: "text-orange-400" };
    return { dot: "bg-[var(--dim)]", text: t.absent, textColor: "text-[var(--dim)]" };
  };

  return (
    <main className="min-h-screen flex flex-col relative z-10" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]" style={{ background: "var(--bg-card)" }}>
        <h1 className="text-xl sm:text-2xl font-bold font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>
          {data.team.name}
        </h1>
        <button onClick={fetchStatus} className="text-sm text-[var(--green)] hover:underline font-medium flex items-center gap-1"><IconRefresh size={14} /> {t.refresh}</button>
      </div>

      {lastUpdate && (
        <div className="text-center text-xs text-[var(--dim)] py-1.5">{t.lastUpdate.replace("{time}", lastUpdate)}</div>
      )}

      {/* Member list */}
      <div ref={listRef} className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-2">
        {data.members.map((m) => {
          const badge = statusBadge(m.status, m.lastCheckIn, m.lastCheckOut);
          return (
            <div key={m.id} className="view-member flex items-center justify-between rounded-xl px-4 py-3.5 border border-[var(--border)] transition-all hover:border-[rgba(0,128,51,0.15)]" style={{ background: "var(--bg-card)" }}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${badge.dot} ${m.status === "in" ? "animate-pulse" : ""}`} />
                <span className="text-lg font-medium text-[var(--text)]/90">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${badge.textColor}`}>{badge.text}</span>
                {m.lastSignatureIn && (
                  <button onClick={() => setSigViewer({ name: m.name, strokes: m.lastSignatureIn!, label: `${t.checkInLabel}${t.signature}` })} className="text-xs text-[var(--green)] hover:underline flex items-center gap-0.5">
                    <IconSignature size={12} /> {t.signature}
                  </button>
                )}
                {m.lastSignatureOut && (
                  <button onClick={() => setSigViewer({ name: m.name, strokes: m.lastSignatureOut!, label: `${t.signOutLabel}${t.signature}` })} className="text-xs text-[var(--green)] hover:underline flex items-center gap-0.5">
                    <IconSignature size={12} /> {t.signOutLabel}
                  </button>
                )}
                <button onClick={() => setHistoryModal({ memberId: m.id, name: m.name })} className="text-xs text-[var(--green)] hover:underline flex items-center gap-0.5">
                  <IconHistory size={12} /> {t.historyShort}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <StatsBar {...data.stats} />

      {/* Signature viewer modal */}
      <AnimatedModal show={sigViewer !== null} onClose={() => setSigViewer(null)}>
        <h3 className="text-lg font-bold mb-3 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{sigViewer?.name} - {sigViewer?.label}</h3>
        <SignatureViewer strokes={sigViewer?.strokes || []} />
        <button onClick={() => setSigViewer(null)} className="mt-4 w-full py-2 rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">{t.close}</button>
      </AnimatedModal>

      {/* History modal */}
      <AnimatedModal show={historyModal !== null} onClose={() => setHistoryModal(null)}>
        <h3 className="text-lg font-bold mb-3 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{historyModal?.name} - {t.checkInHistory}</h3>
        <div className="max-h-[60vh] overflow-y-auto">
          <HistoryDayList
            days={memberHistory}
            from={hFrom}
            to={hTo}
            onFromChange={setHFrom}
            onToChange={setHTo}
            onViewSignature={(name, strokes, label) => setSigViewer({ name, strokes, label })}
            showMemberName={false}
          />
        </div>
        <button onClick={() => setHistoryModal(null)} className="mt-4 w-full py-2 rounded-xl text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">{t.close}</button>
      </AnimatedModal>
    </main>
  );
}
