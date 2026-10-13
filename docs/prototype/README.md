# 每日名单与报名可点击原型

本机预览：<http://127.0.0.1:3100/prototype>。这是设计体验，不是正式报名网站。

## 如何试用

1. 点击顶部“客人报名”，选择场次、填写示例姓名与示例联系方式并提交。
2. 结果显示“等待确认”，正式名单不会立即增加。
3. 点击“试用后台确认这份报名”，批准该申请。
4. 切回“管理后台”查看人数变化，再切到“现场签到”选择刚加入的人并确认。
5. 可切换“周排期”，试用客户资料、加入单次名单、建立场次或固定安排表单。
6. “重置示例”可恢复最初的 12 位正式客户与 3 份待确认报名。

## 数据范围

所有数据保存在当前浏览器标签的 sessionStorage；没有调用正式 API 或数据库。示例一周为 2026 年 10 月 12–18 日，固定安排仅演示这一周。审批、付款标记和签到是前端模拟，正式版本还需要服务器权限、事务和持久化。

已实现日期与场次切换、桌面周历／手机日程、报名三步表单、重复申请检测、审批／拒绝／候补、名额限制、客户详情、固定安排表单、场次建立、签到／签退、可选示例签名和操作记录。

动效包括内容切换、名单新增高亮、审批处理状态、详情抽屉与轻量按压反馈；支持减少动态效果。

## 验证记录

- 通过 TypeScript 检查和 Next.js 完整建置。
- 浏览器走通报名 → 等待确认 → 后台批准 → 名单 12 变 13 → 新客户签到，已到人数 8 变 9。
- 批准剩余示例申请后达到 16/16；额外报名仍可申请，转入候补不增加正式人数。
- 检查桌面与 390px 手机界面，并缩短手机顶部信息区，让名单更早出现。
- 固定排期表单已在浏览器打开并显示客户、星期与起止日期；继续操作时遇到浏览器自动审核超时，因此该保存流程的浏览器验证尚未完成。

正式服务器登录、真实报名查询链接、自动通知、长期排期生成和数据库迁移不属于这个原型的已完成功能。

## 本次反馈修订

- 签到恢复旧版亮绿色姓名卡：默认完整名单，明确区分未签到、已签到、已签退；支持搜索与状态筛选。签到页隐藏管理侧栏，手机顶部缩减为场次选择与搜索。
- 付款编辑集中在管理后台，勾选多人可一次设为已付、待付或套餐内。名单详情可跳转后台。
- 每日名单支持多人移出，确认说明仅影响本场；原出席和签名保留。历史记录有移出名单与恢复入口，恢复满额时会阻止。
- 本次操作产生的签到记录可撤销并恢复操作前的状态和签名。被撤销记录保留；有后续记录时必须先撤销较新记录。
- 浏览器已验证两人移出、两人恢复、两人批量付款、签到和撤销恢复。最终构建通过。
- 示例持久化升级为 v2；仍仅保存本页示例数据，未接入正式数据库或部署线上。

## 套餐、确认与记录

- 套餐只有单次、月卡、年卡，无次数包。付款独立选择已收款、待收款、无需另付。
- 单人先点击编辑，修改草稿后确认保存；取消恢复原值。批量支持全选/勾选、保持原值、确认保存和取消选择。
- 记录保存香港时间、客户姓名及套餐/付款的修改前后值；管理后台有返回每日名单。
- 浏览器验证了单人编辑取消原值不变、全选 12 人保存、每位客户修改明细以及返回每日名单。构建通过。

## 后台新增名单

- 客户管理顶部新增客户、加入场次、固定安排三个入口。
- 新增支持一人或每行一位的多人名单，共用套餐/付款选项，可只建立客户或同时加入选定场次。确认新增、取消返回、姓名重复检查和场次名额检查均已实现。
- 现有客户加入场次可选择日期和课程，重复加入和满额错误显示在表单内。
- 浏览器验证满额私教场次阻止两人新增，换到团体场次后两人成功新增，签到名单由 12 变为 14 人。构建通过，仍为示例原型。

## 联系方式编辑

客户姓名下显示已有联系方式。点击编辑预填现有值，可修改后确认保存或取消；详情也可直接进入编辑。修改记录保留时间、姓名及前后值。浏览器已验证保存示例联系方式后详情显示新值，再次编辑预填新值；构建通过。

## 内部与对外链接分离

