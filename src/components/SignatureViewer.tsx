"use client";

import type { SignatureData } from "@/lib/types";

interface SignatureViewerProps {
  strokes: SignatureData;
  width?: number;
  height?: number;
}

export default function SignatureViewer({ strokes, width = 700, height = 400 }: SignatureViewerProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-[400px] h-[200px] border rounded-xl bg-white"
    >
      {strokes.map((stroke, i) => {
        if (stroke.points.length < 2) return null;
        const d = stroke.points
          .map((p, j) => `${j === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ");
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {strokes.length === 0 && (
        <text x="50%" y="50%" textAnchor="middle" className="text-sm fill-gray-400" dy=".3em">
          无签名
        </text>
      )}
    </svg>
  );
}
