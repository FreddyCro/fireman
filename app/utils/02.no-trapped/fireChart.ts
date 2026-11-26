// 02 重大火災 vs 殉職人數：pc 版捲動動畫（components/02.no-trapped/NoTrappedFireChart.vue）。中英文共用。
// 設計稿：CH「Frame 1321314697」（2726:218165）五個 1280×720 畫面＋註記；座標全部是該 frame 的設計 px。
//   1 前 10 年：火災點 7 塊（每塊 5000 點、50×100 排）＋殉職 17 顆（20px、間距 30、一排 5 顆）
//   2 近 10 年：火災點剩 3 塊、殉職往上長到 27 顆，整組重新置中
//   3 火災只剩左上一顆、殉職只剩左下一顆 → 4 齊左、疊到折線起點與第一根長條底部 → 5 長條與折線向右長出
// 平板、手機沿用 ui/PinChart（設計師：只改 pc）。

// ── 逐年資料：從設計稿 5 的向量反推（長條 7 人 = 295.137px、折線 7000 件 = 295.137px）──
// ⚠️ 待編輯確認：2015–2025 火災加總 14234 與設計稿一致；2004–2014 加總 33381，與設計稿的 35085 不符。
export const YEARS = Array.from({ length: 23 }, (_, i) => 2004 + i); // 2004–2026，長條 23 根
/** 重大火災件數（折線，2004–2025） */
export const FIRES = [
  6611, 5139, 4332, 3392, 2886, 2621, 2186, 1772, 1574, 1451, 1417, 1704, 1856, 1572, 1434, 1405, 1138, 1056, 976, 1059,
  1027, 1007,
];
/** 殉職人數（長條，2004–2026） */
export const DEATHS = [3, 2, 0, 0, 0, 1, 0, 0, 1, 3, 7, 6, 0, 1, 7, 2, 1, 1, 0, 6, 2, 0, 1];

/** 設計稿 1、2 的總數（數字照設計稿） */
export const PERIODS = [
  { fires: 35085, deaths: 17 },
  { fires: 14234, deaths: 27 },
] as const;

// ── 版面（設計 px，1280×720 frame）──
export const FRAME = { w: 1280, h: 720 };
export const COLOR = { fire: '#FFEDD9', death: '#FF6600', line: '#FFFFFF' };

/** 圓點區：上緣 186.5、下緣 570.5（高 384） */
const AREA_TOP = 186.5;
const AREA_BOTTOM = 570.5;

/** 火災點：一塊 5000 點（50 欄 × 100 列），塊與塊間距 1px */
const BLOCK = { w: 99.623, h: 191.681, pitchX: 100.637, pitchY: 192.319, cols: 50, rows: 100, size: 5000 };
const CELL_W = BLOCK.w / BLOCK.cols;
const CELL_H = BLOCK.h / BLOCK.rows;
export const FIRE_DOT = 1.15;

/** 殉職點：20px、間距 30、一排 5 顆；組寬 190，點從 25 開始（排列寬 140） */
export const DEATH_DOT = 20;
const DEATH_PITCH = 30;
const DEATH_PER_ROW = 5;
const DEATH_INSET = 25;

/** 兩幕的版面：火災組左緣、殉職組左緣（組寬 190）、標籤中心 */
export const COMPARE = [
  { fireX: 304.231, deathX: 785.768, fireLabelX: 505.0, deathLabelX: 880.77 },
  { fireX: 392.87, deathX: 697.13, fireLabelX: 493.0, deathLabelX: 792.03 },
] as const;
/** 標題、年份、標籤的 top */
export const TEXT_TOP = { title: 59.5, period: 129.5, labels: 590.5 };

/** 設計稿 5 的圖表：frame 內 (330, 92)、寬 620；以下座標相對圖表左上 */
export const CHART = {
  x: 330,
  y: 92,
  w: 620,
  base: 412.33, // 0 的 y
  plotTop: 117.19, // 7000／7 的 y
  barX0: 61,
  barPitch: 22.8954,
  barW: 16.306,
  lineX0: 68.27,
  linePitch: 22.937,
  maxFires: 7000,
  maxDeaths: 7,
  legendTop: 54.75,
  yearTop: 433.4, // 年份文字中心
  yearX0: 58.1,
  yearPitch: 23,
  noteTop: 470,
};
const PLOT_H = CHART.base - CHART.plotTop;
export const fireY = (v: number) => CHART.base - (v / CHART.maxFires) * PLOT_H;
export const deathH = (v: number) => (v / CHART.maxDeaths) * PLOT_H;
export const lineX = (i: number) => CHART.lineX0 + i * CHART.linePitch;
export const barX = (i: number) => CHART.barX0 + i * CHART.barPitch;