- 内部原型：/prototype。每个场次上方提供独立名单展示和报名链接。
- 名单展示：/prototype?mode=roster&session=场次ID，仅显示该场次名称、日期、姓名与出席状态，不可编辑或签到，没有付款、联系方式、客户详情或内部导航。
- 报名：/prototype?mode=register&session=场次ID，仅向该场次提交申请，不显示名单或内部管理入口；未开放报名的场次不可使用。
- 本机同一浏览器通过 localStorage / storage 事件演示跨标签同步，并修复原先读取 v2、写入 v1 的不一致。真实跨设备同步及权限隔离尚未接入；原型全量数据均为虚构示例，本次不是正式上线。上线前必须由服务器按链接范围返回最少字段，管理 API 继续要求验证。
- 浏览器验证内部签退后只读页面自动变成 7 已签到 / 4 未签到 / 1 已签退；独立报名提交进入内部待确认列表，未加入正式名单，报名结果没有后台按钮。构建通过。

## 分享入口与视觉修订

- 取消列表上常驻的两条长网址，场次标题旁仅保留分享按钮。
- 点击分享弹出选择面板，选择名单展示或客人报名，再一键复制。复制成功显示绿色对勾；可预览或返回，未开放报名的场次禁用报名选择。复制失败时才显示可手动选择的链接。
- 参考 React Bits 的 Animated List / Animated Content 交互方向，用现有 React 和 CSS 实现短暂展开、选择反馈及复制成功切换，并支持减少动态效果；未引入新的组件依赖或复制第三方代码。
- 调整场次按钮、表头、列表悬停和页面密度。
- 浏览器验证名单复制成功、切换报名后重置成功状态，以及复制内容确认为 /prototype?mode=register&session=group1。构建通过。
- 参考：https://reactbits.dev/components/animated-list 和 https://reactbits.dev/animations/animated-content 。

## 姓名排版

移除每日名单、客户管理、报名列表中的全部圆形姓名头像，直接呈现姓名文字。统一姓名字号、字重、间距与对齐。浏览器已检查客户列表无圆形姓名装饰，最终构建通过。

## 全选加入场次

客户管理支持勾选或全选客户后批量加入场次，选择日期及班次后确认。已在场次的人跳过，曾移出的恢复原记录；名额不足整批不加入。操作保留日期、班次、姓名及新增/跳过人数。浏览器已验证全选 12 人加入新建空场次，正式名单为 12/16。构建通过。

批量加入入口改为搜索框下方独立深绿色按钮，与新增客户并排；打开后可直接勾选或全选客户，无需先在主列表选择。已验证打开表单和全选 12 位客户，移除重复入口，最终构建通过。

## 客户分组

- 客户管理顶部展示全部客户、未分组及自定义分组，显示各组人数。初始示例组常规组、周末组为空，已有客户保持未分组。
- 管理分组可以新建/改名；每位客户归一个管理分组，可单人编辑或勾选多人后分到分组，需确认并记录前后分组。新增客户时也可选择分组。
- 选择一组后筛选、搜索和主列表全选只涉及该组。批量加入场次的选择器也支持分组筛选和全选本组。
- 分组独立于班次、套餐和付款，换组不改变既有出席或安排。旧示例数据自动补上分组字段。
- 浏览器验证新建晚间训练组、确认将陈小明和李嘉欣分入、分组人数 2 / 未分组 10，批量加入界面全选本组只有这两人。构建通过，仍为本机示例原型。

## React Bits 与 GSAP 视觉升级

- 使用 React Bits AnimatedContent 改编组件，保留版权及许可；改成默认可见、轻量状态切换及减少动态效果支持。源码来源 https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx 。
- GSAP 驱动模式切换和分组选择指示条、人数变化及签到卡反馈。过渡约 180–240ms；首次加载不从空白等待播放。
- 页面与弹窗/报名步骤使用 AnimatedContent。动效卸载清理，选择条响应尺寸变化。
- 颜色统一为深森林绿、白色中性表面、低饱和状态色；荧光绿保留给现场签到及复制成功。标题、文字、边界、按钮与间距统一，姓名仍无圆形头像。
- 手机及 1440px 桌面检查；验证分组筛选、签到确认、人数变更、分享面板。运行期间浏览器错误日志为空，最终构建通过。仍为本机示例原型，未部署正式网站。

## 固定安排编辑

管理后台顶部固定安排打开安排列表，每条安排可编辑，原客户、课程时段、星期及起止日期会预填。确认更新修改原规则，取消返回不会保存。旧字符串形式示例规则自动转成结构化记录。

