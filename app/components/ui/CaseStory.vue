<!--
  案例區（02 no-trapped、03 violation 共用），設計稿 1110 定版。
  PC：左右切割。左欄（日期／標題／內文＋殉職人數）sticky 置中；右欄素材（文件、照片、情境圖）垂直排列往上捲。
  pad／mob：文字、殉職人數在上，素材欄在下，一樣往上捲。

  ・進場：左側文字一組、殉職人數一組，時間差 fade up（各 0.3s）。
  ・active：跨過視窗中線的素材放大（PC／pad 400 → 500、mob 262 → 414），文件同時換成焦點圖；回滾縮回去。
  ・情境圖（steps）：中線從圖的上緣走到下緣的過程依序換圖（a → b → c），溫度計漸層跟著變。
  ・退場：右欄捲完時下緣剛好與左欄齊底（PC 右欄 padding-bottom 依左欄高度算），之後整組一起往上收，
    綁捲動 opacity 1 → 0。
  active、換圖、退場都在同一個 rAF 節流的 scroll handler 裡算：active 素材會改變高度、推動下方素材，
  事先算好觸發點的 ScrollTrigger／IntersectionObserver 會跟著失準，每次即時量 getBoundingClientRect 最穩。
-->
<script setup lang="ts">
import { isMedia, stepAt, type CaseItem, type CaseLayout } from '~/utils/case-story';
import { PC_BREAKPOINTS, TABLET_BREAKPOINTS } from '~/utils/constants';
import './CaseStory.scss';

interface ItemCopy {
  text?: string;
  alt?: string;
  overlay?: string;
  steps?: Record<string, { title?: string; label?: string }>;
}

interface CaseCopy {
  date: string;
  title: string[];
  /** **…** 包起來的字＝重點（粗體白字） */
  body: string;
  /** 殉職人數 SVG 檔名主幹，補 _pc／_pad／_mob.svg */
  countSvg: string;
  countAlt: string;
  items: Record<string, ItemCopy>;
}

const props = defineProps<{ layout: CaseLayout; copy: CaseCopy }>();

const assetUrl = useAssetUrl();
const STEP_KEYS = ['a', 'b', 'c', 'd', 'e'];
const MQ_MOB = `(max-width: ${TABLET_BREAKPOINTS - 0.02}px)`;
const MQ_PAD = `(max-width: ${PC_BREAKPOINTS - 0.02}px)`;

/** body 依 **…** 切段：偶數段一般文字、奇數段重點 */
const bodyParts = computed(() => props.copy.body.split(/\*\*(.+?)\*\*/));

const items = computed(() =>
  props.layout.items.map((it, index) => ({ ...it, index, copy: props.copy.items[it.id] ?? ({} as ItemCopy) })),
);

/** steps item 目前這一步的標題與溫度計文字 */
const stepCopy = (it: CaseItem & { copy: ItemCopy }, i: number) => it.copy.steps?.[STEP_KEYS[i]!] ?? {};

/** 溫度計漸層（@property 註冊過，換步驟時 transition） */
const thermoStyle = (stops: [number, number][], i: number) => ({
  '--thermo-white': stops[i]![0],
  '--thermo-orange': stops[i]![1],
});

const root = ref<HTMLElement | null>(null);
const introBox = ref<HTMLElement | null>(null);
const textEl = ref<HTMLElement | null>(null);
const countEl = ref<HTMLElement | null>(null);
const itemEls = ref<HTMLElement[]>([]);

const textShown = useReveal(textEl, { threshold: 0.3 });
const countShown = useReveal(countEl, { threshold: 0.3 });

/** 目前 active 的 item index（null＝還沒捲到第一個素材） */
const active = ref<number | null>(null);
/** steps item 的目前步驟，key 是 item id */
const steps = reactive<Record<string, number>>({});
/** 左欄高度：PC 右欄 padding-bottom 用它算齊底 */
const introH = ref(0);

let raf = 0;
let resizeObs: ResizeObserver | null = null;

const update = () => {
  raf = 0;
  const el = root.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vh = innerHeight;
  // 不在畫面附近就不算
  if (rect.bottom < -vh || rect.top > vh * 2) return;

  const mid = vh / 2;
  const media = itemEls.value
    .map((node) => ({ node, i: Number(node.dataset.index), it: props.layout.items[Number(node.dataset.index)]! }))
    .filter(({ it }) => isMedia(it));

  let hit: number | null = null;
  for (const { node, i, it } of media) {
    const r = node.getBoundingClientRect();
    if (r.top <= mid && r.bottom >= mid) hit = i;
    if (it.kind === 'steps') steps[it.id] = stepAt((mid - r.top) / r.height, it.srcs.length);
  }
  if (hit !== null) active.value = hit;
  else if (media[0] && media[0].node.getBoundingClientRect().top > mid) active.value = null;
  // 中線落在素材間距或已過最後一個：維持上一個 active（最後一張停在放大狀態一起往上收）

  // 退場：下緣離開視窗底後，捲到視窗 30% 高時淡到 0
  const fade = (vh - rect.bottom) / (vh * 0.7);
  el.style.opacity = fade > 0 ? String(Math.max(0, 1 - fade)) : '';
};

