<!--
  05 ending（黑底）。順序照設計稿：
  滿版大圖（捲動 zoom out）→ 照片拼貼（各張進入視窗時原地淡入；敬鵬擦汗那張在框內捲動 zoom in）→ 火焰圖＋支持聯合報區塊
  版面座標在 app/utils/05.ending/collage.ts（1280 稿 px，這裡換算成百分比等比縮放）。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLLAGE, FIRE_SRC, HERO, PHOTOS } from '~/utils/05.ending/collage';
import './Ending.scss';

const str = useCopy().ending;
const assetUrl = useAssetUrl();

const pct = (v: number, base: number) => `${((v / base) * 100).toFixed(3)}%`;

const photos = PHOTOS.map((p) => ({
  ...p,
  alt: str.photos[p.id as keyof typeof str.photos] ?? '',
  style: {
    left: pct(p.x - COLLAGE.x, COLLAGE.w),
    top: pct(p.y - COLLAGE.y, COLLAGE.h),
    width: pct(p.w, COLLAGE.w),
    aspectRatio: `${p.w} / ${p.h}`,
  },
}));

const collageStyle = {
  '--collage-ratio': `${COLLAGE.w} / ${COLLAGE.h}`,
  '--collage-overlap': COLLAGE.overlap / COLLAGE.w,
};

const root = ref<HTMLElement | null>(null);
const heroImg = ref<HTMLElement | null>(null);
const photoEls = ref<HTMLElement[]>([]);
const shown = useReveal(photoEls, { threshold: 0.3 });

let ctx: gsap.Context | null = null;

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  ctx = gsap.context(() => {
    // 大圖：進入視窗時放大 1.25 倍，捲到離開時回到原尺寸（zoom out）
    gsap.fromTo(
      heroImg.value,
      { scale: 1.25 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: heroImg.value, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    // 指定的照片：框不動、圖在框內慢慢放大（zoom in）
    root.value!.querySelectorAll<HTMLElement>('[data-zoom]').forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1 },
        { scale: 1.25, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    });
  }, root.value!);
});

onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <section id="ending" ref="root" class="sec-ending">
    <div class="sec-ending__hero">
      <img
        ref="heroImg"
        class="sec-ending__hero-img"
        :src="assetUrl(HERO.src)"
        :alt="str.hero.alt"
        :width="HERO.w"
        :height="HERO.h"
        loading="lazy"
      />
    </div>

    <div class="sec-ending__collage" :style="collageStyle">
      <figure
        v-for="(p, i) in photos"
        :key="p.id"
        ref="photoEls"
        class="sec-ending__photo"
        :class="{ 'sec-ending__photo--shown': shown[i] }"
        :style="p.style"
      >
        <img class="sec-ending__photo-img" :src="assetUrl(p.src)" :alt="p.alt" :data-zoom="p.zoom ? '' : undefined" loading="lazy" />
      </figure>
    </div>

    <div class="sec-ending__support">
      <img class="sec-ending__fire" :src="assetUrl(FIRE_SRC)" :alt="str.fireAlt" width="207" height="206" loading="lazy" />
      <h2 class="sec-ending__title">{{ str.support.title }}</h2>
      <p class="sec-ending__body">{{ str.support.body }}</p>
      <a class="sec-ending__cta" :href="str.support.href" target="_blank" rel="noopener noreferrer">
        {{ str.support.cta }}
        <svg class="sec-ending__cta-icon" viewBox="0 0 8 12" aria-hidden="true">
          <path d="M1.5 1.5L6 6l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" />
        </svg>
      </a>
    </div>
  </section>
</template>
