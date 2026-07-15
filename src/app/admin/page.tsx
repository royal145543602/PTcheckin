"use client";

import { useState, useEffect, useCallback } from "react";
import TeamSelector from "@/components/TeamSelector";

interface Team { id: string; name: string; createdAt: string; }
interface Member { id: string; teamId: string; name: string; isPreset: boolean; }

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchTeams = useCallback(async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    setTeams(data);
    if (data.length > 0 && !selectedTeamId) {
      setSelectedTeamId(data[0].id);
    }
  }, [selectedTeamId]);

  const fetchMembers = useCallback(async () => {
    if (!selectedTeamId) return;
    const res = await fetch(`/api/teams/${selectedTeamId}/members`);
    const data = await res.json();
    setMembers(data);
  }, [selectedTeamId]);

  useEffect(() => { fetchTeams(); }, []);
  useEffect(() => { fetchMembers(); }, [selectedTeamId]);

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setLoading(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });
    const team = await res.json();
    setNewTeamName("");
    await fetchTeams();
    setSelectedTeamId(team.id);
    setMsg("团队已创建");
    setLoading(false);
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim() || !selectedTeamId) return;
    setLoading(true);
    await fetch(`/api/teams/${selectedTeamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMemberName, isPreset: true }),
    });
    setNewMemberName("");
    await fetchMembers();
    setMsg("成员已添加");
    setLoading(false);
  }

  async function deleteMember(memberId: string) {
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    await fetchMembers();
  }

  async function deleteTeam() {
    if (!selectedTeamId || !confirm("确定删除这个团队及其所有成员和记录？")) return;
    await fetch(`/api/teams/${selectedTeamId}`, { method: "DELETE" });
    setSelectedTeamId(null);
    await fetchTeams();
    setMembers([]);
    setMsg("团队已删除");
  }

  const kioskUrl = selectedTeamId ? `${window.location.origin}/kiosk/${selectedTeamId}` : "";
  const viewUrl = selectedTeamId ? `${window.location.origin}/view/${selectedTeamId}` : "";

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">签到管理</h1>

      {teams.length > 0 && (
        <TeamSelector teams={teams} selectedId={selectedTeamId} onSelect={setSelectedTeamId} loading={loading} />
      )}

      {/* Create Team */}
      <form onSubmit={createTeam} className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
          placeholder="新团队名称"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          创建
        </button>
      </form>

      {/* Team Actions */}
      {selectedTeamId && (
        <div className="mt-4 p-4 bg-white rounded-lg border space-y-2">
          <div className="flex flex-col gap-1 text-sm">
            <span>签到链接：<a href={kioskUrl} target="_blank" className="text-blue-600 underline break-all">{kioskUrl}</a></span>
            <span>查看链接：<a href={viewUrl} target="_blank" className="text-blue-600 underline break-all">{viewUrl}</a></span>
          </div>
          <button onClick={deleteTeam} className="text-red-600 text-sm">删除此团队</button>
        </div>
      )}

      {/* Member Management */}
      {selectedTeamId && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">成员管理</h2>
          <form onSubmit={addMember} className="flex gap-2 mb-4">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="成员名字"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              添加
            </button>
          </form>

          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex justify-between items-center bg-white border rounded-lg px-4 py-3">
                <span>{m.name}</span>
                <button onClick={() => deleteMember(m.id)} className="text-red-500 text-sm">删除</button>
              </li>
            ))}
          </ul>
          {members.length === 0 && <p className="text-gray-400 text-sm">还没有成员</p>}
        </div>
      )}

      {msg && <p className="mt-4 text-sm text-gray-500">{msg}</p>}
    </main>
  );
}
