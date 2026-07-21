"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import SignaturePad from "@/components/SignaturePad";
import type { SignatureData } from "@/lib/types";
import { useT } from "@/i18n";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: SignatureData | null) => Promise<void>;
  memberName: string;
  actionType: "in" | "out";
}

export default function SignatureModal({ isOpen, onClose, onConfirm, memberName, actionType }: SignatureModalProps) {
  const { t } = useT();
  const [strokes, setStrokes] = useState<SignatureData>([]);
  const [loading, setLoading] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (isOpen) {
      gsap.fromTo(el, { y: "100%" }, { y: 0, duration: 0.3, ease: "gsap-quart-out" });
    }
  }, [isOpen]);

  function handleClose() {
    const el = containerRef.current;
    if (el) {
      gsap.to(el, { y: "100%", duration: 0.3, ease: "power3.in", onComplete: () => {
        setStrokes([]); setConfirmSkip(false); setLoading(false);
      }});
    }
    setTimeout(() => onClose(), 50);
  }

  async function handleConfirm() {
    if (strokes.length === 0) { setConfirmSkip(true); return; }
    setLoading(true);
    await onConfirm(strokes);
    setStrokes([]);
    setLoading(false);
  }

  async function handleSkip() {
    setLoading(true);
    await onConfirm(null);
    setStrokes([]);
    setLoading(false);
  }

  async function handleForceConfirm() {
    setLoading(true);
    setConfirmSkip(false);
    await onConfirm(null);
    setStrokes([]);
    setLoading(false);
  }

  if (!isOpen) return null;

  const actionLabel = actionType === "in" ? t.checkIn : t.signOutLabel;
  const actionColor = actionType === "in" ? "var(--green)" : "#e83030";

  return (
    <>
      {confirmSkip && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setConfirmSkip(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs" style={{ boxShadow: "0 16px 56px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{t.noSignature}</h3>
            <p className="text-sm text-[var(--muted)] mb-4">{t.skipConfirmMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSkip(false)} className="flex-1 py-3 rounded-xl text-base font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">{t.continueSign}</button>
              <button onClick={handleForceConfirm} disabled={loading} className="flex-1 py-3 rounded-xl text-base font-bold text-white hover:brightness-110 transition-all disabled:opacity-50" style={{ background: actionColor }}>{t.skipConfirm}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div ref={containerRef} className="fixed inset-0 z-[55] flex flex-col" style={{ background: "var(--bg)" }}>
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)]" style={{ background: "var(--bg-card)" }}>
          <div>
            <h3 className="text-xl font-bold font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>
              <span style={{ color: actionColor }}>{actionLabel}</span> — {memberName}
            </h3>
            <p className="text-sm text-[var(--muted)]">{t.pleaseSign}</p>
          </div>
          <button onClick={handleClose} className="text-[var(--muted)] hover:text-[var(--green)] text-2xl transition-colors">&times;</button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 w-full max-w-4xl h-full max-h-[70vh] flex items-center justify-center">
            <SignaturePad strokes={strokes} onChange={setStrokes} width={900} height={600} />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)]" style={{ background: "var(--bg-card)" }}>
          <div className="flex gap-2">
            <button onClick={() => setStrokes(strokes.slice(0, -1))} disabled={strokes.length === 0} className="text-sm px-4 py-2 rounded-lg border border-black/10 text-black/50 disabled:opacity-30 hover:border-black/20 hover:text-black/80 transition-all">{t.undoStroke}</button>
            <button onClick={() => setStrokes([])} disabled={strokes.length === 0} className="text-sm px-4 py-2 rounded-lg border border-black/10 text-black/50 disabled:opacity-30 hover:border-black/20 hover:text-black/80 transition-all">{t.clearAll}</button>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSkip} disabled={loading} className="px-6 py-3 rounded-xl text-base font-medium text-[var(--muted)] disabled:opacity-50 hover:text-[var(--text)] transition-all">{t.skipSignature}</button>
            <button onClick={handleConfirm} disabled={loading} className="px-8 py-3 rounded-xl text-base font-bold disabled:opacity-50 hover:brightness-110 transition-all" style={{ background: actionColor, color: "#fff" }}>{t.confirmAction.replace("{action}", actionLabel)}</button>
          </div>
        </div>
      </div>
    </>
  );
}
