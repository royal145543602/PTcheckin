"use client";

import { useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = "确认", cancelLabel = "取消", danger, onConfirm, onCancel }: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.killTweensOf([overlayRef.current, modalRef.current]);
    gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
    gsap.fromTo(modalRef.current, { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.25, ease: "expo.out" });
    return () => { gsap.killTweensOf([overlayRef.current, modalRef.current]); };
  }, []);

  function handleClose() {
    gsap.to([overlayRef.current, modalRef.current], { autoAlpha: 0, duration: 0.15, onComplete: onCancel });
  }

  function handleConfirm() {
    gsap.to([overlayRef.current, modalRef.current], { autoAlpha: 0, duration: 0.12, onComplete: onConfirm });
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }} onClick={handleClose}>
      <div ref={modalRef} className="w-full max-w-xs rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 12px 48px rgba(0,0,0,0.12)" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-2 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{title}</h3>
        <p className="text-sm text-[var(--muted)] mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={handleClose} className="flex-1 py-3 rounded-xl text-base font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">{cancelLabel}</button>
          <button onClick={handleConfirm} className={`flex-1 py-3 rounded-xl text-base font-bold text-white hover:brightness-110 transition-all ${danger ? "bg-red-500" : "bg-[var(--green)]"}`}
            style={danger ? {} : { boxShadow: "0 2px 12px rgba(0,232,92,0.3)" }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
