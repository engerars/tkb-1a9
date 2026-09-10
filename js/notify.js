const NOTIFY_KEY = "tkb-1a9-notify-v1";
const SENT_KEY = "tkb-1a9-notify-sent-v1";
const VAPID_PUBLIC_KEY = "BGTD4OuJoIAiAnwRoe9fHjLBYLgWLfnBtqIpMD1Z4rGu-_DlhhclTdvfWPNgFQqxcCU60gJfjjDpC2opNj1Qucg";
const GRACE_MINUTES = 15;

const defaultNotify = {
  enabled: false,
  leadMinutes: 20,
  dropoff: true,
  start: true,
  startPm: true,
  pickup: true,
  extra: true,
};

function notifyClassName() {
  return typeof getClassName === "function" ? getClassName() : "1A9";
}

function notifyTime(session, kind) {
  if (typeof settings === "undefined") {
    const fallback = {
      morning: { arrive: "06:50", start: "07:00", dismiss: "09:50" },
      afternoon: { arrive: "13:50", start: "14:00", dismiss: "16:10" },
    };
    return fallback[session][kind];
  }
  if (kind === "arrive") return settings.arrive[session];
  if (kind === "dismiss") return settings.dismiss[session];
  return settings.periods[session][0].start;
}

let notifySettings = loadNotify();
let notifyTimers = [];
const notifyFiring = new Set();
let sentMemory = loadSent();

function loadNotify() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTIFY_KEY) || "{}");
    const next = { ...defaultNotify, ...saved };
    if (saved.startPm === undefined && saved.start === false) next.startPm = false;
    return next;
  } catch {
    return { ...defaultNotify };
  }
}

function saveNotify() {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(notifySettings));
}

function loadSent() {
  try {
    const saved = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function dayStamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pruneSent(now) {
  const keep = new Set([dayStamp(now)]);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  keep.add(dayStamp(yesterday));
  const next = {};
  Object.entries(sentMemory).forEach(([key, value]) => {
    if (keep.has(String(key).split(":")[0])) next[key] = value;
  });
  sentMemory = next;
}

function persistSent() {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(sentMemory));
  } catch {
    /* ignore quota */
  }
}

function reminderKey(date, id) {
  return `${dayStamp(date)}:${id}`;
}

