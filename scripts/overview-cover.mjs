import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs/overview/cover-desk.webp");

function loadKey() {
  const text = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq).trim() !== "OPENAI_API_KEY") continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("OPENAI_API_KEY missing");
}

const prompt = [
  "Premium Japanese software keynote photograph, close crop.",
  "A silver MacBook fills most of the frame. Camera close to the display.",
  "The three attached 2D characters (orange tabby cat, white rabbit, cream floppy-eared dog) appear ON THE LIT LCD SCREEN as software windows, rendered in pixels inside the display.",
  "They are always-on-top floating chat windows on the desktop wallpaper, clearly inside the glass, with a faint screen glow and slight reflection.",
  "NOT physical stickers. NOT toys sitting on the bezel or keyboard. NOT decorations on the laptop body.",
  "Characters are large and readable on the screen.",
  "Soft cream and lilac light. Photorealistic laptop. No flowers, no plants, no moon, no sakura, no text, no letters, no logos, no watermark.",
].join(" ");

const apiKey = loadKey();
const refs = [
  path.join(ROOT, "public/party/cat/02.webp"),
  path.join(ROOT, "public/party/bunny/02.webp"),
  path.join(ROOT, "public/party/dog/09.webp"),
];

const form = new FormData();
form.append("model", "gpt-image-2.5-sunburst");
form.append("prompt", prompt);
form.append("size", "2048x1152");
form.append("quality", "high");
form.append("output_format", "png");
for (const file of refs) {
  const bytes = fs.readFileSync(file);
  form.append("image[]", new Blob([new Uint8Array(bytes)], { type: "image/png" }), path.basename(file));
}

process.stdout.write("cover-desk.webp ... ");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { authorization: `Bearer ${apiKey}` },
  body: form,
  signal: AbortSignal.timeout(300_000),
});
const json = await res.json();
if (!res.ok) throw new Error(json?.error?.message || `openai ${res.status}`);
const b64 = json.data?.[0]?.b64_json;
if (!b64) throw new Error("no image bytes");
const buf = Buffer.from(b64, "base64");
fs.writeFileSync(OUT, buf);
console.log(`${buf.length} bytes`);
