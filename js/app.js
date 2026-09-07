const STORAGE_KEY = "tkb-1a9-schedule-v2";
const SETTINGS_KEY = "tkb-1a9-settings-v1";

const DAYS = [
  { short: "T2", name: "Thứ Hai", header: "Thứ 2" },
  { short: "T3", name: "Thứ Ba", header: "Thứ 3" },
  { short: "T4", name: "Thứ Tư", header: "Thứ 4" },
  { short: "T5", name: "Thứ Năm", header: "Thứ 5" },
  { short: "T6", name: "Thứ Sáu", header: "Thứ 6" },
  { short: "T7", name: "Thứ Bảy", header: "Thứ 7" },
  { short: "CN", name: "Chủ Nhật", header: "CN" },
];

const SUBJECTS = {
  "Sinh hoạt dưới cờ": { color: "#ef5350", bg: "#ffe8e6" },
  "Tiếng Việt": { color: "#ec407a", bg: "#fce4ec" },
  Toán: { color: "#5c6bc0", bg: "#e8eaf6" },
  "Tự nhiên và Xã hội": { color: "#43a047", bg: "#e8f5e9" },
  "An toàn giao thông / Đọc thư viện": { color: "#fb8c00", bg: "#fff3e0" },
  "Hoạt động trải nghiệm": { color: "#8e24aa", bg: "#f3e5f5" },
  "Mỹ thuật": { color: "#f06292", bg: "#fde7ef" },
  "Giáo dục thể chất": { color: "#00897b", bg: "#e0f2f1" },
  "Âm nhạc": { color: "#7e57c2", bg: "#ede7f6" },
  Bơi: { color: "#039be5", bg: "#e1f5fe" },
  "Đạo đức": { color: "#c0a145", bg: "#fff8e1" },
  "Sinh hoạt lớp": { color: "#d81b60", bg: "#fce4ec" },
  "Tin học": { color: "#3949ab", bg: "#e8eaf6" },
};

const PALETTE = [
  { color: "#ef5350", bg: "#ffe8e6" },
  { color: "#ec407a", bg: "#fce4ec" },
  { color: "#5c6bc0", bg: "#e8eaf6" },
  { color: "#43a047", bg: "#e8f5e9" },
  { color: "#fb8c00", bg: "#fff3e0" },
  { color: "#8e24aa", bg: "#f3e5f5" },
  { color: "#00897b", bg: "#e0f2f1" },
  { color: "#039be5", bg: "#e1f5fe" },
];

const DEFAULT_TIMETABLE = {
  morning: [
    {
      period: 1,
      start: "07:00",
      end: "07:35",
      days: ["Sinh hoạt dưới cờ", "Tiếng Việt", "Tiếng Việt", "Tiếng Việt", null, null, null],
    },
    {
      period: 2,
      start: "07:40",
      end: "08:15",
      days: ["Tiếng Việt", "Tiếng Việt", "Tiếng Việt", "Tiếng Việt", null, null, null],
    },
    {
      period: 3,
      start: "08:20",
      end: "08:55",
      days: ["Tiếng Việt", "Toán", "Tự nhiên và Xã hội", "Toán", null, null, null],
    },
    {
      period: 4,
      start: "09:15",
      end: "09:50",
      days: ["Toán", "Tự nhiên và Xã hội", "An toàn giao thông / Đọc thư viện", "Hoạt động trải nghiệm", null, null, null],
    },
  ],
  afternoon: [
    {
      period: 2,
      start: "14:00",
      end: "14:35",
      days: [null, "Mỹ thuật", "Tiếng Việt", "Tiếng Việt", "Giáo dục thể chất", null, null],
    },
    {
      period: 3,
      start: "14:40",
      end: "15:15",
      days: [null, "Giáo dục thể chất", "Tiếng Việt", "Tiếng Việt", "Âm nhạc", null, null],
    },
    {
      period: 4,
      start: "15:35",
      end: "16:10",
      days: [null, "Bơi", "Đạo đức", "Sinh hoạt lớp", "Tin học", null, null],
    },
  ],
};

