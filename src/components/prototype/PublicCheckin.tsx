"use client";
import { useRef, useState, useEffect } from "react";
import type { Demo } from "@/lib/roster-types";
import type { SignatureData } from "@/lib/types";
import { nextAttendanceAction } from "@/lib/attendance-rules";
import SignaturePad from "@/components/SignaturePad";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import AnimatedNumber from "./AnimatedNumber";
import s from "@/app/prototype/prototype.module.css";

export default function PublicCheckin({ data, loaded, error, onAttendance }: { data: Demo; loaded: boolean; error: string; onAttendance: (personId: string, action: "in" | "out", signature?: SignatureData) => Promise<void> }) {
  const session = data.sessions[0], [personId, setPersonId] = useState(""), [strokes, setStrokes] = useState<SignatureData>([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [skip, setSkip] = useState(false), [selected, setSelected] = useState<string[]>([]), [batch, setBatch] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (personId) dialog.current?.showModal(); else dialog.current?.close(); }, [personId]);
  const person = data.people.find((item) => item.id === personId), place = data.places.find((item) => item.personId === personId), action = place && nextAttendanceAction(place.attendance);
  const submit = async (withoutSignature = false) => {
    if (busy || !action) return;
    if (!withoutSignature && !strokes.length) { setSkip(true); return; }
    setBusy(true); setNotice("");
    try { await onAttendance(personId, action, withoutSignature ? undefined : strokes); setPersonId(""); setNotice(`${person?.name}已${action === "in" ? "簽到" : "簽退"}。`); } catch (e) { setNotice(e instanceof Error ? e.message : "保存失敗，請重試。"); } finally { setBusy(false); }
  };
  const batchSubmit = async (operation: "in" | "out") => {
    if (busy) return; setBusy(true); let count = 0;
    try { for (const id of selected) { const item = data.places.find((place) => place.personId === id); if (item && nextAttendanceAction(item.attendance) === operation) { await onAttendance(id, operation); count++; } } setSelected([]); setNotice(`已完成 ${count} 人${operation === "in" ? "簽到" : "簽退"}。`); } catch(e) { setNotice(`已完成 ${count} 人。${e instanceof Error ? e.message : "請重試剩餘名單。"}`); } finally { setBusy(false); }
  };
  if (!loaded || !session) return <div className={s.app}><main className={s.publicMain}><h1>{error ? "此連結暫時不可用" : "載入場次…"}</h1><p>{error}</p></main></div>;
  return <div className={`${s.app} ${s.kioskMode}`}><header className={s.referenceHeader}><div><h1>{session.title}</h1><p>{session.date} · {session.time}</p></div></header><div className={s.referenceToolbar}><strong>簽到／簽退</strong><button className={s.textButton} onClick={() => { setBatch(!batch); setSelected([]); }}>{batch ? "結束選擇" : "批量選擇"}</button></div><main className={s.main}>
    {(notice || error) && <p role="status" className={s.pendingNotice}>{notice || error}</p>}
    {batch && <div className={s.attendanceBatchBar}><label><input type="checkbox" checked={data.places.length > 0 && selected.length === data.places.length} onChange={(e) => setSelected(e.target.checked ? data.places.map((item) => item.personId) : [])} />全選</label><span>已選 {selected.length} 人</span><button disabled={busy || !selected.length} className={s.primary} onClick={() => batchSubmit("in")}>批量簽到</button><button disabled={busy || !selected.length} className={s.secondary} onClick={() => batchSubmit("out")}>批量簽退</button></div>}
    <AnimatedContent distance={8} duration={.3}><div className={`${s.kioskGrid} ${s.referenceGrid}`}>{data.places.map((item) => <button key={item.personId} disabled={busy || !batch && item.attendance === "out"} aria-pressed={batch ? selected.includes(item.personId) : undefined} className={`${s.kioskPerson} ${item.attendance === "in" ? s.kioskPresent : item.attendance === "out" ? s.kioskOut : ""}`} onClick={() => { if (batch) { setSelected((ids) => ids.includes(item.personId) ? ids.filter((id) => id !== item.personId) : [...ids, item.personId]); return; } setStrokes([]); setSkip(false); setPersonId(item.personId); }}><strong>{data.people.find((person) => person.id === item.personId)?.name}</strong><span className={s.cardStatus}>{batch ? selected.includes(item.personId) ? "✓ 已選擇" : "點擊選擇" : item.attendance === "in" ? "已簽到 · 點擊簽退" : item.attendance === "out" ? "已簽退" : "點擊簽到"}</span></button>)}</div></AnimatedContent>
    {!data.places.length && <p className={s.empty}>本場還沒有名單。</p>}
  </main><footer className={s.referenceFooter}>{[["在場", data.places.filter((item) => item.attendance === "in").length], ["未到", data.places.filter((item) => item.attendance === "none").length], ["已簽退", data.places.filter((item) => item.attendance === "out").length], ["總計", data.places.length]].map(([label,count]) => <div key={label}><AnimatedNumber value={Number(count)} /><small>{label}</small></div>)}</footer>
  <dialog ref={dialog} className={`${s.drawer} ${s.attendanceDialog}`} onCancel={(e) => { if (busy) e.preventDefault(); else setPersonId(""); }}><div className={s.signatureScreen}><header className={s.signHeader}><div><small>{action === "out" ? "簽退" : "簽到"}</small><h2>{person?.name}</h2><p>{session.date} · {session.time}</p></div><button disabled={busy} aria-label="關閉簽名頁" onClick={() => setPersonId("")}>×</button></header><div className={s.signCanvas}><SignaturePad strokes={strokes} onChange={setStrokes} /></div><div className={s.signTools}><button disabled={busy || !strokes.length} onClick={() => setStrokes((value) => value.slice(0,-1))}>撤回一筆</button><button disabled={busy} onClick={() => setStrokes([])}>清除筆跡</button></div>{notice && <p role="alert">{notice}</p>}{skip ? <div className={s.skipSignatureNotice}><p>沒有簽名，確認仍要繼續？</p><button disabled={busy} className={s.primary} onClick={() => submit(true)}>確認不簽名</button><button disabled={busy} className={s.secondary} onClick={() => setSkip(false)}>返回簽名</button></div> : <button disabled={busy || !action} className={s.primary} onClick={() => submit()}>{busy ? "保存中…" : `確認${action === "out" ? "簽退" : "簽到"}`}</button>}</div></dialog></div>;
}
