import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readWorkspace, writeWorkspace, publicWorkspace, validateWorkspace, mutatePublic, addApplication, recordPublicAttendance } from "@/lib/roster-store";
import type { SignatureData } from "@/lib/types";
import { allowRequest } from "@/lib/request-limit";

const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function scope(request: NextRequest, data: Awaited<ReturnType<typeof readWorkspace>>["data"]) {
  const params = request.nextUrl.searchParams, mode = params.get("mode") || "admin";
  if (!["admin", "register", "roster", "kiosk"].includes(mode)) throw new Error("此連結不可用。");
  const ids = params.get("page") === "booking" && mode === "register" ? data.bookingPage?.sessionIds || [] : (params.get("sessions") || params.get("session") || "").split(",").filter(Boolean);
  if (mode !== "admin" && !ids.length && !(mode === "register" && params.get("page") === "booking")) throw new Error("此連結不可用。");
  if (ids.some((id) => !data.sessions.some((session) => session.id === id && (mode !== "register" || session.public)))) throw new Error("場次不存在或未開放報名。");
  return { mode, ids, receipt: params.get("receipt") || undefined };
}

export async function GET(request: NextRequest) {
  if (!request.nextUrl.searchParams.has("mode")) { const denied = await requireAdmin(request); if (denied) return denied; }
  try {
    const current = await readWorkspace(), selected = scope(request, current.data);
    if (selected.mode === "admin") { const denied = await requireAdmin(request); if (denied) return denied; return response(current); }
    return response({ ...current, data: publicWorkspace(current.data, selected.mode, selected.ids, selected.receipt) });
  } catch (error) { return response({ error: error instanceof Error ? error.message : "資料無法載入。" }, 503); }
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const text = await request.text(); if (text.length > 8_000_000) return response({ error: "資料太大，請聯絡管理員。" }, 413);
    const body = JSON.parse(text), current = await readWorkspace();
    if (body.revision !== current.revision) return response({ error: "名單剛被其他人更新，這次未保存。已載入最新資料，請重新操作。" }, 409);
    if (!validateWorkspace(body.data, current.data)) return response({ error: "資料不完整、超出名額或修改了歷史，這次未保存。" }, 400);
    const revision = await writeWorkspace(body.data, body.revision);
    if (revision === null) return response({ error: "資料已更新，這次未保存，請重新操作。" }, 409);
    return response({ data: body.data, revision });
  } catch { return response({ error: "保存失敗，請重試。" }, 500); }
}

function signatureValid(value: unknown): value is SignatureData | undefined {
  return value === undefined || Array.isArray(value) && value.length <= 500 && value.every((stroke) => Array.isArray(stroke.points) && stroke.points.length <= 10000 && stroke.points.every((point: {x: number; y: number}) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 900 && point.y >= 0 && point.y <= 600));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return response({ error: "請求來源無效。" }, 403);
  try {
    if (!(await allowRequest(request, "workspace-public", 60, 60))) return response({ error: "操作過於頻繁，請稍後再試。" }, 429);
    const text = await request.text(); if (text.length > 1_000_000) return response({ error: "內容過長。" }, 413);
    const body = JSON.parse(text);
    if (body.action === "register") {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 40 || typeof body.phone !== "string" || !body.phone.trim() || body.phone.length > 60 || typeof body.note !== "string" || body.note.length > 200) return response({ error: "請填寫有效的姓名與聯絡方式。" }, 400);
      const ids: string[] = Array.isArray(body.sessionIds) ? body.sessionIds : [body.sessionId];
      if (!ids.length || ids.length > 30 || ids.some((id: unknown) => typeof id !== "string") || new Set(ids).size !== ids.length) return response({ error: "請選擇 1 至 30 個不同場次。" }, 400);
      const receipt = crypto.randomUUID();
      const applications = ids.map((sessionId: string) => ({ id: crypto.randomUUID(), receiptId: receipt, sessionId, name: body.name.trim(), phone: body.phone.trim(), note: body.note.trim(), state: "pending" as const }));
      await mutatePublic((data) => { const selected = scope(request, data); if (selected.mode !== "register" || ids.some((id: string) => !selected.ids.includes(id))) throw new Error("請使用這些場次的報名連結。"); return applications.reduce((next, application) => addApplication(next, application), data); });
      return response({ applications, receipt, application: applications[0] }, 201);
    }
    if (body.action === "in" || body.action === "out") {
      if (!signatureValid(body.signature) || typeof body.personId !== "string") return response({ error: "簽名或客戶資料無效。" }, 400);
      const current = await mutatePublic((data) => { const selected = scope(request, data); if (selected.mode !== "kiosk" || selected.ids.length !== 1 || selected.ids[0] !== body.sessionId) throw new Error("請使用此場次的簽到連結。"); return recordPublicAttendance(data, body.sessionId, body.personId, body.action, body.signature); });
      return response({ ...current, data: publicWorkspace(current.data, "kiosk", [body.sessionId]) });
    }
    return response({ error: "操作無效。" }, 400);
  } catch (error) { return response({ error: error instanceof Error ? error.message : "操作失敗，請重試。" }, 400); }
}