// ── 時間軸：跑道進度 0～1 切成幾段，權重 ≈ 捲動距離 ──
const PHASES = [
  ['hold1', 0.6], // 設計稿 1 停留
  ['shrink', 2.2], // 1 → 2：火災點減少、殉職點增加、整組重新置中
  ['hold2', 0.6], // 設計稿 2 停留
  ['collapse', 1.2], // → 3：只剩兩顆點，文字淡出
  ['align', 1.2], // → 4：齊左、疊到圖表起點，圖表框淡入
  ['grow', 2.4], // → 5：長條與折線向右長出
  ['hold3', 0.5], // 設計稿 5 停留
] as const;
export type PhaseName = (typeof PHASES)[number][0];
const TOTAL = PHASES.reduce((s, [, w]) => s + w, 0);
/** 跑道高度（vh）：一個視窗高＋每單位權重 70vh */
export const TRACK_VH = Math.round(100 + TOTAL * 70);

/** 每段的起訖（0～1） */
const RANGES = (() => {
  let acc = 0;
  return Object.fromEntries(
    PHASES.map(([name, w]) => {
      const r = [acc / TOTAL, (acc + w) / TOTAL] as const;
      acc += w;
      return [name, r];
    }),
  ) as Record<PhaseName, readonly [number, number]>;
})();

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 某段的區段進度 0～1 */
export const phase = (p: number, name: PhaseName) => {
  const [a, b] = RANGES[name];
  return clamp01((p - a) / (b - a));
};

/** 減少動態：只停在設計稿 1、2、5 三個畫面 */
export function snapReduced(p: number) {
  if (p < RANGES.shrink[0] + (RANGES.shrink[1] - RANGES.shrink[0]) / 2) return 0;
  if (p < RANGES.collapse[0]) return RANGES.hold2[0];
  return 1;
}

// ── 火災點 ──
export interface FireDots {
  /** 設計稿 1 的位置（點的左上角） */
  x: Float32Array;
  y: Float32Array;
  /** 1 → 2 的消失順序；-1 表示留到設計稿 2 */
  shrinkRank: Int32Array;
  /** → 3 的消失順序（留下來的點才有）；-1 表示不消失（左上那一顆） */
  collapseRank: Int32Array;
  /** 留到最後那一顆 */
  keep: number;
  removed: number;
  survivors: number;
}

/** 固定種子的亂數，畫面每次一樣 */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

/**
 * 設計稿 1 的塊（L 形）：下排 4 塊、上排 3 塊，第 8 塊放上排第 4 欄裝零頭（85 點）。
 * 塊內從底列往上、每列由左而右填；設計稿 2 留下：下排第 1、2 欄、上排第 1 欄（只留 4234 點）。
 * 1 → 2 的消失順序：從右欄往左；同一欄先上塊後下塊；塊內由上而下、每列由右而左。
 */
