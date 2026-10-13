"use client";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { emptyWorkspace, type Demo, type Application } from "@/lib/roster-types";
import type { SignatureData } from "@/lib/types";

export default function useCloudWorkspace() {
  const [data, update] = useState<Demo>(emptyWorkspace), [loaded, setLoaded] = useState(false), [unlocked, setUnlocked] = useState(false), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("admin");
  const current = useRef({ data: emptyWorkspace(), revision: 0 }), url = useRef("/api/workspace"), writing = useRef(false), queryMode = useRef("admin"), readSequence = useRef(0);
  const apply = (body: {data: Demo; revision: number}) => { current.current = body; update(body.data); setLoaded(true); };
  const refresh = useCallback(async () => {
    if (writing.current) return;
    const sequence = ++readSequence.current;
    try {
      const result = await fetch(url.current, { cache: "no-store" });
      const body = await result.json();
      if (sequence !== readSequence.current || writing.current) return;
      if (result.status === 401) { setUnlocked(false); setError(""); return; }
      if (!result.ok) throw new Error(body.error || "雲端連線失敗，請重試。");
      if (body.revision >= current.current.revision) apply(body);
      if (queryMode.current === "admin") setUnlocked(true);
    } catch (e) { setError(e instanceof Error ? e.message : "連線失敗。"); }
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    queryMode.current = params.get("mode") || "admin"; setMode(queryMode.current);
    url.current = `/api/workspace${params.toString() ? `?${params}` : ""}`;
    refresh(); const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  const setData = async (operation: SetStateAction<Demo>): Promise<string | null> => {
    if (writing.current || queryMode.current !== "admin" || !unlocked) { const message = "請先解鎖後台，並等待上一筆保存完成。"; setError(message); return message; }
    writing.current = true; ++readSequence.current; setSaving(true); setError("");
    const next = typeof operation === "function" ? operation(current.current.data) : operation;
    const revision = current.current.revision;
      try {
        const result = await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: next, revision }) });
        const body = await result.json();
        if (result.status === 401) setUnlocked(false);
        if (!result.ok) throw new Error(body.error || "保存失敗，請重試。");
        apply(body); return null;
      } catch (e) { const message = e instanceof Error ? e.message : "保存失敗，請重試。"; setError(message); return message; }
      finally { writing.current = false; setSaving(false); await refresh(); }
  };
  const unlock = async (pin: string) => {
    setError("");
    try { const result = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) }); const body = await result.json(); if (!result.ok) throw new Error(body.error); setUnlocked(true); await refresh(); } catch(e) { setError(e instanceof Error ? e.message : "解鎖失敗。"); }
  };
  const lock = async () => { await fetch("/api/admin/session", { method: "DELETE" }); setUnlocked(false); update(emptyWorkspace()); setLoaded(false); };
  const submitGuest = async (fields: {sessionIds: string[]; name: string; phone: string; note: string}): Promise<{ receipt: string; applications: Application[] }> => {
    if (writing.current) throw new Error("正在提交，請稍候。");
    writing.current = true; setSaving(true);
    try {
      const requestUrl = queryMode.current === "admin" ? `/api/workspace?mode=register&sessions=${encodeURIComponent(fields.sessionIds.join(","))}` : url.current;
      const result = await fetch(requestUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", ...fields }) });
      const body = await result.json(); if (!result.ok) throw new Error(body.error);
      const params = new URLSearchParams(window.location.search); params.set("receipt", body.receipt);
      if (queryMode.current !== "admin") { window.history.replaceState(null, "", `${window.location.pathname}?${params}`); url.current = `/api/workspace?${params}`; }
      update((previous) => ({...previous, requests: [...body.applications, ...previous.requests.filter((item) => !body.applications.some((entry: Application) => entry.id === item.id))]}));
      return { receipt: body.receipt, applications: body.applications };
    } finally { writing.current = false; setSaving(false); }
  };
  const publicAttendance = async (personId: string, action: "in" | "out", signature?: SignatureData) => {
    if (writing.current) throw new Error("正在保存，請稍候。");
    writing.current = true; setSaving(true);
    try { const result = await fetch(url.current, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, personId, sessionId: current.current.data.sessions[0]?.id, signature }) }); const body = await result.json(); if (!result.ok) throw new Error(body.error); apply(body); } finally { writing.current = false; setSaving(false); }
  };
  return {data, setData, loaded, unlocked, error, saving, mode, unlock, lock, submitGuest, publicAttendance};
}
