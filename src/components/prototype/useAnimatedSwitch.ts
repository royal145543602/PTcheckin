"use client";

import { useCallback, useEffect, useRef, useState, type RefObject, type SetStateAction } from "react";
import { gsap } from "@/lib/gsap";

/** Keep the old content mounted for its exit, then commit the latest selection. */
export default function useAnimatedSwitch<T extends string>(initial: T, root: RefObject<HTMLElement | null>, selector: string, distance = 6) {
  const [value, commit] = useState<T>(initial);
  const current = useRef(initial);
  const requested = useRef(initial);
  const tween = useRef<gsap.core.Tween | null>(null);
  const setValue = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function" ? action(requested.current) : action;
    if (next === requested.current) return;
    requested.current = next;
    tween.current?.kill();
    const region = root.current?.querySelector<HTMLElement>(selector);
    if (!region || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = next;
      commit(next);
      return;
    }
    if (next === current.current) {
      tween.current = gsap.to(region, { opacity: 1, ...(distance ? { y: 0 } : {}), duration: .24, ease: "power3.out", overwrite: true, clearProps: "transform,opacity,willChange" });
      return;
    }
    gsap.set(region, { willChange: "transform,opacity" });
    tween.current = gsap.to(region, {
      opacity: 0, ...(distance ? { y: -distance } : {}), duration: .1, ease: "power2.in", overwrite: true,
      onComplete: () => {
        // The next AnimatedContent layout effect orchestrates the entrance.
        tween.current = null;
        current.current = requested.current;
        commit(requested.current);
      },
    });
  }, [root, selector, distance]);
  useEffect(() => () => { tween.current?.kill(); }, []);
  return [value, setValue] as const;
}
