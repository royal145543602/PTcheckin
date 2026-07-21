// SVG icon components — PRIMETIME design language
// All icons: 24×24 viewBox, stroke="currentColor", stroke-width="1.5", round caps/joins

import React from "react";

type IconProps = { size?: number; className?: string };

const s = (props: IconProps) => ({
  width: props.size ?? 18,
  height: props.size ?? 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: props.className,
});

// ── Navigation ──
export function IconMenu(p: IconProps) {
  return <svg {...s(p)}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
}

// ── Actions ──
export function IconUndo(p: IconProps) {
  return <svg {...s(p)}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.5L3 13"/></svg>;
}

export function IconBatch(p: IconProps) {
  return <svg {...s(p)}><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></svg>;
}

export function IconCheckIn(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/></svg>;
}

export function IconSignOut(p: IconProps) {
  return <svg {...s(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

export function IconRefresh(p: IconProps) {
  return <svg {...s(p)}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
}

export function IconPlus(p: IconProps) {
  return <svg {...s(p)}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

export function IconCheck(p: IconProps) {
  return <svg {...s(p)}><polyline points="20 6 9 17 4 12"/></svg>;
}

// ── Selection ──
export function IconSelectAll(p: IconProps) {
  return <svg {...s(p)}><rect x="4" y="4" width="16" height="6" rx="1.5"/><polyline points="7 7 9 9 11 6"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><polyline points="7 17 9 19 11 16"/></svg>;
}

export function IconDeselect(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>;
}

// ── Status / Category ──
export function IconHistory(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>;
}

export function IconExit(p: IconProps) {
  return <svg {...s(p)}><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/></svg>;
}
export function IconWalk(p: IconProps) {
  return <svg {...s(p)}><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/></svg>;
}

export function IconGroup(p: IconProps) {
  return <svg {...s(p)}>
    <circle cx="17" cy="7" r="3"/>
    <path d="M10 21v-2a5 5 0 0 1 10 0v2"/>
    <circle cx="7" cy="7" r="3.5"/>
    <path d="M2 21v-2a5.5 5.5 0 0 1 11 0v2"/>
  </svg>;
}

export function IconFootball(p: IconProps) {
  return <svg {...s(p)}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M15 4.5l4 2.5 2 5-1 5-5 2.5-4 1-5-2-2-5 1.5-5L9 6.5z"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>;
}

export function IconSignature(p: IconProps) {
  return <svg {...s(p)}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="M15 5l4 4"/></svg>;
}

// ── Sidebar section icons ──
export function IconGear(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
}

export function IconPerson(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="5" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/></svg>;
}

export function IconLink(p: IconProps) {
  return <svg {...s(p)}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}

export function IconAlert(p: IconProps) {
  return <svg {...s(p)}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}

export function IconLock(p: IconProps) {
  return <svg {...s(p)}><rect x="5" y="11" width="14" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/></svg>;
}

export function IconTime(p: IconProps) {
  return <svg {...s(p)}><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg>;
}

export function IconClose(p: IconProps) {
  return <svg {...s(p)}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
