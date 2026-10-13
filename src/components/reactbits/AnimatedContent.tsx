"use client";

// Adapted from DavidHDev/react-bits AnimatedContent.
// Copyright (c) 2026 David Haz. License: ./LICENSE.md.
// Changes: mount/replay transitions, visible default, reduced motion and GSAP context cleanup.
import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  duration?: number;
  initialOpacity?: number;
  replayKey?: string;
  animateOnMount?: boolean;
  enabled?: boolean;
}

export default function AnimatedContent({ children, distance = 12, direction = "vertical", duration = .36, initialOpacity = 0, replayKey = "", animateOnMount = true, enabled = true, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const skip = first.current && !animateOnMount;
    first.current = false;
    if (skip || !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { clearProps: "transform,opacity,willChange" });
      return;
    }
      const axis = direction === "horizontal" ? "x" : "y";
      // Layout timing prevents a painted full-opacity frame before the reveal.
      // Finish interrupted motion from its current position rather than reverting.
      const interrupted = gsap.isTweening(el);
      gsap.killTweensOf(el);
      gsap.set(el, { willChange: "transform,opacity" });
      if (!interrupted) gsap.set(el, { ...(distance ? { [axis]: distance } : {}), opacity: initialOpacity });
      gsap.to(el, { ...(distance ? { [axis]: 0 } : {}), opacity: 1, duration, ease: "power3.out", overwrite: true, clearProps: "transform,opacity,willChange" });
  }, { scope: ref, dependencies: [replayKey, animateOnMount, enabled, direction, distance, duration, initialOpacity] });
  return <div ref={ref} {...props}>{children}</div>;
}
