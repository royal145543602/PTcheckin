"use client";

import { useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, Flip);

// gsap.com's custom cubic-bezier curves
CustomEase.create("gsap-out", "M0,0 C0.175,0.79 0.38,0.905 1,1");       // gentle settle
CustomEase.create("gsap-in", "M0,0 C0.755,0.05 0.855,0.06 1,1");         // fast start
CustomEase.create("gsap-inout", "M0,0 C0.86,0 0.07,1 1,1");              // sharp in, smooth out
CustomEase.create("gsap-quart-out", "M0,0 C0.175,0.79 0.38,0.905 1,1");  // refined deceleration

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export { gsap, useGSAP, ScrollTrigger, Flip };