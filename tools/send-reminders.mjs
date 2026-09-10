import webpush from "web-push";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const WINDOW_MINUTES = Number(process.env.WINDOW_MINUTES || 90);
const sentPath = join(root, ".reminders-sent.json");

if (!publicKey || !privateKey) {
  console.log("Missing VAPID keys; skip send.");
  process.exit(0);
}

webpush.setVapidDetails("mailto:engerars@users.noreply.github.com", publicKey, privateKey);

const timetable = JSON.parse(await readFile(join(root, "data", "reminders.json"), "utf8"));
const stored = JSON.parse(await readFile(join(root, "data", "subscriptions.json"), "utf8"));
const subscriptions = stored.subscriptions || [];

if (!subscriptions.length) {
  console.log("No push subscriptions yet.");
  process.exit(0);
}

const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
const minutes = now.getHours() * 60 + now.getMinutes();
const lead = Number(process.env.LEAD_MINUTES || 20);
const dayStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

function hasSession(session) {
  return timetable[session][day];
}

let sent = {};
try {
  sent = JSON.parse(await readFile(sentPath, "utf8"));
} catch {
  sent = {};
}

const keepPrefix = dayStamp;
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStamp = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
sent = Object.fromEntries(Object.entries(sent).filter(([key]) => key.startsWith(keepPrefix) || key.startsWith(yesterdayStamp)));

const due = [];
if (hasSession("morning")) {
  due.push(
    { at: 6 * 60 + 50 - lead, title: "Đưa bé đến trường", body: `Còn ${lead} phút nữa vào lớp (6:50).`, tag: "m-drop", tab: "gio" },
    { at: 7 * 60, title: "Bắt đầu giờ học sáng", body: "Lớp 1A9 vào tiết lúc 7:00.", tag: "m-start", tab: "tkb" },
    { at: 9 * 60 + 50 - lead, title: "Đón bé tan học sáng", body: `Còn ${lead} phút nữa tan học (9:50).`, tag: "m-pick", tab: "gio" }
  );
}
if (hasSession("afternoon")) {
  due.push(
    { at: 13 * 60 + 50 - lead, title: "Đưa bé học chiều", body: `Còn ${lead} phút nữa vào lớp (13:50).`, tag: "a-drop", tab: "gio" },
    { at: 14 * 60 - lead, title: "Sắp vào học chiều", body: `Còn ${lead} phút nữa vào học chiều (14:00).`, tag: "a-start-lead", tab: "gio" },
    { at: 14 * 60, title: "Bắt đầu giờ học chiều", body: "Lớp 1A9 vào học chiều lúc 14:00.", tag: "a-start", tab: "tkb" },
    { at: 16 * 60 + 10 - lead, title: "Đón bé tan học chiều", body: `Còn ${lead} phút nữa tan học (16:10).`, tag: "a-pick", tab: "gio" }
  );
}

const matched = due.filter((item) => {
  const key = `${dayStamp}:${item.tag}`;
  if (sent[key]) return false;
  return minutes >= item.at && minutes < item.at + WINDOW_MINUTES;
});

if (!matched.length) {
  console.log(`No reminder in this window (${minutes} min, window ${WINDOW_MINUTES}).`);
  await writeFile(sentPath, `${JSON.stringify(sent, null, 2)}\n`);
  process.exit(0);
}

let deliveredAny = false;
for (const item of matched) {
  const key = `${dayStamp}:${item.tag}`;
  const payload = JSON.stringify({ title: item.title, body: item.body, tag: item.tag, tab: item.tab });
  let delivered = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      delivered += 1;
      console.log("sent", item.tag);
    } catch (error) {
      console.log("skip", item.tag, error.statusCode || error.message);
    }
  }
  if (delivered > 0) {
    sent[key] = Date.now();
    deliveredAny = true;
  }
}

await writeFile(sentPath, `${JSON.stringify(sent, null, 2)}\n`);
if (deliveredAny) console.log("updated sent log");

