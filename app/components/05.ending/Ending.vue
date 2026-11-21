<!--
  大圖 → 照片拼貼 → 最後一幕（照片與導購交叉淡入淡出）。
  大圖是拼貼裡的一格，捲動時用 transform 從蓋滿前面的空位縮回自己的格子。
-->
<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FINALE, FIRE_LOOP, HERO, LAYOUTS, PHOTOS, type Breakpoint } from '~/utils/05.ending/collage';
import { TABLET_BREAKPOINTS } from '~/utils/constants';
import './Ending.scss';

const str = useCopy().ending;
const assetUrl = useAssetUrl();

const BPS: Breakpoint[] = ['mob', 'pad', 'pc'];
const MQ_MOB = `(max-width: ${TABLET_BREAKPOINTS - 0.02}px)`;
const pct = (v: number, base: number) => `${((v / base) * 100).toFixed(3)}%`;

/** 各斷點的位置（框的 %）；沒列到＝不顯示 */
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

const heroStyle = photoVars(HERO.id);
const photos = PHOTOS.map((p) => ({ ...p, alt: str.photos[p.id as keyof typeof str.photos] ?? '', style: photoVars(p.id) }));

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
const heroSpacer = ref<HTMLElement | null>(null);
const collage = ref<HTMLElement | null>(null);
const hero = ref<HTMLElement | null>(null);
const heroImg = ref<HTMLElement | null>(null);
const photoEls = ref<HTMLElement[]>([]);
// 上緣過視窗中線才淡入
const shown = useReveal(photoEls, { rootMargin: '0px 0px -50% 0px', threshold: 0 });
let dockSt: ScrollTrigger | null = null;

const finale = ref<HTMLElement | null>(null);
const finaleSupport = ref(false);
let finaleSt: ScrollTrigger | null = null;
const finaleStyle = {
  '--track': FINALE.trackVh,
  '--finale-w-mob': `${FINALE.w.mob}px`,
  '--finale-w-pad': `${FINALE.w.pad}px`,
  '--finale-w-pc': `${FINALE.w.pc}px`,
  '--finale-scale-mob': FINALE.mobScale,
};

let ctx: gsap.Context | null = null;

// 動態火：進入視窗才播，播完跳回 loop 起點
const fireVideo = ref<HTMLVideoElement | null>(null);
let fireIo: IntersectionObserver | null = null;
const onFireEnded = () => {
  const v = fireVideo.value;
  if (!v) return;
  v.currentTime = FIRE_LOOP.loopFrom;
  void v.play().catch(() => {});
};

onBeforeUnmount(() => fireIo?.disconnect());

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);
  // 減少動態時也要看得到導購，所以不受 reduced-motion 影響
  const setFinaleP = gsap.quickSetter(finale.value, '--finale-p');
  const applyFinale = (self: ScrollTrigger) => {
    const p = gsap.utils.clamp(0, 1, (self.progress - (FINALE.switchAt - FINALE.fadeSpan)) / (FINALE.fadeSpan * 2));
    setFinaleP(p);
    finaleSupport.value = p >= 0.5;
  };
  finaleSt = ScrollTrigger.create({ trigger: finale.value, start: 'top top', end: 'bottom bottom', onUpdate: applyFinale, onRefresh: applyFinale });

  // 大圖縮小定位；減少動態時也要做，否則空位是一塊黑
  const dockFrom = () => {
    const c = collage.value!;
    const h = hero.value!;
    const sp = heroSpacer.value!;
    return {
      x: sp.offsetLeft - c.offsetLeft - h.offsetLeft,
      y: sp.offsetTop - c.offsetTop - h.offsetTop,
      scale: sp.offsetWidth / h.offsetWidth,
    };
  };
  dockSt = gsap.fromTo(hero.value, dockFrom(), {
    x: 0,
    y: 0,
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: heroSpacer.value, start: 'top top', end: 'bottom 25%', scrub: true, invalidateOnRefresh: true },
  }).scrollTrigger!;
  // invalidateOnRefresh 只重算 to 端
  ScrollTrigger.addEventListener('refreshInit', () => gsap.set(hero.value, dockFrom()));

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const v = fireVideo.value;
  if (v) {
    fireIo = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) void v.play().catch(() => {});
      else v.pause();
    });
    fireIo.observe(v);
  }
  ctx = gsap.context(() => {
    // 以空位當 trigger，不受縮小定位的 transform 影響
    gsap.fromTo(
      heroImg.value,
      { scale: 1.25 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: heroSpacer.value, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    root.value!.querySelectorAll<HTMLElement>('[data-zoom]').forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1 },
        { scale: 1.25, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
    });
  }, root.value!);
});

onBeforeUnmount(() => {
  ctx?.revert();
  dockSt?.kill();
  finaleSt?.kill();
});
</script>

<template>
  <section id="ending" ref="root" class="sec-ending">
    <div ref="heroSpacer" class="sec-ending__hero" aria-hidden="true" />

    <div ref="collage" class="sec-ending__collage" :style="collageStyle">
      <figure ref="hero" class="sec-ending__photo sec-ending__photo--hero" :style="heroStyle">
        <img
          ref="heroImg"
          class="sec-ending__photo-img sec-ending__hero-img"
          :src="assetUrl(HERO.src)"
          :alt="str.hero.alt"
          :width="HERO.w"
          :height="HERO.h"
          loading="lazy"
        />
      </figure>
      <figure
        v-for="(p, i) in photos"
        :key="p.id"
        ref="photoEls"
        class="sec-ending__photo"
        :class="{ 'sec-ending__photo--shown': shown[i] }"
        :style="p.style"
      >
        <picture>
          <source v-if="p.srcMob" :media="MQ_MOB" :srcset="assetUrl(p.srcMob)" />
          <img class="sec-ending__photo-img" :src="assetUrl(p.src)" :alt="p.alt" :data-zoom="p.zoom ? '' : undefined" loading="lazy" />
        </picture>
      </figure>
    </div>

    <div ref="finale" class="sec-ending__finale" :class="{ 'sec-ending__finale--support': finaleSupport }" :style="finaleStyle">
      <div class="sec-ending__finale-stage">
        <figure class="sec-ending__finale-photo">
          <img class="sec-ending__finale-img" :src="assetUrl(FINALE.src)" :alt="str.photos.gear" loading="lazy" />
        </figure>
    <div class="sec-ending__support" :aria-hidden="!finaleSupport">
      <video
        ref="fireVideo"
        class="sec-ending__fire"
        :src="assetUrl(`${FIRE_LOOP.src}.mp4`)"
        :poster="assetUrl(`${FIRE_LOOP.src}.jpg`)"
        :width="FIRE_LOOP.w"
        :height="FIRE_LOOP.h"
        role="img"
        :aria-label="str.fireAlt"
        muted
        playsinline
        preload="metadata"
        @ended="onFireEnded"
      />
      <h2 class="sec-ending__title">{{ str.support.title }}</h2>
      <p class="sec-ending__body">{{ str.support.body }}</p>
      <a class="sec-ending__cta" :href="str.support.href" target="_blank" rel="noopener noreferrer">
        {{ str.support.cta }}
        <svg class="sec-ending__cta-icon" viewBox="0 0 8 12" aria-hidden="true">
          <path d="M1.5 1.5L6 6l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" />
        </svg>
      </a>
    </div>
      </div>
    </div>
  </section>
</template>
