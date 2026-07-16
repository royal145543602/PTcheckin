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

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(strokes.length > 0 ? strokes : null);
    setStrokes([]);
    setLoading(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    await onConfirm(null);
    setStrokes([]);
    setLoading(false);
  };

  const actionLabel = actionType === "in" ? "签到" : "签退";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">
          {actionLabel} - {memberName}
        </h3>
        <p className="text-sm text-gray-500 mb-4">请签名确认</p>

        <div className="flex justify-center mb-3">
          <SignaturePad strokes={strokes} onChange={setStrokes} />
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setStrokes(strokes.slice(0, -1))}
            disabled={strokes.length === 0}
            className="text-sm px-3 py-1.5 border rounded-lg disabled:opacity-30"
          >
            撤销
          </button>
          <button
            type="button"
            onClick={() => setStrokes([])}
            disabled={strokes.length === 0}
            className="text-sm px-3 py-1.5 border rounded-lg disabled:opacity-30"
          >
            清除
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 bg-gray-200 py-3 rounded-xl text-base font-medium disabled:opacity-50"
          >
            跳过签名
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-base font-medium disabled:opacity-50"
          >
            确认{actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