const THEMES = [
  { id: "pink", label: "Hồng", from: "#ff8fab", to: "#ff6b9d" },
  { id: "sky", label: "Xanh trời", from: "#5ec4e0", to: "#2aa4c8" },
  { id: "mint", label: "Mint", from: "#5ecf9a", to: "#3aaa7a" },
  { id: "peach", label: "Cam đào", from: "#ffb07a", to: "#f08a4b" },
  { id: "lavender", label: "Tím", from: "#b39ddb", to: "#8b6cc9" },
  { id: "lemon", label: "Vàng", from: "#f0c14b", to: "#d4a017" },
];

const DEFAULT_SETTINGS = {
  className: "1A9",
  theme: "pink",
  arrive: { morning: "06:50", afternoon: "13:50" },
  dismiss: { morning: "09:50", afternoon: "16:10" },
  periods: {
    morning: [
      { period: 1, start: "07:00", end: "07:35" },
      { period: 2, start: "07:40", end: "08:15" },
      { period: 3, start: "08:20", end: "08:55" },
      { period: 4, start: "09:15", end: "09:50" },
    ],
    afternoon: [
      { period: 2, start: "14:00", end: "14:35" },
      { period: 3, start: "14:40", end: "15:15" },
      { period: 4, start: "15:35", end: "16:10" },
    ],
  },
};

function cloneSettings(source) {
  return {
    className: source.className,
    theme: source.theme,
    arrive: { ...source.arrive },
    dismiss: { ...source.dismiss },
    periods: {
      morning: source.periods.morning.map((row) => ({ ...row })),
      afternoon: source.periods.afternoon.map((row) => ({ ...row })),
    },
  };
}

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const base = cloneSettings(DEFAULT_SETTINGS);
    return {
      ...base,
      ...raw,
      className: String(raw.className || base.className).trim() || base.className,
      theme: THEMES.some((item) => item.id === raw.theme) ? raw.theme : base.theme,
      arrive: { ...base.arrive, ...raw.arrive },
      dismiss: { ...base.dismiss, ...raw.dismiss },
      periods: {
        morning: base.periods.morning.map((row, index) => ({ ...row, ...raw.periods?.morning?.[index] })),
        afternoon: base.periods.afternoon.map((row, index) => ({ ...row, ...raw.periods?.afternoon?.[index] })),
      },
    };
  } catch {
    return cloneSettings(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

let settings = loadSettings();

function normalizeClassName(value) {
  return String(value || "").replace(/^lớp\s+/i, "").trim() || DEFAULT_SETTINGS.className;
}

function getClassName() {
  return normalizeClassName(settings.className);
}

function classRibbon() {
  const name = getClassName();
  return /^lớp\s/i.test(name) ? name : `Lớp ${name}`;
}

function applyPeriodTimes() {
  ["morning", "afternoon"].forEach((session) => {
    settings.periods[session].forEach((row, index) => {
      if (!TIMETABLE[session][index]) return;
      TIMETABLE[session][index].start = row.start;
      TIMETABLE[session][index].end = row.end;
      TIMETABLE[session][index].period = row.period;
    });
  });
}

function breakBetween(session) {
  const rows = settings.periods[session];
  if (rows.length < 2) return null;
  const prev = rows[rows.length - 2];
  const last = rows[rows.length - 1];
  return { start: prev.end, end: last.start };
}

function getBells() {
  return [
    {
      key: "morning",
      title: "Sáng",
      meta: `Vào ${settings.arrive.morning} · Về ${settings.dismiss.morning}`,
      rows: bellsRows("morning"),
    },
    {
      key: "afternoon",
      title: "Chiều",
      meta: `Vào ${settings.arrive.afternoon} · Học ${settings.periods.afternoon[0].start} · Về ${settings.dismiss.afternoon}`,
      rows: bellsRows("afternoon"),
    },
  ];
}

function bellsRows(session) {
  const periods = settings.periods[session];
  const rows = [];
  periods.forEach((row, index) => {
    if (index === periods.length - 1 && index > 0) {
      const prev = periods[index - 1];
      rows.push({ period: "break", time: `${prev.end}–${row.start}`, label: "Nghỉ giữa buổi" });
    }
    rows.push({ period: row.period, time: `${row.start}–${row.end}` });
  });
  return rows;
}

const TIMETABLE = cloneTimetable(DEFAULT_TIMETABLE);
let customSubjects = [];

const state = {
  tab: "tkb",
  dayIndex: todayIndex(),
  edit: null,
  pendingSubject: null,
  swiped: false,
};

function cloneTimetable(source) {
  return {
    morning: source.morning.map((row) => ({ ...row, days: [...row.days] })),
    afternoon: source.afternoon.map((row) => ({ ...row, days: [...row.days] })),
  };
}

function loadSchedule() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    customSubjects = Array.isArray(data.customSubjects) ? data.customSubjects : [];
    ["morning", "afternoon"].forEach((session) => {
      data[session]?.forEach((days, index) => {
        if (TIMETABLE[session][index] && Array.isArray(days) && days.length === 7) {
          TIMETABLE[session][index].days = days;
        }
      });
    });
  } catch {
    /* keep defaults */
  }
}

