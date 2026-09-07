import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "subscriptions.json");
const incoming = JSON.parse(process.env.SUB || "null");
if (!incoming?.endpoint) {
  console.log("No subscription endpoint; skip.");
  process.exit(0);
}

const data = JSON.parse(await readFile(file, "utf8"));
data.subscriptions = data.subscriptions || [];
if (!data.subscriptions.some((item) => item.endpoint === incoming.endpoint)) {
  data.subscriptions.push(incoming);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log("added");
} else {
  console.log("already registered");
}
