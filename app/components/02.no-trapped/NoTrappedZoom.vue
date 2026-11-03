<!--
  scrapbook 放大框。用原生 <dialog>（showModal：Esc、焦點鎖、背景 inert 都免費），
  圖從原素材的位置、角度 FLIP 長出來：寬螢幕寬度加 100px 原地放大、解除旋轉；手機滿版置中。
  右上角 × 、點背景、Esc 都會反向縮回原位再關閉。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { zoomRect, type Rect, type ScrapbookItem } from '~/utils/02.no-trapped/scrapbook';

interface ZoomOrigin {
  cx: number;
  cy: number;
  w: number;
  h: number;
  r: number;
  /** 影片從原素材目前的播放位置接著播 */
  time: number;
}

const props = defineProps<{ item: ScrapbookItem | null; origin: ZoomOrigin | null; wide: boolean }>();
const emit = defineEmits<{ closed: [] }>();

const assetUrl = useAssetUrl();
const str = useCopy().noTrapped;
const dialog = ref<HTMLDialogElement | null>(null);
const figure = ref<HTMLElement | null>(null);
const rect = ref<Rect | null>(null);
let closing = false;

const figureStyle = computed(() =>
  rect.value
    ? {
        left: `${rect.value.left}px`,
        top: `${rect.value.top}px`,
        width: `${rect.value.width}px`,
        height: `${rect.value.height}px`,
      }
    : {},
);

/** 讓 figure 看起來疊在原素材上：位移到原中心、縮回原寬、轉回原角度 */
const fromOrigin = (o: ZoomOrigin, r: Rect) => ({
  x: o.cx - (r.left + r.width / 2),
  y: o.cy - (r.top + r.height / 2),
  scale: o.w / r.width,
  rotation: o.r,
});

watch(
  () => props.origin,
  async (o) => {
    // 開著時換斷點也會重算 origin，那時不要再開一次
    if (!o || !props.item || dialog.value!.open) return;
    closing = false;
    rect.value = zoomRect(o, { w: innerWidth, h: innerHeight }, props.wide);
    document.documentElement.classList.add('is-zoom-open');
    dialog.value!.showModal();
    await nextTick();
    const video = figure.value!.querySelector('video');
    if (video) video.currentTime = o.time;
    gsap.fromTo(
      figure.value,
      fromOrigin(o, rect.value),
      { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.45, ease: 'power3.out' },
    );
  },
);

const close = () => {
  if (closing || !props.origin || !rect.value) return;
  closing = true;
  dialog.value!.classList.add('no-trapped-zoom--leaving');
  gsap.to(figure.value, {
    ...fromOrigin(props.origin, rect.value),
    duration: 0.35,
    ease: 'power3.inOut',
    onComplete: () => {
      dialog.value!.close();
      dialog.value!.classList.remove('no-trapped-zoom--leaving');
      document.documentElement.classList.remove('is-zoom-open');
      rect.value = null;
      emit('closed');
    },
  });
};

/** Esc：先擋掉原生的立即關閉，改走動畫 */
const onCancel = (e: Event) => {
  e.preventDefault();
  close();
};

/** dialog 撐滿視窗，點到的是 dialog 本身＝點在背景上 */
const onBackdrop = (e: MouseEvent) => {
  if (e.target === dialog.value) close();
};

onBeforeUnmount(() => document.documentElement.classList.remove('is-zoom-open'));
</script>

<template>
  <dialog ref="dialog" class="no-trapped-zoom" :aria-label="item?.alt" @cancel="onCancel" @click="onBackdrop">
    <figure v-if="item && rect" ref="figure" class="no-trapped-zoom__figure" :style="figureStyle">
      <img v-if="item.type === 'image'" class="no-trapped-zoom__media" :src="assetUrl(item.src)" :alt="item.alt" />
      <video
        v-else
        class="no-trapped-zoom__media"
        :src="assetUrl(item.src)"
        :aria-label="item.alt"
        autoplay
        muted
        loop
        playsinline
        controls
      />
      <button type="button" class="no-trapped-zoom__close" :aria-label="str.zoomClose" @click="close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      </button>
    </figure>
  </dialog>
</template>
