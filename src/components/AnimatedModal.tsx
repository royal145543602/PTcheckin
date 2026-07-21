"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { gsap } from "@/lib/gsap";

interface AnimatedModalProps {
  show: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayCls?: string;
  cardCls?: string;
  /** "scale" = scale+fade (default), "slide" = slide up from bottom */
  variant?: "scale" | "slide";
}

export default function AnimatedModal({ show, onClose, children, overlayCls, cardCls, variant = "scale" }: AnimatedModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const exitingRef = useRef(false);

  // Mount / unmount
  useEffect(() => {
    if (show && !visible) {
      setVisible(true);
    } else if (!show && visible) {
      handleClose();
    }
  }, [show, visible]); // eslint-disable-line

  // Animate in
  useEffect(() => {
    if (!visible || !overlayRef.current || !cardRef.current) return;
    exitingRef.current = false;
    gsap.killTweensOf([overlayRef.current, cardRef.current]);
    gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });

    if (variant === "slide") {
      gsap.fromTo(cardRef.current, { y: "100%", autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "expo.out" });
    } else {
      gsap.fromTo(cardRef.current, { scale: 0.88, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "expo.out" });
    }
  }, [visible]); // eslint-disable-line

  function handleClose() {
    if (exitingRef.current) return;
    exitingRef.current = true;
    const card = cardRef.current;
    const overlay = overlayRef.current;
    if (!card || !overlay) { setVisible(false); onClose(); return; }

    const tl = gsap.timeline({ onComplete: () => { setVisible(false); onClose(); } });
    if (variant === "slide") {
      tl.to(card, { y: "100%", duration: 0.25, ease: "power3.in" }, 0);
    } else {
      tl.to(card, { scale: 0.92, autoAlpha: 0, duration: 0.18, ease: "power2.in" }, 0);
    }
    tl.to(overlay, { autoAlpha: 0, duration: 0.2 }, 0);
  }

  if (!visible) return null;

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${overlayCls || ""}`} style={{ background: "rgba(0,0,0,0.5)" }} onClick={handleClose}>
      <div ref={cardRef} className={cardCls || "bg-white rounded-2xl p-6 w-full max-w-xs"} style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04)" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
