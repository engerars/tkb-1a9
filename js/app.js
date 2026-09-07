const STORAGE_KEY = "tkb-1a9-schedule-v2";

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

const BELLS = [
  {
    key: "morning",
    title: "Sáng",
    meta: "Vào 6:50 · Về 9:50",
    rows: [
      { period: 1, time: "7:00–7:35" },
      { period: 2, time: "7:40–8:15" },
      { period: 3, time: "8:20–8:55" },
      { period: "break", time: "8:55–9:15", label: "Nghỉ giữa buổi" },
      { period: 4, time: "9:15–9:50" },
    ],
  },
  {
    key: "afternoon",
    title: "Chiều",
    meta: "Vào 13:50 · Học 14:00 · Về 16:10",
    rows: [
      { period: 2, time: "14:00–14:35" },
      { period: 3, time: "14:40–15:15" },
      { period: "break", time: "15:15–15:35", label: "Nghỉ giữa buổi" },
      { period: 4, time: "15:35–16:10" },
    ],
  },
];

const TIMETABLE = cloneTimetable(DEFAULT_TIMETABLE);
let customSubjects = [];

const state = {
  tab: "tkb",
  dayIndex: todayIndex(),
  edit: null,
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

  if (hasMorning && now >= parseHm("06:50") && now < parseHm("07:00")) {
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
  if (hasMorning && now >= parseHm("08:55") && now < parseHm("09:15")) {
    return { kind: "break", session: "morning", label: "Nghỉ giữa buổi sáng (20 phút)" };
  }
  if (hasMorning && now >= parseHm("07:00") && now < parseHm("09:50")) {
    return { kind: "gap", session: "morning", label: "Chuyển tiết" };
  }
  if (hasMorning && now >= parseHm("09:50") && now < parseHm("13:50")) {
    return { kind: "noon", label: "Tan học buổi sáng · nghỉ trưa" };
  }
  if (hasAfternoon && now >= parseHm("13:50") && now < parseHm("14:00")) {
    return { kind: "arrive", session: "afternoon", label: "Vào lớp, bắt đầu học lúc 14 giờ 00" };
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
  if (hasAfternoon && now >= parseHm("15:15") && now < parseHm("15:35")) {
    return { kind: "break", session: "afternoon", label: "Nghỉ giữa buổi chiều (20 phút)" };
  }
  if (hasAfternoon && now >= parseHm("14:00") && now < parseHm("16:10")) {
    return { kind: "gap", session: "afternoon", label: "Chuyển tiết" };
  }
  if (hasAfternoon && now >= parseHm("16:10")) {
    return { kind: "done", label: "Đã tan học" };
  }
  if (!hasMorning && !hasAfternoon) {
    return { kind: "off", label: `${dayName} không có tiết học` };
  }
  if (!hasMorning && now < parseHm("13:50")) {
    return { kind: "off", label: `Sáng ${dayName} không có tiết học` };
  }
  if (!hasAfternoon && now >= parseHm("09:50")) {
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
        <span class="badge">6:50–9:50</span>
      </div>
      ${renderPeriodCards("morning", state.dayIndex)}
    </section>
    <section class="session">
      <div class="session-head">
        <h2>Chiều</h2>
        <span class="badge sky">13:50–16:10</span>
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
        index === 2
          ? `<tr class="break-row"><td class="cell-period">—</td><td class="cell-time">08:55 – 09:15</td><td colspan="7">Nghỉ giữa buổi sáng (20 phút)</td></tr>`
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
        index === 2
          ? `<tr class="break-row"><td class="cell-period">—</td><td class="cell-time">15:15 – 15:35</td><td colspan="7">Nghỉ giữa buổi chiều (20 phút)</td></tr>`
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
  grid.innerHTML = BELLS.map((session) => {
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

function setTab(tab) {
  state.tab = tab;
  document.body.dataset.theme = tab === "gio" ? "sky" : "pink";
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

function openEditor(session, rowIndex, dayIndex) {
  const row = TIMETABLE[session][rowIndex];
  state.edit = { session, rowIndex, dayIndex };
  const current = row.days[dayIndex];
  const sessionLabel = session === "morning" ? "Sáng" : "Chiều";
  document.getElementById("editorTitle").textContent = `${DAYS[dayIndex].name} · ${sessionLabel} · Tiết ${row.period}`;
  document.getElementById("editorSub").textContent = `${row.start} – ${row.end}`;
  document.getElementById("customSubject").value = current && !SUBJECTS[current] ? current : "";
  document.getElementById("subjectGrid").innerHTML = allSubjects()
    .map((name) => {
      const style = subjectStyle(name);
      const selected = name === current ? " is-selected" : "";
      return `<button type="button" class="pick${selected}" data-subject="${escapeHtml(name)}" style="background:${style.bg};color:${style.color}">${escapeHtml(name)}</button>`;
    })
    .join("");
  document.getElementById("editor").hidden = false;
}

function closeEditor() {
  state.edit = null;
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
    applySubject(pick.dataset.subject);
  });
  document.getElementById("saveCustom").addEventListener("click", () => {
    applySubject(document.getElementById("customSubject").value);
  });
  document.getElementById("customSubject").addEventListener("keydown", (event) => {
    if (event.key === "Enter") applySubject(event.target.value);
  });
  document.getElementById("clearPeriod").addEventListener("click", () => applySubject(null));
  document.getElementById("closeEditor").addEventListener("click", closeEditor);
  document.getElementById("editor").addEventListener("click", (event) => {
    if (event.target.id === "editor") closeEditor();
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Khôi phục thời khóa biểu ban đầu? Các thay đổi sẽ bị xóa.")) {
      resetSchedule();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeEditor();
  });
}

function renderAll() {
  renderNowBar();
  renderDayBar();
  renderDayBoard();
  renderWeekBoard();
  renderBells();
}

loadSchedule();
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