function waitFor(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandaloneApp() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function hasNotificationAPI() {
  return typeof window.Notification === "function";
}

function notificationGranted() {
  return hasNotificationAPI() && Notification.permission === "granted";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function reminderList(dayIndex, lead) {
  const items = [];
  const cls = notifyClassName();
  const arriveM = notifyTime("morning", "arrive");
  const startM = notifyTime("morning", "start");
  const endM = notifyTime("morning", "dismiss");
  const arriveA = notifyTime("afternoon", "arrive");
  const startA = notifyTime("afternoon", "start");
  const endA = notifyTime("afternoon", "dismiss");

  if (sessionHasDay("morning", dayIndex)) {
    if (notifySettings.dropoff) {
      items.push({
        id: "m-drop",
        at: parseHm(arriveM) - lead,
        title: "Đưa bé đến trường",
        body: `Còn ${lead} phút nữa vào lớp (${arriveM}). Chuẩn bị đưa học sinh lớp ${cls} đến trường.`,
        tab: "gio",
      });
    }
    if (notifySettings.start) {
      items.push({
        id: "m-start",
        at: parseHm(startM),
        title: "Bắt đầu giờ học sáng",
        body: `Lớp ${cls} vào tiết lúc ${startM}. Phụ huynh lưu ý giờ ra vào lớp.`,
        tab: "tkb",
      });
    }
    if (notifySettings.pickup) {
      items.push({
        id: "m-pick",
        at: parseHm(endM) - lead,
        title: "Đón bé tan học sáng",
        body: `Còn ${lead} phút nữa tan học (${endM}). Xuất phát đón học sinh lớp ${cls}.`,
        tab: "gio",
      });
    }
  }
  if (sessionHasDay("afternoon", dayIndex)) {
    if (notifySettings.dropoff) {
      items.push({
        id: "a-drop",
        at: parseHm(arriveA) - lead,
        title: "Đưa bé học chiều",
        body: `Còn ${lead} phút nữa vào lớp (${arriveA}). Chuẩn bị đưa học sinh lớp ${cls} đến trường.`,
        tab: "gio",
      });
    }
    if (notifySettings.startPm) {
      items.push({
        id: "a-start-lead",
        at: parseHm(startA) - lead,
        title: "Sắp vào học chiều",
        body: `Còn ${lead} phút nữa vào học chiều (${startA}). Lớp ${cls} chuẩn bị vào tiết.`,
        tab: "gio",
      });
      items.push({
        id: "a-start",
        at: parseHm(startA),
        title: "Bắt đầu giờ học chiều",
        body: `Lớp ${cls} vào học chiều lúc ${startA}.`,
        tab: "tkb",
      });
    }
    if (notifySettings.pickup) {
      items.push({
        id: "a-pick",
        at: parseHm(endA) - lead,
        title: "Đón bé tan học chiều",
        body: `Còn ${lead} phút nữa tan học (${endA}). Xuất phát đón học sinh lớp ${cls}.`,
        tab: "gio",
      });
    }
  }
  if (notifySettings.extra && typeof extrasForDay === "function") {
    extrasForDay(dayIndex).forEach((item) => {
      if (!item.remind) return;
      items.push({
        id: `ex-lead-${item.id}`,
        at: parseHm(item.start) - lead,
        title: `Sắp học thêm · ${item.name}`,
        body: `Còn ${lead} phút nữa học thêm (${item.start}${item.place ? ` · ${item.place}` : ""}). Lớp ${cls}.`,
        tab: "tkb",
      });
      items.push({
        id: `ex-start-${item.id}`,
        at: parseHm(item.start),
        title: `Bắt đầu học thêm · ${item.name}`,
        body: `Đến giờ học thêm lúc ${item.start}${item.place ? ` · ${item.place}` : ""}.`,
        tab: "tkb",
      });
    });
  }
  return items.filter((item) => item.at >= 0);
}

function formatClock(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

async function showReminder(item) {
  if (!notificationGranted()) return false;
  const options = {
    body: item.body,
    tag: item.id,
    renotify: true,
    icon: "./favicon.svg",
    badge: "./favicon.svg",
    data: { url: "./index.html", tab: item.tab },
  };
  try {
    if (navigator.serviceWorker) {
      const reg = await waitFor(navigator.serviceWorker.ready, 2000);
      if (reg?.showNotification) {
        await reg.showNotification(item.title, options);
        return true;
      }
      if (reg?.active) {
        reg.active.postMessage({ type: "notify", title: item.title, ...options, tab: item.tab });
        return true;
      }
    }
  } catch {
    /* fall through to page Notification */
  }
  try {
    new Notification(item.title, { body: item.body, tag: item.id });
    return true;
  } catch {
    return false;
  }
}

function clearNotifyTimers() {
  notifyTimers.forEach((id) => {
    clearTimeout(id);
    clearInterval(id);
  });
  notifyTimers = [];
}

async function tickReminders() {
  if (!notifySettings.enabled || !notificationGranted()) return;
  const now = vietnamNow();
  pruneSent(now);
  const nowMin = minutesNow(now) + now.getSeconds() / 60;
  const items = reminderList(toDayIndex(now), notifySettings.leadMinutes);
  for (const item of items) {
    const late = nowMin - item.at;
    if (late < 0 || late > GRACE_MINUTES) continue;
    const key = reminderKey(now, item.id);
    if (sentMemory[key] || notifyFiring.has(key)) continue;
    notifyFiring.add(key);
    try {
      const shown = await showReminder(item);
      if (!shown) continue;
      sentMemory[key] = Date.now();
      persistSent();
    } catch {
      /* retry on the next tick */
    } finally {
      notifyFiring.delete(key);
    }
  }
}

function scheduleLocalReminders() {
  clearNotifyTimers();
  if (!notifySettings.enabled || !notificationGranted()) {
    renderNotifyPanel();
    return;
  }
  tickReminders();
  notifyTimers.push(setInterval(tickReminders, 15000));
  const now = vietnamNow();
  const nowMin = minutesNow(now);
  const sec = now.getSeconds();
  reminderList(toDayIndex(now), notifySettings.leadMinutes).forEach((item) => {
    const delay = (item.at - nowMin) * 60 * 1000 - sec * 1000;
    if (delay < 1500 || delay > 36 * 3600 * 1000) return;
    notifyTimers.push(setTimeout(() => tickReminders(), delay));
  });
  const msToMidnight = ((24 * 60 - nowMin) * 60 - sec) * 1000 + 2000;
  if (msToMidnight > 1500 && msToMidnight < 36 * 3600 * 1000) {
    notifyTimers.push(setTimeout(() => scheduleLocalReminders(), msToMidnight));
  }
  renderNotifyPanel();
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await waitFor(navigator.serviceWorker.ready, 4000);
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  localStorage.setItem("tkb-1a9-push-sub", JSON.stringify(sub.toJSON()));
  return sub;
}

async function enableNotifications() {
  if (!window.isSecureContext || !hasNotificationAPI()) {
    notifySettings.enabled = false;
    saveNotify();
    renderNotifyPanel();
    return;
  }
  let permission = Notification.permission;
  if (permission !== "granted") {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = "denied";
    }
  }
  if (permission !== "granted") {
    notifySettings.enabled = false;
    saveNotify();
    renderNotifyPanel();
    return;
  }
  notifySettings.enabled = true;
  saveNotify();
  try {
    await registerPush();
  } catch {
    /* local reminders still work */
  }
  scheduleLocalReminders();
  await showReminder({
    id: "test",
    title: "Đã bật nhắc giờ học",
    body: "Phụ huynh sẽ nhận thông báo trước giờ đưa, đón và khi bắt đầu học.",
    tab: "gio",
  });
}

function disableNotifications() {
  notifySettings.enabled = false;
  saveNotify();
  clearNotifyTimers();
  renderNotifyPanel();
}

function renderNotifyPanel() {
  const status = document.getElementById("notifyStatus");
  const next = document.getElementById("notifyNext");
  const toggle = document.getElementById("notifyToggle");
  const lead = document.getElementById("notifyLead");
  if (!status || !next || !toggle || !lead) return;

  toggle.checked = notifySettings.enabled && notificationGranted();
  lead.value = String(notifySettings.leadMinutes);
  document.getElementById("notifyDropoff").checked = notifySettings.dropoff;
  document.getElementById("notifyStart").checked = notifySettings.start;
  document.getElementById("notifyStartPm").checked = notifySettings.startPm;
  document.getElementById("notifyPickup").checked = notifySettings.pickup;
  document.getElementById("notifyExtra").checked = notifySettings.extra;

  const iosHint = document.getElementById("notifyIos");
  const onIosBrowser = isIosDevice() && !isStandaloneApp();
  if (!window.isSecureContext) {
    iosHint.hidden = !isIosDevice();
    status.textContent = "Cần mở bằng https, hoặc thêm ra Màn hình chính rồi mở icon TKB 1A9.";
  } else if (onIosBrowser && !hasNotificationAPI()) {
    iosHint.hidden = false;
    status.textContent = "Safari/Edge trên iPhone chỉ gửi thông báo khi mở từ icon ở Màn hình chính.";
  } else if (hasNotificationAPI() && Notification.permission === "denied") {
    iosHint.hidden = !onIosBrowser;
    status.textContent = "Thông báo đang bị chặn. Vào Cài đặt máy, cho phép thông báo với TKB 1A9.";
  } else if (toggle.checked) {
    iosHint.hidden = true;
    const pending = reminderList(toDayIndex(vietnamNow()), notifySettings.leadMinutes).filter(
      (item) => item.at > minutesNow(vietnamNow())
    ).length;
    status.textContent = pending
      ? `Đã bật. Còn ${pending} nhắc hôm nay, app sẽ tự gửi đúng giờ.`
      : "Đã bật. Hôm nay không còn nhắc. Mai app sẽ hẹn lại.";
  } else {
    iosHint.hidden = !onIosBrowser;
    status.textContent = "Bật thông báo để nhắc phụ huynh đưa và đón đúng giờ.";
  }

  const now = vietnamNow();
  const upcoming = reminderList(toDayIndex(now), notifySettings.leadMinutes)
    .filter((item) => item.at > minutesNow(now))
    .slice(0, 8);
  next.innerHTML = upcoming.length
    ? upcoming.map((item) => `<li><b>${formatClock(item.at)}</b> · ${escapeHtml(item.title)}</li>`).join("")
    : "<li>Hôm nay không còn nhắc nào, hoặc hôm nay không có tiết.</li>";
}

function openNotify() {
  document.getElementById("notifySheet").hidden = false;
  renderNotifyPanel();
}

function closeNotify() {
  document.getElementById("notifySheet").hidden = true;
}

function bindNotify() {
  document.getElementById("notifyOpen").addEventListener("click", openNotify);
  document.getElementById("closeNotify").addEventListener("click", closeNotify);
  document.getElementById("notifySheet").addEventListener("click", (event) => {
    if (event.target.id === "notifySheet") closeNotify();
  });
  document.getElementById("notifyToggle").addEventListener("change", async (event) => {
    if (event.target.checked) await enableNotifications();
    else disableNotifications();
  });
  document.getElementById("notifyLead").addEventListener("change", (event) => {
    notifySettings.leadMinutes = Number(event.target.value) || 20;
    saveNotify();
    scheduleLocalReminders();
  });
  [
    { id: "notifyDropoff", key: "dropoff" },
    { id: "notifyStart", key: "start" },
    { id: "notifyStartPm", key: "startPm" },
    { id: "notifyPickup", key: "pickup" },
    { id: "notifyExtra", key: "extra" },
  ].forEach(({ id, key }) => {
    document.getElementById(id).addEventListener("change", (event) => {
      notifySettings[key] = event.target.checked;
      saveNotify();
      scheduleLocalReminders();
    });
  });
  document.getElementById("notifyCalendar").addEventListener("click", () => {
    if (typeof downloadCalendarIcs === "function") downloadCalendarIcs();
  });
  document.getElementById("notifyCopy").addEventListener("click", async () => {
    const raw = localStorage.getItem("tkb-1a9-push-sub");
    if (!raw) {
      alert("Hãy bật thông báo trước, rồi sao chép mã thiết bị.");
      return;
    }
    try {
      await navigator.clipboard.writeText(raw);
      alert("Đã sao chép. Gửi mã này để đăng ký nhắc khi đã tắt hẳn app.");
    } catch {
      alert(raw);
    }
  });
  document.getElementById("notifyTest").addEventListener("click", async () => {
    if (!notificationGranted() || !notifySettings.enabled) {
      await enableNotifications();
    }
    if (!notificationGranted()) return;
    await showReminder({
      id: "test",
      title: "Nhắc thử · Đưa bé đến trường",
      body: "Đây là thông báo thử. Còn 20 phút nữa vào lớp (6:50).",
      tab: "gio",
    });
    scheduleLocalReminders();
  });
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "open-tab" && event.data.tab) setTab(event.data.tab);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleLocalReminders();
  });
  window.addEventListener("pageshow", () => scheduleLocalReminders());
  window.addEventListener("focus", () => tickReminders());
}

async function initNotify() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch {
      /* ignore */
    }
  }
  bindNotify();
  if (notifySettings.enabled && notificationGranted()) {
    try {
      await registerPush();
    } catch {
      /* ignore */
    }
    scheduleLocalReminders();
  } else {
    renderNotifyPanel();
  }
}

initNotify();
