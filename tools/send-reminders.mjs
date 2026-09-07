import webpush from "web-push";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

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

function hasSession(session) {
  return timetable[session][day];
}

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
    { at: 14 * 60, title: "Bắt đầu giờ học chiều", body: "Lớp 1A9 bắt đầu học lúc 14:00.", tag: "a-start", tab: "tkb" },
    { at: 16 * 60 + 10 - lead, title: "Đón bé tan học chiều", body: `Còn ${lead} phút nữa tan học (16:10).`, tag: "a-pick", tab: "gio" }
  );
}

const matched = due.filter((item) => minutes >= item.at && minutes < item.at + 5);
if (!matched.length) {
  console.log(`No reminder in this window (${minutes} min).`);
  process.exit(0);
}

for (const item of matched) {
  const payload = JSON.stringify({ title: item.title, body: item.body, tag: item.tag, tab: item.tab });
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      console.log("sent", item.tag);
    } catch (error) {
      console.log("skip", item.tag, error.statusCode || error.message);
    }
  }
}
