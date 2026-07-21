"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useT } from "@/i18n";
import Dropdown from "@/components/Dropdown";
import Toast from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import AnimatedModal from "@/components/AnimatedModal";
import { IconFootball, IconGear, IconPerson, IconLink, IconAlert, IconLock } from "@/components/icons";

interface Team { id: string; name: string; }
interface Member { id: string; teamId: string; name: string; isPreset: boolean; }

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (id: string) => void;
  members: Member[];
  onAddMember: (name: string) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onCreateTeam: (name: string) => Promise<void>;
  onRenameTeam: (id: string, name: string) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  undoStack: { recordIds: string[]; label: string }[];
  onUndo: (index: number) => void;
  batchMode: boolean;
  onToggleBatch: () => void;
  onAddMemberClick: () => void;
  viewUrl: string;
  onResetToday?: () => void;
}

const hdrStyle = { color: "rgba(0,0,0,0.45)", textShadow: "0 1px 0 rgba(255,255,255,0.8)" };

export default function Sidebar({ isOpen, onClose, teams, selectedTeamId, onSelectTeam, members, onAddMember, onDeleteMember, onCreateTeam, onRenameTeam, onDeleteTeam, undoStack, onUndo, batchMode, onToggleBatch, onAddMemberClick, viewUrl, onResetToday }: SidebarProps) {
  const { t, lang, setLang } = useT();
  const [newName, setNewName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [pinModal, setPinModal] = useState<{ action: () => void } | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pinAuthed, setPinAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    const t = localStorage.getItem("pinAuthedUntil");
    return t ? Number(t) > Date.now() : false;
  });

  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    const overlay = overlayRef.current;
    if (!sidebar || !overlay) return;
    gsap.killTweensOf([sidebar, overlay, ".sidebar-item"]);
    if (isOpen) {
      gsap.set(sidebar, { xPercent: -100, autoAlpha: 0 });
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(".sidebar-item", { x: -16, autoAlpha: 0 });
      gsap.to(sidebar, { xPercent: 0, autoAlpha: 1, duration: 0.28, ease: "gsap-quart-out" });
      gsap.to(overlay, { autoAlpha: 1, pointerEvents: "auto", duration: 0.25 });
      gsap.to(".sidebar-item", { x: 0, autoAlpha: 1, duration: 0.3, stagger: { each: 0.05 }, ease: "gsap-quart-out", delay: 0.06 });
    } else {
      gsap.to(sidebar, { xPercent: -100, autoAlpha: 0, duration: 0.2, ease: "power3.in" });
      gsap.to(overlay, { autoAlpha: 0, pointerEvents: "none", duration: 0.2 });
    }
  }, [isOpen]);

  async function handleAdd(e: React.FormEvent) { e.preventDefault(); if (!newName.trim()) return; await onAddMember(newName.trim()); setNewName(""); }
  async function handleCreateTeam(e: React.FormEvent) { e.preventDefault(); if (!newTeamName.trim()) return; await onCreateTeam(newTeamName.trim()); setNewTeamName(""); }
  async function handleRenameSubmit(e: React.FormEvent) { e.preventDefault(); if (!renameValue.trim() || !selectedTeamId) return; await onRenameTeam(selectedTeamId, renameValue.trim()); setRenaming(false); }
  async function handleCopy() { await navigator.clipboard.writeText(viewUrl); setToastMsg(t.copiedLink.replace("{name}", selectedTeam?.name || "")); }

  function checkPin(action: () => void) { if (pinAuthed) { action(); return; } setPinModal({ action }); setPinInput(""); }
  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stored = localStorage.getItem("adminPin") || "0000";
    if (pinInput === stored) { localStorage.setItem("pinAuthedUntil", String(Date.now() + 30 * 60 * 1000)); setPinAuthed(true); setPinModal(null); if (pinModal) pinModal.action(); }
  }

  function handleDeleteConfirm() {
    setDeleteConfirm(false);
    if (selectedTeamId) onDeleteTeam(selectedTeamId);
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <>
      <div ref={overlayRef} className="fixed top-0 left-0 right-0 bottom-0 z-[44]" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)", opacity: 0, visibility: "hidden", pointerEvents: "none" }} onClick={onClose} />

      <div ref={sidebarRef} className="fixed top-0 left-0 h-full w-[85vw] max-w-[360px] z-[45] flex flex-col" style={{ background: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", opacity: 0, visibility: "hidden" }}>

        {/* ── Header ── */}
        <div className="px-6 py-5 flex items-center justify-between sidebar-item" style={{ borderBottom: "1px solid var(--border)" }}>
          <img src="/logo.png" alt={t.brand} className="h-8 w-auto" />
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--muted)] hover:bg-black/5 hover:text-[var(--text)] transition-all text-xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-7">

          {/* ── 1. Team ── */}
          <div className="sidebar-item px-6 overflow-visible">
            <span className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={hdrStyle}><IconFootball size={15} /> {t.team}</span>
            <Dropdown
              value={selectedTeamId || ""}
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              onChange={onSelectTeam}
              placeholder={t.selectTeam}
            />
            <form onSubmit={handleCreateTeam} className="flex gap-2 mt-2.5">
              <input className="input-pt flex-1 text-sm py-2.5 px-3.5" placeholder={t.newTeam} value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
              <button type="submit" className="bg-[var(--green)] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex-shrink-0" style={{ boxShadow: "0 2px 10px rgba(0,232,92,0.3)" }}>{t.create}</button>
            </form>
          </div>

          {/* ── 2. Team Settings ── */}
          {selectedTeamId && (
            <div className="sidebar-item px-6 space-y-2.5">
              <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={hdrStyle}><IconGear size={15} /> {t.teamSettings}</span>
              {renaming ? (
                <form onSubmit={handleRenameSubmit} className="flex gap-2">
                  <input className="input-pt flex-1 text-sm py-2.5 px-3.5" value={renameValue} onChange={e => setRenameValue(e.target.value)} placeholder={selectedTeam?.name} autoFocus />
                  <button type="submit" className="text-sm bg-[var(--green)] text-white px-4 py-2.5 rounded-lg font-bold" style={{ boxShadow: "0 2px 10px rgba(0,232,92,0.3)" }}>{t.save}</button>
                  <button type="button" onClick={() => setRenaming(false)} className="text-sm text-[var(--muted)] px-2">{t.cancel}</button>
                </form>
              ) : (
                <div className="flex gap-3">
                  <button onClick={() => { setRenameValue(selectedTeam?.name || ""); setRenaming(true); }} className="text-sm text-[var(--green)] hover:underline font-medium">{t.rename}</button>
                  <span className="text-[var(--border)]">|</span>
                  <button onClick={() => checkPin(() => setDeleteConfirm(true))} className="text-sm text-red-400/60 hover:text-red-400 transition-colors">{t.deleteTeam}</button>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Members ── */}
          {selectedTeamId && (
            <div className="sidebar-item px-6">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={hdrStyle}><IconPerson size={15} /> {t.members}</span>
                <span className="text-xs text-[var(--dim)]">{t.ppl.replace("{count}", String(members.length))}</span>
              </div>
              <form onSubmit={handleAdd} className="flex gap-2 mb-3.5">
                <input className="input-pt flex-1 text-sm py-3 px-3.5" placeholder={t.addMember} value={newName} onChange={e => setNewName(e.target.value)} />
                <button type="submit" className="bg-[var(--green)] text-white w-11 h-11 rounded-xl text-lg font-bold hover:brightness-110 transition-all flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 2px 12px rgba(0,232,92,0.35)" }}>+</button>
              </form>
              <ul className="space-y-1 max-h-64 overflow-y-auto -mx-1">
                {members.map(m => (
                  <li key={m.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-black/[0.03] transition-colors group">
                    <span className="text-[15px] font-medium text-[var(--text)]/85">{m.name}</span>
                    <button onClick={() => checkPin(() => onDeleteMember(m.id))} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-500 transition-all">{t.delete}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 4. Quick links ── */}
          {selectedTeamId && (
            <div className="sidebar-item px-6">
              <span className="text-sm font-bold uppercase tracking-widest mb-3.5 flex items-center gap-2" style={hdrStyle}><IconLink size={15} /> {t.quickLinks}</span>
              <div className="space-y-2">
                <button onClick={handleCopy} className="w-full text-left text-[15px] text-[var(--text)]/60 hover:text-[var(--green)] transition-colors px-1">{t.copyViewLink}</button>
              </div>
            </div>
          )}

          {/* ── Language ── */}
          <div className="sidebar-item px-6">
            <span className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={hdrStyle}>Language</span>
            <div className="flex gap-2">
              <button onClick={() => setLang("en")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${lang === "en" ? "bg-[var(--green)] text-black" : "text-[var(--dim)] hover:text-[var(--text)]"}`}>EN</button>
              <button onClick={() => setLang("zh")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${lang === "zh" ? "bg-[var(--green)] text-black" : "text-[var(--dim)] hover:text-[var(--text)]"}`}>中文</button>
            </div>
          {/* ── Danger Zone ── */}
          {selectedTeamId && (
            <div className="sidebar-item py-5 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-3 px-6">
                <span className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: "rgba(0,0,0,0.35)", textShadow: "0 1px 0 rgba(255,255,255,0.7)" }}><IconAlert size={15} /> {t.dangerZone}</span>
                <span className="text-xs text-[var(--dim)]">{pinAuthed ? t.unlocked : t.locked}</span>
              </div>
              {onResetToday && (
                <button onClick={() => checkPin(() => onResetToday())} className="w-full text-left flex items-center gap-2.5 text-sm text-red-400/60 hover:text-red-400 transition-colors py-2 px-6">
                  <IconLock size={13} /> {t.resetToday}
                </button>
              )}
              <button onClick={() => checkPin(() => setDeleteConfirm(true))} className="w-full text-left flex items-center gap-2.5 text-sm text-red-400/60 hover:text-red-400 transition-colors py-2 px-6">
                <IconLock size={13} /> {t.deleteTeamDanger.replace("{name}", selectedTeam?.name || "")}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <ConfirmModal
          title={t.deleteTeam}
          message={t.deleteTeamConfirm}
          confirmLabel={t.delete}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {/* PIN modal */}
      <AnimatedModal show={pinModal !== null} onClose={() => setPinModal(null)}>
        <h3 className="text-lg font-bold mb-1 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>{t.adminPin}</h3>
        <p className="text-xs text-[var(--muted)] mb-4">{t.defaultPin}</p>
        <form onSubmit={handlePinSubmit}>
          <input type="password" className="input-pt text-lg text-center mb-4" placeholder="PIN" value={pinInput} onChange={e => setPinInput(e.target.value)} autoFocus />
          <button type="submit" className="w-full bg-[var(--green)] text-white py-3 rounded-xl text-base font-bold hover:brightness-110 transition-all" style={{ boxShadow: "0 2px 12px rgba(0,232,92,0.3)" }}>{t.submitPin}</button>
        </form>
      </AnimatedModal>
    </>
  );
}
