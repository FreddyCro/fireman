// 把專案既有的 ScrollTrigger（唯一 scroll listener）與 gsap.ticker（唯一 rAF）接到 PaperScene。
// 進度用 lerp 平滑（紐時做法），舞台不在畫面上就不繪製。
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Ref } from 'vue';
import { loadStrip } from '~/utils/paper-scroll/assets';
import { PaperScene, type LoadedStrip, type ModeOverride } from '~/utils/paper-scroll/scene';
import type { SceneConfig } from '~/utils/paper-scroll/types';
import { fitCanvas, watchViewport, type ViewportInfo } from '~/utils/paper-scroll/viewport';

export interface UsePaperSceneOptions {
  track: Ref<HTMLElement | null>;
  stage: Ref<HTMLElement | null>;
  canvas: Ref<HTMLCanvasElement | null>;
  scene: SceneConfig;
  assetUrl: (path: string) => string;
}

/** 平滑時間常數（ms）：越小追得越快 */
const SMOOTH_TAU = 80;

export function usePaperScene(opts: UsePaperSceneOptions) {
  const target = ref(0);
  const progress = ref(0);
  const fps = ref(0);
  const ready = ref(false);
  const viewport = ref<ViewportInfo | null>(null);
  const elements = ref<{ id: string; mode: string; frame: number }[]>([]);
  const showClips = ref(false);

  let scene: PaperScene | null = null;
  let trigger: ScrollTrigger | null = null;
  let io: IntersectionObserver | null = null;
  let stopWatch: (() => void) | null = null;
  let visible = false;
  let fpsAcc = 0;
  let fpsCount = 0;

  const setOverride = (mode: ModeOverride) => {
    if (scene) scene.override = mode;
  };

  const tick = (_time: number, dtMs: number) => {
    const canvas = opts.canvas.value;
    const stage = opts.stage.value;
    const track = opts.track.value;
    if (!scene || !visible || !canvas || !stage || !track) return;

    const k = 1 - Math.exp(-dtMs / SMOOTH_TAU);
    const diff = target.value - progress.value;
    progress.value = Math.abs(diff) < 1e-4 ? target.value : progress.value + diff * k;

    const distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
    scene.update({ progress: progress.value, scrollPx: progress.value * distance, dtMs });
    const ctx = canvas.getContext('2d');
    if (ctx) scene.draw(ctx, { w: stage.clientWidth, h: stage.clientHeight }, { clips: showClips.value });

    fpsAcc += dtMs;
    fpsCount++;
    if (fpsAcc >= 500) {
      fps.value = Math.round((fpsCount * 1000) / fpsAcc);
      fpsAcc = 0;
      fpsCount = 0;
      elements.value = scene.snapshot();
    }
  };

  onMounted(async () => {
    const track = opts.track.value;
    const stage = opts.stage.value;
    const canvas = opts.canvas.value;
    if (!track || !stage || !canvas) return;

    const strips = new Map<string, LoadedStrip>();
    const sprites = [...new Map(opts.scene.elements.map((e) => [e.sprite.src, e.sprite])).values()];
    await Promise.all(
      sprites.map(async (s) => strips.set(s.src, await loadStrip(opts.assetUrl(s.src), s.cellW, s.frames))),
    );

    scene = new PaperScene(opts.scene, strips);
    scene.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stopWatch = watchViewport((vp) => {
      viewport.value = vp;
      if (fitCanvas(canvas, vp)) ScrollTrigger.refresh();
    });

    trigger = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      // 與 sticky 實際可黏住的距離一致（舞台高度是 lvh，不用 ScrollTrigger 自己量的 innerHeight）
      end: () => `+=${Math.max(1, track.offsetHeight - stage.offsetHeight)}`,
      onUpdate: (self) => {
        target.value = self.progress;
      },
    });
    target.value = trigger.progress;
    progress.value = target.value;

    io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
      },
      { rootMargin: '100px 0px' },
    );
    io.observe(stage);

    gsap.ticker.add(tick);
    ready.value = true;
  });

  onBeforeUnmount(() => {
    gsap.ticker.remove(tick);
    trigger?.kill();
    io?.disconnect();
    stopWatch?.();
  });

  return { target, progress, fps, ready, viewport, elements, showClips, setOverride };
}
