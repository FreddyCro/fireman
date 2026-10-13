// 產生示範用的剪紙風格 sprite strip（SVG）。只是程式畫的幾何造型，用來驗證手感，
// 正式素材由設計師交付（PNG / WebP / SVG 皆可，格式規範見 architecture 設計文件）。
//
//   node poc/sprite-generator/generate.mjs   → 寫入 public/demo/paper/*.svg
//
// SVG 的 width/height 寫成 2×（viewBox 不變），載入時會以此一次點陣化成清晰的 2× 位圖。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/demo/paper');
const PIXEL_RATIO = 2;

export const SPRITES = {
  walker: { frames: 4, cellW: 240, cellH: 320 },
  door: { frames: 5, cellW: 320, cellH: 420 },
  flame: { frames: 4, cellW: 200, cellH: 260 },
};

/** 門開口（設計像素）與其在格子中的比例，door-fire.ts 的 DOOR_OPENING 要與之一致 */
const DOOR_OPENING = [40, 20, 240, 380];
export const DOOR_OPENING_FRACTIONS = [
  DOOR_OPENING[0] / SPRITES.door.cellW,
  DOOR_OPENING[1] / SPRITES.door.cellH,
  DOOR_OPENING[2] / SPRITES.door.cellW,
  DOOR_OPENING[3] / SPRITES.door.cellH,
];

// 可重現的亂數（同一個 seed 畫出同樣的抖動）
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const fmt = (n) => Math.round(n * 10) / 10;

/** 剪紙邊緣：每邊切成小段並微微抖動，像手剪的 */
function paperPoly(points, rnd, amp = 1.5, segs = 3) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      out.push(
        `${fmt(x1 + (x2 - x1) * t + (rnd() * 2 - 1) * amp)},${fmt(y1 + (y2 - y1) * t + (rnd() * 2 - 1) * amp)}`,
      );
    }
  }
  return out.join(' ');
}

/** 粗線段（四邊形），畫手腳用 */
function limb([x1, y1], [x2, y2], w) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = ((-dy / len) * w) / 2;
  const ny = ((dx / len) * w) / 2;
  return [
    [x1 + nx, y1 + ny],
    [x2 + nx, y2 + ny],
    [x2 - nx, y2 - ny],
    [x1 - nx, y1 - ny],
  ];
}

function circle(cx, cy, r, n = 16) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
}

/** 一組多邊形：陰影（畫進素材）＋本體，兩者共用同一組抖動點 */
function paperLayer(polys, fill, rnd, { shadow = true, amp = 1.5 } = {}) {
  const pts = polys.map((p) => `<polygon points="${paperPoly(p, rnd, amp)}"/>`).join('');
  const sh = shadow ? `<g fill="rgba(0,0,0,0.22)" transform="translate(4 5)">${pts}</g>` : '';
  return `${sh}<g fill="${fill}">${pts}</g>`;
}

function strip(name, cells) {
  const { cellW, cellH } = SPRITES[name];
  const n = cells.length;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW * n * PIXEL_RATIO}" height="${cellH * PIXEL_RATIO}" viewBox="0 0 ${cellW * n} ${cellH}">` +
    cells.map((c, i) => `<g class="cell" transform="translate(${i * cellW} 0)">${c}</g>`).join('') +
    '</svg>';
  writeFileSync(resolve(OUT, `${name}.svg`), svg);
  console.log(`${name}.svg  ${n} frames  ${cellW}x${cellH}`);
}

// ── 走路的人（240×320，錨點底部中央）：接觸、下沉、經過、抬起 ──
// legs: [[膝, 腳]] 前腳在先；arms: [[肩, 手]]；bob: 身體上下
const WALK_POSES = [
  { legs: [[[150, 238], [168, 300]], [[92, 238], [72, 300]]], arms: [[[96, 112], [70, 150]], [[146, 112], [172, 155]]], bob: 0 },
  { legs: [[[140, 240], [150, 304]], [[100, 240], [90, 304]]], arms: [[[100, 112], [84, 184]], [[142, 112], [160, 184]]], bob: 6 },
  { legs: [[[122, 245], [124, 306]], [[118, 245], [116, 302]]], arms: [[[102, 112], [96, 190]], [[140, 112], [146, 190]]], bob: 2 },
  { legs: [[[100, 236], [84, 298]], [[146, 232], [164, 290]]], arms: [[[98, 112], [74, 170]], [[144, 112], [168, 150]]], bob: -2 },
];
const HIPS = [
  [132, 190],
  [108, 190],
];

