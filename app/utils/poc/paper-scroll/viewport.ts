// 照紐時的做法處理手機網址列：舞台高度用 lvh（網址列收起時的高度，伸縮時不變），
// 安全高度用 documentElement.clientHeight（也不隨網址列變），
// 觸控裝置上「只有高度變」的 resize 一律忽略。純函式放前面，DOM 相關放後面。

export interface ViewportInfo {
  width: number;
  /** 舞台／canvas 高度（lvh） */
  stageHeight: number;
  /** 網址列出現時也看得到的高度，字幕與重要元素放這裡面 */
  safeHeight: number;
  dpr: number;
}

export function needsRelayout(prev: ViewportInfo, next: ViewportInfo, isTouch: boolean): boolean {
  if (next.width !== prev.width || next.dpr !== prev.dpr) return true;
  const heightChanged = next.stageHeight !== prev.stageHeight || next.safeHeight !== prev.safeHeight;
  return heightChanged && !isTouch;
}

export interface CoverTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** 設計畫布 → 舞台的 cover 縮放；anchor 預設靠上置中，手機上被裁的是左右、被網址列蓋的是底部 */
export function coverTransform(
  design: { w: number; h: number },
  stage: { w: number; h: number },
  anchor: { x: number; y: number } = { x: 0.5, y: 0 },
): CoverTransform {
  const scale = Math.max(stage.w / design.w, stage.h / design.h);
  return {
    scale,
    offsetX: (stage.w - design.w * scale) * anchor.x,
    offsetY: (stage.h - design.h * scale) * anchor.y,
  };
}

// ───────────── 以下需要 DOM ─────────────

export const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

let probe: HTMLDivElement | undefined;

/** 用隱藏元素量 100lvh；不支援 lvh 的瀏覽器會丟掉第二個 height 退回 100vh */
export function measureLvh(): number {
  if (!probe) {
    probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100vh;height:100lvh';
    document.documentElement.appendChild(probe);
  }
  return probe.offsetHeight;
}

export function readViewport(): ViewportInfo {
  return {
    width: document.documentElement.clientWidth,
    stageHeight: measureLvh(),
    safeHeight: document.documentElement.clientHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  };
}

/** debounce 的 resize 監聽；立刻先呼叫一次 onChange。回傳停止函式 */
export function watchViewport(onChange: (vp: ViewportInfo) => void, wait = 150): () => void {
  const touch = isTouchDevice();
  let last = readViewport();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const check = () => {
    const next = readViewport();
    if (!needsRelayout(last, next, touch)) return;
    last = next;
    onChange(next);
  };
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(check, wait);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  onChange(last);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  };
}

/**
 * 尺寸沒變就不動（重設 canvas.width 會清空畫布）；回傳是否有改。
 * 要同時比 CSS 尺寸：瀏覽器縮放時 dpr 與 CSS 尺寸反向變動，裝置像素數可能剛好相同。
 */
export function fitCanvas(canvas: HTMLCanvasElement, vp: ViewportInfo): boolean {
  const w = Math.round(vp.width * vp.dpr);
  const h = Math.round(vp.stageHeight * vp.dpr);
  const cssW = `${vp.width}px`;
  const cssH = `${vp.stageHeight}px`;
  if (canvas.width === w && canvas.height === h && canvas.style.width === cssW && canvas.style.height === cssH) {
    return false;
  }
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  canvas.style.width = cssW;
  canvas.style.height = cssH;
  canvas.getContext('2d')?.setTransform(vp.dpr, 0, 0, vp.dpr, 0, 0);
  return true;
}
