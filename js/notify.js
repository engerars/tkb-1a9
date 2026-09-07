const NOTIFY_KEY = "tkb-1a9-notify-v1";
const VAPID_PUBLIC_KEY = "BGTD4OuJoIAiAnwRoe9fHjLBYLgWLfnBtqIpMD1Z4rGu-_DlhhclTdvfWPNgFQqxcCU60gJfjjDpC2opNj1Qucg";

const defaultNotify = {
  enabled: false,
  leadMinutes: 20,
  dropoff: true,
  start: true,
  pickup: true,
};

let notifySettings = loadNotify();
let notifyTimers = [];

function loadNotify() {
  try {
    return { ...defaultNotify, ...JSON.parse(localStorage.getItem(NOTIFY_KEY) || "{}") };
  } catch {
    return { ...defaultNotify };
  }
}

function saveNotify() {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(notifySettings));
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
  if (sessionHasDay("morning", dayIndex)) {
    if (notifySettings.dropoff) {
      items.push({
        id: "m-drop",
        at: parseHm("06:50") - lead,
        title: "Đưa bé đến trường",
        body: `Còn ${lead} phút nữa vào lớp (6:50). Chuẩn bị đưa học sinh lớp 1A9 đến trường.`,
        tab: "gio",
      });
    }
    if (notifySettings.start) {
      items.push({
        id: "m-start",
        at: parseHm("07:00"),
        title: "Bắt đầu giờ học sáng",
        body: "Lớp 1A9 vào tiết lúc 7:00. Phụ huynh lưu ý giờ ra vào lớp.",
        tab: "tkb",
      });
    }
    if (notifySettings.pickup) {
      items.push({
        id: "m-pick",
        at: parseHm("09:50") - lead,
        title: "Đón bé tan học sáng",
        body: `Còn ${lead} phút nữa tan học (9:50). Xuất phát đón học sinh lớp 1A9.`,
        tab: "gio",
      });
    }
  }
  if (sessionHasDay("afternoon", dayIndex)) {
    if (notifySettings.dropoff) {
      items.push({
        id: "a-drop",
        at: parseHm("13:50") - lead,
        title: "Đưa bé học chiều",
        body: `Còn ${lead} phút nữa vào lớp (13:50). Chuẩn bị đưa học sinh lớp 1A9 đến trường.`,
        tab: "gio",
      });
    }
    if (notifySettings.start) {
      items.push({
        id: "a-start",
        at: parseHm("14:00"),
        title: "Bắt đầu giờ học chiều",
        body: "Lớp 1A9 bắt đầu học lúc 14:00.",
        tab: "tkb",
      });
    }
    if (notifySettings.pickup) {
      items.push({
        id: "a-pick",
        at: parseHm("16:10") - lead,
        title: "Đón bé tan học chiều",
        body: `Còn ${lead} phút nữa tan học (16:10). Xuất phát đón học sinh lớp 1A9.`,
        tab: "gio",
      });
    }
  }
  return items.filter((item) => item.at >= 0);
}

function formatClock(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

async function showReminder(item) {
  if (!notificationGranted()) return;
  const payload = { type: "notify", title: item.title, body: item.body, tag: item.id, tab: item.tab };
  const ready = navigator.serviceWorker?.ready;
  if (ready) {
    const reg = await ready;
    if (reg.active) {
      reg.active.postMessage(payload);
      return;
    }
    if (reg.showNotification) {
      await reg.showNotification(item.title, {
        body: item.body,
        tag: item.id,
        renotify: true,
        icon: "./favicon.svg",
        data: { url: "./index.html", tab: item.tab },
      });
      return;
    }
  }
  new Notification(item.title, { body: item.body, tag: item.id });
}

function clearNotifyTimers() {
  notifyTimers.forEach((id) => clearTimeout(id));
  notifyTimers = [];
}

function scheduleLocalReminders() {
  clearNotifyTimers();
  if (!notifySettings.enabled || !notificationGranted()) {
    renderNotifyPanel();
    return;
  }
  const now = vietnamNow();
  const nowMin = minutesNow(now);
  const sec = now.getSeconds();
  reminderList(toDayIndex(now), notifySettings.leadMinutes).forEach((item) => {
    const delay = (item.at - nowMin) * 60 * 1000 - sec * 1000;
    if (delay < 1500 || delay > 20 * 3600 * 1000) return;
    notifyTimers.push(setTimeout(() => showReminder(item), delay));
  });
  renderNotifyPanel();
}

async function registerPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
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
  document.getElementById("notifyPickup").checked = notifySettings.pickup;

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
    status.textContent = "Đã bật. App sẽ nhắc trước giờ đưa/đón và khi bắt đầu học.";
  } else {
    iosHint.hidden = !onIosBrowser;
    status.textContent = "Bật thông báo để nhắc phụ huynh đưa và đón đúng giờ.";
  }

  const now = vietnamNow();
  const upcoming = reminderList(toDayIndex(now), notifySettings.leadMinutes)
    .filter((item) => item.at > minutesNow(now))
    .slice(0, 4);
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
  ["notifyDropoff", "notifyStart", "notifyPickup"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      const key = id.replace("notify", "").toLowerCase();
      notifySettings[key] = event.target.checked;
      saveNotify();
      scheduleLocalReminders();
    });
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
    if (!notificationGranted()) {
      await enableNotifications();
      return;
    }
    await showReminder({
      id: "test",
      title: "Nhắc thử · Đưa bé đến trường",
      body: "Đây là thông báo thử. Còn 20 phút nữa vào lớp (6:50).",
      tab: "gio",
    });
  });
  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "open-tab" && event.data.tab) setTab(event.data.tab);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleLocalReminders();
  });
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
