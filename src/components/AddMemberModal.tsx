"use client";

import { useState } from "react";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export default function AddMemberModal({ isOpen, onClose, onAdd }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">添加人员</h3>
        <form onSubmit={handleSubmit}>
          <input
            className="w-full border rounded-xl px-4 py-3 text-lg mb-4"
            placeholder="输入名字"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-xl text-lg font-medium">
              取消
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-lg font-medium disabled:opacity-50">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
