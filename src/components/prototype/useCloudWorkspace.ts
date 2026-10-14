"use client";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { emptyWorkspace, type Demo, type Application } from "@/lib/roster-types";
import { canRecordAttendance } from "@/lib/attendance-rules";
import type { SignatureData } from "@/lib/types";

export default function useCloudWorkspace() {
  const [data, update] = useState<Demo>(emptyWorkspace), [loaded, setLoaded] = useState(false), [unlocked, setUnlocked] = useState(false), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("admin"), [offline, setOffline] = useState(false);
  const local = useRef(false);
  const localKey = "pt-checkin-local-preview-v1";
  const current = useRef({ data: emptyWorkspace(), revision: 0 }), url = useRef("/api/workspace"), writing = useRef(false), queryMode = useRef("admin"), readSequence = useRef(0);
  const apply = (body: {data: Demo; revision: number}) => { current.current = body; update(body.data); setLoaded(true); };
  const saveLocal = (next: Demo) => {
    const body = {data: next, revision: current.current.revision + 1};
    localStorage.setItem(localKey, JSON.stringify(body)); apply(body);
  };
  const refresh = useCallback(async () => {
    if (local.current || writing.current) return;
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
    if (["127.0.0.1", "localhost", "[::1]"].includes(window.location.hostname)) {
      local.current = true; setOffline(true); setUnlocked(true);
      try { const saved = localStorage.getItem(localKey); apply(saved ? JSON.parse(saved) : {data: emptyWorkspace(), revision: 0}); } catch { apply({data: emptyWorkspace(), revision: 0}); }
      const receive = (event: StorageEvent) => { if (event.key === localKey && event.newValue) { try { apply(JSON.parse(event.newValue)); } catch { setError("本地資料無法讀取，請重新整理。"); } } };
      window.addEventListener("storage", receive); return () => window.removeEventListener("storage", receive);
    }
    refresh(); const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);
  const setData = async (operation: SetStateAction<Demo>): Promise<string | null> => {
    if (writing.current || queryMode.current !== "admin" || !unlocked) { const message = "請先解鎖後台，並等待上一筆保存完成。"; setError(message); return message; }
    writing.current = true; ++readSequence.current; setSaving(true); setError("");
    const next = typeof operation === "function" ? operation(current.current.data) : operation;
    const revision = current.current.revision;
      try {
        if (local.current) { saveLocal(next); return null; }
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
    if (local.current) { setUnlocked(true); return; }
    try { const result = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) }); const body = await result.json(); if (!result.ok) throw new Error(body.error); setUnlocked(true); await refresh(); } catch(e) { setError(e instanceof Error ? e.message : "解鎖失敗。"); }
  };
  const lock = async () => { if (local.current) return; await fetch("/api/admin/session", { method: "DELETE" }); setUnlocked(false); update(emptyWorkspace()); setLoaded(false); };
  const submitGuest = async (fields: {sessionIds: string[]; name: string; phone: string; note: string}): Promise<{ receipt: string; applications: Application[] }> => {
    if (writing.current) throw new Error("正在提交，請稍候。");
    writing.current = true; setSaving(true);
    try {
      if (local.current) {
        const previous = current.current.data, receipt = crypto.randomUUID();
        if (!fields.sessionIds.length || fields.sessionIds.some((id) => { const item = previous.sessions.find((item) => item.id === id && item.public); return !item || previous.places.filter((place) => place.sessionId === id && !place.removedAt).length >= (item.registrationLimit ?? item.capacity); })) throw new Error("所選場次未開放或已滿，請重新選擇。");
        if (previous.requests.some((item) => fields.sessionIds.includes(item.sessionId) && item.phone === fields.phone && item.state !== "rejected")) throw new Error("已有這個聯絡方式的報名。");
        const applications: Application[] = fields.sessionIds.map((sessionId) => ({id: crypto.randomUUID(), receiptId: receipt, sessionId, name: fields.name, phone: fields.phone, note: fields.note, state: "pending"}));
        saveLocal({...previous, requests: [...applications, ...previous.requests], logs: [`本地預覽 · 收到 ${fields.name} 的 ${applications.length} 場報名。`, ...previous.logs]});
        if (queryMode.current !== "admin") { const params = new URLSearchParams(window.location.search); params.set("receipt", receipt); window.history.replaceState(null, "", `${window.location.pathname}?${params}`); }
        return {receipt, applications};
      }
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
    try {
      if (local.current) {
        const previous = current.current.data, id = new URLSearchParams(window.location.search).get("session");
        const place = previous.places.find((item) => item.sessionId === id && item.personId === personId && !item.removedAt);
        if (!place || !canRecordAttendance(place.attendance, action)) throw new Error("狀態已改變，請重新選擇。");
        saveLocal({...previous, places: previous.places.map((item) => item === place ? {...item, attendance: action, signature} : item), records: [{id: crypto.randomUUID(), sessionId: place.sessionId, personId, before: place.attendance, after: action, signatureBefore: place.signature, signature, time: new Date().toISOString()}, ...previous.records]}); return;
      }
      const result = await fetch(url.current, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, personId, sessionId: current.current.data.sessions[0]?.id, signature }) }); const body = await result.json(); if (!result.ok) throw new Error(body.error); apply(body); } finally { writing.current = false; setSaving(false); }
  };
  const shownData = offline && mode === "kiosk" ? {...data, sessions: data.sessions.filter((item) => item.id === new URLSearchParams(window.location.search).get("session")), places: data.places.filter((item) => item.sessionId === new URLSearchParams(window.location.search).get("session") && !item.removedAt)} : data;
  return {data: shownData, offline, setData, loaded, unlocked, error, saving, mode, unlock, lock, submitGuest, publicAttendance};
}
