// 04 各國消防員服務比：圓點動畫的版面計算（純函式，ManpowerChart.vue 用 Canvas 畫）。
// 每顆點有固定身分（國家＋序號），四個 stage 各有一組位置，捲動時在相鄰 stage 之間內插：
//   0 一位民眾：日本第 0 顆是大白點，其餘點藏在它身上
//   1 日本：大白點縮成日本方塊第一格，其餘 723 顆從它身上依序冒出、由下往上長滿（一列 30 點）
//   2 日本 vs 台灣：日本方塊左移；台灣前 724 顆（白）從日本方塊複製滑到右邊，556 顆橘點一列列疊上去
//   3 五國長條：全部重排成一列 10 點的長條、點變小；台灣保留白底＋橘頂；南韓、美國、新加坡從底部長出
import { COUNTRIES, COMPARE } from './staffing';
import type { CountryId } from './staffing';

export const STAGES = 4;

/** 版面幾何（CSS px），由元件量測容器後傳入 */
export interface ChartGeom {
  w: number;
  h: number;
  wide: boolean; // tablet 以上
  /** 標題底部 y（量 HTML；英文標題在手機會換兩行） */
  titleBottom: number;
  /** stage 0 大白點圓心（量 HTML 佔位元素） */
  introX: number;
  introY: number;
}

/** 每顆點在某 stage 的狀態：x, y, 半徑, 透明度, 橘色比例（0 白 → 1 橘） */
export interface DotStates {
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
  a: Float32Array;
  c: Float32Array;
}

export interface ChartLayout {
  n: number;
  stages: DotStates[]; // 0..3
  delays: Float32Array[]; // 轉場 0→1、1→2、2→3 每顆點的起跑延遲（0～0.5）
  /** 各國標籤中心 x（每個 stage）與標籤頂端 y */
  labelX: Record<CountryId, number[]>;
  labelTop: number;
  /** stage 2 台灣橘點頂端（+77% 放在它上方） */
  diffY: number;
  baseline: number;
}

const BLOCK_COLS = 30;
const BAR_COLS = 10;
const DOT_RATIO = 0.34; // 半徑／點距
const INTRO_R = 27; // 設計稿 54×54

/** 版面常數：mob ／ tablet 以上（對應 ManpowerChart.scss 的字級與行高） */
const metrics = (wide: boolean) => ({
  bigLabel: wide ? 60 + 80 : 40 + 56, // 國名＋大數字
  barLabel: wide ? 60 + 50 + 12 : 30 + 30 + 12, // 國名＋數字＋間距
  diff: wide ? 60 : 36, // +77%
  bottom: wide ? 56 : 48, // 長條下方留給「單位：人」
  maxPitch: wide ? 7 : 5,
  maxBarPitch: wide ? 3 : 2.4,
  pairGap: wide ? 60 : 24,
  barSide: wide ? 30 : 0,
});

const country = (id: CountryId) => COUNTRIES.find((c) => c.id === id)!;

/**
 * 點的格位：count 顆排成 cols 欄、由下往上；最上面不滿一列的靠右。
 * 回傳第 i 顆相對「方塊底部中心」的偏移（單位：格）
 */
function cell(i: number, count: number, cols: number): [number, number] {
  const row = Math.floor(i / cols);
  const fullRows = Math.floor(count / cols);
  let col = i % cols;
  if (row === fullRows) col += cols - (count % cols); // 最上面的殘列靠右
  return [col - (cols - 1) / 2, row + 0.5];
}

