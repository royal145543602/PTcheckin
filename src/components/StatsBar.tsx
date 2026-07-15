interface StatsBarProps {
  present: number;
  absent: number;
  gone: number;
  total: number;
}

export default function StatsBar({ present, absent, gone, total }: StatsBarProps) {
  return (
    <div className="flex justify-around text-center py-3 bg-white border-t text-sm sm:text-base">
      <div><span className="text-green-600 font-bold">{present}</span> 在场</div>
      <div><span className="text-gray-400 font-bold">{absent}</span> 未到</div>
      {gone > 0 && <div><span className="text-orange-500 font-bold">{gone}</span> 已走</div>}
      <div><span className="font-bold">{total}</span> 共</div>
    </div>
  );
}
