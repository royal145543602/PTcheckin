"use client";

import { useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import type { SignatureData } from "@/lib/types";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signature: SignatureData | null) => Promise<void>;
  memberName: string;
  actionType: "in" | "out";
}

export default function SignatureModal({ isOpen, onClose, onConfirm, memberName, actionType }: SignatureModalProps) {
  const [strokes, setStrokes] = useState<SignatureData>([]);
  const [loading, setLoading] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (strokes.length === 0) {
      setConfirmSkip(true);
      return;
    }
    setLoading(true);
    await onConfirm(strokes);
    setStrokes([]);
    setLoading(false);
  };

  const handleForceConfirm = async () => {
    setLoading(true);
    await onConfirm(null);
    setStrokes([]);
    setConfirmSkip(false);
    setLoading(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    await onConfirm(null);
    setStrokes([]);
    setLoading(false);
  };

  const actionLabel = actionType === "in" ? "签到" : "签退";

  if (confirmSkip) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmSkip(false)}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-2">还没签名</h3>
          <p className="text-sm text-gray-500 mb-4">确定要跳过签名吗？</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmSkip(false)} disabled={loading} className="flex-1 bg-gray-200 py-3 rounded-xl text-base font-medium">
              继续签名
            </button>
            <button onClick={handleForceConfirm} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-base font-medium disabled:opacity-50">
              确定跳过
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex flex-col z-50" onClick={onClose}>
      {/* Header */}
      <div className="bg-white px-6 py-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-xl font-bold">{actionLabel} - {memberName}</h3>
          <p className="text-sm text-gray-500">请签名确认</p>
        </div>
        <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
      </div>

      {/* Canvas area - fills remaining space */}
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-2xl shadow-lg p-4 w-full max-w-4xl h-full max-h-[70vh] flex items-center justify-center">
          <SignaturePad strokes={strokes} onChange={setStrokes} width={900} height={600} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-white px-6 py-4 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStrokes(strokes.slice(0, -1))}
            disabled={strokes.length === 0}
            className="text-sm px-4 py-2 border rounded-lg disabled:opacity-30"
          >
            撤销
          </button>
          <button
            type="button"
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
            className="text-sm px-4 py-2 border rounded-lg disabled:opacity-30"
          >
            清除
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="bg-gray-200 px-6 py-3 rounded-xl text-base font-medium disabled:opacity-50"
          >
            跳过签名
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl text-base font-medium disabled:opacity-50"
          >
            确认{actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