export function buildLayout(g: ChartGeom): ChartLayout {
  const m = metrics(g.wide);
  const jp = country(COMPARE.from);
  const tw = country(COMPARE.to);
  const baseline = g.h - m.bottom;
  const labelTop = g.titleBottom + (g.wide ? 10 : 6);

  // 點距：塞得下最高的那疊（stage 2 台灣 1280 顆 → 43 列；stage 3 台灣長條 128 列）
  const twRows = Math.ceil(tw.perFirefighter / BLOCK_COLS);
  const pitch = Math.max(
    2,
    Math.min(m.maxPitch, (baseline - labelTop - m.bigLabel - m.diff - 8) / twRows),
  );
  const barRows = Math.ceil(tw.perFirefighter / BAR_COLS);
  const barPitch = Math.max(1.2, Math.min(m.maxBarPitch, (baseline - labelTop - m.barLabel - 8) / barRows));

  // 各國在各 stage 的方塊中心 x
  const blockW = BLOCK_COLS * pitch;
  const pairJp = g.w / 2 - m.pairGap / 2 - blockW / 2;
  const pairTw = g.w / 2 + m.pairGap / 2 + blockW / 2;
  const slotW = (g.w - m.barSide * 2) / COUNTRIES.length;
  const slotX = (id: CountryId) => m.barSide + slotW * (COUNTRIES.findIndex((c) => c.id === id) + 0.5);

  const labelX = {} as Record<CountryId, number[]>;
  for (const c of COUNTRIES) {
    const s3 = slotX(c.id);
    labelX[c.id] =
      c.id === jp.id ? [g.w / 2, g.w / 2, pairJp, s3] : c.id === tw.id ? [pairTw, pairTw, pairTw, s3] : [s3, s3, s3, s3];
  }

  // 點的清單：依 COUNTRIES 順序，每國 perFirefighter 顆
  const owners: { id: CountryId; i: number; count: number }[] = [];
  for (const c of COUNTRIES) for (let i = 0; i < c.perFirefighter; i++) owners.push({ id: c.id, i, count: c.perFirefighter });
  const n = owners.length;

  const mk = (): DotStates => ({
    x: new Float32Array(n),
    y: new Float32Array(n),
    r: new Float32Array(n),
    a: new Float32Array(n),
    c: new Float32Array(n),
  });
  const stages = [mk(), mk(), mk(), mk()];
  const delays = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];

  const set = (s: DotStates, k: number, x: number, y: number, r: number, a: number, c: number) => {
    s.x[k] = x;
    s.y[k] = y;
    s.r[k] = r;
    s.a[k] = a;
    s.c[k] = c;
  };
  const blockPos = (cx: number, i: number, count: number, cols: number, p: number): [number, number] => {
    const [dx, dy] = cell(i, count, cols);
    return [cx + dx * p, baseline - dy * p];
  };

  const r1 = pitch * DOT_RATIO;
  const r3 = barPitch * DOT_RATIO;
  const jpCount = jp.perFirefighter;

  owners.forEach(({ id, i, count }, k) => {
    const [bx, by] = blockPos(slotX(id), i, count, BAR_COLS, barPitch);
    const isTwTop = id === tw.id && i >= jpCount; // 台灣多出來的橘點
    const s3c = isTwTop ? 1 : 0;

    if (id === jp.id || (id === tw.id && i < jpCount)) {
      // 日本，以及台灣的白底（stage 0、1 與日本同位置，stage 2 才滑開）
      const [x1, y1] = blockPos(g.w / 2, i, jpCount, BLOCK_COLS, pitch);
      const big = id === jp.id && i === 0;
      set(stages[0]!, k, g.introX, g.introY, big ? INTRO_R : 0, big ? 1 : 0, 0);
      set(stages[1]!, k, x1, y1, r1, 1, 0);
      const [x2, y2] =
        id === jp.id ? blockPos(pairJp, i, jpCount, BLOCK_COLS, pitch) : blockPos(pairTw, i, tw.perFirefighter, BLOCK_COLS, pitch);
      set(stages[2]!, k, x2, y2, r1, 1, 0);
      set(stages[3]!, k, bx, by, r3, 1, s3c);
      delays[0]![k] = 0.5 * (i / jpCount); // 由第一顆往後依序冒出
      delays[1]![k] = 0;
      delays[2]![k] = 0.3 * (i / count);
    } else if (isTwTop) {
      // 台灣橘點：stage 2 從上方一列列落下
      const [x2, y2] = blockPos(pairTw, i, tw.perFirefighter, BLOCK_COLS, pitch);
      set(stages[0]!, k, x2, y2 - 40, r1, 0, 1);
      set(stages[1]!, k, x2, y2 - 40, r1, 0, 1);
      set(stages[2]!, k, x2, y2, r1, 1, 1);
      set(stages[3]!, k, bx, by, r3, 1, 1);
      const j = (i - jpCount) / (count - jpCount);
      delays[0]![k] = 0;
      delays[1]![k] = 0.15 + 0.35 * j;
      delays[2]![k] = 0.3 * (i / count);
    } else {
      // 南韓、美國、新加坡：stage 3 才從長條底部長出
      set(stages[0]!, k, bx, baseline, 0, 0, 0);
      set(stages[1]!, k, bx, baseline, 0, 0, 0);
      set(stages[2]!, k, bx, baseline, 0, 0, 0);
      set(stages[3]!, k, bx, by, r3, 1, 0);
      delays[0]![k] = 0;
      delays[1]![k] = 0;
      delays[2]![k] = 0.5 * (i / count);
    }
  });

  const twTopRows = Math.ceil(tw.perFirefighter / BLOCK_COLS);
  return { n, stages, delays, labelX, labelTop, diffY: baseline - twTopRows * pitch, baseline };
}

