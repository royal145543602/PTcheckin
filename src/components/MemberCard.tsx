"use client";

import { useRef, CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useT } from "@/i18n";

interface MemberCardProps {
  name: string;
  status: "in" | "out" | "none";
  lastCheckIn: string | null;
  lastCheckOut: string | null;
  onClick: () => void;
  showCheckbox?: boolean;
  checked?: boolean;
}

const IN_BG = "#00e85c";
const IN_BORDER = "#00e85c";
const IN_TEXT = "#000";
const CARD_BG = "#ffffff";
const CARD_BORDER = "rgba(0,0,0,0.08)";
const OUT_BG = "rgba(220,40,40,0.10)";
const OUT_BORDER = "rgba(220,40,40,0.30)";

export default function MemberCard({ name, status, lastCheckIn, lastCheckOut, onClick, showCheckbox, checked }: MemberCardProps) {
  const { t } = useT();
  const cardRef = useRef<HTMLButtonElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(status);

  const isIn = status === "in";
  const isOut = status === "out";

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Status change animation — scale via GSAP, colors via CSS transition
  useGSAP(() => {
    const prev = prevStatusRef.current;
    if (prev === status || !cardRef.current) return;
    prevStatusRef.current = status;
    const card = cardRef.current;

    if (status === "in") {
      gsap.timeline()
        .to(card, { scale: 1.04, duration: 0.08, ease: "gsap-in" })
        .to(card, { scale: 1, duration: 0.25, ease: "gsap-quart-out" });
      // Particle burst
      if (particlesRef.current) {
        const container = particlesRef.current;
        for (let i = 0; i < 12; i++) {
          const p = document.createElement("div");
          const angle = (i / 12) * Math.PI * 2;
          const d = 28 + Math.random() * 24;
          const size = 3 + Math.random() * 4;
          Object.assign(p.style, {
            position: "absolute", width: `${size}px`, height: `${size}px`, borderRadius: "50%", background: "#00e85c",
            left: "50%", top: "50%", pointerEvents: "none", zIndex: "10",
            boxShadow: `0 0 ${size * 2}px rgba(0,232,92,0.6)`,
          });
          container.appendChild(p);
          gsap.fromTo(p,
            { x: 0, y: 0, scale: 0 },
            { x: Math.cos(angle) * d, y: Math.sin(angle) * d, scale: 1, duration: 0.6, ease: "expo.out", onComplete: () => p.remove() }
          );
        }
      }
    } else if (status === "out" && prev === "in") {
      gsap.timeline()
        .to(card, { scale: 0.97, duration: 0.08, ease: "gsap-in" })
        .to(card, { scale: 1, duration: 0.2, ease: "gsap-quart-out" });
    } else if (status === "none") {
      gsap.fromTo(card, { scale: 1.03 }, { scale: 1, duration: 0.2, ease: "gsap-quart-out" });
    } else {
      gsap.fromTo(card, { scale: 1.03 }, { scale: 1, duration: 0.2, ease: "gsap-quart-out" });
    }
  }, { dependencies: [status], scope: cardRef, revertOnUpdate: true });

  // Status colors
  let bg = CARD_BG;
  let border = CARD_BORDER;
  let text = "var(--text)";
  let dot = "var(--dim)";
  let timeLabel = "var(--muted)";

  if (isIn) {
    bg = IN_BG; border = IN_BORDER; text = IN_TEXT;
    dot = "rgba(0,0,0,0.3)"; timeLabel = "rgba(0,0,0,0.55)";
  } else if (isOut) {
    bg = OUT_BG; border = OUT_BORDER;
    text = "#d42020"; dot = "#e83030"; timeLabel = "rgba(220,40,40,0.55)";
  }

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      className="relative w-full min-h-[90px] sm:min-h-[110px] rounded-2xl flex flex-col items-center justify-center text-center p-3 sm:p-4 select-none overflow-hidden hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        background: bg, border: `1px solid ${border}`, color: text, outline: "none",
        boxShadow: isIn ? "0 6px 24px rgba(0,232,92,0.25), 0 2px 8px rgba(0,0,0,0.08)" : "0 3px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
      } as CSSProperties}
    >
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

      {showCheckbox && (
        <div className="absolute top-2 left-2 z-10">
          <input type="checkbox" checked={checked} onChange={onClick} className="w-5 h-5 accent-[#008033] rounded cursor-pointer" />
        </div>
      )}

      <span className="text-lg sm:text-2xl font-bold relative z-[1] leading-tight">{name}</span>

      <div className="flex items-center gap-1.5 mt-2 relative z-[1]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        <span className="text-xs" style={{ color: timeLabel }}>
          {status === "none" && t.tapToSign}
          {isIn && lastCheckIn && formatTime(lastCheckIn)}
          {isOut && lastCheckOut && formatTime(lastCheckOut)}
        </span>
      </div>
    </button>
  );
}
