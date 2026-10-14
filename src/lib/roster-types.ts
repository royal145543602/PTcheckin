import type { SignatureData } from "@/lib/types";
export type Person = { id: string; name: string; plan: string; phone: string; payment: string; groupId?: string; deletedAt?: string };
export type Session = { id: string; date: string; title: string; time: string; coach: string; capacity: number; public: boolean; registrationLimit?: number };
export type Place = { sessionId: string; personId: string; source: string; attendance: "none" | "in" | "out"; ruleIds?: string[]; removedByRule?: string; removedAt?: string; signature?: SignatureData };
export type Application = { id: string; receiptId?: string; sessionId: string; name: string; phone: string; note: string; state: "pending" | "approved" | "waiting" | "rejected"; personId?: string };
export type AttendanceRecord = { id: string; sessionId: string; personId: string; before: Place["attendance"]; after: Place["attendance"]; time: string; signatureBefore?: SignatureData; signature?: SignatureData; batchId?: string; voided?: boolean };
export type CustomerGroup = { id: string; name: string };
export type FixedRule = { id: string; personId: string; weekdays: number[]; start: string; end: string; course: string; time: string; archivedAt?: string };
export type Demo = { groups: CustomerGroup[]; people: Person[]; sessions: Session[]; places: Place[]; requests: Application[]; logs: string[]; rules: FixedRule[]; records: AttendanceRecord[]; bookingPage?: { title: string; description: string; sessionIds: string[] } };

export const emptyWorkspace = (): Demo => ({groups:[], people:[], sessions:[], places:[], requests:[], logs:[], rules:[], records:[]});