规则记录自己生成的位置；编辑只调整未开始且无出席/签名操作记录的位置，旧位置归档保留并可随规则恢复，不修改独立手动安排或其他规则的位置。满额场次跳过，修改前后规则及调整人数记入日志。

浏览器验证原一三五改为一四后仍只有一条安排，周三名单由 12 变为 11；再改回一三五，编辑表单正确预填。最终构建通过。日期仍仅演示样例周 10/12–10/18，未上线正式网站。

## 截图风格与完整编辑操作

- 根据用户旧签到截图重做签到页：深绿顶栏、居中场次名称、签到/历史切换、5 列桌面姓名卡与固定底部人数栏；手机 3 列。卡片只显示姓名及动作/状态，GSAP 轻量错峰入场及签到反馈。
- 管理客户目录改为姓名卡，点名字查看；编辑在同一个资料面板，确认/取消放在底部动作栏。
- 固定安排编辑面板提供确认、取消编辑及删除固定安排。删除确认在同一面板，不丢失未保存草稿；取消编辑回到原值。
- 删除仅归档规则，并取消其独占、未开始且无出席记录的位置；手动安排、其他规则共享位置和历史保留。已删除列表可恢复规则和仍可安排的后续位置，满额/单日例外跳过。
- 浏览器验证取消删除保留草稿，取消编辑不保存，删除后使用中 0 / 已删除 1，恢复后使用中 1 / 已删除 0；客户联系方式取消后原值保持。移动布局与参考图桌面宽度已检查，构建通过。仍为本机示例，未上线。
# 切換動效修正 · 2026-10-13

- 重新閱讀 React Bits 的 AnimatedContent 原始碼及 GSAP 官方 React、gsap.to 文件：https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx 、https://gsap.com/resources/React/ 。
- AnimatedContent 改用 useGSAP 的 layout timing，避免內容先完整顯示一幀再開始入場；保留 power3.out 緩動，打斷動畫時从當前位置繼續。
- 主畫面、簽到／歷史切換保留舊內容完成 100ms 退場，再提交最後一次選擇；入場 300–360ms。選中塊滑動 340ms。
- 移除整體內容與卡片重複移動，以及卡片 transform 的 CSS／GSAP 競爭。簽到內容獨立轉場，底部人數欄維持 fixed，父層沒有 transform。
- 瀏覽器驗證主畫面切換、簽到／歷史連續點擊、場次切換；最後選擇正確，控制台沒有錯誤或警告。生產構建通過。未宣稱已測得 60fps。
## 開啟簽到位置跳動修復

- 原因：零位移的淡入仍設置 will-change: transform；位於其中的 fixed 人數欄會暫時以動畫容器定位，完成後才回到視窗底部。此前只查動畫完成後的 transform，漏掉這個瞬態問題。
- 人數欄移到 app 根層，完全脫離所有內容動畫容器；零位移動畫只設置 will-change: opacity。
- 主畫面變更在 layout effect 重設頁面滾動至頂部，避免點擊下方「開啟簽到」後沿用舊畫面滾動位置。

## 左側導航菜單

- 漢堡導航使用獨立 menuDialog 樣式，固定左邊，寬度 min(340px, 86vw)，手機同樣保持左側展開。
- 320ms 從左入場、GSAP 220ms 向左收回；Escape、取消、遮罩及導航項目共用关闭邏輯。減少動畫設定使用即時關閉。
- 已驗證左邊界為 0、面板高度等於視窗高度，取消後關閉，點擊「現場簽到」後正常導向及關閉；構建通過。

## 導航菜單視覺簡化

- 移除淺綠圓角按鈕背景與重複小人圖標，改成白底文字導覽、18px 主入口、14px 快捷入口、細分隔線。
- 當前頁面以深綠文字及「當前」標記顯示；其餘入口保留輕量箭頭、hover 位移與鍵盤 focus 提示。
- 保留左側進出動畫。瀏覽器已驗證菜單顯示、管理後台導向和選中狀態更新；構建通過。

## 全屏簽名及舊版签到流程對齊

