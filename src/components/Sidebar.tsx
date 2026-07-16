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
  onCreateTeam: (name: string) => Promise<void>;
  onRenameTeam: (id: string, name: string) => Promise<void>;
  onDeleteTeam: (id: string) => Promise<void>;
  undoStack: { recordIds: string[]; label: string }[];
  onUndo: (index: number) => void;
  batchMode: boolean;
  onToggleBatch: () => void;
  onAddMemberClick: () => void;
  viewUrl: string;
}

export default function Sidebar({ isOpen, onClose, teams, selectedTeamId, onSelectTeam, members, onAddMember, onDeleteMember, onCreateTeam, onRenameTeam, onDeleteTeam, undoStack, onUndo, batchMode, onToggleBatch, onAddMemberClick, viewUrl }: SidebarProps) {
  const [newName, setNewName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [pinModal, setPinModal] = useState<{ action: () => void } | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinAuthed, setPinAuthed] = useState(() => {
    if (typeof window === "undefined") return false;
    const t = localStorage.getItem("pinAuthedUntil");
    return t ? Number(t) > Date.now() : false;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await onAddMember(newName.trim());
    setNewName("");
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await onCreateTeam(newTeamName.trim());
    setNewTeamName("");
  }

  async function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renameValue.trim() || !selectedTeamId) return;
    await onRenameTeam(selectedTeamId, renameValue.trim());
    setRenaming(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(viewUrl);
    alert("链接已复制");
  }

  function checkPin(action: () => void) {
    if (pinAuthed) { action(); return; }
    setPinModal({ action });
    setPinInput("");
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stored = localStorage.getItem("adminPin") || "0000";
    if (pinInput === stored) {
      const until = Date.now() + 30 * 60 * 1000; // 30 min
      localStorage.setItem("pinAuthedUntil", String(until));
      setPinAuthed(true);
      setPinModal(null);
      if (pinModal) pinModal.action();
    } else {
      alert("PIN 错误");
    }
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
            {/* Create new team */}
            <form onSubmit={handleCreateTeam} className="flex gap-2 mt-2">
              <input
                className="flex-1 border rounded-lg px-2 py-1 text-xs"
                placeholder="新建团队"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs">创建</button>
            </form>
          </div>

          {/* Team actions: rename, delete */}
          {selectedTeamId && (
            <div className="space-y-2">
              {renaming ? (
                <form onSubmit={handleRenameSubmit} className="flex gap-2">
                  <input
                    className="flex-1 border rounded-lg px-2 py-1 text-sm"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder={teams.find(t => t.id === selectedTeamId)?.name}
                    autoFocus
                  />
                  <button type="submit" className="text-xs bg-green-600 text-white px-2 py-1 rounded">保存</button>
                  <button type="button" onClick={() => setRenaming(false)} className="text-xs text-gray-400">取消</button>
                </form>
              ) : (
                <button onClick={() => { setRenameValue(teams.find(t => t.id === selectedTeamId)?.name || ""); setRenaming(true); }} className="text-xs text-blue-600 underline">
                  重命名团队
                </button>
              )}
              <br/>
              <button onClick={() => checkPin(() => { if (confirm("删除团队及其所有成员和记录？")) onDeleteTeam(selectedTeamId); })} className="text-xs text-red-500 underline">
                删除团队
              </button>
            </div>
          )}
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
                    <button onClick={() => checkPin(() => onDeleteMember(m.id))} className="text-red-400 text-xs">删除</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selectedTeamId && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">最近操作</h3>
              {undoStack.length === 0 ? (
                <p className="text-xs text-gray-400">暂无</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {undoStack.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-700">↩ {entry.label}</span>
                      <button onClick={() => onUndo(i)} className="text-yellow-600 underline">撤销</button>
                    </div>
                  ))}
                </div>
              )}
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
      {pinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setPinModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">请输入管理密码</h3>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                className="w-full border rounded-xl px-4 py-3 text-lg mb-4 text-center"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl text-base font-medium">
                确认
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
