import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.PETASSIST_URL ?? "http://127.0.0.1:3000";
const OUT_DIR = path.join(process.cwd(), "demo");
const MAX_MS = 165_000;

function cardHtml({ kicker, title, body }) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; height: 100%; }
    body {
      display: flex; align-items: center; justify-content: center;
      background: #eef3f9; color: #302c55;
      font-family: ui-sans-serif, system-ui, "Hiragino Sans", sans-serif;
    }
    .wrap { max-width: 780px; padding: 56px; }
    .kicker {
      letter-spacing: 0.18em; font-size: 13px; font-weight: 700; color: #6b5cff;
      margin: 0 0 12px;
    }
    h1 { font-size: 40px; line-height: 1.25; margin: 0 0 16px; }
    p { font-size: 20px; line-height: 1.55; margin: 0; color: #4b4768; }
  </style>
</head>
<body>
  <div class="wrap">
    <p class="kicker">${kicker}</p>
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

async function titleCard(page, copy, ms) {
  await page.setContent(cardHtml(copy));
  await page.waitForTimeout(ms);
}

async function waitForDesk() {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    try {
      const res = await fetch(`${BASE}/desk`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`desk did not become ready at ${BASE}/desk`);
}

async function main() {
  await waitForDesk();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    slowMo: 55,
    args: ["--window-position=80,40"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "ja-JP",
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  const started = Date.now();
  const remain = () => Math.max(0, MAX_MS - (Date.now() - started));

  try {
    await titleCard(
      page,
      {
        kicker: "PETASSIST",
        title: "デスクにぺたっと。<br />Allow まで、外に出さない。",
        body: "エンジニアじゃない人でも、エージェントを仲間にできる。ねこは調べるだけ。うさぎは下書きだけ。いぬだけが送る。送る前に止まる。",
      },
      7000
    );

    await titleCard(
      page,
      {
        kicker: "STACK",
        title: "顔はペット。配管は TrueForge。",
        body: "Next.js 15 · Electron · TrueForge（sandbox / subagent / MCP / ツール承認）。コード品質は Qodo の PR #1。",
      },
      6500
    );

    if (remain() < 20_000) throw new Error("time budget");

    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo({ top: 420, behavior: "smooth" }));
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(900);
    await page.getByRole("link", { name: "デスクに貼る" }).first().click();
    await page.waitForURL(/\/desk/, { timeout: 30_000 });
    await page.waitForSelector('[data-testid="job-card"]', { timeout: 30_000 });
    await page.waitForTimeout(2000);

    const cat = page.locator('[data-pet-id="cat"]').first();
    if (await cat.isVisible()) {
      await cat.click();
      await page.waitForTimeout(1200);
    }
    const dog = page.locator('[data-pet-id="dog"]').first();
    if (await dog.isVisible()) {
      await dog.click();
      await page.waitForTimeout(1200);
    }

    const job = page.getByTestId("job-run");
    const canRun = await job.isEnabled();
    if (canRun) {
      await job.click();
      const deny = page.getByRole("button", { name: "やめる" });
      try {
        await deny.waitFor({ state: "visible", timeout: Math.min(95_000, remain()) });
        await page.waitForTimeout(1800);
        await deny.click();
        await page.waitForTimeout(2500);
      } catch {
        await page.waitForTimeout(4000);
      }
    } else {
      await titleCard(
        page,
        {
          kicker: "HARNESS",
          title: "TrueForge がまだ緑ではない。",
          body: "審査デモは npx @truefoundry/trueforge のあと「この仕事を任せる」。ねこ→うさぎ→いぬ。いぬは Allow まで投稿しない。",
        },
        6500
      );
      await page.goto(`${BASE}/desk`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('[data-testid="job-card"]');
      await page.waitForTimeout(2500);
    }

    if (remain() > 8000) {
      await titleCard(
        page,
        {
          kicker: "LEARNING",
          title: "ハーネスが見えないと、怖いまま。",
          body: "配線をログに出した。Qodo の High を直してからマージした。誰かが Allow するまで、いぬは送らない。",
        },
        Math.min(7000, remain() - 500)
      );
    }
  } finally {
    const video = page.video();
    await page.close();
    const src = video ? await video.path() : null;
    await context.close();
    await browser.close();
    if (!src) throw new Error("playwright did not write a video");
    const dest = path.join(OUT_DIR, "petassist-demo.webm");
    await fs.copyFile(src, dest);
    if (path.dirname(src) === OUT_DIR && src !== dest) {
      await fs.unlink(src).catch(() => {});
    }
    console.log(dest);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
