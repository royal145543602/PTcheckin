"use client";

import { useState } from "react";

interface Team {
  id: string;
  name: string;
}

interface Member {
  id: string;
  teamId: string;
  name: string;
  isPreset: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (id: string) => void;
  members: Member[];
  onAddMember: (name: string) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  viewUrl: string;
}

export default function Sidebar({ isOpen, onClose, teams, selectedTeamId, onSelectTeam, members, onAddMember, onDeleteMember, viewUrl }: SidebarProps) {
  const [newName, setNewName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await onAddMember(newName.trim());
    setNewName("");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(viewUrl);
    alert("链接已复制");
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">菜单</h2>
          <button onClick={onClose} className="text-gray-500 text-xl">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">团队</label>
            <select
              value={selectedTeamId || ""}
              onChange={(e) => onSelectTeam(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1 text-sm bg-white"
            >
              <option value="" disabled>选择团队</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {selectedTeamId && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">成员管理</h3>
              <form onSubmit={handleAdd} className="flex gap-2 mb-2">
                <input
                  className="flex-1 border rounded-lg px-2 py-1 text-sm"
                  placeholder="添加成员"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">+</button>
              </form>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {members.map((m) => (
                  <li key={m.id} className="flex justify-between items-center text-sm py-1">
                    <span>{m.name}</span>
                    <button onClick={() => onDeleteMember(m.id)} className="text-red-400 text-xs">删除</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedTeamId && (
            <div>
              <button onClick={handleCopy} className="text-sm text-blue-600 underline">
                复制家长查看链接
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