export function buildFireDots(): FireDots {
  const [before, after] = PERIODS;
  const blocks: { col: number; row: number; count: number; keep: number }[] = [];
  let left = before.fires;
  // 填入順序：下排 col 0..3、上排 col 0..3
  for (const row of [1, 0]) {
    for (let col = 0; col < 4; col++) {
      const count = Math.min(left, BLOCK.size);
      if (count <= 0) continue;
      left -= count;
      blocks.push({ col, row, count, keep: 0 });
    }
  }
  // 留下的點：下排 col 0、1 整塊，其餘從上排 col 0 補
  let keepLeft = after.fires;
  for (const b of [...blocks].sort((a, c) => c.row - a.row || a.col - c.col)) {
    if (b.row === 1 && b.col < 2) {
      b.keep = Math.min(b.count, keepLeft);
      keepLeft -= b.keep;
    }
  }
  const topLeft = blocks.find((b) => b.row === 0 && b.col === 0)!;
  topLeft.keep = Math.min(topLeft.count, keepLeft);

  const n = before.fires;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const shrinkRank = new Int32Array(n).fill(-1);
  const collapseRank = new Int32Array(n).fill(-1);
  const index = new Map<string, number>();

  let i = 0;
  for (const b of blocks) {
    const bx = b.col * BLOCK.pitchX;
    const by = AREA_TOP + b.row * BLOCK.pitchY;
    for (let k = 0; k < b.count; k++) {
      const r = Math.floor(k / BLOCK.cols);
      const c = k % BLOCK.cols;
      x[i] = bx + c * CELL_W;
      y[i] = by + BLOCK.h - (r + 1) * CELL_H;
      index.set(`${b.col},${b.row},${k}`, i);
      i++;
    }
  }

  // 1 → 2 的消失順序
  let rank = 0;
  for (let col = 3; col >= 0; col--) {
    for (const row of [0, 1]) {
      const b = blocks.find((v) => v.col === col && v.row === row);
      if (!b) continue;
      for (let k = b.count - 1; k >= b.keep; k--) shrinkRank[index.get(`${col},${row},${k}`)!] = rank++;
    }
  }

  // 留下的點裡，左上那一顆：上排 col 0 最上面一列的第一顆
  const keepK = Math.floor((topLeft.keep - 1) / BLOCK.cols) * BLOCK.cols;
  const keep = index.get(`0,0,${keepK}`)!;

  // → 3：其他留下的點隨機消失
  const rand = rng(20261126);
  const pool: number[] = [];
  for (let j = 0; j < n; j++) if (shrinkRank[j]! < 0 && j !== keep) pool.push(j);
  for (let j = pool.length - 1; j > 0; j--) {
    const s = Math.floor(rand() * (j + 1));
    [pool[j], pool[s]] = [pool[s]!, pool[j]!];
  }
  pool.forEach((j, r) => (collapseRank[j] = r));

  return { x, y, shrinkRank, collapseRank, keep, removed: rank, survivors: pool.length + 1 };
}

/** 殉職點第 i 顆（0 起算，由下而上、每列由左而右）的左上角 */
export function deathDot(i: number, groupX: number) {
  const row = Math.floor(i / DEATH_PER_ROW);
  const col = i % DEATH_PER_ROW;
  return {
    x: groupX + DEATH_INSET + col * DEATH_PITCH,
    y: AREA_BOTTOM - DEATH_DOT - row * DEATH_PITCH,
  };
}

// ── 每個捲動位置的畫面狀態 ──
export interface FireChartState {
  /** 1 → 2 的進度（點的增減、置中、數字） */
  shrink: number;
  collapse: number;
  align: number;
  /** 長出來的位置：0 → YEARS.length */
  grow: number;
  /** 設計稿 1、2 的文字 */
  compareOpacity: number;
  /** 設計稿 5 的圖表框 */
  chartOpacity: number;
}

export function stateAt(p: number): FireChartState {
  const collapse = phase(p, 'collapse');
  const align = phase(p, 'align');
  const grow = phase(p, 'grow');
  return {
    shrink: phase(p, 'shrink'),
    collapse,
    align,
    grow: grow * YEARS.length,
    compareOpacity: 1 - clamp01(collapse / 0.4),
    // 設計稿 4 的框是半透明，長出來時才變實；等點齊左（align 前半）之後才淡入，橘點橫移時不壓到註解
    chartOpacity: clamp01((align - 0.5) / 0.5) * 0.35 + clamp01(grow / 0.3) * 0.65,
  };
}

/** 1 → 2 數字跟著點數跳：火災 = 還在的點數；殉職 = 已長出的點數 */
export function countsAt(dots: FireDots, shrink: number) {
  const [before, after] = PERIODS;
  return {
    fires: before.fires - Math.round(dots.removed * shrink),
    deaths: Math.round(lerp(before.deaths, after.deaths, clamp01((shrink - 0.2) / 0.8))),
  };
}

