export type AttendanceState = "none" | "in" | "out";
export type AttendanceAction = "in" | "out";

/** A class's daily attendance only moves forward; reversal is an explicit undo. */
export function nextAttendanceAction(state: AttendanceState): AttendanceAction | null {
  return state === "none" ? "in" : state === "in" ? "out" : null;
}

export function canRecordAttendance(state: AttendanceState, action: AttendanceAction): boolean {
  return nextAttendanceAction(state) === action;
}
