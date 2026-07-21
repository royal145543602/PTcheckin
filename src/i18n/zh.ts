import type { Translations } from "./en";

const zh: Translations = {
  // Tabs
  checkIn: "簽到",
  history: "歷史",
  // Top bar
  undo: "撤回",
  batch: "批量",
  done: "完成",
  // Batch controls
  selectAll: "全選",
  deselect: "取消",
  batchCheckIn: "全部\n簽到",
  batchSignOut: "全部\n簽退",
  // Empty state
  createFirstTeam: "創建第一個團隊",
  teamNamePlaceholder: "輸入團隊名稱",
  create: "創建",
  // Confirm sign-out
  confirmSignOut: "確認簽退",
  confirmSignOutMsg: "{name} 確定要簽退嗎？",
  cancel: "取消",
  confirmSignOutBtn: "確定簽退",
  // Toast
  undoDone: "已撤銷 {label}",
  opFailed: "操作失敗",
  noNeedCheckIn: "所選成員無需簽到",
  noNeedSignOut: "所選成員無需簽退",
  // Batch confirm
  batchInTitle: "批量簽到",
  batchOutTitle: "批量簽退",
  batchInMsg: "{skipped} 人已到場，確定僅為剩餘 {valid} 人簽到？",
  batchOutMsg: "{skipped} 人不在場，確定僅為剩餘 {valid} 人簽退？",
  confirm: "確定",
  // Reset
  resetTitle: "重置今日記錄",
  resetMsg: "確定要重置今日所有簽到記錄嗎？此操作不可撤銷。",
  resetBtn: "重置",
  // Kiosk
  loading: "載入中...",
  tapToCheckIn: "點擊卡片簽到 / 簽退",
  currentlyIn: "目前在場，確認簽退？",
  alreadyOut: "已簽退，重新簽到？",
  tapToConfirm: "點擊確認簽到",
  // View page
  refresh: "刷新",
  lastUpdate: "最後更新：{time}",
  signature: "簽名",
  historyShort: "歷史",
  close: "關閉",
  checkInHistory: "簽到歷史",
  // Sidebar
  brand: "PRIMETIME",
  team: "團隊",
  selectTeam: "選擇團隊",
  newTeam: "新建團隊…",
  teamSettings: "團隊設定",
  rename: "重新命名",
  deleteTeam: "刪除團隊",
  save: "儲存",
  members: "成員",
  ppl: "{count} 人",
  addMember: "新增成員…",
  delete: "刪除",
  quickLinks: "快捷連結",
  copyViewLink: "複製家長查看連結",
  specialActions: "特殊操作",
  locked: "需密碼",
  unlocked: "已解鎖",
  resetToday: "重置今日所有簽到",
  deleteTeamDanger: "刪除「{name}」",
  deleteTeamConfirm: "確定要刪除該團隊及其所有成員和記錄嗎？此操作不可撤銷。",
  copiedLink: "已複製 {name} 的查看連結",
  teamCreated: "團隊已創建",
  teamDeleted: "團隊已刪除",
  memberAdded: "成員已新增",
  memberDeleted: "成員已刪除",
  // PIN
  adminPin: "管理密碼",
  defaultPin: "默認密碼 0000",
  submitPin: "確認",
  // Member card
  tapToSign: "點擊簽到",
  // Stats
  present: "在場",
  absent: "未到",
  gone: "已走",
  total: "總計",
  // Signature
  signTitle: "簽名 — {name}",
  pleaseSign: "請簽名確認",
  noSignature: "還沒簽名",
  skipConfirmMsg: "確定要跳過簽名嗎？",
  continueSign: "繼續簽名",
  skipConfirm: "確定跳過",
  undoStroke: "撤銷",
  clearAll: "清除",
  skipSignature: "跳過簽名",
  confirmAction: "確認{action}",
  // Add member
  addMemberTitle: "新增人員",
  namePlaceholder: "輸入名字",
  add: "新增",
  // History
  signOut: "簽退",
  checkInLabel: "簽到",
  signOutLabel: "簽退",
  viewSignature: "查看簽名",
  to: "至",
  noRecords: "暫無記錄",
  // Dropdown
  pleaseSelect: "請選擇",
  // Date
  weekdays: ["日", "一", "二", "三", "四", "五", "六"],
  // Time
  timeFormat: "{year}年{month}月{day}日 週{weekday} {time}",
};

export default zh;
