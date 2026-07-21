const en = {
  // Tabs
  checkIn: "Sign In",
  history: "History",
  // Top bar
  undo: "Undo",
  batch: "Batch",
  done: "Done",
  // Batch controls
  selectAll: "Select All",
  deselect: "Clear",
  batchCheckIn: "All\nSign In",
  batchSignOut: "All\nSign Out",
  // Empty state
  createFirstTeam: "Create your first team",
  teamNamePlaceholder: "Enter team name",
  create: "Create",
  // Confirm sign-out
  confirmSignOut: "Sign Out",
  confirmSignOutMsg: "Sign out {name}?",
  cancel: "Cancel",
  confirmSignOutBtn: "Sign Out",
  // Toast
  undoDone: "Undid {label}",
  opFailed: "Operation failed",
  noNeedCheckIn: "Selected members don't need check-in",
  noNeedSignOut: "Selected members don't need sign-out",
  // Batch confirm
  batchInTitle: "Batch Check In",
  batchOutTitle: "Batch Sign Out",
  batchInMsg: "{skipped} already in, check in remaining {valid}?",
  batchOutMsg: "{skipped} not present, sign out remaining {valid}?",
  confirm: "Confirm",
  // Reset
  resetTitle: "Reset Today",
  resetMsg: "Delete all check-in records for today? This cannot be undone.",
  resetBtn: "Reset",
  // Kiosk
  loading: "Loading...",
  tapToCheckIn: "Tap card to check in / sign out",
  currentlyIn: "Currently present — sign out?",
  alreadyOut: "Already signed out — sign in again?",
  tapToConfirm: "Tap to confirm check in",
  // View page
  refresh: "Refresh",
  lastUpdate: "Last updated: {time}",
  signature: "Signature",
  historyShort: "History",
  close: "Close",
  checkInHistory: "Check-in History",
  // Sidebar
  brand: "PRIMETIME",
  team: "Team",
  selectTeam: "Select Team",
  newTeam: "New team...",
  teamSettings: "Team Settings",
  rename: "Rename",
  deleteTeam: "Delete Team",
  save: "Save",
  members: "Members",
  ppl: "{count} ppl",
  addMember: "Add member...",
  delete: "Delete",
  quickLinks: "Quick Links",
  copyViewLink: "Copy View Link",
  dangerZone: "Danger Zone",
  locked: "Locked",
  unlocked: "Unlocked",
  resetToday: "Reset today's records",
  deleteTeamDanger: 'Delete "{name}"',
  deleteTeamConfirm: "Delete this team and all its members & records? This cannot be undone.",
  copiedLink: "Copied {name}'s view link",
  // PIN
  adminPin: "Admin PIN",
  defaultPin: "Default PIN is 0000",
  submitPin: "Confirm",
  // Member card
  tapToSign: "Tap to sign",
  // Stats
  present: "Present",
  absent: "Absent",
  gone: "Gone",
  total: "Total",
  // Signature
  signTitle: "Sign — {name}",
  pleaseSign: "Please sign to confirm",
  noSignature: "No Signature",
  skipConfirmMsg: "Skip without signing?",
  continueSign: "Continue Signing",
  skipConfirm: "Skip",
  undoStroke: "Undo",
  clearAll: "Clear",
  skipSignature: "Skip",
  confirmAction: "{action}",
  // Add member
  addMemberTitle: "Add Member",
  namePlaceholder: "Enter name",
  add: "Add",
  // History
  checkInLabel: "Signed In",
  signOutLabel: "Signed Out",
  viewSignature: "View Signature",
  to: "to",
  noRecords: "No records",
  // Dropdown
  pleaseSelect: "Select...",
  // Date
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  // Time
  timeFormat: "{year}/{month}/{day} {weekday} {time}",
};

export default en;
export type Translations = typeof en;
