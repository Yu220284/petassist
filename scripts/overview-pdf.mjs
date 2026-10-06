import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import PDFDocument from "pdfkit";

const ROOT = path.resolve(import.meta.dirname, "..");
const HTML = path.join(ROOT, "docs/overview/index.html");
const OUT = path.join(ROOT, "docs/petassist-overview.pdf");
const PAGES = 5;

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].find((bin) => fs.existsSync(bin));

if (!CHROME) {
  console.error("Chrome / Edge が見つかりません");
  process.exit(1);
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${bin} exited ${code}`));
    });
  });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "overview-pdf-"));
const jpegs = [];

for (let i = 1; i <= PAGES; i += 1) {
  const png = path.join(tmp, `slide-${i}.png`);
  const jpg = path.join(tmp, `slide-${i}.jpg`);
  await run(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--hide-scrollbars",
    "--window-size=1920,1080",
    `--screenshot=${png}`,
    `${pathToFileURL(HTML).href}?p=${i}`,
  ]);
  await run("sips", [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "82",
    png,
    "--out",
    jpg,
  ]);
  jpegs.push(jpg);
}

const width = 13.333 * 72;
const height = 7.5 * 72;
await new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: [width, height], margin: 0 });
  const stream = fs.createWriteStream(OUT);
  stream.on("finish", resolve);
  stream.on("error", reject);
  doc.pipe(stream);
  jpegs.forEach((file, i) => {
    if (i > 0) doc.addPage({ size: [width, height], margin: 0 });
    doc.image(file, 0, 0, { width, height });
  });
  doc.end();
});

fs.rmSync(tmp, { recursive: true, force: true });
const st = fs.statSync(OUT);
console.log(`wrote ${OUT} (${st.size} bytes)`);
if (st.size > 10 * 1024 * 1024) {
  console.error("still over 10MB");
  process.exit(1);
}