/** 捲動進度 → 連續的 stage 位置（0～3）：每段前 55% 是轉場、後面停住 */
export function stagePos(progress: number): number {
  const seg = Math.min(Math.floor(progress * STAGES), STAGES - 1);
  if (seg === 0) return 0;
  const local = progress * STAGES - seg;
  return seg - 1 + Math.min(local / 0.55, 1);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const WHITE = [255, 255, 255];
const ORANGE = [237, 114, 35];

/** 畫一格：pos 是連續 stage 位置 */
export function drawDots(ctx: CanvasRenderingContext2D, L: ChartLayout, pos: number) {
  const k = Math.min(Math.floor(pos), STAGES - 2);
  const t = pos - k;
  const A = L.stages[k]!;
  const B = L.stages[k + 1]!;
  const D = L.delays[k]!;

  // 依顏色＋透明度分桶，一桶一個 Path2D，減少 fillStyle 切換
  const buckets = new Map<string, Path2D>();
  for (let i = 0; i < L.n; i++) {
    const tt = ease(Math.min(Math.max((t - D[i]!) / 0.5, 0), 1));
    const r = A.r[i]! + (B.r[i]! - A.r[i]!) * tt;
    const a = A.a[i]! + (B.a[i]! - A.a[i]!) * tt;
    if (r < 0.2 || a < 0.02) continue;
    const x = A.x[i]! + (B.x[i]! - A.x[i]!) * tt;
    const y = A.y[i]! + (B.y[i]! - A.y[i]!) * tt;
    const c = A.c[i]! + (B.c[i]! - A.c[i]!) * tt;
    const key = `${Math.round(c * 10)}|${Math.round(a * 10)}`;
    let p = buckets.get(key);
    if (!p) buckets.set(key, (p = new Path2D()));
    p.moveTo(x + r, y);
    p.arc(x, y, r, 0, Math.PI * 2);
  }
  for (const [key, p] of buckets) {
    const [cq, aq] = key.split('|').map(Number) as [number, number];
    const mix = WHITE.map((v, j) => Math.round(v + (ORANGE[j]! - v) * (cq / 10)));
    ctx.fillStyle = `rgba(${mix.join(',')},${aq / 10})`;
    ctx.fill(p);
  }
}

/** 標籤用：在兩個 stage 之間內插（不錯開） */
export function lerpStage(values: number[], pos: number): number {
  const k = Math.min(Math.floor(pos), STAGES - 2);
  const t = ease(pos - k);
  return values[k]! + (values[k + 1]! - values[k]!) * t;
}
