"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  useLayoutEffect(() => {
    const element = ref.current;
    const from = previous.current;
    previous.current = value;
    if (!element || from === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const counter = { value: from };
    element.textContent = String(from);
    const tween = gsap.to(counter, { value, duration: .24, ease: "power2.out", onUpdate: () => { element.textContent = String(Math.round(counter.value)); }, onComplete: () => { element.textContent = String(value); } });
    return () => { tween.kill(); };
  }, [value]);
  return <span ref={ref} className={className} aria-label={String(value)}>{value}</span>;
}
