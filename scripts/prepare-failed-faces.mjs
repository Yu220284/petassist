import fs from "node:fs";
import path from "node:path";
import { Jimp } from "jimp";

const SRC = "/tmp/animal-failed";
const ROOT = path.resolve(import.meta.dirname, "..");
const FRAMES = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];

const GROUPS = {
  cat: { named: ["cat0.png", "cat1.png"], prefix: "無題149", blob: true },
  bunny: { named: ["bunny0.png"], prefix: "無題154", blob: false },
  chick: { named: ["hiyoko0.png"], prefix: "無題172", blob: true },
  dog: { named: ["dog0.png"], prefix: "無題174", blob: false },
  raccoondog: { named: ["tanuki0.png"], prefix: "無題175", blob: false },
  penguin: { named: ["ペンギン0.png"], prefix: "無題191", blob: false },
};

function listGroup(group) {
  const files = fs.readdirSync(SRC).filter((name) => name.endsWith(".png"));
  const out = [];
  for (const name of files) {
    if (group.named.includes(name) || name.startsWith(group.prefix)) {
      out.push(path.join(SRC, name));
    }
  }
  return out.sort();
}

function largestBlob(width, height, data) {
  const at = (x, y) => y * width + x;
  const opaque = new Uint8Array(width * height);
  const seeds = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[at(x, y) * 4 + 3] < 16) continue;
      opaque[at(x, y)] = 1;
      seeds.push(x, y);
    }
  }
  const seen = new Uint8Array(width * height);
  let best = [];
  for (let i = 0; i < seeds.length; i += 2) {
    const sx = seeds[i];
    const sy = seeds[i + 1];
    const s = at(sx, sy);
    if (seen[s]) continue;
    const blob = [];
    const stack = [sx, sy];
    seen[s] = 1;
    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      blob.push(x, y);
      const neigh = [x + 1, y, x - 1, y, x, y + 1, x, y - 1];
      for (let n = 0; n < neigh.length; n += 2) {
        const nx = neigh[n];
        const ny = neigh[n + 1];
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = at(nx, ny);
        if (seen[ni] || !opaque[ni]) continue;
        seen[ni] = 1;
        stack.push(nx, ny);
      }
    }
    if (blob.length > best.length) best = blob;
  }
  return best;
}

function keepBlob(img) {
  const { data, width, height } = img.bitmap;
  const blob = largestBlob(width, height, data);
  const keep = new Uint8Array(width * height);
  for (let i = 0; i < blob.length; i += 2) {
    keep[blob[i + 1] * width + blob[i]] = 1;
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (keep[y * width + x]) continue;
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
    }
  }
}

function opaqueBox(img) {
  const { data, width, height } = img.bitmap;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 16) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return null;
  return { minX, minY, maxX, maxY };
}

function cropPadded(img, pad = 6) {
  const box = opaqueBox(img);
  if (!box) return img;
  const x = Math.max(0, box.minX - pad);
  const y = Math.max(0, box.minY - pad);
  const w = Math.min(img.bitmap.width - x, box.maxX - box.minX + 1 + pad * 2);
  const h = Math.min(img.bitmap.height - y, box.maxY - box.minY + 1 + pad * 2);
  return img.clone().crop({ x, y, w, h });
}

function meanColor(img) {
  const { data, width, height } = img.bitmap;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    if (data[o + 3] < 128) continue;
    const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
    if (lum < 48) continue;
    r += data[o];
    g += data[o + 1];
    b += data[o + 2];
    n++;
  }
  if (!n) return [128, 128, 128];
  return [r / n, g / n, b / n];
}

