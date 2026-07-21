"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

export default function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  const topRef = useRef<SVGLineElement>(null);
  const midRef = useRef<SVGLineElement>(null);
  const botRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const top = topRef.current;
    const mid = midRef.current;
    const bot = botRef.current;
    if (!top || !mid || !bot) return;
    gsap.killTweensOf([top, mid, bot]);

    if (open) {
      // Top line → rotates down-right to form X top
      gsap.to(top, { attr: { y1: 6, y2: 6, x1: 4, x2: 20 }, rotate: 45, transformOrigin: "50% 50%", duration: 0.25, ease: "power2.inOut" });
      // Bottom line → rotates up-right to form X bottom
      gsap.to(bot, { attr: { y1: 18, y2: 18, x1: 4, x2: 20 }, rotate: -45, transformOrigin: "50% 50%", duration: 0.25, ease: "power2.inOut" });
      // Middle line → fades out
      gsap.to(mid, { autoAlpha: 0, duration: 0.15, ease: "power2.in" });
    } else {
      // Restore to hamburger
      gsap.to(top, { attr: { y1: 5, y2: 5, x1: 3, x2: 21 }, rotate: 0, duration: 0.25, ease: "power2.inOut" });
      gsap.to(bot, { attr: { y1: 19, y2: 19, x1: 3, x2: 21 }, rotate: 0, duration: 0.25, ease: "power2.inOut" });
      gsap.to(mid, { attr: { y1: 12, y2: 12, x1: 3, x2: 21 }, autoAlpha: 1, duration: 0.25, ease: "power2.inOut" });
    }
  }, [open]);

  return (
    <button onClick={onClick} className="text-white hover:text-[#00e85c] transition-colors w-8 h-8 flex items-center justify-center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line ref={topRef} x1="3" y1="5" x2="21" y2="5" />
        <line ref={midRef} x1="3" y1="12" x2="21" y2="12" />
        <line ref={botRef} x1="3" y1="19" x2="21" y2="19" />
      </svg>
    </button>
  );
}
