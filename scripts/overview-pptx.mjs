import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "docs", "petassist-overview.pptx");

const INK = "302c55";
const MUTED = "5a6478";
const PINK = "e56b8c";
const PAPER = "eef3f9";
const CARD = "FFFFFF";
const FONT = "Hiragino Sans";
const ICONS = {
  cat: path.join(ROOT, "public/party/cat/02.webp"),
  bunny: path.join(ROOT, "public/party/bunny/02.webp"),
  dog: path.join(ROOT, "public/party/dog/09.webp"),
  penguin: path.join(ROOT, "public/party/penguin/04.webp"),
  chick: path.join(ROOT, "public/party/chick/02.webp"),
  raccoondog: path.join(ROOT, "public/party/raccoondog/06.webp"),
};

function pngSize(file) {
  const buf = fs.readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function logoFit(slide, file, x, y, maxW, maxH) {
  const { w, h } = pngSize(file);
  const ratio = w / h;
  let dw = maxW;
  let dh = maxW / ratio;
  if (dh > maxH) {
    dh = maxH;
    dw = maxH * ratio;
  }
  slide.addImage({
    path: file,
    x: x + (maxW - dw) / 2,
    y: y + (maxH - dh) / 2,
    w: dw,
    h: dh,
  });
}

const L = (name) => path.join(ROOT, "docs/logos", name);

function pet(slide, file, x, y, box) {
  const { w, h } = pngSize(file);
  const ratio = w / h;
  let dw = box;
  let dh = box;
  if (ratio > 1) dh = box / ratio;
  else dw = box * ratio;
  slide.addImage({
    path: file,
    x: x + (box - dw) / 2,
    y: y + (box - dh) / 2,
    w: dw,
    h: dh,
  });
}

function eyebrow(slide, text, y = 0.38) {
  slide.addText(text, {
    x: 0.55,
    y,
    w: 12.2,
    h: 0.32,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: PINK,
    margin: 0,
  });
}

function heading(slide, text, y = 0.68) {
  slide.addText(text, {
    x: 0.55,
    y,
    w: 12.2,
    h: 0.72,
    fontFace: FONT,
    fontSize: 28,
    bold: true,
    color: INK,
    margin: 0,
  });
}

function footer(slide, n) {
  slide.addText("Petassist", {
    x: 0.55,
    y: 7.12,
    w: 8,
    h: 0.22,
    fontFace: FONT,
    fontSize: 10,
    color: MUTED,
    margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 11.4,
    y: 7.12,
    w: 1.35,
    h: 0.22,
    fontFace: FONT,
    fontSize: 10,
    color: MUTED,
    align: "right",
    margin: 0,
  });
}

function paper(pres, fill = PAPER) {
  const slide = pres.addSlide();
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: fill },
  });
  return slide;
}

function card(slide, x, y, w, h) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: CARD },
    shadow: { type: "outer", color: "302c55", opacity: 0.08, blur: 8, offset: 1 },
    rectRadius: 0.12,
  });
}