function dist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function matchCoats(idles, faileds) {
  const edges = [];
  for (let i = 0; i < idles.length; i++) {
    for (let j = 0; j < faileds.length; j++) {
      edges.push({ i, j, d: dist(idles[i].color, faileds[j].color) });
    }
  }
  edges.sort((a, b) => a.d - b.d);
  const usedIdle = new Set();
  const usedFailed = new Set();
  const assign = Array(idles.length).fill(-1);
  for (const e of edges) {
    if (usedIdle.has(e.i) || usedFailed.has(e.j)) continue;
    usedIdle.add(e.i);
    usedFailed.add(e.j);
    assign[e.i] = e.j;
  }
  for (let i = 0; i < idles.length; i++) {
    if (assign[i] >= 0) continue;
    let best = 0;
    let bestD = Infinity;
    for (let j = 0; j < faileds.length; j++) {
      const d = dist(idles[i].color, faileds[j].color);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    assign[i] = best;
  }
  return idles.map((idle, i) => {
    const failed = faileds[assign[i]];
    return { idle, failed, d: Math.round(Math.sqrt(dist(idle.color, failed.color))) };
  });
}

async function fitOnCanvas(src, idle) {
  const srcBox = opaqueBox(src);
  const idleBox = opaqueBox(idle);
  const tw = idle.bitmap.width;
  const th = idle.bitmap.height;
  if (!srcBox) {
    const canvas = new Jimp({ width: tw, height: th, color: 0x00000000 });
    return canvas;
  }
  const sw = srcBox.maxX - srcBox.minX + 1;
  const sh = srcBox.maxY - srcBox.minY + 1;
  const cropped = src.clone().crop({
    x: srcBox.minX,
    y: srcBox.minY,
    w: sw,
    h: sh,
  });
  let scale;
  if (idleBox) {
    const iw = idleBox.maxX - idleBox.minX + 1;
    const ih = idleBox.maxY - idleBox.minY + 1;
    scale = Math.min(iw / sw, ih / sh);
  } else {
    scale = Math.min(tw / sw, th / sh);
  }
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  const resized = cropped.resize({ w, h });
  const canvas = new Jimp({ width: tw, height: th, color: 0x00000000 });
  let x;
  let y;
  if (idleBox) {
    const iw = idleBox.maxX - idleBox.minX + 1;
    const ih = idleBox.maxY - idleBox.minY + 1;
    x = idleBox.minX + Math.round((iw - w) / 2);
    y = idleBox.minY + Math.round((ih - h) / 2);
  } else {
    x = Math.round((tw - w) / 2);
    y = Math.round((th - h) / 2);
  }
  canvas.composite(resized, Math.max(0, x), Math.max(0, y));
  return canvas;
}

async function prepareOne(file, blob) {
  const img = await Jimp.read(file);
  if (blob) keepBlob(img);
  return cropPadded(img);
}

async function run() {
  for (const [petId, group] of Object.entries(GROUPS)) {
    const sources = listGroup(group);
    const faileds = [];
    for (const file of sources) {
      const cropped = await prepareOne(file, group.blob);
      faileds.push({
        file,
        img: cropped,
        color: meanColor(cropped),
        size: `${cropped.bitmap.width}x${cropped.bitmap.height}`,
      });
    }
    const idles = [];
    for (const frame of FRAMES) {
      const file = path.join(ROOT, "public/party", petId, `${frame}.png`);
      const img = await Jimp.read(file);
      idles.push({
        frame,
        img,
        color: meanColor(img),
        w: img.bitmap.width,
        h: img.bitmap.height,
      });
    }
    const pairs = matchCoats(idles, faileds);
    const destDir = path.join(ROOT, "public/party", petId);
    console.log(`\n${petId} (${faileds.length} failed → ${idles.length} coats)`);
    for (const pair of pairs) {
      const out = await fitOnCanvas(pair.failed.img, pair.idle.img);
      const dest = path.join(destDir, `failed-${pair.idle.frame}.png`);
      await out.write(dest);
      const rgb = pair.failed.color.map((n) => Math.round(n));
      console.log(
        `  ${pair.idle.frame} ← ${path.basename(pair.failed.file)}  Δ${pair.d}  ${rgb.join(",")}  ${pair.failed.size} → ${pair.idle.w}x${pair.idle.h}`
      );
    }
  }
}

await run();
