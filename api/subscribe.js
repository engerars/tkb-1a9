const REPO = process.env.GITHUB_REPOSITORY || "engerars/tkb-1a9";
const FILE_PATH = "data/subscriptions.json";

function isSubscription(value) {
  return Boolean(
    value &&
      typeof value.endpoint === "string" &&
      value.endpoint.startsWith("https://") &&
      value.keys?.p256dh &&
      value.keys?.auth
  );
}

async function github(path, token, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  return res;
}

async function saveSubscription(token, incoming) {
  const get = await github(`/contents/${FILE_PATH}`, token);
  if (!get.ok) throw new Error("read-failed");
  const file = await get.json();
  const current = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  current.subscriptions = current.subscriptions || [];
  if (current.subscriptions.some((item) => item.endpoint === incoming.endpoint)) {
    return false;
  }
  current.subscriptions.push(incoming);
  const put = await github(`/contents/${FILE_PATH}`, token, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Register a reminder device",
      content: Buffer.from(`${JSON.stringify(current, null, 2)}\n`).toString("base64"),
      sha: file.sha,
    }),
  });
  if (!put.ok) throw new Error("write-failed");
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const incoming = req.body;
  if (!isSubscription(incoming)) {
    res.status(400).json({ ok: false, error: "invalid" });
    return;
  }

  const token = process.env.REPO_WRITE_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    res.status(200).json({ ok: false, reason: "no-token" });
    return;
  }

  try {
    const added = await saveSubscription(token, incoming);
    res.status(200).json({ ok: true, added });
  } catch {
    res.status(500).json({ ok: false, error: "commit-failed" });
  }
}
