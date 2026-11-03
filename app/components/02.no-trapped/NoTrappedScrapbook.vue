<!--
  可拖曳的剪報／照片／影片（參考 mosbyfiles case-folder）。拖曳範圍＝父元素（NoTrappedCase 的 article）。
  外層 __item 給 Draggable 平移、內層 __paper 負責旋轉，兩者的 transform 才不會互相覆蓋。
  點擊（沒拖動）放大：滑鼠裝置直接開；觸控裝置第一下先亮放大符號，再點一次才開。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { TABLET_BREAKPOINTS } from '~/utils/constants';
import type { ScrapbookItem } from '~/utils/02.no-trapped/scrapbook';
import './NoTrappedScrapbook.scss';

const props = defineProps<{ items: ScrapbookItem[]; aspect: { mob: string; pc: string } }>();

const assetUrl = useAssetUrl();
const root = ref<HTMLElement | null>(null);
const itemEls = ref<HTMLElement[]>([]);
const paperEls = ref<HTMLElement[]>([]);
const videoEls = ref<HTMLVideoElement[]>([]);

/** 觸控裝置上亮著放大符號的那張 */
const active = ref<number | null>(null);
const zoomed = ref<number | null>(null);
const wide = ref(false);

const boardStyle = computed(() => ({ '--aspect-mob': props.aspect.mob, '--aspect-pc': props.aspect.pc }));

const itemStyle = (it: ScrapbookItem) => ({
  '--x-mob': it.mob.x,
  '--y-mob': it.mob.y,
  '--w-mob': it.mob.w,
  '--r-mob': it.mob.r,
  '--x-pc': it.pc.x,
  '--y-pc': it.pc.y,
  '--w-pc': it.pc.w,
  '--r-pc': it.pc.r,
  '--ratio': it.ratio,
});

/** 遮罩用圖片本身的 alpha，撕邊剪報的變暗色塊才不會露出方角 */
const veilStyle = (it: ScrapbookItem) =>
  it.type === 'image' ? { maskImage: `url(${assetUrl(it.src)})`, WebkitMaskImage: `url(${assetUrl(it.src)})` } : {};

/** 放大框要從哪裡長出來：原素材未旋轉的尺寸、中心點、目前斷點的角度 */
const zoomOrigin = computed(() => {
  const i = zoomed.value;
  const paper = i === null ? null : paperEls.value[i];
  if (i === null || !paper) return null;
  const box = paper.getBoundingClientRect();
  const it = props.items[i]!;
  return {
    cx: box.left + box.width / 2,
    cy: box.top + box.height / 2,
    w: paper.offsetWidth,
    h: paper.offsetHeight,
    r: wide.value ? it.pc.r : it.mob.r,
    time: videoEls.value.find((v) => paper.contains(v))?.currentTime ?? 0,
  };
});

let draggables: Draggable[] = [];
let mqWide: MediaQueryList | null = null;
let canHover = false;
let resizeObs: ResizeObserver | null = null;
let videoObs: IntersectionObserver | null = null;

const open = (i: number) => {
  active.value = null;
  zoomed.value = i;
};

const onClick = (i: number) => {
  if (canHover || active.value === i) open(i);
  else active.value = i;
};

/** 觸控：點到素材以外的地方就收掉放大符號 */
const onDocPointer = (e: PointerEvent) => {
  if (active.value === null) return;
  if (!itemEls.value.some((el) => el.contains(e.target as Node))) active.value = null;
};

/** 換斷點時素材位置整組換掉，拖曳留下的位移歸零 */
const onBreakpoint = () => {
  wide.value = !!mqWide?.matches;
  gsap.set(itemEls.value, { x: 0, y: 0 });
  draggables.forEach((d) => d.update());
};

onMounted(() => {
  gsap.registerPlugin(Draggable, InertiaPlugin);
  canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  mqWide = matchMedia(`(min-width: ${TABLET_BREAKPOINTS}px)`);
  wide.value = mqWide.matches;
  mqWide.addEventListener('change', onBreakpoint);

  const bounds = root.value!.parentElement!;
  draggables = Draggable.create(itemEls.value, {
    type: 'x,y',
    bounds,
    inertia: true,
    edgeResistance: 0.75,
    cursor: 'grab',
    activeCursor: 'grabbing',
    onDragStart() {
      active.value = null;
      (this.target as HTMLElement).classList.add('no-trapped-scrapbook__item--dragging');
    },
    onRelease() {
      (this.target as HTMLElement).classList.remove('no-trapped-scrapbook__item--dragging');
    },
    onClick() {
      onClick(Number((this.target as HTMLElement).dataset.index));
    },
  });

  // 版面縮放後，拖到邊緣的素材可能跑出範圍，推回來
  resizeObs = new ResizeObserver(() => draggables.forEach((d) => d.applyBounds(bounds)));
  resizeObs.observe(bounds);

  // 影片只在畫面內播（檔案大，不用 autoplay 一次全開）
  videoObs = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const v = target as HTMLVideoElement;
      if (isIntersecting) {
        v.muted = true;
        v.play().catch(() => {});
      } else v.pause();
    }
  });
  videoEls.value.forEach((v) => videoObs!.observe(v));

  document.addEventListener('pointerdown', onDocPointer);
});

onBeforeUnmount(() => {
  draggables.forEach((d) => d.kill());
  mqWide?.removeEventListener('change', onBreakpoint);
  resizeObs?.disconnect();
  videoObs?.disconnect();
  document.removeEventListener('pointerdown', onDocPointer);
});
</script>

<template>
  <div ref="root" class="no-trapped-scrapbook" :style="boardStyle">
    <div
      v-for="(it, i) in items"
      :key="it.src"
      ref="itemEls"
      class="no-trapped-scrapbook__item"
      :class="{
        'no-trapped-scrapbook__item--active': active === i,
        'no-trapped-scrapbook__item--zoomed': zoomed === i,
      }"
      :style="itemStyle(it)"
      :data-index="i"
    >
      <div ref="paperEls" class="no-trapped-scrapbook__paper">
        <img
          v-if="it.type === 'image'"
          class="no-trapped-scrapbook__media"
          :src="assetUrl(it.src)"
          :alt="it.alt"
          draggable="false"
          loading="lazy"
        />
        <video
          v-else
          ref="videoEls"
          class="no-trapped-scrapbook__media"
          :src="assetUrl(it.src)"
          :aria-label="it.alt"
          muted
          loop
          playsinline
          preload="metadata"
        />
        <div class="no-trapped-scrapbook__veil" :style="veilStyle(it)" aria-hidden="true">
          <svg class="no-trapped-scrapbook__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="21" cy="21" r="12" />
            <path d="M30 30l9 9M21 15v12M15 21h12" stroke-linecap="round" />
          </svg>
        </div>
      </div>
    </div>

    <NoTrappedZoom :item="zoomed === null ? null : items[zoomed]!" :origin="zoomOrigin" :wide="wide" @closed="zoomed = null" />
  </div>
</template>
