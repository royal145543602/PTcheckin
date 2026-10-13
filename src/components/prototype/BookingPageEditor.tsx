"use client";

import { useState } from "react";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import s from "@/app/prototype/prototype.module.css";

export type BookingSlot = { id: string; title: string; start: string; end: string; seats: string; originalSeats?: number };
export type BookingDay = { id: string; date: string; slots: BookingSlot[] };
export type BookingDraft = { title: string; description: string; days: BookingDay[] };
const blankSlot = (): BookingSlot => ({ id: crypto.randomUUID(), title: "", start: "", end: "", seats: "" });
const blankDay = (): BookingDay => ({ id: crypto.randomUUID(), date: "", slots: [blankSlot()] });

export default function BookingPageEditor({ initial, saved, url, onSave, onBack }: {
  initial?: BookingDraft; saved: boolean; url: string;
  onSave: (draft: BookingDraft) => string | null | Promise<string | null>; onBack: () => void;
}) {
  const [draft, setDraft] = useState<BookingDraft>(() => initial || { title: "", description: "", days: [] });
  const [dirty, setDirty] = useState(false);
  const [published, setPublished] = useState(saved);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  function change(next: BookingDraft) { setDraft(next); setDirty(true); setError(""); setCopied(false); }
  function changeDay(id: string, fn: (day: BookingDay) => BookingDay) { change({ ...draft, days: draft.days.map((day) => day.id === id ? fn(day) : day) }); }
  function changeSlot(dayId: string, slotId: string, field: keyof BookingSlot, value: string) { changeDay(dayId, (day) => ({ ...day, slots: day.slots.map((slot) => slot.id === slotId ? { ...slot, [field]: value } : slot) })); }
  async function save() {
    const issue = await onSave(draft);
    if (issue) { setError(issue); return; }
    setDraft({ ...draft, days: draft.days.map((day) => ({ ...day, slots: day.slots.map((slot) => ({ ...slot, originalSeats: Number(slot.seats) })) })) });
    setPublished(true); setDirty(false); setCopied(false);
  }
  const slots = draft.days.flatMap((day) => day.slots);
  const total = slots.reduce((sum, slot) => sum + (Number(slot.seats) || 0), 0);
  return <section className={s.bookingEditor} aria-label="報名分享頁設定">
    <button className={s.textButton} onClick={onBack}>← 返回客戶管理</button>
    <div className={s.bookingIntro}><label>分享頁標題<input value={draft.title} placeholder="填寫這次報名活動的名稱" onChange={(e) => change({ ...draft, title: e.target.value })} maxLength={60} /></label><label>給客人的說明<textarea value={draft.description} placeholder="例如地點、適合對象、報名須知（選填）" onChange={(e) => change({ ...draft, description: e.target.value })} maxLength={1000} rows={3} /></label></div>
    <div className={s.bookingSectionTitle}><div><h2>日期與時段</h2><p>一天可設多個時段，每個時段的名額各自填寫。</p></div><button className={s.secondary} onClick={() => change({ ...draft, days: [...draft.days, blankDay()] })}>＋ 添加一天</button></div>
    {!draft.days.length && <div className={s.bookingEmpty}><h3>從你要開放的第一天開始</h3><p>日期、時間、名額都由你決定。</p><button className={s.primary} onClick={() => change({ ...draft, days: [blankDay()] })}>添加第一天</button></div>}
    {draft.days.map((day, index) => <AnimatedContent key={day.id} className={s.bookingDay} distance={8} duration={.24}>
      <div className={s.bookingDayHeading}><label>第 {index + 1} 天<input type="date" aria-label={`第${index + 1}天日期`} defaultValue={day.date} onInput={(e) => changeDay(day.id, (item) => ({ ...item, date: e.currentTarget.value }))} /></label><div><button className={s.textButton} onClick={() => change({ ...draft, days: [...draft.days, { id: crypto.randomUUID(), date: "", slots: day.slots.map((slot) => ({ ...slot, id: crypto.randomUUID(), originalSeats: undefined })) }] })}>複製時段到另一天</button><button className={s.dangerButton} onClick={() => change({ ...draft, days: draft.days.filter((item) => item.id !== day.id) })}>移除這天</button></div></div>
      {day.slots.map((slot, slotIndex) => <div className={s.bookingSlot} key={slot.id}><label>時段名稱<input aria-label={`第${index + 1}天時段${slotIndex + 1}名稱`} value={slot.title} placeholder="選填，未填則使用分享頁標題" onChange={(e) => changeSlot(day.id, slot.id, "title", e.target.value)} maxLength={60} /></label><label>開始<input type="time" step={60} aria-label={`第${index + 1}天時段${slotIndex + 1}開始`} defaultValue={slot.start} onInput={(e) => changeSlot(day.id, slot.id, "start", e.currentTarget.value)} /></label><label>結束<input type="time" step={60} aria-label={`第${index + 1}天時段${slotIndex + 1}結束`} defaultValue={slot.end} onInput={(e) => changeSlot(day.id, slot.id, "end", e.currentTarget.value)} /></label><label>開放名額<input type="number" min={0} step={1} aria-label={`第${index + 1}天時段${slotIndex + 1}名額`} value={slot.seats} placeholder="幾位" onChange={(e) => changeSlot(day.id, slot.id, "seats", e.target.value)} /></label><button className={s.textButton} aria-label={`移除第${index + 1}天時段${slotIndex + 1}`} onClick={() => changeDay(day.id, (item) => ({ ...item, slots: item.slots.filter((entry) => entry.id !== slot.id) }))}>移除</button></div>)}
      <button className={s.textButton} onClick={() => changeDay(day.id, (item) => ({ ...item, slots: [...item.slots, blankSlot()] }))}>＋ 添加時段</button>
    </AnimatedContent>)}
    {error && <p className={s.error} role="alert">{error}</p>}
    <footer className={s.bookingPublish}><div><strong>{draft.days.length} 天 · {slots.length} 個時段 · {total} 個名額</strong><small>{dirty ? "尚未保存修改" : published ? "已保存，所有日期共用同一個連結" : "填好後保存，產生一個分享連結"}</small></div><div><button className={s.secondary} onClick={save}>保存分享頁</button><button className={s.primary} disabled={!published || dirty} onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); } }}>{copied ? "已複製連結 ✓" : "複製分享連結"}</button>{published && !dirty && <a href={url} target="_blank" rel="noopener noreferrer">預覽客人頁面 ↗</a>}</div>{copyFailed && <label>可選取複製連結<input readOnly value={url} onFocus={(e) => e.currentTarget.select()} /></label>}</footer>
  </section>;
}