async function main() {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pres.layout = "WIDE";
  pres.title = "Petassist 概要";
  pres.author = "Petassist";
  pres.subject = "デスクにぺたっとPetassist";

  // 1. 表紙
  {
    const s = paper(pres);
    pet(s, ICONS.cat, 8.55, 4.85, 1.45);
    pet(s, ICONS.bunny, 10.05, 4.55, 1.65);
    pet(s, ICONS.dog, 11.55, 4.35, 1.55);
    s.addText("「貼れる」AIエージェント", {
      x: 0.7,
      y: 2.05,
      w: 10.5,
      h: 0.4,
      fontFace: FONT,
      fontSize: 16,
      bold: true,
      color: PINK,
      margin: 0,
    });
    s.addText("デスクにぺたっと Petassist", {
      x: 0.7,
      y: 2.5,
      w: 11.4,
      h: 1.15,
      fontFace: FONT,
      fontSize: 38,
      bold: true,
      color: INK,
      margin: 0,
    });
    s.addText("大人も子どもも。安心して使えるAIエージェント", {
      x: 0.7,
      y: 3.75,
      w: 9.2,
      h: 0.5,
      fontFace: FONT,
      fontSize: 18,
      color: MUTED,
      margin: 0,
    });
    footer(s, 1);
  }

  // 2. Problem
  {
    const s = paper(pres);
    eyebrow(s, "Problem");
    heading(s, "AIエージェントを使ってみたい。学ばせてみたい。でも…");
    const items = [
      [ICONS.cat, "大事な情報が消されないか心配", "権限をすべて渡すか、まったく渡さないか。両極端になりがち…"],
      [ICONS.bunny, "意図が伝わらず、時間を取られる", "頼んでいない場所まで触ってしまい、やり直しに時間がかかる…"],
      [ICONS.dog, "触ってほしくないファイルがある", "社外秘や大切な個人情報にはアクセスしてほしくない…"],
    ];
    items.forEach((item, i) => {
      const x = 0.55 + i * 4.15;
      card(s, x, 1.7, 3.98, 4.85);
      pet(s, item[0], x + 1.34, 1.9, 1.3);
      s.addText(item[1], {
        x: x + 0.28,
        y: 3.4,
        w: 3.42,
        h: 1.35,
        fontFace: FONT,
        fontSize: 16,
        bold: true,
        color: INK,
        margin: 0,
      });
      s.addText(item[2], {
        x: x + 0.28,
        y: 4.85,
        w: 3.42,
        h: 1.4,
        fontFace: FONT,
        fontSize: 13,
        color: MUTED,
        margin: 0,
      });
    });
    footer(s, 2);
  }

  // 3. Solution
  {
    const s = paper(pres);
    eyebrow(s, "Solution");
    heading(s, "かわいいだけじゃない、使えるデスクペット。");
    s.addText("権限は、必要な分だけ渡す。ぺたしすとは、PCの安全を守るアシスタントです。", {
      x: 0.55,
      y: 1.5,
      w: 8.6,
      h: 0.7,
      fontFace: FONT,
      fontSize: 16,
      color: INK,
      margin: 0,
    });
    pet(s, ICONS.cat, 9.7, 1.35, 1.35);
    pet(s, ICONS.bunny, 11.15, 1.2, 1.5);
    const items = [
      ["範囲を決める", "使うツールや開けるアプリ・フォルダなど、権限を渡す範囲を絞れます。"],
      ["確認する", "メールや投稿は、ユーザーの承認を待って停止します。"],
      ["スマホ・PCに対応", "シームレスにスマホにも移動して、作業を継続。"],
    ];
    items.forEach((item, i) => {
      const y = 2.4 + i * 1.45;
      card(s, 0.55, y, 12.2, 1.32);
      s.addText(item[0], {
        x: 0.85,
        y: y + 0.16,
        w: 11.6,
        h: 0.4,
        fontFace: FONT,
        fontSize: 16,
        bold: true,
        color: INK,
        margin: 0,
      });
      s.addText(item[1], {
        x: 0.85,
        y: y + 0.62,
        w: 11.6,
        h: 0.5,
        fontFace: FONT,
        fontSize: 14,
        color: MUTED,
        margin: 0,
      });
    });
    footer(s, 3);
  }

  // 4. Examples
  {
    const s = paper(pres);
    eyebrow(s, "How to use");
    heading(s, "こんな使い方ができます");
    s.addText("アシスタントごとに、権限も、使うモデルも変えられます。", {
      x: 0.55,
      y: 1.48,
      w: 12.2,
      h: 0.4,
      fontFace: FONT,
      fontSize: 14,
      color: MUTED,
      margin: 0,
    });
    const items = [
      [ICONS.cat, "ねこ", "調べるだけ", "検索や調べ物担当。フォルダやPCの中は見ても、中身は変えない。"],
      [ICONS.bunny, "うさぎ", "下書きだけ", "返信や告知の文を作って、送る直前まで待つ。"],
      [ICONS.dog, "いぬ", "ツールをつくる", "渡したフォルダの中で、アプリやサイトをつくる。頼んでいない場所には入らない。"],
    ];
    items.forEach((item, i) => {
      const x = 0.55 + i * 4.15;
      card(s, x, 2.05, 3.98, 4.5);
      pet(s, item[0], x + 1.09, 2.22, 1.8);
      s.addText(`0${i + 1} / ${item[1]}`, {
        x: x + 0.28,
        y: 4.15,
        w: 3.42,
        h: 0.28,
        fontFace: FONT,
        fontSize: 11,
        bold: true,
        color: PINK,
        margin: 0,
      });
      s.addText(item[2], {
        x: x + 0.28,
        y: 4.45,
        w: 3.42,
        h: 0.4,
        fontFace: FONT,
        fontSize: 18,
        bold: true,
        color: INK,
        margin: 0,
      });
      s.addText(item[3], {
        x: x + 0.28,
        y: 4.95,
        w: 3.42,
        h: 1.3,
        fontFace: FONT,
        fontSize: 13,
        color: MUTED,
        margin: 0,
      });
    });
    footer(s, 4);
  }

  // 5. しくみ — 構成図1枚
  {
    const s = paper(pres);
    eyebrow(s, "構造", 0.28);
    s.addText("デスクの裏側", {
      x: 0.55,
      y: 0.52,
      w: 12.2,
      h: 0.42,
      fontFace: FONT,
      fontSize: 24,
      bold: true,
      color: INK,
      margin: 0,
    });
    s.addText("貼る窓、デスク、範囲つきの土台、モデル。層に分かれている。", {
      x: 0.55,
      y: 0.96,
      w: 12.2,
      h: 0.28,
      fontFace: FONT,
      fontSize: 13,
      color: MUTED,
      margin: 0,
    });

    const row = (y, h, title, body, logos) => {
      card(s, 0.45, y, 12.4, h);
      s.addText(title, {
        x: 0.65,
        y: y + 0.12,
        w: 2.1,
        h: 0.32,
        fontFace: FONT,
        fontSize: 11,
        bold: true,
        color: PINK,
        margin: 0,
      });
      s.addText(body, {
        x: 2.7,
        y: y + 0.1,
        w: 9.9,
        h: 0.34,
        fontFace: FONT,
        fontSize: 13,
        color: INK,
        margin: 0,
      });
      logos.forEach((item, i) => {
        const x = 0.7 + i * 1.35;
        logoFit(s, item.file, x, y + 0.48, item.w ?? 0.62, item.h ?? 0.62);
        s.addText(item.label, {
          x: x - 0.2,
          y: y + 1.14,
          w: 1.05,
          h: 0.28,
          fontFace: FONT,
          fontSize: 9,
          color: MUTED,
          align: "center",
          margin: 0,
        });
      });
    };

    row(1.32, 1.55, "画面", "Electron · macOS　ポケットと、モニターに貼る窓", [
      { file: L("electron.png"), label: "Electron" },
      { file: L("apple.png"), label: "macOS" },
    ]);

    s.addText("↓", {
      x: 6.3,
      y: 2.82,
      w: 0.7,
      h: 0.28,
      fontFace: FONT,
      fontSize: 14,
      color: PINK,
      align: "center",
      margin: 0,
    });

    row(3.08, 1.55, "デスク", "仕事を置く場所。このパソコンの中で動く", [
      { file: L("nextdotjs.png"), label: "Next.js" },
      { file: L("react.png"), label: "React" },
      { file: L("typescript.png"), label: "TypeScript" },
      { file: L("nodedotjs.png"), label: "Node.js" },
      { file: L("tailwindcss.png"), label: "Tailwind" },
      { file: L("radixui.png"), label: "Radix UI" },
      { file: L("framer.png"), label: "Framer" },
    ]);

    s.addText("↓", {
      x: 6.3,
      y: 4.58,
      w: 0.7,
      h: 0.28,
      fontFace: FONT,
      fontSize: 14,
      color: PINK,
      align: "center",
      margin: 0,
    });

    card(s, 0.45, 4.84, 6.1, 2.05);
    s.addText("TrueForge", {
      x: 0.65,
      y: 4.96,
      w: 5.7,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: PINK,
      margin: 0,
    });
    s.addText("渡した範囲の中で仕事を回す。外に出す前に止まる。", {
      x: 0.65,
      y: 5.24,
      w: 5.7,
      h: 0.32,
      fontFace: FONT,
      fontSize: 12,
      color: INK,
      margin: 0,
    });
    const tf = [
      { file: L("trueforge.png"), label: "TrueForge", w: 0.7, h: 0.7 },
      { file: L("mcp.png"), label: "MCP", w: 0.7, h: 0.7 },
      { file: L("daytona.png"), label: "Daytona", w: 1.55, h: 0.42 },
      { file: L("slack.png"), label: "Slack", w: 0.7, h: 0.7 },
    ];
    let tx = 0.7;
    tf.forEach((item) => {
      const boxW = item.w;
      logoFit(s, item.file, tx, 5.62, boxW, item.h);
      s.addText(item.label, {
        x: tx - 0.1,
        y: 6.38,
        w: boxW + 0.2,
        h: 0.28,
        fontFace: FONT,
        fontSize: 9,
        color: MUTED,
        align: "center",
        margin: 0,
      });
      tx += boxW + 0.22;
    });

    card(s, 6.75, 4.84, 6.1, 2.05);
    s.addText("モデル", {
      x: 6.95,
      y: 4.96,
      w: 5.7,
      h: 0.28,
      fontFace: FONT,
      fontSize: 11,
      bold: true,
      color: PINK,
      margin: 0,
    });
    s.addText("アシスタントごとに、使うAIを変える。", {
      x: 6.95,
      y: 5.24,
      w: 5.7,
      h: 0.32,
      fontFace: FONT,
      fontSize: 12,
      color: INK,
      margin: 0,
    });
    const models = [
      { file: L("openai.png"), label: "OpenAI" },
      { file: L("googlegemini.png"), label: "Gemini" },
    ];
    models.forEach((item, i) => {
      const x = 7.2 + i * 1.7;
      logoFit(s, item.file, x, 5.62, 0.78, 0.78);
      s.addText(item.label, {
        x: x - 0.15,
        y: 6.46,
        w: 1.1,
        h: 0.28,
        fontFace: FONT,
        fontSize: 9,
        color: MUTED,
        align: "center",
        margin: 0,
      });
    });

    footer(s, 5);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await pres.writeFile({ fileName: OUT });
  const st = fs.statSync(OUT);
  console.log(`wrote ${OUT} (${st.size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