- 對照 src/app/kiosk/[teamId]/page.tsx 與 SignatureModal.tsx：舊版為全屏簽名，支持撤銷一筆、清除、跳過及空簽名提醒。預覽此前只沿用狀態切換，將簽名簡化為窄抽屜，未完整保留操作。
- 現改為獨立全屏簽名工作區：姓名／動作及場次、大面積白色畫板、底部操作欄；簽退採用不同動作色。跳過和空簽名均明確確認後提交。
- SignaturePad 保持原有 SignatureData 邏輯座標格式，按實際顯示尺寸與 devicePixelRatio 繪製；平滑連點、ref 追蹤 pointer、合併採樣、每幀重畫，處理 capture、cancel，移除格子和虛線。
- 預覽仍為 none/out → in、in → out；每次記錄保存本次簽名，可從歷史查看。撤銷恢復操作前的狀態及簽名，撤銷紀錄保留。加入重複提交防護及名單存在性檢查。
- 瀏覽器驗證兩筆書寫、撤銷一筆、清除、空簽名提醒、繼續簽名、帶簽名签到、歷史簽名顯示、跳過簽名签退、撤銷签退恢復在場。手機預覽與 1440×900 桌面均覆盖整個視窗；構建通過。
- 本次未修改正式签到 API 或 Supabase 資料；SignaturePad 為共用元件，舊頁也沿用更清晰的畫板實現。預覽仍使用示例資料。

## 單向签到及批量回溯規則

- 已瀏覽使用者提供的線上網站並對照舊 src/app/page.tsx 的批量邏輯：批量签到只處理 none、簽退只處理 in；舊單人入口及先前原型仍容許 out → in。以使用者明確規則為準，修正原型為本場當天 none → in → out，out 鎖定。
- attendance-rules.ts 統一單人和批量資格判斷；提交時再次检查狀態。已簽退卡片不再打開簽名頁。單向狀態矩陣及回溯邊界檢查通過。
- 簽到頁可見「批量選擇」及「回溯」。全選僅選取目前顯示的名單，確認面板列出處理／跳過人数和將處理的姓名，批量不收集簽名。
- 每批逐人記錄、共同 batchId；回溯支持單人及整批，保留作廢紀錄並恢復 before 狀態／簽名。有較新操作時禁止回溯舊紀錄，確認面板直接說明原因。歷史回溯也走明確確認流程。
- 浏览器已驗證混合12人只處理未到2人、整批12人签到及簽退、12張卡片全部鎖定、重新批量签到處理0人、整批回溯恢复12人在場、較舊操作被阻止、單人回溯恢复在場。
- 仍為本地示例原型；未修改或部署正式網站／資料庫 API。

## 底部人數欄

- 將在場、未到、已簽退、總人數拆成四個等寬項目，数字及標籤各自對齊。移除「總計 · 已簽退」擠在同一行的小字和裝飾圖標。
- 在場保持綠色、簽退採用柔和紅色，其餘中性文字；保留固定底部及數字變化動畫。手機實際顯示與構建已驗證。

## 后台多日期余位分享

- 客户管理后台新增「分享报名场次」，可按整天或单场勾选，汇总日期数、场次数及余位，复制一个合并报名链接。
- 新链接使用 mode=register&sessions=多个公开场次ID。只显示所选公开场次，按日期分组；私教／非公开或无效ID不接受。旧单场 session 链接继续兼容。
- 余位 = 容量减去正式名单人数（忽略已移出），不按到场人数计算，也不扣待审核申请；满额可显示候补。
- 公共报名沿用填写、核对、提交、后台审批流程。提交时重新检查场次开放及链接范围，不直接进入正式名单。
- 分享面板日期列表独立滚动，复制／预览保持可见；公共列表只含课程、时间、名额，不显示内部名单、联系方式及付款资料。
- 已验证选两天只分享两场，成功复制；公开选择10月15日报名后余位仍为4，后台批准后同浏览器公开页同步为3。构建通过。
- 仍为本地示例：同浏览器storage同步，不代表跨设备实时同步或正式链接上线；正式网站／数据库没有部署更新。

## 自订场次与开放名额

- 分享面板新增「新增自订场次」，每场新增编辑；每日名单也有「场次设置」，包括非公开场次。
- 建立和编辑共用确认／取消表单，课程、教练、日期、开始结束时间、总上限、剩余开放名额可填；日期移除示例周限制、时间精确到分钟、上限移除100人的表单预设限制。
- registrationLimit 保存已排名单人数加上本次设定的剩余开放名额。公开余位按 min(物理容量, registrationLimit) 减已排名单人数；审批也遵守公开报名名额限制。内部手动排名单仍遵守场次总容量。
- 允许只开放部分名额及0个名额（候补仍可申请）；不足已排人数、超出容量、结束早于开始会阻止保存。有出席记录的场次保留历史日期／时间，需另建新场次。
- 日期星期由真实日期计算，跨示例周及跨年份可正确显示。分享列表允许手动选择过去日期，默认只选择今天以后的有余位公开场次。
- 浏览器验证建立2026-11-20、06:45–08:20、上限6／开放3；开放7被阻止，保存3后重新编辑字段保持，公開链接正确显示星期五及3个名额。构建通过。仍为本地示例，未部署正式API。

