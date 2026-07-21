"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { IconCheck } from "@/components/icons";

interface DropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Dropdown({ value, options, onChange, placeholder = "请选择" }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ top: 0, left: 0, width: 0 });
  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;
    // Set position synchronously via ref to avoid React state delay
    const r = trigger.getBoundingClientRect();
    posRef.current = { top: r.bottom + 4, left: r.left, width: r.width };
    Object.assign(menu.style, {
      top: `${posRef.current.top}px`,
      left: `${posRef.current.left}px`,
      width: `${posRef.current.width}px`,
    });
    // Force React re-render to align with new position
    setMenuKey(k => k + 1);
  }, [open]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || !open) return;
    gsap.killTweensOf([menu, ".dropdown-opt"]);
    gsap.fromTo(menu, { display: "block", autoAlpha: 0, y: -2 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: "expo.out" });
    gsap.fromTo(".dropdown-opt", { autoAlpha: 0, x: -4 }, { autoAlpha: 1, x: 0, duration: 0.1, stagger: { each: 0.02 }, ease: "expo.out", delay: 0.02 });
    return () => { gsap.killTweensOf([menu, ".dropdown-opt"]); };
  }, [menuKey]); // eslint-disable-line

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || open) return;
    gsap.killTweensOf([menu, ".dropdown-opt"]);
    gsap.to(menu, { autoAlpha: 0, duration: 0.08, ease: "power2.in", onComplete: () => gsap.set(menu, { display: "none" }) });
    return () => { gsap.killTweensOf([menu, ".dropdown-opt"]); };
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
          menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button ref={triggerRef}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: open ? "1px solid var(--green)" : "1px solid var(--border-glass)",
          boxShadow: open ? "0 0 0 3px var(--green-dim)" : "none",
          color: selected ? "var(--text)" : "var(--dim)",
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s ease" }}>
          <path d="M6 8L1 3h10z" fill="var(--green)" />
        </svg>
      </button>

      {mounted && createPortal(
      <div ref={menuRef} className="fixed overflow-hidden rounded-xl"
        style={{
          display: "none",
          zIndex: 9999, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", border: "1px solid var(--border-glass)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.1)",
        }}
      >
        <div className="py-1">
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`dropdown-opt w-full text-left px-4 py-3 text-[15px] transition-colors ${o.value === value ? "text-[var(--green)] font-semibold bg-[var(--green-dim)]" : "text-[var(--text)]/70 hover:bg-black/[0.03]"}`}
            >
              {o.label}
              {o.value === value && <span className="float-right text-[var(--green)]"><IconCheck size={16} /></span>}
            </button>
          ))}
        </div>
      </div>,
      document.body
      )}
    </>
  );
}