function saveSchedule() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      morning: TIMETABLE.morning.map((row) => row.days),
      afternoon: TIMETABLE.afternoon.map((row) => row.days),
      customSubjects,
    })
  );
}

function vietnamNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
}

function toDayIndex(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function todayIndex() {
  return toDayIndex(vietnamNow());
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function minutesNow(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHm(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function hashStyle(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function subjectStyle(name) {
  return SUBJECTS[name] || hashStyle(name);
}

function allSubjects() {
  const names = [...Object.keys(SUBJECTS), ...customSubjects];
  return [...new Set(names)];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sessionHasDay(session, dayIndex) {
  return TIMETABLE[session].some((row) => row.days[dayIndex]);
}

function currentSlot(date) {
  const dayIndex = toDayIndex(date);
  const now = minutesNow(date);
  const hasMorning = sessionHasDay("morning", dayIndex);
  const hasAfternoon = sessionHasDay("afternoon", dayIndex);
  const dayName = DAYS[dayIndex].name;

  const arriveM = settings.arrive.morning;
  const startM = settings.periods.morning[0].start;
  const endM = settings.dismiss.morning;
  const arriveA = settings.arrive.afternoon;
  const startA = settings.periods.afternoon[0].start;
  const endA = settings.dismiss.afternoon;
  const breakM = breakBetween("morning");
  const breakA = breakBetween("afternoon");

  if (hasMorning && now >= parseHm(arriveM) && now < parseHm(startM)) {
    return { kind: "arrive", session: "morning", label: "Vào lớp, chuẩn bị tiết 1" };
  }
  for (const row of TIMETABLE.morning) {
    if (!row.days[dayIndex]) continue;
    if (now >= parseHm(row.start) && now < parseHm(row.end)) {
      return {
        kind: "period",
        session: "morning",
        period: row.period,
        label: `Tiết ${row.period} · ${row.days[dayIndex]}`,
      };
    }
  }
  if (hasMorning && breakM && now >= parseHm(breakM.start) && now < parseHm(breakM.end)) {
    return { kind: "break", session: "morning", label: "Nghỉ giữa buổi sáng" };
  }
  if (hasMorning && now >= parseHm(startM) && now < parseHm(endM)) {
    return { kind: "gap", session: "morning", label: "Chuyển tiết" };
  }
  if (hasMorning && now >= parseHm(endM) && now < parseHm(arriveA)) {
    return { kind: "noon", label: "Tan học buổi sáng · nghỉ trưa" };
  }
  if (hasAfternoon && now >= parseHm(arriveA) && now < parseHm(startA)) {
    return { kind: "arrive", session: "afternoon", label: `Vào lớp, bắt đầu học lúc ${startA}` };
  }
  for (const row of TIMETABLE.afternoon) {
    if (!row.days[dayIndex]) continue;
    if (now >= parseHm(row.start) && now < parseHm(row.end)) {
      return {
        kind: "period",
        session: "afternoon",
        period: row.period,
        label: `Tiết ${row.period} · ${row.days[dayIndex]}`,
      };
    }
  }
  if (hasAfternoon && breakA && now >= parseHm(breakA.start) && now < parseHm(breakA.end)) {
    return { kind: "break", session: "afternoon", label: "Nghỉ giữa buổi chiều" };
  }
  if (hasAfternoon && now >= parseHm(startA) && now < parseHm(endA)) {
    return { kind: "gap", session: "afternoon", label: "Chuyển tiết" };
  }
  if (hasAfternoon && now >= parseHm(endA)) {
    return { kind: "done", label: "Đã tan học" };
  }
  if (!hasMorning && !hasAfternoon) {
    return { kind: "off", label: `${dayName} không có tiết học` };
  }
  if (!hasMorning && now < parseHm(arriveA)) {
    return { kind: "off", label: `Sáng ${dayName} không có tiết học` };
  }
  if (!hasAfternoon && now >= parseHm(endM)) {
    return { kind: "off", label: `Chiều ${dayName} không có tiết học` };
  }
  return { kind: "wait", label: "Chưa đến giờ vào lớp" };
}

function isCurrentPeriod(session, period, dayIndex, date) {
  const slot = currentSlot(date);
  return (
    slot.kind === "period" &&
    slot.session === session &&
    slot.period === period &&
    toDayIndex(date) === dayIndex
  );
}

function renderNowBar() {
  const date = vietnamNow();
  const slot = currentSlot(date);
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const weekday = date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const bar = document.getElementById("nowBar");
  bar.className = "now";
  if (slot.kind === "period") bar.classList.add("is-live");
  else if (slot.kind === "break" || slot.kind === "arrive") bar.classList.add("is-break");
  else bar.classList.add("is-off");
  bar.innerHTML = `
    <span class="clock">${clock}</span>
    <span>${weekday}</span>
    <span class="pill">${escapeHtml(slot.label)}</span>
  `;
}

function renderDayBar() {
  const today = todayIndex();
  document.getElementById("dayBar").innerHTML = DAYS.map(
    (day, index) => `
      <button class="day-chip${index === state.dayIndex ? " is-active" : ""}${
        index === today ? " is-today" : ""
      }" data-day="${index}" type="button">${day.short}</button>
    `
  ).join("");
}

function renderPeriodCards(session, dayIndex) {
  const date = vietnamNow();
  const rows = TIMETABLE[session];
  const filled = rows.filter((row) => row.days[dayIndex]);
  const empty = rows
    .map((row, rowIndex) => ({ row, rowIndex }))
    .filter(({ row }) => !row.days[dayIndex]);

  const list = filled.length
    ? `<div class="period-list">${filled
        .map((row) => {
          const rowIndex = rows.indexOf(row);
          const name = row.days[dayIndex];
          const now = isCurrentPeriod(session, row.period, dayIndex, date);
          const style = subjectStyle(name);
          return `<button type="button" class="period-card${now ? " is-now" : ""}" style="--i:${rowIndex}" data-edit data-session="${session}" data-row="${rowIndex}" data-day="${dayIndex}">
            <div class="period-no" style="background:${style.color}">${row.period}</div>
            <p class="period-name">${escapeHtml(name)}</p>
            <p class="period-time">${row.start}–${row.end}</p>
          </button>`;
        })
        .join("")}</div>`
    : `<p class="empty-session">Không có tiết</p>`;

  const add = empty.length
    ? `<div class="add-row">${empty
        .map(
          ({ row, rowIndex }) =>
            `<button type="button" class="add-chip" data-edit data-session="${session}" data-row="${rowIndex}" data-day="${dayIndex}">+ Tiết ${row.period}</button>`
        )
        .join("")}</div>`
    : "";

  return `${list}${add}`;
}

function renderDayBoard(animate = true) {
  const board = document.getElementById("dayBoard");
  board.innerHTML = `
    <section class="session">
      <div class="session-head">
        <h2>Sáng</h2>
        <span class="badge">${settings.arrive.morning}–${settings.dismiss.morning}</span>
      </div>
      ${renderPeriodCards("morning", state.dayIndex)}
    </section>
    <section class="session">
      <div class="session-head">
        <h2>Chiều</h2>
        <span class="badge sky">${settings.arrive.afternoon}–${settings.dismiss.afternoon}</span>
      </div>
      ${renderPeriodCards("afternoon", state.dayIndex)}
    </section>
  `;
  if (animate) replayAnim(board);
}

function subjectButton(name, session, rowIndex, dayIndex, isNow) {
  const style = subjectStyle(name);
  return `<button type="button" class="subj${isNow ? " is-now" : ""}" style="background:${style.bg};color:${style.color}" data-edit data-session="${session}" data-row="${rowIndex}" data-day="${dayIndex}">${escapeHtml(name)}</button>`;
}

function emptyButton(session, rowIndex, dayIndex) {
  return `<button type="button" class="subj is-empty" data-edit data-session="${session}" data-row="${rowIndex}" data-day="${dayIndex}">Thêm môn</button>`;
}

function renderWeekBoard() {
  const date = vietnamNow();
  const morningRows = TIMETABLE.morning
    .map((row, index) => {
      const span = index === 0 ? ` rowspan="${TIMETABLE.morning.length + 1}"` : "";
      const sessionCell =
        index === 0 ? `<td class="cell-session sang"${span}>SÁNG</td>` : "";
      return `<tr>
        ${sessionCell}
        <td class="cell-period">${row.period}</td>
        <td class="cell-time">${row.start} – ${row.end}</td>
        ${row.days
          .map((name, dayIndex) => {
            const now = isCurrentPeriod("morning", row.period, dayIndex, date);
            return `<td>${
              name
                ? subjectButton(name, "morning", index, dayIndex, now)
                : emptyButton("morning", index, dayIndex)
            }</td>`;
          })
          .join("")}
      </tr>${
        index === TIMETABLE.morning.length - 2
          ? `<tr class="break-row"><td class="cell-period">—</td><td class="cell-time">${breakBetween("morning").start} – ${breakBetween("morning").end}</td><td colspan="7">Nghỉ giữa buổi sáng</td></tr>`
          : ""
      }`;
    })
    .join("");

  const afternoonRows = TIMETABLE.afternoon
    .map((row, index) => {
      const span = index === 0 ? ` rowspan="${TIMETABLE.afternoon.length + 1}"` : "";
      const sessionCell =
        index === 0 ? `<td class="cell-session chieu"${span}>CHIỀU</td>` : "";
      return `${
        index === TIMETABLE.afternoon.length - 1
          ? `<tr class="break-row"><td class="cell-period">—</td><td class="cell-time">${breakBetween("afternoon").start} – ${breakBetween("afternoon").end}</td><td colspan="7">Nghỉ giữa buổi chiều</td></tr>`
          : ""
      }<tr>
        ${sessionCell}
        <td class="cell-period">${row.period}</td>
        <td class="cell-time">${row.start} – ${row.end}</td>
        ${row.days
          .map((name, dayIndex) => {
            const now = isCurrentPeriod("afternoon", row.period, dayIndex, date);
            return `<td>${
              name
                ? subjectButton(name, "afternoon", index, dayIndex, now)
                : emptyButton("afternoon", index, dayIndex)
            }</td>`;
          })
          .join("")}
      </tr>`;
    })
    .join("");

  document.getElementById("weekBoard").innerHTML = `
    <table class="tkb">
      <thead>
        <tr>
          <th>Buổi</th>
          <th>Tiết</th>
          <th>Thời gian</th>
          ${DAYS.map((day) => `<th>${day.header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>${morningRows}${afternoonRows}</tbody>
    </table>
  `;
}

function isBellNow(session, period) {
  const slot = currentSlot(vietnamNow());
  if (period === "break") return slot.kind === "break" && slot.session === session;
  return slot.kind === "period" && slot.session === session && slot.period === period;
}

function renderBells() {
  const grid = document.getElementById("bellGrid");
  grid.innerHTML = getBells().map((session) => {
    const rows = session.rows
      .map((row, index) => {
        const now = isBellNow(session.key, row.period);
        if (row.period === "break") {
          return `<div class="bell-row is-break${now ? " is-now" : ""}" style="--i:${index}">
            <div class="period-no">⏸</div>
            <p class="period-name">${row.label}</p>
            <p class="period-time">${row.time}</p>
          </div>`;
        }
        return `<div class="bell-row${now ? " is-now" : ""}" style="--i:${index}">
          <div class="period-no">${row.period}</div>
          <p class="period-name">Tiết ${row.period}</p>
          <p class="period-time">${row.time}</p>
        </div>`;
      })
      .join("");
    return `<section class="session">
      <div class="session-head">
        <h2>${session.title}</h2>
        <span class="badge${session.key === "afternoon" ? " sky" : ""}">${session.meta}</span>
      </div>
      <div class="period-list">${rows}</div>
    </section>`;
  }).join("");
}

function replayAnim(element) {
  if (!element) return;
  element.classList.remove("anim-in");
  void element.offsetWidth;
  element.classList.add("anim-in");
}

function applyTheme(theme) {
  const next = THEMES.some((item) => item.id === theme) ? theme : "pink";
  settings.theme = next;
  document.body.dataset.theme = next;
  const color = getComputedStyle(document.body).getPropertyValue("--pink").trim() || "#e56b93";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = color;
}

function applyChrome() {
  const ribbon = document.getElementById("classRibbon");
  if (ribbon) ribbon.textContent = classRibbon();
  document.title = `Thời khóa biểu ${classRibbon()} – Tuyết Vũ`;
  applyTheme(settings.theme);
}

function setTab(tab) {
  state.tab = tab;
  document.getElementById("tabNav").dataset.active = tab;
  document.querySelectorAll(".tab").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const tkb = document.getElementById("view-tkb");
  const gio = document.getElementById("view-gio");
  tkb.hidden = tab !== "tkb";
  gio.hidden = tab !== "gio";
  replayAnim(tab === "tkb" ? document.getElementById("dayBoard") : document.getElementById("bellGrid"));
}

function selectedSubjectName() {
  const custom = document.getElementById("customSubject").value.trim();
  return custom || state.pendingSubject;
}

function updateConfirmState() {
  const button = document.getElementById("confirmSubject");
  if (button) button.disabled = !selectedSubjectName();
}

function renderSubjectPicks(current) {
  document.getElementById("subjectGrid").innerHTML = allSubjects()
    .map((name) => {
      const style = subjectStyle(name);
      const selected = name === current ? " is-selected" : "";
      return `<button type="button" class="pick${selected}" data-subject="${escapeHtml(name)}" style="background:${style.bg};color:${style.color}">${escapeHtml(name)}</button>`;
    })
    .join("");
}

function openEditor(session, rowIndex, dayIndex) {
  const row = TIMETABLE[session][rowIndex];
  state.edit = { session, rowIndex, dayIndex };
  state.pendingSubject = row.days[dayIndex] || null;
  const current = state.pendingSubject;
  const sessionLabel = session === "morning" ? "Sáng" : "Chiều";
  document.getElementById("editorTitle").textContent = `${DAYS[dayIndex].name} · ${sessionLabel} · Tiết ${row.period}`;
  document.getElementById("editorSub").textContent = `${row.start} – ${row.end}`;
  document.getElementById("customSubject").value = current && !SUBJECTS[current] ? current : "";
  renderSubjectPicks(current);
  updateConfirmState();
  document.getElementById("editor").hidden = false;
}

function closeEditor() {
  state.edit = null;
  state.pendingSubject = null;
  document.getElementById("editor").hidden = true;
}

function applySubject(name) {
  if (!state.edit) return;
  const { session, rowIndex, dayIndex } = state.edit;
  const value = name ? name.trim() : null;
  TIMETABLE[session][rowIndex].days[dayIndex] = value || null;
  if (value && !SUBJECTS[value] && !customSubjects.includes(value)) {
    customSubjects.push(value);
  }
  saveSchedule();
  closeEditor();
  renderNowBar();
  renderDayBar();
  renderDayBoard();
  renderWeekBoard();
  if (typeof scheduleLocalReminders === "function") scheduleLocalReminders();
}

function resetSchedule() {
  const next = cloneTimetable(DEFAULT_TIMETABLE);
  TIMETABLE.morning = next.morning;
  TIMETABLE.afternoon = next.afternoon;
  customSubjects = [];
  applyPeriodTimes();
  saveSchedule();
  renderNowBar();
  renderDayBar();
  renderDayBoard();
  renderWeekBoard();
  if (typeof scheduleLocalReminders === "function") scheduleLocalReminders();
}

function bind() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });
  document.getElementById("dayBar").addEventListener("click", (event) => {
    const chip = event.target.closest("[data-day]");
    if (!chip) return;
    state.dayIndex = Number(chip.dataset.day);
    renderDayBar();
    renderDayBoard();
  });

  document.getElementById("view-tkb").addEventListener("click", (event) => {
    if (state.swiped) {
      state.swiped = false;
      return;
    }
    const target = event.target.closest("[data-edit]");
    if (!target) return;
    openEditor(target.dataset.session, Number(target.dataset.row), Number(target.dataset.day));
  });

  let touchX = null;
  const board = document.getElementById("dayBoard");
  board.addEventListener("touchstart", (event) => {
    touchX = event.changedTouches[0].clientX;
    state.swiped = false;
  }, { passive: true });
  board.addEventListener("touchend", (event) => {
    if (touchX == null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 50) return;
    state.swiped = true;
    state.dayIndex = Math.max(0, Math.min(DAYS.length - 1, state.dayIndex + (dx < 0 ? 1 : -1)));
    renderDayBar();
    renderDayBoard();
  }, { passive: true });

  document.getElementById("subjectGrid").addEventListener("click", (event) => {
    const pick = event.target.closest("[data-subject]");
    if (!pick) return;
    state.pendingSubject = pick.dataset.subject;
    document.getElementById("customSubject").value = "";
    renderSubjectPicks(state.pendingSubject);
    updateConfirmState();
  });
  document.getElementById("customSubject").addEventListener("input", (event) => {
    const value = event.target.value.trim();
    state.pendingSubject = value || state.pendingSubject;
    document.querySelectorAll(".pick").forEach((button) => {
      button.classList.toggle("is-selected", !value && button.dataset.subject === state.pendingSubject);
    });
    updateConfirmState();
  });
  document.getElementById("confirmSubject").addEventListener("click", () => {
    applySubject(selectedSubjectName());
  });
  document.getElementById("customSubject").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && selectedSubjectName()) applySubject(selectedSubjectName());
  });
  document.getElementById("clearPeriod").addEventListener("click", () => applySubject(null));
  document.getElementById("closeEditor").addEventListener("click", closeEditor);
  document.getElementById("editor").addEventListener("click", (event) => {
    if (event.target.id === "editor") closeEditor();
  });
  document.getElementById("settingsOpen").addEventListener("click", openSettings);
  document.getElementById("closeSettings").addEventListener("click", closeSettings);
  document.getElementById("settingsSheet").addEventListener("click", (event) => {
    if (event.target.id === "settingsSheet") closeSettings();
  });
  document.getElementById("saveSettings").addEventListener("click", commitSettings);
  document.getElementById("resetTimes").addEventListener("click", () => {
    if (!confirm("Khôi phục giờ ra vào lớp và giờ các tiết về mặc định?")) return;
    settings.arrive = { ...DEFAULT_SETTINGS.arrive };
    settings.dismiss = { ...DEFAULT_SETTINGS.dismiss };
    settings.periods = cloneSettings(DEFAULT_SETTINGS).periods;
    saveSettings();
    applyPeriodTimes();
    renderSettingsForm();
    renderAll();
    if (typeof scheduleLocalReminders === "function") scheduleLocalReminders();
  });
  document.getElementById("settingsForm").addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-theme]");
    if (!swatch) return;
    applyTheme(swatch.dataset.theme);
    saveSettings();
    document.querySelectorAll(".theme-swatch").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.theme === settings.theme);
    });
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Khôi phục thời khóa biểu ban đầu? Các thay đổi sẽ bị xóa.")) {
      resetSchedule();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeEditor();
    closeSettings();
  });
}

function timeRow(label, startId, endId, start, end) {
  return `<div class="time-row">
    <span class="time-label">${label}</span>
    <div class="time-fields">
      <input type="time" id="${startId}" value="${start}" />
      <span class="time-sep">–</span>
      <input type="time" id="${endId}" value="${end}" />
    </div>
  </div>`;
}

function renderSettingsForm() {
  const form = document.getElementById("settingsForm");
  if (!form) return;
  const morning = settings.periods.morning
    .map((row, index) => timeRow(`Tiết ${row.period}`, `mStart${index}`, `mEnd${index}`, row.start, row.end))
    .join("");
  const afternoon = settings.periods.afternoon
    .map((row, index) => timeRow(`Tiết ${row.period}`, `aStart${index}`, `aEnd${index}`, row.start, row.end))
    .join("");
  form.innerHTML = `
    <label class="custom-label" for="classNameInput">Tên lớp</label>
    <input id="classNameInput" type="text" maxlength="20" value="${escapeHtml(settings.className)}" placeholder="1A9" />
    <p class="custom-label">Giao diện màu</p>
    <div class="theme-grid">
      ${THEMES.map(
        (theme) =>
          `<button type="button" class="theme-swatch${theme.id === settings.theme ? " is-selected" : ""}" data-theme="${theme.id}" style="background:linear-gradient(135deg,${theme.from},${theme.to})">${theme.label}</button>`
      ).join("")}
    </div>
    <div class="time-block">
      <p class="custom-label">Giờ ra vào lớp</p>
      <p class="time-hint">Vào lớp – về</p>
      ${timeRow("Sáng", "arriveM", "dismissM", settings.arrive.morning, settings.dismiss.morning)}
      ${timeRow("Chiều", "arriveA", "dismissA", settings.arrive.afternoon, settings.dismiss.afternoon)}
    </div>
    <div class="time-block">
      <p class="custom-label">Các tiết buổi sáng</p>
      <p class="time-hint">Bắt đầu – kết thúc</p>
      ${morning}
    </div>
    <div class="time-block">
      <p class="custom-label">Các tiết buổi chiều</p>
      <p class="time-hint">Bắt đầu – kết thúc</p>
      ${afternoon}
    </div>
  `;
}

function readTime(id, fallback) {
  const value = document.getElementById(id)?.value || "";
  const match = value.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : fallback;
}

function commitSettings() {
  settings.className = normalizeClassName(document.getElementById("classNameInput")?.value);
  settings.arrive.morning = readTime("arriveM", settings.arrive.morning);
  settings.arrive.afternoon = readTime("arriveA", settings.arrive.afternoon);
  settings.dismiss.morning = readTime("dismissM", settings.dismiss.morning);
  settings.dismiss.afternoon = readTime("dismissA", settings.dismiss.afternoon);
  settings.periods.morning.forEach((row, index) => {
    row.start = readTime(`mStart${index}`, row.start);
    row.end = readTime(`mEnd${index}`, row.end);
  });
  settings.periods.afternoon.forEach((row, index) => {
    row.start = readTime(`aStart${index}`, row.start);
    row.end = readTime(`aEnd${index}`, row.end);
  });
  saveSettings();
  applyPeriodTimes();
  applyChrome();
  renderAll();
  closeSettings();
  if (typeof scheduleLocalReminders === "function") scheduleLocalReminders();
}

function openSettings() {
  renderSettingsForm();
  document.getElementById("settingsSheet").hidden = false;
}

function closeSettings() {
  document.getElementById("settingsSheet").hidden = true;
}

function renderAll() {
  renderNowBar();
  renderDayBar();
  renderDayBoard();
  renderWeekBoard();
  renderBells();
}

loadSchedule();
applyPeriodTimes();
applyChrome();
bind();
renderAll();

let lastSlotKey = `${currentSlot(vietnamNow()).kind}|${currentSlot(vietnamNow()).session || ""}|${currentSlot(vietnamNow()).period || ""}`;
setInterval(() => {
  const slot = currentSlot(vietnamNow());
  const key = `${slot.kind}|${slot.session || ""}|${slot.period || ""}`;
  renderNowBar();
  if (key === lastSlotKey) return;
  lastSlotKey = key;
  renderDayBoard(false);
  renderWeekBoard();
  renderBells();
}, 20000);
