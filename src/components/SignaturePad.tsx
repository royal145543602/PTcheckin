"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { SignatureData } from "@/lib/types";

interface SignaturePadProps {
  strokes: SignatureData;
  onChange: (strokes: SignatureData) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ strokes, onChange, width = 900, height = 600 }: SignaturePadProps) {
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

    // Subtle grid for premium feel
    ctx.strokeStyle = "rgba(0,128,51,0.04)";
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Signature line
    ctx.strokeStyle = "rgba(0,128,51,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.65);
    ctx.lineTo(width * 0.85, height * 0.65);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw strokes
    ctx.strokeStyle = "#008033";
    ctx.lineWidth = 2.5;
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
      className="w-full h-full min-h-[280px] rounded-xl bg-[rgba(0,0,0,0.04)] touch-none cursor-crosshair"
      style={{ border: "1px solid rgba(0,128,51,0.12)" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
