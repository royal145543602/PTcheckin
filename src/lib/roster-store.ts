import { getDb } from "./db";
import { emptyWorkspace, type Demo, type Application } from "./roster-types";
import { canRecordAttendance, type AttendanceAction } from "./attendance-rules";
import type { SignatureData } from "./types";

export async function readWorkspace(): Promise<{ data: Demo; revision: number }> {
  const { data, error } = await getDb().from("roster_workspace").select("document, revision").eq("id", "main").single();
  if (error) throw new Error("雲端資料暫時無法讀取，請稍後重試。");
  return { data: data.document, revision: data.revision };
}

export async function writeWorkspace(document: Demo, revision: number) {
  const { data, error } = await getDb().from("roster_workspace").update({ document, revision: revision + 1, updated_at: new Date().toISOString() }).eq("id", "main").eq("revision", revision).select("revision").maybeSingle();
  if (error) throw new Error("雲端保存失敗，請稍後重試。");
  return data ? revision + 1 : null;
}

export function publicWorkspace(source: Demo, mode: string, sessionIds: string[], receipt?: string): Demo {
  const result = emptyWorkspace();
  const ids = new Set(sessionIds);
  result.sessions = source.sessions.filter((session) => ids.has(session.id));
  if (mode === "register") {
    // Only counts are needed; do not send the roster, contacts or payment details.
    result.places = source.places.filter((place) => ids.has(place.sessionId) && !place.removedAt).map((place, i) => ({ sessionId: place.sessionId, personId: `occupied-${i}`, source: "", attendance: "none" }));
    if (receipt) result.requests = source.requests.filter((request) => (request.id === receipt || request.receiptId === receipt) && ids.has(request.sessionId));
    result.bookingPage = source.bookingPage && { ...source.bookingPage, sessionIds: source.bookingPage.sessionIds.filter((id) => ids.has(id)) };
  } else {
    result.places = source.places.filter((place) => ids.has(place.sessionId) && !place.removedAt).map(({ sessionId, personId, attendance }) => ({ sessionId, personId, attendance, source: "" }));
    const personIds = new Set(result.places.map((place) => place.personId));
    result.people = source.people.filter((person) => personIds.has(person.id)).map(({ id, name }) => ({ id, name, plan: "", phone: "", payment: "" }));
  }
  return result;
}

export function validateWorkspace(value: unknown, previous: Demo): value is Demo {
  if (!value || typeof value !== "object") return false;
  const state = value as Demo;
  if (![state.groups, state.people, state.sessions, state.places, state.requests, state.logs, state.rules, state.records].every(Array.isArray)) return false;
  if (state.people.length > 5000 || state.sessions.length > 5000 || state.records.length > 50000) return false;
  const unique = (items: { id: string }[]) => items.every((item) => typeof item.id === "string" && item.id.length > 0 && item.id.length <= 100) && new Set(items.map((item) => item.id)).size === items.length;
  if (![state.people, state.groups, state.sessions, state.requests, state.rules, state.records].every(unique)) return false;
  if (state.people.some((person) => typeof person.name !== "string" || !person.name.trim() || person.name.length > 60 || typeof person.phone !== "string" || person.phone.length > 100)) return false;
  if (state.sessions.some((session) => !/^\d{4}-\d{2}-\d{2}$/.test(session.date) || !Number.isFinite(Date.parse(`${session.date}T12:00:00Z`)) || !/^([01]\d|2[0-3]):[0-5]\d–([01]\d|2[0-3]):[0-5]\d$/.test(session.time) || session.time.split("–")[0] >= session.time.split("–")[1] || !Number.isSafeInteger(session.capacity) || session.capacity < 1 || typeof session.public !== "boolean" || typeof session.title !== "string" || !session.title.trim() || session.title.length > 60 || (session.registrationLimit !== undefined && (!Number.isSafeInteger(session.registrationLimit) || session.registrationLimit < 0 || session.registrationLimit > session.capacity)))) return false;
  if (previous.people.some((person) => !state.people.some((item) => item.id === person.id))) return false;
  if (state.people.some((person) => person.deletedAt !== undefined && (typeof person.deletedAt !== "string" || !Number.isFinite(Date.parse(person.deletedAt))))) return false;
  if (state.places.some((place) => !place.removedAt && state.people.find((person) => person.id === place.personId)?.deletedAt && !previous.places.some((old) => old.personId === place.personId && old.sessionId === place.sessionId && !old.removedAt))) return false;
  const people = new Set(state.people.map((item) => item.id)), sessions = new Set(state.sessions.map((item) => item.id));
  if (state.places.some((place) => !people.has(place.personId) || !sessions.has(place.sessionId) || !["none", "in", "out"].includes(place.attendance))) return false;
  if (new Set(state.places.map((place) => `${place.sessionId}:${place.personId}`)).size !== state.places.length) return false;
  if (state.requests.some((request) => !sessions.has(request.sessionId) || !["pending", "approved", "waiting", "rejected"].includes(request.state))) return false;
  if (state.records.some((record) => !people.has(record.personId) || !sessions.has(record.sessionId))) return false;
  if (state.bookingPage && (typeof state.bookingPage.title !== "string" || !state.bookingPage.title.trim() || state.bookingPage.title.length > 60 || typeof state.bookingPage.description !== "string" || state.bookingPage.description.length > 1000 || !Array.isArray(state.bookingPage.sessionIds) || state.bookingPage.sessionIds.some((id) => !sessions.has(id)))) return false;
  // Histories are immutable apart from the explicit void marker used by rewind.
  for (const record of previous.records) {
    const retained = state.records.find((item) => item.id === record.id);
    if (!retained || JSON.stringify({ ...retained, voided: undefined }) !== JSON.stringify({ ...record, voided: undefined }) || record.voided && !retained.voided) return false;
  }
  if (previous.logs.some((entry, i) => state.logs[state.logs.length - previous.logs.length + i] !== entry)) return false;
  for (const session of state.sessions) {
    const occupied = state.places.filter((place) => place.sessionId === session.id && !place.removedAt).length;
    if (occupied > session.capacity) return false;
    const old = previous.sessions.find((item) => item.id === session.id);
    const before = previous.places.filter((place) => place.sessionId === session.id && !place.removedAt).length;
    if (occupied > before && occupied > (session.registrationLimit ?? session.capacity)) return false;
    if (old && previous.records.some((record) => record.sessionId === session.id) && (old.date !== session.date || old.time !== session.time)) return false;
  }
  return true;
}

