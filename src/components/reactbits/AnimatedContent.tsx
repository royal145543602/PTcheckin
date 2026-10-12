"use client";

// Adapted from DavidHDev/react-bits AnimatedContent.
// Copyright (c) 2026 David Haz. License: ./LICENSE.md.
// Changes: mount/replay transitions, visible default, reduced motion and GSAP context cleanup.
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  duration?: number;
  initialOpacity?: number;
  replayKey?: string;
  animateOnMount?: boolean;
}

export default function AnimatedContent({ children, distance = 8, direction = "vertical", duration = .22, initialOpacity = .65, replayKey = "", animateOnMount = true, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const skip = first.current && !animateOnMount;
    first.current = false;
    if (skip) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const axis = direction === "horizontal" ? "x" : "y";
      gsap.fromTo(el, { [axis]: distance, opacity: initialOpacity }, { [axis]: 0, opacity: 1, duration, ease: "power3.out", clearProps: "transform,opacity" });
    });
    return () => { media.revert(); };
  }, [replayKey, animateOnMount, direction, distance, duration, initialOpacity]);
  return <div ref={ref} {...props}>{children}</div>;
}
