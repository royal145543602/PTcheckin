"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { IconPlus, IconCheck, IconCheckIn, IconHistory, IconGroup, IconFootball, IconUndo, IconLink, IconLock } from "@/components/icons";
import SignaturePad from "@/components/SignaturePad";
import type { SignatureData } from "@/lib/types";
import s from "./prototype.module.css";

type View = "daily" | "week" | "requests" | "clients" | "history" | "register" | "kiosk";
const plans = ["單次", "月卡", "年卡"] as const;
const payments = ["已收款", "待收款", "無需另付"] as const;
type Person = { id: string; name: string; plan: string; phone: string; payment: string };
type Session = { id: string; date: string; title: string; time: string; coach: string; capacity: number; public: boolean };
type Place = { sessionId: string; personId: string; source: string; attendance: "none" | "in" | "out"; removedAt?: string; signature?: SignatureData };
type Application = { id: string; sessionId: string; name: string; phone: string; note: string; state: "pending" | "approved" | "waiting" | "rejected"; personId?: string };
type AttendanceRecord = { id: string; sessionId: string; personId: string; before: Place["attendance"]; after: Place["attendance"]; time: string; signatureBefore?: SignatureData; voided?: boolean };
type Demo = { people: Person[]; sessions: Session[]; places: Place[]; requests: Application[]; logs: string[]; rules: string[]; records: AttendanceRecord[] };
type Drawer = { kind: "request" | "person" | "add" | "rule" | "create" | "remove" | "newPeople" | "share"; id?: string } | null;
const days = Array.from({ length: 7 }, (_, i) => `2026-10-${12 + i}`);
const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
const dateLabel = (value: string) => `${Number(value.slice(5, 7))} 月 ${Number(value.slice(8))} 日`;
const fixture = (): Demo => {
  const names = ["陳小明", "李嘉欣", "王志明", "黃曉彤", "張子豪", "劉穎珊", "周柏軒", "林凱晴", "許家朗", "梁詠琪", "何志軒", "郭雅琳"];
  const people = names.map((name, i) => ({ id: `p${i}`, name, plan: i % 3 === 0 ? "年卡" : "月卡", phone: "示例聯絡方式", payment: "無需另付" }));
  const sessions = days.flatMap((date, i) => [
    { id: `private${i}`, date, title: "私人訓練", time: "17:00–18:00", coach: "Coach Alex", capacity: 1, public: false },
    { id: `group${i}`, date, title: "團體訓練", time: "19:00–20:00", coach: "Coach Alex", capacity: 16, public: true },
  ]);
  const places: Place[] = sessions.flatMap((session) => people.slice(0, session.public ? 12 : 1).map((person, index) => ({ sessionId: session.id, personId: person.id, source: "固定安排", attendance: session.id === "group1" && index < 8 ? "in" : "none" })));
  const requests: Application[] = ["林子軒", "鄭詠晴", "何俊豪"].map((name, i) => ({ id: `r${i}`, sessionId: "group1", name, phone: `demo-${i}`, note: ["第一次參加，希望先了解課程。", "希望安排晚間團體課。", "朋友介紹，想試一次。 "][i], state: "pending" }));
  return { people, sessions, places, requests, records: [], logs: ["示例名單已準備：10 月 13 日晚間團體課，共 12 人。"], rules: ["陳小明 · 每週一、三、五 · 團體訓練"] };
};

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) { return <span className={`${s.pill} ${s[tone] || ""}`}>{children}</span>; }

