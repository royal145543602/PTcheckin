"use client";

import { useState } from "react";
import type { SignatureData } from "@/lib/types";

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 (周${weekdays[d.getDay()]})`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function HistoryDayList({ days, from, to, onFromChange, onToChange, onViewSignature, showMemberName = true }: HistoryDayListProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    return new Set(days.slice(0, 7).map((d) => d.date));
  });

  const toggle = (date: string) => {
    const next = new Set(expanded);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setExpanded(next);
  };

  return (
    <div>
      <div className="flex gap-2 items-center mb-3">
        <input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm"
        />
        <span className="text-sm text-gray-500">至</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm"
        />
      </div>

      {days.length === 0 && <p className="text-gray-400 text-sm">暂无记录</p>}

      {days.map((day) => {
        const isOpen = expanded.has(day.date);
        const inCount = day.records.filter((r) => r.type === "in").length;
        const outCount = day.records.filter((r) => r.type === "out").length;

        return (
          <div key={day.date} className="mb-2 border rounded-lg bg-white">
            <button
              onClick={() => toggle(day.date)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg text-left"
            >
              <span className="font-medium text-sm">{formatDate(day.date)}</span>
              <span className="text-xs text-gray-500">
                签到{inCount} / 签退{outCount}
                <span className="ml-2">{isOpen ? "▲" : "▼"}</span>
              </span>
            </button>

            {isOpen && (
              <div className="border-t px-4 py-2 space-y-1">
                {day.records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={r.type === "in" ? "text-green-600" : "text-red-500"}>
                        {r.type === "in" ? "签到" : "签退"}
                      </span>
                      {showMemberName && <span className="font-medium">{r.memberName}</span>}
                      <span className="text-gray-400">{formatTime(r.time)}</span>
                    </div>
                    {r.signature && onViewSignature && (
                      <button
                        onClick={() => onViewSignature(r.memberName, r.signature!, r.type === "in" ? "签到签名" : "签退签名")}
                        className="text-xs text-blue-600 underline"
                      >
                        查看签名
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
