"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { IconCheck, IconTime, IconExit, IconPerson } from "@/components/icons";
import { useT } from "@/i18n";

interface StatsBarProps { present: number; absent: number; gone: number; total: number; }

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [prev, setPrev] = useState(value);
  useGSAP(() => {
    if (value === prev) return;
    const el = ref.current; if (!el) return;
    const start = prev, diff = value - start;
    gsap.to(el, { duration: 0.6, ease: "gsap-quart-out", onUpdate() { el.textContent = String(Math.round(start + diff * this.progress())); } });
    setPrev(value);
  }, { dependencies: [value] });
  return <span ref={ref} className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Barlow Condensed','Noto Sans TC',sans-serif", color }}>{value}</span>;
}

export default function StatsBar({ present, absent, gone, total }: StatsBarProps) {
  const { t } = useT();
  return (
    <div className="flex justify-around text-center py-5 px-4" style={{ background: "var(--dark)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex flex-col items-center gap-1.5">
        <AnimatedNumber value={present} color="var(--green)" />
        <span className="text-xs text-white/70 uppercase tracking-widest font-medium flex items-center gap-1"><IconCheck size={12} /> {t.present}</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <AnimatedNumber value={absent} color="#fff" />
        <span className="text-xs text-white/70 uppercase tracking-widest font-medium flex items-center gap-1"><IconTime size={12} /> {t.absent}</span>
      </div>
      {gone > 0 && (
        <div className="flex flex-col items-center gap-1.5">
          <AnimatedNumber value={gone} color="#e83030" />
          <span className="text-xs text-white/70 uppercase tracking-widest font-medium flex items-center gap-1"><IconExit size={12} /> {t.gone}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-1.5">
        <AnimatedNumber value={total} color="rgba(255,255,255,0.8)" />
        <span className="text-xs text-white/70 uppercase tracking-widest font-medium flex items-center gap-1"><IconPerson size={12} /> {t.total}</span>
      </div>
    </div>
  );
}
