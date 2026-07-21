"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 2200 }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { y: -32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: "expo.out" });
    const t = setTimeout(() => {
      gsap.to(el, { y: -16, autoAlpha: 0, duration: 0.2, ease: "power3.in", onComplete: onClose });
    }, duration);
    return () => { clearTimeout(t); gsap.killTweensOf(el); };
  }, []); // eslint-disable-line

  return (
    <div ref={ref} className="fixed top-6 left-1/2 z-[100] -translate-x-1/2 pointer-events-none">
      <div className="px-5 py-3 rounded-full text-sm font-bold tracking-wide whitespace-nowrap"
        style={{
          background: "rgba(10,26,15,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#fff",
          border: "1px solid rgba(0,232,92,0.3)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,232,92,0.1)",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
      >
        {message}
      </div>
    </div>
  );
}