## 独立的多日期分享页（取代场次勾选弹窗）

- 客户管理「设定分享页」打开整页 BookingPageEditor。初始标题、说明、日期、时间、名额全部为空。
- 直接添加日期，每天添加多个时段，各自填名称、开始／结束、名额；可复制自己已填写的时段到另一空白日期，也可移除天／时段。保存前修改不影响公开页。
- 一份 bookingPage 保存页面标题、说明及关联时段ID，固定链接 mode=register&page=booking 汇总全部日期。公开页按保存配置读取，后续修改不需要更换链接。
- 发布时生成／更新对应报名场次；移除时段仅停止其公开报名，保留名单、申请及历史。审批及状态限制继续沿用。
- 修复 native date/time 与 React 输入事件配合问题，使用 onInput 保留实际输入。保存检查日期、时段、名额及历史日期限制；未修改名额时不意外补回已经报名占用的名额。
- 验证初始空白、两天三个时段、复制及移除时段、保存及复制一个链接、公開页展示全部日期、改名额后原链接更新、再次打开恢复已保存配置。手机及桌面布局已检查，构建通过。
- 旧后台分享弹窗及其辅助代码已移除。每日单场分享继续保留。当前仍为本地示例，未部署正式网站／API。

### Compact customer directory
Customer management now displays one customer per compact row, with selection, name, group, edit and details aligned for quick scanning. Mobile keeps the group beneath the name. Existing bulk operations and customer actions are preserved.

## Cloud workspace release

- `/` and `/admin` open `/manage`, protected by the existing server verified five minute admin cookie.
- Default customers, sessions, applications, signatures and client side demo storage have been removed. Browser demo data is never imported into the cloud workspace.
- `/manage?mode=register&page=booking` is the shared multi day booking page. `/manage?mode=register&session=<id>` is a single session signup; `/manage?mode=roster&session=<id>` is read only; `/manage?mode=kiosk&session=<id>` permits same day check-in/out. All links use the runtime site origin.
- `/api/workspace` stores a private Supabase document with a revision counter. Conflicting writes return 409 and refresh the latest state; they cannot overwrite a concurrent application or check-in. The interface blocks additional actions while saving.
- Public reads return scoped fields only. Contacts, payments, signatures, internal rules and other applications remain private. A random application receipt can read only its own result.
- New tables have RLS enabled and no anon/authenticated access. Shared database counters limit password attempts and public writes across Worker instances.
- Existing team/member/record tables and their history are independent; `/legacy`, `/kiosk/<team>` and `/view/<team>` retain compatibility.
- Verification: `node tests/cloud-workspace.cjs` tests unauthorized access, scope, privacy, check-in transitions, history retention, five-minute expiry and revision conflicts; Cloudflare OpenNext production build succeeds.

Cloudflare preview verification (2026-10-13): uploaded version `5f4de21b-b881-4ce5-9030-3363a55e3bee`. Live checks passed for empty public booking data, admin 401, wrong-password 401, submitted application/receipt privacy, check-in then checkout, blocked re-entry, and read-only attendance rejection. Temporary release verification entries were removed with a revision=4 guard; the resulting revision=5 has zero customers, sessions, applications and new attendance records. Old team/member/record history was not modified.

Production cutover: user explicitly approved deployment, and version `5f4de21b-b881-4ce5-9030-3363a55e3bee` received 100% of traffic. After verifying all old API routes use the server-only getDb client, the existing tables had RLS enabled and anon/authenticated access revoked with preconditions checking service_role permissions and RLS bypass. Legacy public status/member/history endpoints still respond; protected management endpoints return 401. Existing stored legacy data remains present (3 teams, 16 members, 56 records). The new empty workspace remains independent.

### Multi-select registration
Removed the introductory availability/confirmation paragraph. Guests can select several dates and time slots, enter their details once and submit the selected sessions together. The server validates every selected session before the revision-guarded save; a failure leaves the whole batch unsubmitted. Each session retains its own pending application and approval status, while a shared random receipt shows the results of the submitted batch. Full slots cannot be selected. Existing single-session request payloads and receipts remain compatible. Production build passed; no new sample data was added.
