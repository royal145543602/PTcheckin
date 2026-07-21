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
      <label className="text-xs font-semibold text-[var(--dim)] uppercase tracking-wider">团队</label>
      <select
        className="select-pt text-sm py-2"
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
