"use client";

import { useState, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { SignatureData } from "@/lib/types";
import { useT } from "@/i18n";
import type { Translations } from "@/i18n/en";

interface HistoryRecord {
  id: string;
  memberName: string;
  type: "in" | "out";
  time: string;
  signature: SignatureData | null;
}

interface DayGroup {
  date: string;
  records: HistoryRecord[];
}

interface HistoryDayListProps {
  days: DayGroup[];
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onViewSignature?: (name: string, sig: SignatureData, label: string) => void;
  showMemberName?: boolean;
}

function formatDate(dateStr: string, t: Translations): string {
  const d = new Date(dateStr);
  const text = t.timeFormat
    .replace("{year}", String(d.getFullYear()))
    .replace("{month}", String(d.getMonth() + 1))
    .replace("{day}", String(d.getDate()))
    .replace("{weekday}", t.weekdays[d.getDay()])
    .replace(/\s*\{time\}/, "");
  return text.trim();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function DayCard({ day, defaultOpen, onViewSignature, showMemberName }: {
  day: DayGroup;
  defaultOpen: boolean;
  onViewSignature?: (name: string, sig: SignatureData, label: string) => void;
  showMemberName: boolean;
}) {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = contentRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (isOpen) {
      gsap.fromTo(el, { display: "block", autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: "expo.out" });
    } else {
      gsap.to(el, { autoAlpha: 0, duration: 0.15, ease: "power2.in" });
    }
  }, { dependencies: [isOpen] });

  const inCount = day.records.filter((r) => r.type === "in").length;
  const outCount = day.records.filter((r) => r.type === "out").length;

  return (
    <div className="mb-2 rounded-lg border border-[var(--border)] overflow-hidden" style={{ background: "var(--bg-card)" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors text-left"
      >
        <span className="font-medium text-sm text-[var(--text)]/85 font-display tracking-wide" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>
          {formatDate(day.date, t)}
        </span>
        <span className="text-xs text-[var(--muted)] flex items-center gap-2">
          <span className="text-[var(--green)]">{t.checkInLabel}{inCount}</span>
          <span className="text-red-400">{t.signOutLabel}{outCount}</span>
          <span className="ml-1 text-[var(--dim)] transition-transform duration-300" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
            ▼
          </span>
        </span>
      </button>

      <div ref={contentRef} style={{ height: 0, overflow: "hidden", transformOrigin: "top" }}>
        <div className="border-t border-[var(--border)] px-4 py-2 space-y-1">
          {day.records.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.type === "in" ? "bg-[rgba(0,128,51,0.1)] text-[var(--green)]" : "bg-[rgba(232,48,48,0.1)] text-red-400"}`}>
                  {r.type === "in" ? t.checkInLabel : t.signOutLabel}
                </span>
                {showMemberName && <span className="font-medium text-[var(--text)]/80">{r.memberName}</span>}
                <span className="text-[var(--dim)] text-xs">{formatTime(r.time)}</span>
              </div>
              {r.signature && onViewSignature && (
                <button
                  onClick={() => onViewSignature(r.memberName, r.signature!, r.type === "in" ? `${t.checkInLabel}${t.signature}` : `${t.signOutLabel}${t.signature}`)}
                  className="text-xs text-[var(--green)] hover:underline"
                >
                  {t.viewSignature}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HistoryDayList({ days, from, to, onFromChange, onToChange, onViewSignature, showMemberName = true }: HistoryDayListProps) {
  const { t } = useT();
  return (
    <div>
      {/* Date picker */}
      <div className="flex gap-2 items-center mb-4">
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="input-pt text-sm py-2 px-3 w-auto"
        />
        <span className="text-xs text-[var(--muted)]">{t.to}</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="input-pt text-sm py-2 px-3 w-auto"
        />
      </div>

      {days.length === 0 && (
        <p className="text-[var(--muted)] text-sm py-8 text-center">{t.noRecords}</p>
      )}

      {days.map((day, i) => (
        <DayCard
          key={day.date}
          day={day}
          defaultOpen={i < 7}
          onViewSignature={onViewSignature}
          showMemberName={showMemberName}
        />
      ))}
    </div>
  );
}
