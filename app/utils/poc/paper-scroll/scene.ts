// 場景核心。update() 把進度與 dt 變成每個元素的「格數 + 繪製狀態」，
// draw() 依圖層排序後畫到 canvas。所有狀態都是進度的函數，往回捲自然可逆。
import { advanceTime, loopIndex, scrollTargetRaw, stepToward } from './frame';
import { sampleColor, sampleNumber, sampleStep } from './keyframes';
import type { ClipConfig, ElementConfig, SceneConfig, SpriteConfig } from './types';
import { syncVideo } from './video';
import { fitTransform, type CoverTransform } from './viewport';

export type ModeOverride = 'config' | 'time' | 'scroll';

export interface LoadedStrip {
  source: CanvasImageSource;
  /** 圖檔實際像素 ÷ 設定的 cellW×frames；交 2× 圖不用改設定 */
  pixelRatio: number;
  /** sprite.kind = 'video' 時就是 source，播放由 syncVideo 控制 */
  video?: HTMLVideoElement;
}

export interface ElementRuntime {
  config: ElementConfig;
  /** time 模式累積的格數（浮點） */
  acc: number;
  phase: number;
  /** scroll 模式目前的 raw index */
  raw: number;
  frame: number;
  jitterRot: number;
  jitterX: number;
  jitterY: number;
}

export interface TickInput {
  progress: number;
  scrollPx: number;
  dtMs: number;
}

export interface DrawState {
  x: number;
  y: number;
  scale: number;
  rot: number;
  opacity: number;
  layer: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 套用所有 p <= 進度 的 trigger（依序覆蓋），再套全域覆寫；hold 不被覆寫 */
export function resolveConfig(base: ElementConfig, progress: number, override: ModeOverride = 'config'): ElementConfig {
  let cfg = base;
  for (const t of base.triggers ?? []) if (t.p <= progress) cfg = { ...cfg, ...t.set };
  if (override !== 'config' && cfg.frameMode !== 'hold') cfg = { ...cfg, frameMode: override };
  return cfg;
}

/** 更新 rt 的內部狀態並回傳要顯示的格 */
export function nextFrame(rt: ElementRuntime, cfg: ElementConfig, input: TickInput, reduceMotion = false): number {
  const { frames } = cfg.sprite;
  const loop = cfg.loop ?? 'repeat';
  switch (cfg.frameMode) {
    case 'hold':
      return loopIndex(cfg.holdFrame ?? 0, frames, 'clamp');
    case 'time': {
      if (reduceMotion) return 0;
      const fps = sampleNumber(cfg.keyframes, 'fps', input.progress, cfg.fps ?? 8);
      rt.acc = advanceTime(rt.acc, input.dtMs, fps);
      return loopIndex(Math.floor(rt.acc + rt.phase), frames, loop);
    }
    case 'scroll': {
      const target = scrollTargetRaw({
        progress: input.progress,
        scrollPx: input.scrollPx,
        frames,
        pxPerFrame: cfg.pxPerFrame,
        range: cfg.range,
      });
      rt.raw = stepToward(rt.raw, target, cfg.maxStepPerTick ?? 1);
      return loopIndex(rt.raw, frames, loop);
    }
  }
}

export function drawStateOf(cfg: ElementConfig, p: number): DrawState {
  const k = cfg.keyframes;
  return {
    x: sampleNumber(k, 'x', p, 0.5),
    y: sampleNumber(k, 'y', p, 0.5),
    scale: sampleNumber(k, 'scale', p, 1),
    rot: sampleNumber(k, 'rot', p, 0),
    opacity: sampleNumber(k, 'opacity', p, 1),
    layer: sampleStep(k, 'layer', p, 0),
  };
}

/** null = 不裁切；數字 = 裁切矩形的放大倍率（fade 段由 1 平滑到 4） */
export function clipExpand(clip: ClipConfig, p: number): number | null {
  const from = clip.from ?? -Infinity;
  const until = clip.until ?? Infinity;
  const fade = clip.fade ?? 0;
  if (p < from || p >= until) return null;
  if (fade <= 0 || p < until - fade) return 1;
  const t = (p - (until - fade)) / fade;
  return 1 + 3 * t * t * (3 - 2 * t);
}

/** 元素目前繪製的格子在設計畫布上的矩形（忽略旋轉） */
export function cellRect(sprite: SpriteConfig, state: DrawState, design: { w: number; h: number }): Rect {
  const [ax, ay] = sprite.anchor ?? [0.5, 1];
  const w = sprite.cellW * state.scale;
  const h = sprite.cellH * state.scale;
  return { x: state.x * design.w - ax * w, y: state.y * design.h - ay * h, w, h };
}

export function clipRect(clip: ClipConfig, ref: Rect, expand: number): Rect {
  const [fx, fy, fw, fh] = clip.rect;
  const w = ref.w * fw;
  const h = ref.h * fh;
  const cx = ref.x + ref.w * fx + w / 2;
  const cy = ref.y + ref.h * fy + h / 2;
  return { x: cx - (w * expand) / 2, y: cy - (h * expand) / 2, w: w * expand, h: h * expand };
}

export function sortByLayer<T extends { layer: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.layer - b.layer); // Array.prototype.sort 是穩定排序
}