export default function PrototypePage() {
  const [data, setData] = useState<Demo>(fixture);
  const [view, setView] = useState<View>("daily");
  const [date, setDate] = useState(days[1]);
  const [sessionId, setSessionId] = useState("group1");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const [search, setSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState("pending");
  const [rosterTab, setRosterTab] = useState("roster");
  const [freshPerson, setFreshPerson] = useState("");
  const [guestStep, setGuestStep] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [guestSession, setGuestSession] = useState("group1");
  const [guestRequest, setGuestRequest] = useState("");
  const [guestError, setGuestError] = useState("");
  const [signPerson, setSignPerson] = useState("");
  const [strokes, setStrokes] = useState<SignatureData>([]);
  const [formError, setFormError] = useState("");
  const [editingPerson, setEditingPerson] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftPlan, setDraftPlan] = useState("");
  const [draftPayment, setDraftPayment] = useState("");
  const [bulkPlan, setBulkPlan] = useState("");
  const [bulkPayment, setBulkPayment] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [historyTab, setHistoryTab] = useState("attendance");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [shareMode, setShareMode] = useState<"roster" | "register">("roster");
  const [copied, setCopied] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [publicSurface, setPublicSurface] = useState<"" | "roster" | "register" | "invalid">("");
  const [origin, setOrigin] = useState("");
  const [syncTime, setSyncTime] = useState("");
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let initial = fixture();
    try { const saved = localStorage.getItem("pt-roster-prototype-v3") || sessionStorage.getItem("pt-roster-prototype-v1") || sessionStorage.getItem("pt-roster-prototype-v2"); if (saved) { initial = JSON.parse(saved); initial.people = initial.people.map((person: Person & { kind?: string }) => ({ ...person, plan: person.plan || (person.kind === "單次" ? "單次" : "月卡"), payment: ({ "已付": "已收款", "待付": "待收款", "套餐內": "無需另付" } as Record<string, string>)[person.payment] || person.payment })); } } catch { /* Use the fictional fixture. */ }
    setData(initial); setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search); const mode = params.get("mode"); const target = initial.sessions.find((item) => item.id === params.get("session"));
    if (mode) {
      if (!target || !["roster", "register"].includes(mode) || mode === "register" && !target.public) setPublicSurface("invalid");
      else { setPublicSurface(mode as "roster" | "register"); setSessionId(target.id); setDate(target.date); setGuestSession(target.id); }
    }
    setReady(true);
    const receive = (event: StorageEvent) => { if (event.key !== "pt-roster-prototype-v3" || !event.newValue) return; try { setData(JSON.parse(event.newValue)); setSyncTime(new Date().toLocaleTimeString("zh-HK", { timeZone: "Asia/Hong_Kong" })); } catch { /* Keep the current valid demo. */ } };
    window.addEventListener("storage", receive); return () => window.removeEventListener("storage", receive);
  }, []);
  useEffect(() => { if (ready && publicSurface !== "roster" && publicSurface !== "invalid") { try { localStorage.setItem("pt-roster-prototype-v3", JSON.stringify(data)); } catch { /* Demo remains usable without persistence. */ } } }, [data, ready, publicSurface]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3800); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    setFormError("");
    if (drawer || signPerson) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [drawer, signPerson]);

  const session = data.sessions.find((item) => item.id === sessionId)!;
  const roster = data.places.filter((item) => item.sessionId === sessionId && !item.removedAt);
  const pending = data.requests.filter((item) => item.state === "pending");
  const currentPending = pending.filter((item) => item.sessionId === sessionId);
  const currentApplication = data.requests.find((item) => item.id === guestRequest);
  const count = (id: string) => data.places.filter((item) => item.sessionId === id && !item.removedAt).length;
  const chooseSession = (item: Session) => { setSelected([]); setDate(item.date); setSessionId(item.id); setRosterTab("roster"); };
  const chooseDate = (value: string) => { setSelected([]); setDate(value); const next = data.sessions.find((item) => item.date === value && item.public); if (next) setSessionId(next.id); setRosterTab("roster"); };
  const closeDialog = () => { setDrawer(null); setSignPerson(""); setStrokes([]); };

  function processRequest(id: string, state: Application["state"]) {
    if (busy) return;
    const application = data.requests.find((item) => item.id === id);
    if (!application || application.state === "approved" || application.state === "rejected") return;
    const target = data.sessions.find((item) => item.id === application.sessionId)!;
    if (state === "approved" && count(target.id) >= target.capacity) { setToast("這個場次已滿，可以先設為候補。"); return; }
    setBusy(id);
    setTimeout(() => {
      setData((previous) => {
        const latest = previous.requests.find((item) => item.id === id);
        if (!latest || latest.state === "approved" || latest.state === "rejected") return previous;
        if (state === "approved" && previous.places.filter((item) => item.sessionId === target.id && !item.removedAt).length >= target.capacity) return previous;
        const personId = latest.personId || `person-${id}`;
        const person: Person = { id: personId, name: latest.name, phone: latest.phone, plan: "單次", payment: "待收款" };
        return {
          ...previous,
          people: state === "approved" && !previous.people.some((item) => item.id === personId) ? [...previous.people, person] : previous.people,
          places: state === "approved" ? [...previous.places, { sessionId: target.id, personId, source: "報名獲批", attendance: "none" }] : previous.places,
          requests: previous.requests.map((item) => item.id === id ? { ...item, state, personId: state === "approved" ? personId : item.personId } : item),
          logs: [`${latest.name} 的 ${dateLabel(target.date)} ${target.time} 報名${state === "approved" ? "已批准，加入正式名單" : state === "waiting" ? "已設為候補" : "未通過"}。`, ...previous.logs],
        };
      });
      setFreshPerson(`person-${id}`);
      setBusy(""); closeDialog();
      setToast(state === "approved" ? "已批准，正式名單已更新；付款狀態另行處理。" : state === "waiting" ? "已加入候補，不佔正式名額。" : "已記錄處理結果。");
    }, 420);
  }

  function createPeople(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setFormError(""); const form = new FormData(e.currentTarget);
    const names = String(form.get("names") || "").split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
    if (!names.length || names.length > 50 || names.some((name) => name.length > 40)) { setFormError("請填寫姓名，每行一位；一次最多 50 人，每個姓名最多 40 字。"); return; }
    if (new Set(names).size !== names.length) { setFormError("輸入的名單有重複姓名，請先核對。"); return; }
    const duplicate = names.find((name) => data.people.some((person) => person.name === name));
    if (duplicate) { setFormError(`「${duplicate}」已在客戶名單，請使用「加入場次」選擇現有客戶。`); return; }
    const targetId = String(form.get("target") || ""); const target = data.sessions.find((item) => item.id === targetId);
    if (target && count(target.id) + names.length > target.capacity) { setFormError(`此場剩餘 ${Math.max(0, target.capacity - count(target.id))} 個名額，未能加入全部 ${names.length} 人。請選另一場或先只建立客戶。`); return; }
    const plan = String(form.get("plan")); const payment = String(form.get("payment"));
    if (!plans.includes(plan as typeof plans[number]) || !payments.includes(payment as typeof payments[number])) return;
    const stamp = Date.now(); const additions: Person[] = names.map((name, index) => ({ id: `staff-${stamp}-${index}`, name, plan, payment, phone: String(form.get("phone") || "").trim() || "未填寫" }));
    const time = new Date().toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
    setData((previous) => ({ ...previous, people: [...previous.people, ...additions], places: target ? [...previous.places, ...additions.map((person): Place => ({ personId: person.id, sessionId: target.id, source: "後台加入", attendance: "none" }))] : previous.places, logs: additions.map((person) => `${time} · 後台新增 ${person.name} · ${plan} · ${payment}${target ? `，加入 ${dateLabel(target.date)} ${target.title}` : "，尚未安排場次"}。`).concat(previous.logs) }));
    setSearch(""); closeDialog(); setToast(`已確認新增 ${additions.length} 位客戶${target ? "並加入場次名單" : "，可再安排場次"}。`);
  }
  function addPerson(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setFormError(""); const form = new FormData(e.currentTarget); const personId = String(form.get("person")); const targetId = String(form.get("target")); const target = data.sessions.find((item) => item.id === targetId)!;
    if (data.places.some((item) => item.sessionId === targetId && item.personId === personId && !item.removedAt)) { setFormError("這位客戶已在所選場次名單中。"); return; }
    if (count(targetId) >= target.capacity) { setFormError("場次已滿，請選另一場次或先調整名額。"); return; }
    const person = data.people.find((item) => item.id === personId)!;
    setData((previous) => ({ ...previous, places: previous.places.some((place) => place.sessionId === targetId && place.personId === personId) ? previous.places.map((place) => place.sessionId === targetId && place.personId === personId ? { ...place, removedAt: undefined } : place) : [...previous.places, { sessionId: targetId, personId, source: "後台加入", attendance: "none" }], logs: [`${person.name} 已由後台加入 ${dateLabel(target.date)} ${target.title} ${target.time}。`, ...previous.logs] }));
    setFreshPerson(personId); closeDialog(); setToast("已確認加入所選場次，其他日期不變。");
  }

  function createSession(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const item: Session = { id: `session-${Date.now()}`, date: String(form.get("date")), title: String(form.get("title")).trim(), time: `${form.get("time")}–${form.get("end")}`, coach: "Coach Alex", capacity: Number(form.get("capacity")), public: form.get("public") === "on" };
    if (String(form.get("time")) >= String(form.get("end"))) { setToast("結束時間需要晚於開始時間。"); return; }
    setData((previous) => ({ ...previous, sessions: [...previous.sessions, item], logs: [`已建立 ${dateLabel(item.date)} ${item.title}。`, ...previous.logs] }));
    chooseSession(item); closeDialog(); setToast("場次已建立，可以開始排名單。");
  }

  function createRule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); const personId = String(form.get("person")); const weekdays = form.getAll("weekday").map(Number);
    if (!weekdays.length) { setToast("請選擇至少一個星期。"); return; }
    if (String(form.get("end")) < String(form.get("start"))) { setToast("結束日期不能早於開始日期。"); return; }
    const person = data.people.find((item) => item.id === personId)!;
    const targets = data.sessions.filter((item) => item.public && weekdays.includes(days.indexOf(item.date)) && item.date >= String(form.get("start")) && item.date <= String(form.get("end")));
    const additions: Place[] = targets.filter((item) => count(item.id) < item.capacity && !data.places.some((place) => place.sessionId === item.id && place.personId === personId)).map((item) => ({ sessionId: item.id, personId, source: "固定安排", attendance: "none" }));
    setData((previous) => ({ ...previous, places: [...previous.places, ...additions], rules: [`${person.name} · 每週${weekdays.map((i) => dayNames[i]).join("、")} · 團體訓練`, ...previous.rules], logs: [`${person.name} 的固定安排已更新，本週新增 ${additions.length} 個位置；滿額及已存在位置已跳過。`, ...previous.logs] }));
    closeDialog(); setToast(`安排已保存，本週新增 ${additions.length} 個位置。`);
  }

  function submitGuest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setGuestError("");
    const name = guestName.trim(); const phone = guestPhone.trim();
    if (!name || !phone) { setGuestError("請填寫姓名和示例聯絡方式。"); return; }
    const duplicate = data.requests.find((item) => item.sessionId === guestSession && item.phone.toLowerCase() === phone.toLowerCase() && item.state !== "rejected");
    if (duplicate) { setGuestRequest(duplicate.id); setGuestStep(4); setToast("已有這個場次的申請，已打開原報名結果。"); return; }
    const application: Application = { id: `request-${Date.now()}`, sessionId: guestSession, name, phone, note: guestNote, state: "pending" };
    setData((previous) => ({ ...previous, requests: [application, ...previous.requests], logs: [`收到 ${name} 的報名申請，等待確認。`, ...previous.logs] }));
    setGuestRequest(application.id); setGuestStep(4);
  }

  function confirmAttendance() {
    const person = data.people.find((item) => item.id === signPerson)!;
    const place = roster.find((item) => item.personId === signPerson)!;
    const attendance = place.attendance === "in" ? "out" : "in";
    const record: AttendanceRecord = { id: `attendance-${Date.now()}`, sessionId, personId: signPerson, before: place.attendance, after: attendance, signatureBefore: place.signature, time: new Date().toLocaleTimeString("zh-HK", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", second: "2-digit" }) };
    setData((previous) => ({ ...previous, records: [record, ...previous.records], places: previous.places.map((item) => item.sessionId === sessionId && item.personId === signPerson ? { ...item, attendance, signature: strokes } : item), logs: [`${person.name} 已在 ${session.title} ${attendance === "in" ? "簽到" : "簽退"}${strokes.length ? "並保存示例簽名" : ""}。`, ...previous.logs] }));
    setFreshPerson(signPerson); closeDialog(); setToast(`${person.name} ${attendance === "in" ? "簽到" : "簽退"}成功。`);
  }

  const navigation: { id: View; name: string; icon: ReactNode }[] = [
    { id: "daily", name: "每日名單", icon: <IconFootball /> }, { id: "requests", name: "報名", icon: <IconGroup /> },
    { id: "clients", name: "管理後台", icon: <IconGroup /> }, { id: "history", name: "歷史紀錄", icon: <IconHistory /> },
  ];
  const attendanceText = (value: Place["attendance"]) => value === "in" ? "已簽到" : value === "out" ? "已簽退" : "未簽到";

  const toggleSelected = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  function beginEdit(person: Person) { setEditingPerson(person.id); setDraftPhone(person.phone === "未填寫" ? "" : person.phone); setDraftPlan(person.plan); setDraftPayment(person.payment); }
  function savePerson() {
    const person = data.people.find((item) => item.id === editingPerson);
    if (!person) return;
    const time = new Date().toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
    const phone = draftPhone.trim() || "未填寫";
    const changes = [person.phone !== phone ? `聯絡方式：${person.phone} → ${phone}` : "", person.plan !== draftPlan ? `套餐：${person.plan} → ${draftPlan}` : "", person.payment !== draftPayment ? `付款：${person.payment} → ${draftPayment}` : ""].filter(Boolean);
    if (changes.length) setData((previous) => ({ ...previous, people: previous.people.map((item) => item.id === person.id ? { ...item, phone, plan: draftPlan, payment: draftPayment } : item), logs: [`${time} · ${person.name} · ${changes.join("；")}。`, ...previous.logs] }));
    setEditingPerson(""); closeDialog(); setToast(changes.length ? "已確認保存，修改紀錄已保留。" : "沒有變更。");
  }
  function saveBulk() {
    if (!selected.length || (!bulkPlan && !bulkPayment)) return;
    const time = new Date().toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" });
    setData((previous) => {
      const changes = previous.people.filter((person) => selected.includes(person.id)).flatMap((person) => {
        const details = [bulkPlan && person.plan !== bulkPlan ? `套餐：${person.plan} → ${bulkPlan}` : "", bulkPayment && person.payment !== bulkPayment ? `付款：${person.payment} → ${bulkPayment}` : ""].filter(Boolean);
        return details.length ? [`${time} · 批量修改 · ${person.name} · ${details.join("；")}。`] : [];
      });
      return { ...previous, people: previous.people.map((person) => selected.includes(person.id) ? { ...person, plan: bulkPlan || person.plan, payment: bulkPayment || person.payment } : person), logs: [...changes, ...previous.logs] };
    });
    setSelected([]); setBulkPlan(""); setBulkPayment(""); setToast("批量修改已確認保存，可在操作紀錄查看。");
  }
  function removePlaces(ids: string[]) {
    setData((previous) => ({ ...previous, places: previous.places.map((place) => place.sessionId === sessionId && ids.includes(place.personId) && !place.removedAt ? { ...place, removedAt: new Date().toISOString() } : place), logs: [`已從 ${dateLabel(session.date)} ${session.title} 移出 ${ids.length} 人，出席與簽名記錄保留。`, ...previous.logs] }));
    setSelected([]); closeDialog(); setToast("已移出本場名單，可在歷史紀錄中恢復。");
  }
  function restorePlace(place: Place) {
    const target = data.sessions.find((item) => item.id === place.sessionId)!;
    if (count(target.id) >= target.capacity) { setToast("原場次已滿，請先騰出名額再恢復。"); return; }
    if (data.places.some((item) => item.sessionId === place.sessionId && item.personId === place.personId && !item.removedAt)) { setToast("這位客戶已在名單中。"); return; }
    setData((previous) => ({ ...previous, places: previous.places.map((item) => item === place ? { ...item, removedAt: undefined } : item), logs: [`已恢復 ${data.people.find((person) => person.id === place.personId)?.name} 的 ${dateLabel(target.date)} 名單位置。`, ...previous.logs] }));
    setToast("已恢復原場次，原有出席狀態及簽名保留。");
  }
  function undoAttendance(record: AttendanceRecord) {
    const later = data.records.some((item) => !item.voided && item.sessionId === record.sessionId && item.personId === record.personId && data.records.indexOf(item) < data.records.indexOf(record));
    if (later) { setToast("請先撤銷這位客戶較新的紀錄。"); return; }
    setData((previous) => ({ ...previous, records: previous.records.map((item) => item.id === record.id ? { ...item, voided: true } : item), places: previous.places.map((item) => item.sessionId === record.sessionId && item.personId === record.personId ? { ...item, attendance: record.before, signature: record.signatureBefore } : item), logs: [`已撤銷 ${data.people.find((person) => person.id === record.personId)?.name} 的 ${record.time} ${attendanceText(record.after)}紀錄。`, ...previous.logs] }));
    setToast("已恢復操作前的出席狀態，撤銷紀錄仍然保留。");
  }

  function requestRows(items: Application[]) { return items.length ? items.map((item) => {
    const target = data.sessions.find((target) => target.id === item.sessionId)!;
    return <article className={s.request} key={item.id}>
      <div className={s.personLine}><div><strong>{item.name}</strong><p>{dateLabel(target.date)} · {target.time}</p></div><button className={s.textButton} onClick={() => setDrawer({ kind: "request", id: item.id })}>詳情 ↗</button></div>
      <p className={s.note}>{item.note || "沒有額外備註"}</p>
      {item.state === "pending" || item.state === "waiting" ? <div className={s.actions}><button className={s.primary} disabled={!!busy} onClick={() => count(target.id) >= target.capacity ? setDrawer({ kind: "request", id: item.id }) : processRequest(item.id, "approved")}>{busy === item.id ? "確認中…" : count(target.id) >= target.capacity ? "已滿 · 查看候補" : "批准"}</button><button className={s.secondary} onClick={() => setDrawer({ kind: "request", id: item.id })}>其他處理</button></div> : <Pill tone={item.state === "approved" ? "green" : "neutral"}>{item.state === "approved" ? "已加入名單" : "未通過"}</Pill>}
    </article>;
  }) : <div className={s.empty}><IconCheckIn size={32} /><h3>這裡都處理好了</h3><p>新的報名申請會出現在這裡。</p></div>; }

  function rosterPanel() { return <section className={s.panel}>

    <div className={s.panelHeader}><div><h2>{session.title}</h2><p>{session.time} · {session.coach}</p></div><div className={s.rosterActions}><button className={s.shareTrigger} onClick={() => { setShareMode("roster"); setCopied(false); setCopyFailed(false); setDrawer({ kind: "share" }); }}><IconLink size={17} /> 分享</button><button className={s.secondary} onClick={() => setDrawer({ kind: "add" })}><IconPlus /> 加入名單</button></div></div>
    <div className={s.mobileTabs}><button className={rosterTab === "roster" ? s.tabActive : ""} onClick={() => setRosterTab("roster")}>正式名單 {roster.length}</button><button className={rosterTab === "pending" ? s.tabActive : ""} onClick={() => setRosterTab("pending")}>待確認 {currentPending.length}</button></div>
    {rosterTab === "pending" ? requestRows(currentPending) : <><div className={s.bulkBar}><label><input type="checkbox" aria-label="全選本場名單" checked={roster.length > 0 && roster.every((place) => selected.includes(place.personId))} onChange={(e) => setSelected(e.target.checked ? roster.map((place) => place.personId) : [])} />全選</label><span>已選 {selected.length} 人</span><button className={s.dangerButton} disabled={!selected.length} onClick={() => setDrawer({ kind: "remove" })}>移出本場名單</button></div><div className={s.tableHead}><span>客戶姓名</span><span>來源</span><span>出席狀態</span><span>操作</span></div>
    {roster.length ? roster.map((place) => { const person = data.people.find((person) => person.id === place.personId)!; return <div key={person.id} className={`${s.row} ${freshPerson === person.id ? s.added : ""}`}>
      <label className={s.personName}><input type="checkbox" aria-label={`選擇${person.name}`} checked={selected.includes(person.id)} onChange={() => toggleSelected(person.id)} /><span><strong>{person.name}</strong><small>{person.plan}</small></span></label>
      <span className={s.source}><Pill tone={place.source === "報名獲批" ? "amber" : "green"}>{place.source}</Pill></span><span><Pill tone={place.attendance === "in" ? "green" : "neutral"}>{attendanceText(place.attendance)}</Pill></span>
      <button className={s.textButton} aria-label={`查看${person.name}資料`} onClick={() => setDrawer({ kind: "person", id: person.id })}>···</button>
    </div>; }) : <div className={s.empty}><h3>這一場還沒有人</h3><p>從客戶庫加入，或開放报名後再確認申請。</p></div>}</>}
  </section>; }

  function guestPage() {
    const target = data.sessions.find((item) => item.id === (currentApplication && guestStep === 4 ? currentApplication.sessionId : guestSession))!;
    const summary = <div className={s.courseSummary}><strong>{target.title}</strong><span>{dateLabel(target.date)} · {target.time}</span><span>PRIMETIME Macau · {target.coach}</span></div>;
    return <main className={s.guestWrap}><div className={s.guest} key={guestStep}><header className={s.guestBrand}>PRIMETIME<small>PERFORMANCE LAB MACAU</small></header><div className={s.guestBody}>
      {guestStep < 4 && <div className={s.steps}>{[1, 2, 3].map((step) => <span key={step} className={guestStep >= step ? s.stepActive : ""}>{step < guestStep ? "✓" : step}<small>{["選場次", "填資料", "核對"][step - 1]}</small></span>)}</div>}
      {guestStep === 1 && <><h1>預約下一次訓練</h1><p className={s.subtitle}>選擇場次，報名需經工作人員確認。</p><label>選擇日期<select value={data.sessions.find((item) => item.id === guestSession)?.date} onChange={(e) => { const next = data.sessions.find((item) => item.public && item.date === e.target.value); if (next) setGuestSession(next.id); }}>{(publicSurface === "register" ? [target.date] : days).map((day) => <option key={day} value={day}>{dateLabel(day)} · 星期{dayNames[days.indexOf(day)]}</option>)}</select></label>
        <div className={s.courseChoices}>{data.sessions.filter((item) => item.public && item.date === target.date && (publicSurface !== "register" || item.id === sessionId)).map((item) => <button key={item.id} className={`${s.courseChoice} ${guestSession === item.id ? s.courseSelected : ""}`} onClick={() => setGuestSession(item.id)}><span className={s.radio}>{guestSession === item.id ? "●" : ""}</span><span><strong>{item.title}</strong><p>{item.time}</p><small>{count(item.id) >= item.capacity ? "已滿，可申請候補" : "接受報名申請"}</small></span></button>)}</div><button className={s.primary} onClick={() => setGuestStep(2)}>下一步 →</button></>}
      {guestStep === 2 && <form onSubmit={(e) => { e.preventDefault(); setGuestStep(3); }}><h1>你的報名資料</h1>{summary}<p className={s.demoHint}>請用示例姓名及聯絡方式試用。</p><label>姓名<input required maxLength={40} value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="例如：林子軒" autoComplete="off" /></label><label>聯絡方式<input required maxLength={60} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="例如：demo-123" autoComplete="off" /></label><label>備註（選填）<textarea maxLength={200} value={guestNote} onChange={(e) => setGuestNote(e.target.value)} placeholder="如需協助，可在此留言。" /></label><button className={s.primary}>核對資料 →</button><button type="button" className={s.textButton} onClick={() => setGuestStep(1)}>返回選場次</button></form>}
      {guestStep === 3 && <form onSubmit={submitGuest}><h1>確認你的申請</h1>{summary}<dl className={s.details}><dt>姓名</dt><dd>{guestName}</dd><dt>聯絡方式</dt><dd>{guestPhone}</dd><dt>備註</dt><dd>{guestNote || "沒有額外備註"}</dd></dl><p className={s.pendingNotice}>提交後等待工作人員確認，暫時不進入正式名單；提交不代表已付款。</p>{guestError && <p className={s.error} role="alert">{guestError}</p>}<button className={s.primary}>提交報名申請</button><button type="button" className={s.textButton} onClick={() => setGuestStep(2)}>返回修改</button></form>}
      {guestStep === 4 && currentApplication && <><div className={`${s.statusMark} ${currentApplication.state === "approved" ? s.statusApproved : ""}`}>{currentApplication.state === "approved" ? <IconCheck size={44} /> : <IconHistory size={44} />}</div><h1>{currentApplication.state === "approved" ? "報名已確認" : currentApplication.state === "rejected" ? "這次申請未通過" : currentApplication.state === "waiting" ? "你已加入候補" : "報名已收到"}</h1><p className={s.subtitle}>{currentApplication.state === "approved" ? "你已加入正式名單，到場後可以簽到。" : currentApplication.state === "rejected" ? "你可以選擇其他場次重新申請。" : "等待工作人員確認後，才會加入正式名單。"}</p>{summary}<div className={s.progressRow}><Pill tone="green">已提交</Pill><span>→</span><Pill tone={currentApplication.state === "approved" ? "green" : "amber"}>{currentApplication.state === "approved" ? "已確認" : currentApplication.state === "waiting" ? "候補中" : currentApplication.state === "rejected" ? "未通過" : "待確認"}</Pill></div><p>{currentApplication.name}，此頁會顯示你的最新處理結果。</p>{!publicSurface && <button className={s.primary} onClick={() => { if (currentApplication.state === "approved") { chooseSession(target); setView("kiosk"); } else { setView("requests"); setRequestFilter("pending"); setToast("現在可在示例後台批准剛才的申請。"); } }}>{currentApplication.state === "approved" ? "前往場次簽到" : "試用後台確認這份报名"}</button>}<button className={s.textButton} onClick={() => { setGuestStep(1); setGuestRequest(""); }}>再試一次報名</button></>}
    </div></div></main>;
  }

  const publicLink = (mode: "roster" | "register") => `${origin}/prototype?mode=${mode}&session=${encodeURIComponent(sessionId)}`;
  const demoNotice = <div className={s.demoBar}>公開頁面原型 · 示例資料 · 僅本機瀏覽器同步</div>;
  if (!ready) return <div className={s.app}><main className={s.publicMain}><p>載入場次…</p></main></div>;
  if (publicSurface === "invalid") return <div className={s.app}>{demoNotice}<main className={s.publicMain}><h1>此連結不可用</h1><p>場次不存在或未開放報名，請向工作人員索取正確連結。</p></main></div>;
  if (publicSurface === "register") return <div className={s.app}>{demoNotice}{guestPage()}</div>;
  if (publicSurface === "roster") return <div className={s.app}>{demoNotice}<main className={s.publicMain}><header className={s.publicHeader}><div className={s.brand}>PRIMETIME<small>PERFORMANCE LAB MACAU</small></div><Pill>名單展示 · 只讀</Pill></header><h1>{session.title}</h1><p>{dateLabel(session.date)} · {session.time} · {session.coach}</p><div className={s.attendanceSummary}><strong>{roster.filter((place) => place.attendance === "in").length}<small>已簽到</small></strong><strong>{roster.filter((place) => place.attendance === "none").length}<small>未簽到</small></strong><strong>{roster.filter((place) => place.attendance === "out").length}<small>已簽退</small></strong><span>共 {roster.length} 人</span></div><p className={s.syncLabel} role="status">{syncTime ? `示例狀態已同步 · ${syncTime}` : "同一瀏覽器內，工作人員簽到或簽退後，此頁會自動更新。"}</p><div className={s.kioskGrid}>{roster.map((place) => <article className={`${s.kioskPerson} ${place.attendance === "in" ? s.kioskPresent : place.attendance === "out" ? s.kioskOut : ""}`} key={place.personId}><span className={s.cardStatus}>{place.attendance === "in" ? "✓ 已簽到" : place.attendance === "out" ? "↗ 已簽退" : "○ 未簽到"}</span><strong>{data.people.find((person) => person.id === place.personId)?.name}</strong></article>)}</div>{!roster.length && <div className={s.empty}><h2>名單尚未公布</h2><p>工作人員確認後，名單會顯示在這裡。</p></div>}<p className={s.publicFoot}>此頁只供查看本場名單及出席狀態。</p></main></div>;

  return <div className={`${s.app} ${view === "kiosk" ? s.kioskMode : ""}`}>
    <div className={s.demoBar}><span><b>互動原型</b> · 示例資料，未連接正式資料庫</span><button onClick={() => { setData(fixture()); setSelected([]); setSearch(""); setAttendanceFilter("all"); setGuestStep(1); setGuestRequest(""); setView("daily"); setDate(days[1]); setSessionId("group1"); closeDialog(); setToast("示例已重置。"); }}><IconUndo size={14} />重置示例</button></div>
    <aside className={s.sidebar}><div className={s.brand}>PRIMETIME<small>PERFORMANCE LAB MACAU</small></div><nav aria-label="管理导航">{navigation.map((item) => <button key={item.id} className={view === item.id || item.id === "daily" && view === "week" ? s.navActive : ""} onClick={() => { setView(item.id); setSelected([]); setSearch(""); }}>{item.icon}<span>{item.name}</span>{item.id === "requests" && pending.length > 0 && <b>{pending.length}</b>}</button>)}</nav><div className={s.sidebarFoot}><span className={s.onlineDot} /> 設計體驗模式<small>正式管理需驗證密碼</small></div></aside>
    <div className={s.workspace}><div className={s.modeBar}><span>工作人員與客人流程</span><div><button className={view !== "register" && view !== "kiosk" ? s.modeActive : ""} onClick={() => { setSelected([]); setView("clients"); }}>管理後台</button><button className={view === "register" ? s.modeActive : ""} onClick={() => setView("register")}>客人報名</button><button className={view === "kiosk" ? s.modeActive : ""} onClick={() => setView("kiosk")}>現場簽到</button></div></div>
    {view === "register" ? guestPage() : <main className={s.main}>
      {view !== "kiosk" && <header className={s.pageHeader}><div><span className={s.eyebrow}>PRIMETIME / DAILY OPERATIONS</span><h1>{view === "daily" ? "每日名單" : view === "week" ? "本週安排" : view === "requests" ? "待處理報名" : view === "clients" ? "客戶管理" : view === "history" ? "操作與出席紀錄" : "一起開始今天的訓練"}</h1><p>{view === "requests" ? "每一份確認，都會加入對應場次的正式名單。" : view === "clients" ? "先按編輯或勾選多人，選好後確認保存；取消不會修改資料。" : view === "history" ? "示例操作持續保留，可以回看整個流程。" : `${dateLabel(date)} · 星期${dayNames[days.indexOf(date)] || ""}`}</p></div>{["daily", "week"].includes(view) && <button className={s.primary} onClick={() => setDrawer({ kind: "create" })}><IconPlus /> 建立場次</button>}</header>}
      {["daily", "week"].includes(view) && <><div className={s.dateToolbar}><div className={s.dates}>{days.map((day, index) => <button key={day} className={day === date ? s.dateActive : ""} onClick={() => chooseDate(day)}><small>週{dayNames[index]}</small><strong>{12 + index}</strong></button>)}</div>{view !== "kiosk" && <div className={s.viewToggle}><button className={view === "daily" ? s.modeActive : ""} onClick={() => setView("daily")}>日名單</button><button className={view === "week" ? s.modeActive : ""} onClick={() => setView("week")}>周排期</button></div>}</div>
      {view !== "week" && <div className={s.sessionTabs}>{data.sessions.filter((item) => item.date === date).map((item) => <button key={item.id} className={item.id === sessionId ? s.sessionActive : ""} onClick={() => chooseSession(item)}><strong>{item.title}</strong><span>{item.time} · {count(item.id)}/{item.capacity} 人</span></button>)}</div>}</>}
      {view === "week" && <><section className={s.calendar} aria-label="一周课程安排">{days.map((day, index) => <div className={`${s.calendarDay} ${day === date ? s.calendarToday : ""}`} key={day}><header>週{dayNames[index]}<strong>{dateLabel(day)}</strong></header>{data.sessions.filter((item) => item.date === day).map((item) => <button key={item.id} className={`${s.calendarEvent} ${item.id === sessionId ? s.calendarSelected : ""}`} onClick={() => chooseSession(item)}><small>{item.time}</small><strong>{item.title}</strong><span>{count(item.id)}/{item.capacity} 人</span>{pending.some((request) => request.sessionId === item.id) && <Pill tone="amber">待確認</Pill>}</button>)}</div>)}</section>{rosterPanel()}</>}
      {view === "daily" && <><section className={s.metrics}><div><span>正式名單</span><strong>{roster.length}<small>/{session.capacity}</small></strong></div><div><span>待確認</span><strong className={s.amberNumber}>{currentPending.length}</strong></div><div><span>已到場</span><strong>{roster.filter((place) => place.attendance === "in").length}</strong></div><button className={s.textButton} onClick={() => setView("kiosk")}><IconCheckIn /> 開啟簽到 →</button></section><div className={s.dailyGrid} key={sessionId}>{rosterPanel()}<aside className={`${s.panel} ${s.inbox}`}><div className={s.panelHeader}><h2>待確認報名 <Pill tone="amber">{currentPending.length}</Pill></h2></div>{requestRows(currentPending)}<p className={s.inboxFoot}>批准後才加入名單，付款另行標記。</p><button className={s.textButton} onClick={() => { setGuestSession(data.sessions.find((item) => item.date === date && item.public)?.id || "group1"); setGuestStep(1); setView("register"); }}>試用公開報名頁 ↗</button></aside></div></>}
      {view === "requests" && <><div className={s.filterBar}>{[["pending", "待確認"], ["waiting", "候補"], ["approved", "已批准"], ["rejected", "未通過"]].map(([id, label]) => <button key={id} className={requestFilter === id ? s.modeActive : ""} onClick={() => setRequestFilter(id)}>{label} <span>{data.requests.filter((item) => item.state === id).length}</span></button>)}</div><section className={`${s.panel} ${s.requestPage}`}>{requestRows(data.requests.filter((item) => item.state === requestFilter))}</section></>}
      {view === "clients" && <><button className={s.textButton} onClick={() => { setEditingPerson(""); setSelected([]); setBulkPlan(""); setBulkPayment(""); setView("daily"); }}>← 返回每日名單</button><div className={s.clientTools}><label className={s.search}>搜尋客戶<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="輸入姓名" /></label><div className={s.editActions}><button className={s.primary} onClick={() => setDrawer({ kind: "newPeople" })}><IconPlus /> 新增客戶</button><button className={s.secondary} onClick={() => setDrawer({ kind: "add" })}>加入場次</button><button className={s.secondary} onClick={() => setDrawer({ kind: "rule" })}>固定安排</button></div></div><div className={s.bulkBar}><label><input type="checkbox" aria-label="全選搜尋結果" checked={data.people.filter((person) => person.name.includes(search)).length > 0 && data.people.filter((person) => person.name.includes(search)).every((person) => selected.includes(person.id))} onChange={(e) => setSelected(e.target.checked ? data.people.filter((person) => person.name.includes(search)).map((person) => person.id) : [])} />全選</label><strong>已選 {selected.length} 人</strong><label className={s.bulkChoice}>批量套餐<select aria-label="批量選擇套餐" disabled={!selected.length} value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}><option value="">保持原值</option>{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label><label className={s.bulkChoice}>批量付款<select aria-label="批量選擇付款狀態" disabled={!selected.length} value={bulkPayment} onChange={(e) => setBulkPayment(e.target.value)}><option value="">保持原值</option>{payments.map((payment) => <option key={payment}>{payment}</option>)}</select></label><button className={s.primary} disabled={!selected.length || (!bulkPlan && !bulkPayment)} onClick={saveBulk}>確認保存 {selected.length} 人</button><button className={s.secondary} onClick={() => { setSelected([]); setBulkPlan(""); setBulkPayment(""); }}>取消選擇</button></div><div className={s.clientLayout}><section className={s.panel}>{data.people.filter((person) => person.name.includes(search)).map((person) => <div className={s.clientRow} key={person.id}><label className={s.personName}><input type="checkbox" aria-label={`選擇客戶${person.name}`} checked={selected.includes(person.id)} onChange={() => toggleSelected(person.id)} /><span><strong>{person.name}</strong><small className={s.contactPreview}>{person.phone}</small></span></label>{editingPerson === person.id ? <><label className={`${s.inlineChoice} ${s.contactChoice}`}>聯絡方式<input aria-label={`${person.name}的聯絡方式`} maxLength={60} value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} placeholder="輸入聯絡方式，可留空" autoComplete="off" /></label><label className={s.inlineChoice}>套餐<select aria-label={`${person.name}的套餐`} value={draftPlan} onChange={(e) => setDraftPlan(e.target.value)}>{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label><label className={s.inlineChoice}>付款<select aria-label={`${person.name}的付款狀態`} value={draftPayment} onChange={(e) => setDraftPayment(e.target.value)}>{payments.map((payment) => <option key={payment}>{payment}</option>)}</select></label><div className={s.editActions}><button className={s.primary} onClick={savePerson}>確認保存</button><button className={s.secondary} onClick={() => setEditingPerson("")}>取消</button></div></> : <><Pill>{person.plan}</Pill><Pill tone={person.payment === "待收款" ? "amber" : "green"}>{person.payment}</Pill><button className={s.textButton} onClick={() => beginEdit(person)}>編輯</button><button className={s.textButton} aria-label={`查看客戶${person.name}詳情`} onClick={() => setDrawer({ kind: "person", id: person.id })}>詳情</button></>}</div>)}</section><aside className={s.panel}><div className={s.panelHeader}><h2>固定安排</h2></div>{data.rules.map((rule, index) => <p className={s.ruleRow} key={index}>{rule}</p>)}<p className={s.inboxFoot}>原型預覽本週；正式版本會依起止日期生成未來場次。</p></aside></div></>}
      {view === "history" && <><div className={s.filterBar}>{[["attendance", "簽到與撤銷"], ["removed", "移出名單與恢復"], ["operations", "操作紀錄"]].map(([id, label]) => <button key={id} className={historyTab === id ? s.modeActive : ""} onClick={() => setHistoryTab(id)}>{label}</button>)}</div><section className={s.panel}>{historyTab === "attendance" && (data.records.length ? data.records.map((record) => <div className={s.recordRow} key={record.id}><div><strong>{data.people.find((person) => person.id === record.personId)?.name} · {attendanceText(record.after)}</strong><p>{dateLabel(data.sessions.find((item) => item.id === record.sessionId)!.date)} · {record.time}</p></div>{record.voided ? <Pill>已撤銷</Pill> : <button className={s.secondary} onClick={() => undoAttendance(record)}>撤銷並恢復</button>}</div>) : <div className={s.empty}><h3>尚無本次體驗的簽到紀錄</h3><p>前往現場簽到後，這裡可以查看和撤銷操作。</p></div>)}{historyTab === "removed" && (data.places.some((place) => place.removedAt) ? data.places.filter((place) => place.removedAt).map((place) => { const target = data.sessions.find((item) => item.id === place.sessionId)!; return <div className={s.recordRow} key={place.sessionId + place.personId + place.removedAt}><div><strong>{data.people.find((person) => person.id === place.personId)?.name}</strong><p>{dateLabel(target.date)} · {target.title} · {attendanceText(place.attendance)}</p><small>名單已移出，出席與簽名保留</small></div><button className={s.secondary} onClick={() => restorePlace(place)}>恢復名單</button></div>; }) : <div className={s.empty}><h3>沒有移出的名單</h3><p>從每日名單移出的人，可在這裡恢復。</p></div>)}{historyTab === "operations" && <div className={s.history}>{data.logs.map((log, index) => <article key={`${log}-${index}`}><span className={s.historyDot} /><div><small>{index === 0 ? "最新操作" : "本次體驗"}</small><p>{log}</p></div></article>)}</div>}</section></>}
      {view === "kiosk" && <><div className={s.kioskTop}><div><h2>{session.title} · 簽到名單</h2><p>{session.time} · 找到名字，點一下開始簽到</p></div><label>簽到場次<select value={sessionId} onChange={(e) => chooseSession(data.sessions.find((item) => item.id === e.target.value)!)}>{data.sessions.map((item) => <option key={item.id} value={item.id}>{dateLabel(item.date)} · {item.title} · {item.time}</option>)}</select></label><label>搜尋姓名<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="輸入姓名" /></label></div><div className={s.attendanceSummary}><strong>{roster.filter((place) => place.attendance === "in").length}<small>已簽到</small></strong><strong>{roster.filter((place) => place.attendance === "none").length}<small>未簽到</small></strong><strong>{roster.filter((place) => place.attendance === "out").length}<small>已簽退</small></strong><span>共 {roster.length} 人</span></div><div className={s.filterBar}>{[["all", "全部名單"], ["none", "未簽到"], ["in", "已簽到"], ["out", "已簽退"]].map(([id, label]) => <button key={id} className={attendanceFilter === id ? s.modeActive : ""} onClick={() => setAttendanceFilter(id)}>{label}</button>)}</div><div className={s.kioskGrid}>{roster.filter((place) => (attendanceFilter === "all" || place.attendance === attendanceFilter) && data.people.find((person) => person.id === place.personId)!.name.includes(search)).map((place) => { const person = data.people.find((person) => person.id === place.personId)!; return <button aria-label={`${person.name}，${attendanceText(place.attendance)}，點擊${place.attendance === "in" ? "簽退" : "簽到"}`} className={`${s.kioskPerson} ${place.attendance === "in" ? s.kioskPresent : place.attendance === "out" ? s.kioskOut : ""}`} key={person.id} onClick={() => { setSignPerson(person.id); setStrokes([]); }}><span className={s.cardStatus}>{place.attendance === "in" ? "✓ 已簽到" : place.attendance === "out" ? "↗ 已簽退" : "○ 未簽到"}</span><strong>{person.name}</strong><b>{place.attendance === "in" ? "點擊簽退 →" : "點擊簽到 →"}</b></button>; })}</div>{!roster.length && <div className={s.empty}><h3>本場還沒有名單</h3><p>工作人員確認報名後，姓名會出現在這裡。</p></div>}</>}
    </main>}
    </div>
    {view !== "register" && view !== "kiosk" && <nav className={s.bottomNav} aria-label="手机管理导航">{navigation.map((item) => <button key={item.id} className={view === item.id || item.id === "daily" && view === "week" ? s.navActive : ""} onClick={() => { setView(item.id); setSearch(""); }}>{item.icon}<span>{item.name}</span></button>)}</nav>}
    {toast && <div className={s.toast} role="status"><IconCheck size={18} />{toast}</div>}
    <dialog className={`${s.drawer} ${drawer?.kind === "share" ? s.shareDialog : ""}`} aria-label={drawer?.kind === "share" ? "分享本場連結" : signPerson ? "確認現場簽到" : "管理詳情與安排"} ref={dialog} onCancel={closeDialog} onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}>
      <div className={s.drawerContent}><button className={s.close} onClick={closeDialog} aria-label="關閉詳情">×</button>
      {drawer?.kind === "share" && <><div className={s.shareHeading}><span className={s.shareSymbol}><IconLink size={25} /></span><h2>分享這一場</h2><p>{dateLabel(session.date)} · {session.title} · {session.time}</p></div><div className={s.shareChoices} role="group" aria-label="選擇分享內容"><button className={`${s.shareOption} ${shareMode === "roster" ? s.shareChosen : ""}`} aria-pressed={shareMode === "roster"} onClick={() => { setShareMode("roster"); setCopied(false); setCopyFailed(false); }}><span className={s.shareOptionIcon}><IconGroup size={23} /></span><span><strong>名單展示</strong><small>查看本班名單、簽到與簽退狀態</small></span><span className={s.choiceMark}>{shareMode === "roster" && <IconCheck size={15} />}</span></button><button className={`${s.shareOption} ${shareMode === "register" ? s.shareChosen : ""}`} aria-pressed={shareMode === "register"} disabled={!session.public} onClick={() => { setShareMode("register"); setCopied(false); setCopyFailed(false); }}><span className={s.shareOptionIcon}><IconPlus size={23} /></span><span><strong>客人報名</strong><small>{session.public ? "填寫報名資料，等待後台確認" : "本場未開放客人報名"}</small></span><span className={s.choiceMark}>{shareMode === "register" && <IconCheck size={15} />}</span></button></div><div className={s.shareScope}><IconLock size={15} /><span>只分享本場 · 不含聯絡方式與付款資料</span></div><button className={`${s.copyButton} ${copied ? s.copySuccess : ""}`} disabled={copyBusy} onClick={async () => { setCopyBusy(true); setCopyFailed(false); try { await navigator.clipboard.writeText(publicLink(shareMode)); setCopied(true); } catch { setCopyFailed(true); } finally { setCopyBusy(false); } }}><span key={copied ? "copied" : "copy"}>{copied ? <IconCheck size={19} /> : <IconLink size={19} />}{copyBusy ? "正在複製…" : copied ? "已複製連結" : `複製${shareMode === "roster" ? "名單" : "報名"}連結`}</span></button><p className={s.copyFeedback} role="status">{copied ? "可以貼到聊天或群組中分享了。" : "選好分享內容，再按一下複製。"}</p>{copyFailed && <label className={s.copyFallback}>瀏覽器未允許複製，可選取以下連結<input readOnly value={publicLink(shareMode)} onFocus={(e) => e.currentTarget.select()} /></label>}<div className={s.shareFooter}><button className={s.textButton} onClick={closeDialog}>返回名單</button><a href={publicLink(shareMode)} target="_blank" rel="noopener noreferrer">預覽客人頁面 ↗</a></div></>}
      {drawer?.kind === "request" && (() => { const application = data.requests.find((item) => item.id === drawer.id)!; const target = data.sessions.find((item) => item.id === application.sessionId)!; return <><span className={s.eyebrow}>報名申請</span><h2>{application.name}</h2><div className={s.courseSummary}><strong>{target.title}</strong><span>{dateLabel(target.date)} · {target.time}</span><span>正式名單 {count(target.id)}/{target.capacity} 人</span></div><dl className={s.details}><dt>示例聯絡方式</dt><dd>{application.phone}</dd><dt>備註</dt><dd>{application.note || "無"}</dd></dl><div className={s.drawerActions}><button className={s.primary} disabled={!!busy || count(target.id) >= target.capacity || application.state === "approved" || application.state === "rejected"} onClick={() => processRequest(application.id, "approved")}>{busy ? "確認中…" : count(target.id) >= target.capacity ? "名額已滿，請使用候補" : "批准並加入名單"}</button><button className={s.secondary} disabled={!!busy || application.state !== "pending"} onClick={() => processRequest(application.id, "waiting")}>設為候補</button><button className={s.dangerButton} disabled={!!busy || application.state === "approved" || application.state === "rejected"} onClick={() => processRequest(application.id, "rejected")}>不批准這次申請</button></div></>; })()}
      {drawer?.kind === "person" && (() => { const person = data.people.find((item) => item.id === drawer.id)!; return <><span className={s.eyebrow}>客戶檔案</span><h2>{person.name}</h2><Pill>{person.plan}</Pill><dl className={s.details}><dt>聯絡方式</dt><dd>{person.phone}</dd><dt>付款狀態</dt><dd>{person.payment}</dd><dt>本週已安排</dt><dd>{data.places.filter((place) => place.personId === person.id).length} 個場次</dd></dl>{view === "clients" ? <><button className={s.primary} onClick={() => { closeDialog(); beginEdit(person); }}>編輯聯絡方式、套餐與付款</button><button className={s.secondary} onClick={() => setDrawer({ kind: "rule", id: person.id })}>安排固定日期</button></> : <><button className={s.secondary} onClick={() => { closeDialog(); setSelected([person.id]); setView("clients"); }}>前往管理後台編輯</button>{roster.some((place) => place.personId === person.id) && <button className={s.dangerButton} onClick={() => { setSelected([person.id]); setDrawer({ kind: "remove" }); }}>移出本場名單</button>}</>}</>; })()}
      {drawer?.kind === "remove" && <><h2>移出 {selected.length} 人？</h2><p>{dateLabel(session.date)} · {session.title}</p><p>{data.people.filter((person) => selected.includes(person.id)).map((person) => person.name).join("、")}</p><p className={s.pendingNotice}>僅移出本場名單。客戶檔案、其他日期安排、簽到及簽名記錄都會保留，可到「歷史紀錄 → 移出名單與恢復」找回。</p><button className={s.primary} onClick={() => removePlaces(selected)}>確認移出並保留紀錄</button><button className={s.secondary} onClick={closeDialog}>取消</button></>}
      {drawer?.kind === "newPeople" && <form onSubmit={createPeople}><h2>新增客戶名單</h2><p>可新增一人，或貼上多人名單；確認後才保存。</p><label>姓名（每行一位）<textarea name="names" required rows={5} maxLength={2100} placeholder="例如：示例客戶甲\n示例客戶乙" /></label><label>聯絡方式（選填）<input name="phone" maxLength={60} placeholder="多人新增時可留空，之後逐位補充" /></label><div className={s.twoFields}><label>套餐<select name="plan" defaultValue="單次">{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label><label>付款狀態<select name="payment" defaultValue="待收款">{payments.map((payment) => <option key={payment}>{payment}</option>)}</select></label></div><label>同時加入場次<select name="target" defaultValue=""><option value="">先只建立客戶，之後再安排</option>{data.sessions.map((item) => <option key={item.id} value={item.id}>{dateLabel(item.date)} · {item.title} · {item.time}（{count(item.id)}/{item.capacity}）</option>)}</select></label><p className={s.pendingNotice}>多人新增會使用同一組套餐及付款選項；選擇場次後，全部人一起加入該場正式名單。新增操作會保留紀錄。</p>{formError && <p className={s.error} role="alert">{formError}</p>}<button className={s.primary}>確認新增名單</button><button type="button" className={s.secondary} onClick={closeDialog}>取消返回</button></form>}
      {drawer?.kind === "add" && <form onSubmit={addPerson}><h2>現有客戶加入場次</h2><label>選擇場次<select name="target" defaultValue={sessionId}>{data.sessions.map((item) => <option key={item.id} value={item.id}>{dateLabel(item.date)} · {item.title} · {item.time}（{count(item.id)}/{item.capacity}）</option>)}</select></label><label>選擇客戶<select name="person" required>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><p className={s.pendingNotice}>只加入選定場次，固定安排及其他日期不受影響。</p><button type="button" className={s.textButton} onClick={() => setDrawer({ kind: "newPeople" })}>找不到客戶？新增客戶名單 →</button>{formError && <p className={s.error} role="alert">{formError}</p>}<button className={s.primary}>確認加入正式名單</button><button type="button" className={s.secondary} onClick={closeDialog}>取消返回</button></form>}
      {drawer?.kind === "rule" && <form onSubmit={createRule}><h2>設定固定安排</h2><label>客戶<select name="person" defaultValue={drawer.id || data.people[0].id}>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><p>每週參加團體訓練的日子</p><div className={s.weekChecks}>{dayNames.map((day, index) => <label key={day}><input type="checkbox" name="weekday" value={index} defaultChecked={[0, 2, 4].includes(index)} /><span>{day}</span></label>)}</div><div className={s.twoFields}><label>開始日期<input type="date" name="start" defaultValue={days[0]} min={days[0]} max={days[6]} required /></label><label>結束日期<input type="date" name="end" defaultValue={days[6]} min={days[0]} max={days[6]} required /></label></div><p className={s.pendingNotice}>原型演示本週安排。重複位置不會重加，滿額场次會跳過。</p><button className={s.primary}>保存固定安排</button></form>}
      {drawer?.kind === "create" && <form onSubmit={createSession}><h2>建立新場次</h2><label>課程名稱<input name="title" defaultValue="團體訓練" required maxLength={60} /></label><label>日期<input type="date" name="date" defaultValue={date} min={days[0]} max={days[6]} required /></label><div className={s.twoFields}><label>開始時間<input type="time" name="time" defaultValue="18:00" required /></label><label>結束時間<input type="time" name="end" defaultValue="19:00" required /></label></div><label>人數上限<input type="number" name="capacity" defaultValue={16} min={1} max={100} required /></label><label className={s.checkboxLabel}><input type="checkbox" name="public" defaultChecked /> 允許客人通過報名頁申請</label><button className={s.primary}>建立場次</button></form>}
      {signPerson && <><span className={s.eyebrow}>現場簽到</span><h2>{data.people.find((person) => person.id === signPerson)?.name}</h2><p>{session.title} · {session.time}</p><p>示例簽名（選填）</p><div className={s.signature}><SignaturePad strokes={strokes} onChange={setStrokes} width={800} height={350} /></div><button className={s.textButton} onClick={() => setStrokes([])}>清除筆跡</button><button className={s.primary} onClick={confirmAttendance}>確認{roster.find((place) => place.personId === signPerson)?.attendance === "in" ? "簽退" : "簽到"}</button></>}
      </div>
    </dialog>
  </div>;
}