const onScroll = () => {
  if (!raf) raf = requestAnimationFrame(update);
};

onMounted(() => {
  resizeObs = new ResizeObserver(([e]) => {
    introH.value = e?.contentRect.height ?? 0;
    onScroll();
  });
  if (introBox.value) resizeObs.observe(introBox.value);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  removeEventListener('scroll', onScroll);
  removeEventListener('resize', onScroll);
  resizeObs?.disconnect();
});
</script>

<template>
  <article ref="root" class="case-story" :style="{ '--intro-h': `${introH}px` }">
    <div class="case-story__aside">
      <div class="case-story__intro">
        <div ref="introBox" class="case-story__intro-box">
          <div ref="textEl" class="case-story__text" :class="{ 'case-story__text--shown': textShown[0] }">
            <p class="case-story__date">{{ copy.date }}</p>
            <h3 class="case-story__heading">
              <span v-for="l in copy.title" :key="l">{{ l }}</span>
            </h3>
            <p class="case-story__body">
              <template v-for="(part, i) in bodyParts" :key="i">
                <strong v-if="i % 2" class="case-story__em">{{ part }}</strong>
                <template v-else>{{ part }}</template>
              </template>
            </p>
          </div>
          <picture ref="countEl" class="case-story__count" :class="{ 'case-story__count--shown': countShown[0] }">
            <source :media="MQ_MOB" :srcset="assetUrl(`${copy.countSvg}_mob.svg`)" />
            <source :media="MQ_PAD" :srcset="assetUrl(`${copy.countSvg}_pad.svg`)" />
            <img class="case-story__count-img" :src="assetUrl(`${copy.countSvg}_pc.svg`)" :alt="copy.countAlt" />
          </picture>
        </div>
      </div>
    </div>

    <div class="case-story__list">
      <div
        v-for="it in items"
        :key="it.id"
        ref="itemEls"
        class="case-story__item"
        :class="[`case-story__item--${it.kind}`, { 'case-story__item--active': active === it.index }]"
        :data-index="it.index"
      >
        <p v-if="it.kind === 'heading'" class="case-story__doc-title">{{ it.copy.text }}</p>

        <p v-else-if="it.kind === 'quote'" class="case-story__quote">{{ it.copy.text }}</p>

        <div v-else-if="it.kind === 'doc'" class="case-story__frame" :style="{ aspectRatio: it.ratio }">
          <img class="case-story__img" :src="assetUrl(it.src)" :alt="it.copy.alt ?? ''" loading="lazy" />
          <img
            class="case-story__img case-story__img--focus"
            :class="{ 'case-story__img--pcpad': it.focusPcPadOnly }"
            :src="assetUrl(it.focus)"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        </div>

        <div v-else-if="it.kind === 'photo'" class="case-story__frame" :style="{ aspectRatio: it.ratio }">
          <img class="case-story__img" :src="assetUrl(it.src)" :alt="it.copy.alt ?? ''" loading="lazy" />
          <img
            v-for="a in it.arrows"
            :key="a.src"
            class="case-story__arrow"
            :src="assetUrl(a.src)"
            alt=""
            aria-hidden="true"
            :style="{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%` }"
          />
          <p
            v-if="it.overlayText && it.copy.overlay"
            class="case-story__overlay"
            :class="{ 'case-story__overlay--center': it.overlayText.center, 'case-story__overlay--dark': it.overlayText.dark }"
            :style="{
              left: `${it.overlayText.x}%`,
              top: `${it.overlayText.y}%`,
              width: it.overlayText.w ? `${it.overlayText.w}%` : undefined,
            }"
          >
            {{ it.copy.overlay }}
          </p>
        </div>

        <figure v-else-if="it.kind === 'steps'" class="case-story__steps">
          <figcaption class="case-story__steps-title">{{ stepCopy(it, steps[it.id] ?? 0).title }}</figcaption>
          <div class="case-story__steps-row">
            <div class="case-story__steps-pic" :style="{ aspectRatio: it.ratio }">
              <img
                v-for="(src, si) in it.srcs"
                :key="src"
                class="case-story__img case-story__img--step"
                :class="{ 'case-story__img--step-on': si === (steps[it.id] ?? 0) }"
                :src="assetUrl(src)"
                :alt="si === 0 ? (it.copy.alt ?? '') : ''"
                :aria-hidden="si === 0 ? undefined : 'true'"
                loading="lazy"
              />
            </div>
            <div v-if="it.thermometer" class="case-story__thermo">
              <span class="case-story__thermo-bar" :style="thermoStyle(it.thermometer, steps[it.id] ?? 0)" aria-hidden="true" />
              <span class="case-story__thermo-label">{{ stepCopy(it, steps[it.id] ?? 0).label }}</span>
            </div>
          </div>
        </figure>
      </div>
    </div>
  </article>
</template>