// ── 畫（Canvas，設計 px）──
/** px：一個裝置像素等於幾個設計 px。火災點對齊整數像素，避免反鋸齒糊成一片、顏色變暗 */
export function drawFireChart(ctx: CanvasRenderingContext2D, dots: FireDots, s: FireChartState, px = 1) {
  const snap = (v: number) => Math.round(v / px) * px;
  const dotSize = Math.max(1, Math.round(FIRE_DOT / px)) * px;
  const groupDx = lerp(COMPARE[0].fireX, COMPARE[1].fireX, smooth(s.shrink));
  const removed = Math.round(dots.removed * s.shrink);
  const collapsed = Math.round((dots.survivors - 1) * s.collapse);
  const beforeAlign = s.align === 0 && s.grow === 0;

  // 火災點（最後那一顆另外畫）
  if (s.collapse < 1) {
    ctx.fillStyle = COLOR.fire;
    ctx.beginPath();
    for (let i = 0; i < dots.x.length; i++) {
      if (i === dots.keep) continue;
      const sr = dots.shrinkRank[i]!;
      if (sr >= 0 ? sr < removed : dots.collapseRank[i]! < collapsed) continue;
      ctx.rect(snap(dots.x[i]! + groupDx), snap(dots.y[i]!), dotSize, dotSize);
    }
    ctx.fill();
  }

  // 兩顆主角點的位置：→3 原地、→4 先齊左再上下對位
  const keepX = dots.x[dots.keep]! + groupDx + FIRE_DOT / 2;
  const keepY = dots.y[dots.keep]! + FIRE_DOT / 2;
  const death0 = deathDot(0, lerp(COMPARE[0].deathX, COMPARE[1].deathX, smooth(s.shrink)));
  const d0x = death0.x + DEATH_DOT / 2;
  const d0y = death0.y + DEATH_DOT / 2;
  const fireTarget = { x: CHART.x + lineX(0), y: CHART.y + fireY(FIRES[0]!) };
  const deathTarget = { x: CHART.x + barX(0) + CHART.barW / 2, y: CHART.y + CHART.base - DEATH_DOT / 2 };
  const ax = smooth(clamp01(s.align / 0.5));
  const ay = smooth(clamp01((s.align - 0.5) / 0.5));
  // 長出來時兩顆點退場（白點併入折線、橘點併入第一根長條）
  const heroFade = 1 - clamp01(s.grow / 1.2);

  if (heroFade > 0) {
    ctx.globalAlpha = heroFade;
    // 殉職點：1 → 2 往上長，→3 由上往下收到剩第一顆
    const deathGroupX = lerp(COMPARE[0].deathX, COMPARE[1].deathX, smooth(s.shrink));
    const [before, after] = PERIODS;
    const shown = Math.ceil(lerp(after.deaths, 1, s.collapse));
    ctx.fillStyle = COLOR.death;
    for (let i = 0; i < after.deaths; i++) {
      let scale = 1;
      if (i >= before.deaths) scale = clamp01((s.shrink - 0.2) * (after.deaths - before.deaths) * 1.25 - (i - before.deaths));
      if (i >= shown) scale = 0;
      // 對位開始後第一顆改由下面的主角點畫
      if ((i === 0 && !beforeAlign) || scale <= 0) continue;
      const d = deathDot(i, deathGroupX);
      ctx.beginPath();
      ctx.arc(d.x + DEATH_DOT / 2, d.y + DEATH_DOT / 2, (DEATH_DOT / 2) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // 第一顆殉職點（主角）
    if (!beforeAlign) {
      ctx.beginPath();
      ctx.arc(lerp(d0x, deathTarget.x, ax), lerp(d0y, deathTarget.y, ay), DEATH_DOT / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // 火災主角點：→3 從 1px 長成 10px
    const r = lerp(FIRE_DOT / 2, 5, smooth(s.collapse));
    ctx.fillStyle = s.collapse > 0 ? COLOR.line : COLOR.fire;
    ctx.beginPath();
    if (r < 1) ctx.rect(keepX - FIRE_DOT / 2, keepY - FIRE_DOT / 2, FIRE_DOT, FIRE_DOT);
    else ctx.arc(lerp(keepX, fireTarget.x, ax), lerp(keepY, fireTarget.y, ay), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (s.align <= 0) return;

  // 長條：第 i 根在 grow 走到 i～i+1 時長滿
  ctx.save();
  ctx.translate(CHART.x, CHART.y);
  ctx.fillStyle = COLOR.death;
  ctx.globalAlpha = lerp(0.3, 1, clamp01(s.grow / 1.5));
  DEATHS.forEach((v, i) => {
    const f = clamp01(s.grow - i);
    if (!v || f <= 0) return;
    const h = deathH(v) * smooth(f);
    ctx.fillRect(barX(i), CHART.base - h, CHART.barW, h);
  });
  ctx.globalAlpha = 1;

  // 折線：畫到 grow 的位置（含半段）
  const tip = Math.min(s.grow, FIRES.length - 1);
  if (tip > 0) {
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lineX(0), fireY(FIRES[0]!));
    const full = Math.floor(tip);
    for (let i = 1; i <= full; i++) ctx.lineTo(lineX(i), fireY(FIRES[i]!));
    const frac = tip - full;
    if (frac > 0 && full + 1 < FIRES.length) {
      ctx.lineTo(
        lerp(lineX(full), lineX(full + 1), frac),
        lerp(fireY(FIRES[full]!), fireY(FIRES[full + 1]!), frac),
      );
    }
    ctx.stroke();
  }
  ctx.restore();
}
