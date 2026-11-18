// 邊緣遮罩：讓圖的四邊淡出成透明，邊界融進舞台底色，看不出方框。
// 效果仿 Figma 樓梯圖（2486:540，firefighter_story2-1_stairbackground）畫在圖裡的暗角：
// 左右各約 16% 寬、上約 12%、下約 8% 高往黑淡出，曲線前段平、後段陡；淡出帶有噴槍似的顆粒（實測雜訊 sd 3.8 vs 中央 1）。
//
// 繪製時才套（見 compose.ts）：先把這一格畫到暫存 canvas（裝置像素），destination-in 乘上遮罩，再畫回主畫布。
// 遮罩依尺寸快取，捲動時只多兩次 drawImage；透明 PNG 也適用（alpha 相乘）。

export interface EdgeMaskConfig {
  /** 各邊淡出帶佔格子寬（left/right）或高（top/bottom）的比例；0 或省略 = 該邊不淡出 */
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  /** 淡出帶的顆粒強度（alpha 的隨機擾動幅度，淡出帶中段最強、兩端為 0），預設 0 */
  grain?: number;
  /**
   * 內容框：圖檔自己帶了硬邊黑帶時（例：走廊圖底部 11%），框外一律透明，淡出帶從內容的邊開始算
   * （此時上面的 left/right/top/bottom 是內容框寬高的比例）。值是黑帶佔整張圖寬（left/right）或高（top/bottom）的比例
   */
  inset?: { left?: number; right?: number; top?: number; bottom?: number };
}

/** 樓梯圖量到的比例（Figma 2486:540） */
export const STAIR_EDGE: EdgeMaskConfig = { left: 0.16, right: 0.16, top: 0.12, bottom: 0.08, grain: 0.25 };

/** 淡出曲線 0 → 1：smoothstep 再加一點次方，貼近樓梯圖「靠邊的那段幾乎全黑、接近內側才快速變亮」 */
export function edgeRamp(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return (c * c * (3 - 2 * c)) ** 1.4;
}

/** 格子內 (u, v)（0～1）的不含顆粒 alpha */
export function edgeAlpha(u: number, v: number, m: EdgeMaskConfig): number {
  const { left: il = 0, right: ir = 0, top: it = 0, bottom: ib = 0 } = m.inset ?? {};
  // 換成內容框內的座標；框外透明
  const cu = (u - il) / (1 - il - ir);
  const cv = (v - it) / (1 - it - ib);
  if (cu < 0 || cu > 1 || cv < 0 || cv > 1) return 0;
  const f = (d: number, band = 0) => (band > 0 ? edgeRamp(d / band) : 1);
  return f(cu, m.left) * f(1 - cu, m.right) * f(cv, m.top) * f(1 - cv, m.bottom);
}

/** 可重現的雜訊（mulberry32），同尺寸的遮罩每次長得一樣 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** w×h 的遮罩 alpha（0～255），列優先 */
export function edgeMaskAlpha(w: number, h: number, m: EdgeMaskConfig): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  const rand = rng(w * 73856093 + h * 19349663);
  const g = m.grain ?? 0;
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    for (let x = 0; x < w; x++) {
      let a = edgeAlpha((x + 0.5) / w, v, m);
      // 顆粒只出現在淡出帶：4a(1−a) 在 a = 0.5 最大、全透明與全不透明處為 0
      if (g > 0 && a > 0 && a < 1) a += (rand() * 2 - 1) * g * 4 * a * (1 - a);
      out[y * w + x] = Math.round(Math.min(1, Math.max(0, a)) * 255);
    }
  }
  return out;
}

