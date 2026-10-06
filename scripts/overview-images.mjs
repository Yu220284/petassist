import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs/overview");

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

const STYLE = [
  "Premium Japanese brand illustration for a software keynote slide.",
  "Quiet, expensive, editorial. Soft cream paper, dusty lilac, muted rose.",
  "Subtle lighting, fine materials, generous negative space.",
  "Not clipart, not sticker, not chibi, not thick outlines, not 3D cartoon.",
  "No animals, no characters, no flowers, no moon, no text, no letters, no watermark, no logo.",
  "Square composition.",
].join(" ");

const JOBS = [
  {
    file: "problem-lock.webp",
    prompt: `${STYLE} A glass-and-metal padlock hovering over an open laptop. Documents lift and dissolve into light dust. Anxiety about data disappearing.`,
  },
  {
    file: "problem-time.webp",
    prompt: `${STYLE} A refined analog clock with looping silk ribbons of arrows around a crumpled checklist. Time wasted on rework.`,
  },
  {
    file: "problem-secret.webp",
    prompt: `${STYLE} A closed filing cabinet and sealed folders behind a slender red barrier. Confidential files that must not be touched.`,
  },
  {
    file: "solution-scope.webp",
    prompt: `${STYLE} A soft rose ring of light around one folder and two app tiles. Other tiles rest outside, dim. Scoped permissions.`,
  },
  {
    file: "solution-approve.webp",
    prompt: `${STYLE} A pale message card with a pause glyph and a waiting check. Approval before sending.`,
  },
  {
    file: "solution-devices.webp",
    prompt: `${STYLE} A smartphone and a laptop linked by a thin dotted path of light. The same workspace continuing across devices.`,
  },
];

const MODELS = [
  { model: "gpt-image-2.5-sunburst", quality: "high" },
  { model: "gpt-image-2", quality: "high" },
];

async function generate(apiKey, prompt, model, quality) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "2048x2048",
      quality,
      output_format: "png",
    }),
    signal: AbortSignal.timeout(300_000),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `openai ${res.status}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image bytes");
  return Buffer.from(b64, "base64");
}

const apiKey = loadKey();
let chosen = MODELS[0];

try {
  process.stdout.write(`probe ${chosen.model} ... `);
  const probe = await generate(apiKey, JOBS[0].prompt, chosen.model, chosen.quality);
  fs.writeFileSync(path.join(OUT, JOBS[0].file), probe);
  console.log(`ok ${probe.length} bytes`);
} catch (err) {
  console.log(`fail (${err.message})`);
  chosen = MODELS[1];
  process.stdout.write(`fallback ${chosen.model} ... `);
  const probe = await generate(apiKey, JOBS[0].prompt, chosen.model, chosen.quality);
  fs.writeFileSync(path.join(OUT, JOBS[0].file), probe);
  console.log(`ok ${probe.length} bytes`);
}

for (const job of JOBS.slice(1)) {
  process.stdout.write(`${job.file} (${chosen.model}) ... `);
  const buf = await generate(apiKey, job.prompt, chosen.model, chosen.quality);
  fs.writeFileSync(path.join(OUT, job.file), buf);
  console.log(`${buf.length} bytes`);
}