export async function mutatePublic(operation: (data: Demo) => Demo) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await readWorkspace();
    const next = operation(current.data);
    const revision = await writeWorkspace(next, current.revision);
    if (revision !== null) return { data: next, revision };
  }
  throw new Error("多人正在操作，請重試。");
}

export function addApplication(data: Demo, request: Application): Demo {
  const session = data.sessions.find((item) => item.id === request.sessionId && item.public);
  if (!session) throw new Error("這個場次未開放報名。");
  if (new Date(`${session.date}T${session.time.split("–")[1]}:00+08:00`).getTime() < Date.now()) throw new Error("這個場次已結束。");
  const occupied = data.places.filter((place) => place.sessionId === session.id && !place.removedAt).length;
  if (occupied >= Math.min(session.capacity, session.registrationLimit ?? session.capacity)) throw new Error("這個場次已滿，請選擇其他時段。");
  if (data.requests.some((item) => item.sessionId === request.sessionId && item.phone.toLowerCase() === request.phone.toLowerCase() && item.state !== "rejected")) throw new Error("這個聯絡方式已報名此場次，請聯絡工作人員查詢。");
  return { ...data, requests: [request, ...data.requests], logs: [`${new Date().toISOString()} · 收到 ${request.name} 的報名，等待確認。`, ...data.logs] };
}

export function recordPublicAttendance(data: Demo, sessionId: string, personId: string, action: AttendanceAction, signature?: SignatureData): Demo {
  const session = data.sessions.find((item) => item.id === sessionId);
  const place = data.places.find((item) => item.sessionId === sessionId && item.personId === personId && !item.removedAt);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (!session || session.date !== today) throw new Error("只可在場次當天簽到或簽退。");
  if (!place || !canRecordAttendance(place.attendance, action)) throw new Error("狀態已改變，請刷新；已簽退需由後台回溯。");
  const record = { id: crypto.randomUUID(), sessionId, personId, before: place.attendance, after: action, signatureBefore: place.signature, signature, time: new Date().toISOString() };
  return { ...data, places: data.places.map((item) => item === place ? { ...item, attendance: action, signature } : item), records: [record, ...data.records], logs: [`${record.time} · ${data.people.find((person) => person.id === personId)?.name} ${action === "in" ? "簽到" : "簽退"}。`, ...data.logs] };
}
