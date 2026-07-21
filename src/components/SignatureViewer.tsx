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
      className="w-full max-w-[400px] h-[200px] rounded-xl"
      style={{ border: "1px solid rgba(0,128,51,0.1)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}
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
            stroke="#008033"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {strokes.length === 0 && (
        <text x="50%" y="50%" textAnchor="middle" className="text-sm fill-[var(--dim)]" dy=".3em">
          无签名
        </text>
      )}
    </svg>
  );
}
