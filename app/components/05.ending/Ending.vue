<!--
  05 ending（黑底）。順序照設計稿：
  滿版大圖（捲動 zoom out）→ 照片拼貼（各張進入視窗時原地淡入；敬鵬擦汗那張在框內捲動 zoom in）→ 火焰圖＋支持聯合報區塊
  版面座標在 app/utils/05.ending/collage.ts：mob／pad／pc 各一份（各稿 px），這裡換算成百分比，
  以 CSS 變數 --{d,l,t,w,ar,z}-{mob,pad,pc} 交給 Ending.scss 依斷點套用；某斷點沒列到的照片 display: none。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FIRE_SRC, HERO, LAYOUTS, PHOTOS, type Breakpoint } from '~/utils/05.ending/collage';
import './Ending.scss';

const str = useCopy().ending;
const assetUrl = useAssetUrl();

const BPS: Breakpoint[] = ['mob', 'pad', 'pc'];
const pct = (v: number, base: number) => `${((v / base) * 100).toFixed(3)}%`;

/** 單張照片在各斷點的位置（框的百分比）、比例、疊放順序；沒列到＝不顯示 */
const photoVars = (id: string) => {
  const vars: Record<string, string | number> = {};
  for (const bp of BPS) {
    const { frame, stack } = LAYOUTS[bp];
    const i = stack.findIndex((r) => r.id === id);
    const r = stack[i];
    if (!r) {
      vars[`--d-${bp}`] = 'none';
      continue;
    }
    vars[`--d-${bp}`] = 'block';
    vars[`--l-${bp}`] = pct(r.x - frame.x, frame.w);
    vars[`--t-${bp}`] = pct(r.y - frame.y, frame.h);
    vars[`--w-${bp}`] = pct(r.w, frame.w);
    vars[`--ar-${bp}`] = `${r.w} / ${r.h}`;
    vars[`--z-${bp}`] = i + 1;
  }
  return vars;
};

const photos = PHOTOS.map((p) => ({ ...p, alt: str.photos[p.id as keyof typeof str.photos] ?? '', style: photoVars(p.id) }));

/** 拼貼框：各斷點的比例、最大寬、疊進大圖的比例（相對框寬） */
const collageStyle = Object.fromEntries(
  BPS.flatMap((bp) => {
    const { frame } = LAYOUTS[bp];
    return [
      [`--ratio-${bp}`, `${frame.w} / ${frame.h}`],
      [`--max-${bp}`, frame.maxW ? `${frame.maxW}px` : '100%'],
      [`--overlap-${bp}`, frame.overlap / frame.w],
    ];
  }),
);

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
