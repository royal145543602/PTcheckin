"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { SignatureData } from "@/lib/types";

interface SignaturePadProps {
  strokes: SignatureData;
  onChange: (strokes: SignatureData) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ strokes, onChange, width = 400, height = 200 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);

  const getPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [width, height]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const allStrokes = [...strokes, ...(drawing ? [{ points: currentStroke.current }] : [])];
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, drawing, width, height]);

  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    setDrawing(true);
    currentStroke.current = [getPos(e)];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    currentStroke.current.push(getPos(e));
    redraw();
  };

  const handlePointerUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (currentStroke.current.length > 0) {
      onChange([...strokes, { points: currentStroke.current }]);
    }
    currentStroke.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full max-w-[400px] h-[200px] border-2 border-gray-300 rounded-xl bg-white touch-none cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
