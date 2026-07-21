"use client";

import { useState } from "react";
import AnimatedModal from "@/components/AnimatedModal";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export default function AddMemberModal({ isOpen, onClose, onAdd }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim());
    setName("");
    setLoading(false);
    onClose();
  }

  return (
    <AnimatedModal show={isOpen} onClose={onClose} cardCls="bg-white rounded-2xl p-6 w-full max-w-sm" variant="slide">
      <h3 className="text-lg font-bold mb-4 font-display tracking-wider" style={{ fontFamily: "'Barlow Condensed', 'Noto Sans TC', sans-serif" }}>添加人员</h3>
      <form onSubmit={handleSubmit}>
        <input className="input-pt text-lg mb-4 text-center" placeholder="输入名字" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl text-base font-medium text-[var(--muted)] hover:text-[var(--text)] transition-all">取消</button>
          <button type="submit" disabled={loading} className="flex-1 bg-[var(--green)] text-white py-3 rounded-xl text-base font-bold disabled:opacity-50 hover:brightness-110 transition-all" style={{ boxShadow: "0 2px 12px rgba(0,232,92,0.3)" }}>添加</button>
        </div>
      </form>
    </AnimatedModal>
  );
}
