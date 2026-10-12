"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function SlidingIndicator({ activeKey, className }: { activeKey: string; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  useEffect(() => {
    const marker = ref.current;
    const parent = marker?.parentElement;
    if (!marker || !parent) return;
    let tween: gsap.core.Tween | undefined;
    const position = () => {
      const target = parent.querySelector<HTMLElement>('button[aria-pressed="true"]');
      if (!target) { gsap.set(marker, { opacity: 0 }); return; }
      const box = parent.getBoundingClientRect();
      const active = target.getBoundingClientRect();
      const values = { x: active.left - box.left + parent.scrollLeft, y: active.top - box.top + parent.scrollTop, width: active.width, height: active.height, opacity: 1 };
      if (!placed.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) gsap.set(marker, values);
      else { tween?.kill(); tween = gsap.to(marker, { ...values, duration: .22, ease: "power3.out", overwrite: "auto" }); }
      placed.current = true;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(parent);
    parent.querySelectorAll("button").forEach((button) => observer.observe(button));
    return () => { observer.disconnect(); tween?.kill(); };
  }, [activeKey]);
  return <span ref={ref} className={className} aria-hidden="true" />;
}
