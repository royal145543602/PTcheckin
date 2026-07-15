"use client";

interface MemberCardProps {
  name: string;
  status: "in" | "out" | "none";
  lastCheckIn: string | null;
  lastCheckOut: string | null;
  onClick: () => void;
}

export default function MemberCard({ name, status, lastCheckIn, lastCheckOut, onClick }: MemberCardProps) {
  const isIn = status === "in";
  const isOut = status === "out";

  const formatTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full min-h-[80px] sm:min-h-[100px] rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all active:scale-95
        ${isIn ? "bg-green-500 text-white shadow-lg" : isOut ? "bg-orange-100 border-2 border-orange-300" : "bg-gray-200 text-gray-500 border-2 border-gray-300"}`}
    >
      <span className="text-xl sm:text-2xl font-bold">{name}</span>
      {isIn && lastCheckIn && (
        <span className="text-sm opacity-90 mt-1">签到 {formatTime(lastCheckIn)}</span>
      )}
      {isOut && lastCheckOut && (
        <span className="text-sm text-orange-700 mt-1">已走 {formatTime(lastCheckOut)}</span>
      )}
    </button>
  );
}