function walkerCell(pose, rnd) {
  const b = pose.bob;
  const polys = [];
  pose.arms.forEach(([s, h]) => polys.push(limb(s, h, 16)));
  pose.legs.forEach(([knee, foot], i) => {
    polys.push(limb(HIPS[i], knee, 22), limb(knee, foot, 20));
    polys.push([
      [foot[0] - 14, foot[1] - 4],
      [foot[0] + 16, foot[1] - 4],
      [foot[0] + 16, foot[1] + 6],
      [foot[0] - 14, foot[1] + 6],
    ]);
  });
  polys.push([
    [98, 96 + b],
    [142, 96 + b],
    [150, 194 + b],
    [90, 194 + b],
  ]); // 身體
  polys.push(circle(120, 62 + b, 26)); // 頭
  return paperLayer(polys, '#2b2d42', rnd);
}

// ── 門（320×420）：f = 開門比例 0～1 ──
function doorCell(f, rndPanel) {
  const [ox, oy, ow, oh] = DOOR_OPENING;
  const rndFrame = mulberry32(50); // 門框每格用同一個 seed，開門時門框不會跟著晃
  const inside = `<rect x="${ox}" y="${oy}" width="${ow}" height="${oh}" fill="#15110f"/>`;
  const w = ow * (1 - 0.88 * f); // 門板寬度（假透視）
  const top = oy + 44 * f;
  const bot = oy + oh - 28 * f;
  const panel = paperLayer(
    [
      [
        [ox, oy],
        [ox + w, top],
        [ox + w, bot],
        [ox, oy + oh],
      ],
    ],
    '#c47a3a',
    rndPanel,
  );
  const knob = f < 0.95 ? `<circle cx="${fmt(ox + w - 22)}" cy="${fmt(oy + oh / 2)}" r="6" fill="#3b2a1a"/>` : '';
  const frame = paperLayer(
    [
      [[20, 0], [300, 0], [300, 20], [20, 20]], // 門楣
      [[20, 0], [40, 0], [40, 420], [20, 420]], // 左柱
      [[280, 0], [300, 0], [300, 420], [280, 420]], // 右柱
    ],
    '#8d5524',
    rndFrame,
  );
  return inside + panel + knob + frame;
}

// ── 火焰（200×260）：外焰＋內焰，頂點依格抖動 ──
function flameCell(i) {
  const rnd = mulberry32(100 + i);
  const j = (amp) => (rnd() * 2 - 1) * amp;
  const outer = [
    [70, 250],
    [40 + j(6), 190 + j(8)],
    [58 + j(6), 120 + j(10)],
    [48 + j(8), 70 + j(10)],
    [100 + j(10), 14 + j(10)],
    [150 + j(8), 72 + j(10)],
    [142 + j(6), 124 + j(10)],
    [160 + j(6), 190 + j(8)],
    [130, 250],
  ];
  const inner = [
    [82, 250],
    [70 + j(4), 200 + j(6)],
    [80 + j(4), 150 + j(8)],
    [100 + j(6), 100 + j(10)],
    [120 + j(4), 150 + j(8)],
    [130 + j(4), 200 + j(6)],
    [118, 250],
  ];
  return (
    paperLayer([outer], '#ff6a1a', rnd, { shadow: false }) +
    paperLayer([inner], '#ffd166', rnd, { shadow: false, amp: 1 })
  );
}

function main() {
  mkdirSync(OUT, { recursive: true });
  strip('walker', WALK_POSES.map((p, i) => walkerCell(p, mulberry32(1 + i))));
  strip('door', [0, 0.25, 0.5, 0.75, 1].map((f, i) => doorCell(f, mulberry32(60 + i))));
  strip('flame', [0, 1, 2, 3].map((i) => flameCell(i)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