interface Resolved {
  cfg: ElementConfig;
  state: DrawState;
}

export class PaperScene {
  override: ModeOverride = 'config';
  reduceMotion = false;
  progress = 0;
  readonly runtimes: ElementRuntime[];
  private resolved = new Map<string, Resolved>();

  constructor(
    readonly config: SceneConfig,
    private strips: Map<string, LoadedStrip>,
  ) {
    this.runtimes = config.elements.map((e) => ({
      config: e,
      acc: 0,
      phase: e.phase === 'random' ? Math.random() * e.sprite.frames : (e.phase ?? 0),
      raw: 0,
      frame: 0,
      jitterRot: 0,
      jitterX: 0,
      jitterY: 0,
    }));
  }

  update(input: TickInput) {
    this.progress = input.progress;
    for (const rt of this.runtimes) {
      const cfg = resolveConfig(rt.config, input.progress, this.override);
      const frame = nextFrame(rt, cfg, input, this.reduceMotion);
      if (frame !== rt.frame) {
        rt.frame = frame;
        const j = cfg.jitter;
        rt.jitterRot = (Math.random() * 2 - 1) * (j?.rot ?? 0);
        rt.jitterX = (Math.random() * 2 - 1) * (j?.px ?? 0);
        rt.jitterY = (Math.random() * 2 - 1) * (j?.px ?? 0);
      }
      const state = drawStateOf(cfg, input.progress);
      this.resolved.set(rt.config.id, { cfg, state });
      const video = this.strips.get(cfg.sprite.src)?.video;
      if (video && cfg.playback) syncVideo(video, cfg.playback, input.progress, state.opacity > 0.001, this.reduceMotion);
    }
  }

  /** 設計畫布 → 舞台（CSS px）的變換 */
  transform(stage: { w: number; h: number }): CoverTransform {
    const { design, fit, anchor, maxCrop } = this.config;
    return fitTransform(design, stage, fit, anchor, maxCrop);
  }

  /** 卸載時停掉影片 */
  dispose() {
    for (const s of this.strips.values()) s.video?.pause();
  }

  private clipFor(clip: ClipConfig): Rect | null {
    const expand = clipExpand(clip, this.progress);
    if (expand === null) return null;
    const ref = this.resolved.get(clip.ref);
    if (!ref) return null;
    return clipRect(clip, cellRect(ref.cfg.sprite, ref.state, this.config.design), expand);
  }

  draw(ctx: CanvasRenderingContext2D, stage: { w: number; h: number }, debug: { clips?: boolean } = {}) {
    const { design } = this.config;
    const p = this.progress;
    ctx.save();
    ctx.fillStyle = sampleColor(this.config.background, p);
    ctx.fillRect(0, 0, stage.w, stage.h);
    const t = this.transform(stage);
    ctx.translate(t.offsetX, t.offsetY);
    ctx.scale(t.scale, t.scale);
    // contain 時放大的元素不能溢出設計畫布（cover 時設計畫布本來就蓋滿舞台，裁不到看得見的部分）
    ctx.beginPath();
    ctx.rect(0, 0, design.w, design.h);
    ctx.clip();

    const order = sortByLayer(
      this.runtimes.map((rt) => ({ rt, layer: this.resolved.get(rt.config.id)?.state.layer ?? 0 })),
    );
    for (const { rt } of order) {
      const r = this.resolved.get(rt.config.id);
      if (!r || r.state.opacity <= 0.001) continue;
      const strip = this.strips.get(r.cfg.sprite.src);
      if (!strip) continue;
      const { cellW, cellH, anchor = [0.5, 1] } = r.cfg.sprite;
      const clip = r.cfg.clip ? this.clipFor(r.cfg.clip) : null;

      ctx.save();
      if (clip) {
        ctx.beginPath();
        ctx.rect(clip.x, clip.y, clip.w, clip.h);
        if (debug.clips) {
          ctx.strokeStyle = 'rgba(0,200,255,0.9)';
          ctx.lineWidth = 2 / t.scale;
          ctx.stroke();
        }
        ctx.clip();
      }
      ctx.globalAlpha = r.state.opacity;
      ctx.translate(r.state.x * design.w + rt.jitterX, r.state.y * design.h + rt.jitterY);
      ctx.rotate(((r.state.rot + rt.jitterRot) * Math.PI) / 180);
      ctx.scale(r.state.scale, r.state.scale);
      const pr = strip.pixelRatio;
      ctx.drawImage(
        strip.source,
        rt.frame * cellW * pr,
        0,
        cellW * pr,
        cellH * pr,
        -anchor[0] * cellW,
        -anchor[1] * cellH,
        cellW,
        cellH,
      );
      ctx.restore();
    }
    ctx.restore();
  }

  /** 給除錯面板 */
  snapshot() {
    return this.runtimes.map((rt) => ({
      id: rt.config.id,
      mode: this.resolved.get(rt.config.id)?.cfg.frameMode ?? rt.config.frameMode,
      frame: rt.frame,
    }));
  }
}
