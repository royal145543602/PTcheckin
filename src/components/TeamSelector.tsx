"use client";

interface TeamSelectorProps {
  teams: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function TeamSelector({ teams, selectedId, onSelect, loading }: TeamSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">团队：</label>
      <select
        className="border rounded-lg px-3 py-2 text-sm bg-white"
        value={selectedId || ""}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
      >
        <option value="" disabled>选择团队</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
