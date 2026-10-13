"use client";

import { useCallback, useLayoutEffect, useRef, type PointerEvent } from "react";
import type { SignatureData } from "@/lib/types";

interface SignaturePadProps {
  strokes: SignatureData;
  onChange: (strokes: SignatureData) => void;
  width?: number;
  height?: number;
}

export default function SignaturePad({ strokes, onChange, width = 900, height = 600 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{ x: number; y: number }[]>([]);
  const pointer = useRef<number | null>(null);
  const frame = useRef(0);
  const latest = useRef({ strokes, onChange });
  latest.current = { strokes, onChange };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const bitmapWidth = Math.round(box.width * ratio);
    const bitmapHeight = Math.round(box.height * ratio);
    if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
      canvas.width = bitmapWidth; canvas.height = bitmapHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = box.width / width, sy = box.height / height;
    ctx.setTransform(ratio * sx, 0, 0, ratio * sy, 0, 0);
    ctx.strokeStyle = "#173b29"; ctx.fillStyle = "#173b29";
    ctx.lineWidth = 2.6 / Math.sqrt(sx * sy);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    const all = [...latest.current.strokes, ...(points.current.length ? [{ points: points.current }] : [])];
    for (const stroke of all) {
      const p = stroke.points;
      if (!p.length) continue;
      if (p.length === 1) {
        ctx.beginPath(); ctx.arc(p[0].x, p[0].y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
        continue;
      }
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y);
      for (let i = 1; i < p.length - 1; i++) {
        ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
      }
      ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y); ctx.stroke();
    }
  }, [width, height]);

  useLayoutEffect(() => {
    redraw();
    const observer = new ResizeObserver(redraw);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current); };
  }, [redraw]);
  useLayoutEffect(() => { redraw(); }, [strokes, redraw]);

  const position = (event: { clientX: number; clientY: number }) => {
    const box = canvasRef.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(width, (event.clientX - box.left) * width / box.width)), y: Math.max(0, Math.min(height, (event.clientY - box.top) * height / box.height)) };
  };
  const finish = (event: PointerEvent<HTMLCanvasElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    const stroke = points.current;
    points.current = [];
    if (stroke.length) latest.current.onChange([...latest.current.strokes, { points: stroke }]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return <canvas ref={canvasRef} aria-label="簽名區，使用手指、觸控筆或滑鼠書寫"
    style={{ display: "block", width: "100%", height: "100%", minHeight: 180, touchAction: "none", cursor: "crosshair", background: "#fff" }}
    onPointerDown={(event) => {
      if (pointer.current !== null || event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault(); pointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      points.current = [position(event)]; redraw();
    }}
    onPointerMove={(event) => {
      if (pointer.current !== event.pointerId) return;
      const samples = event.nativeEvent.getCoalescedEvents?.() || [];
      for (const sample of samples.length ? samples : [event]) points.current.push(position(sample));
      if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; redraw(); });
    }}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
  />;
}