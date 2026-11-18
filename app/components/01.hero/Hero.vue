<!-- 「消防員之死」捲動動畫，原為 fire-story POC 的 C 版（paced）。分鏡與時間軸在 utils/01.hero/scene.ts。 -->
<script setup lang="ts">
import { clamp01, EASE } from '~/utils/paper-scroll/keyframes';
import { deviceOfWidth, type Device } from '~/utils/get-device';
import type { SequenceState } from '~/utils/paper-scroll/sequence';
import {
  HERO_INCIDENT_MOVE,
  HERO_ROLL,
  HERO_TRACK_VH,
  c4Done,
  c4Mid,
  exitPresence,
  heroScene,
  type HeroLocale,
  presence,
  type HeroCue,
} from '~/utils/01.hero/scene';
import './Hero.scss';

const str = useCopy().hero;

// C4 影片三載具各一組。hero 在首屏，不能 prerender 先掛 pc 再換（會白載 pc 素材）：
// client 在 setup 就依寬度決定；場景只影響 canvas，不影響 DOM，hydration 不會不一致。之後跨斷點才重掛
// 標題影片依語系選檔（沒有動態切換語系，換語系＝換頁）
const device = ref<Device>(import.meta.client ? deviceOfWidth(document.documentElement.clientWidth) : 'pc');
const { locale } = useI18n();
const heroLocale: HeroLocale = locale.value === 'en' ? 'en' : 'zh';
const scene = computed(() => heroScene(device.value, heroLocale));
const onResize = () => {
  device.value = deviceOfWidth(document.documentElement.clientWidth);
};
onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

// 除錯面板在手機上會蓋住半個畫面，網址加 ?debug 才開；prerender 時不知道 query，掛載後才判斷以免 hydration 不一致
const debug = ref(false);
onMounted(() => {
  debug.value = new URLSearchParams(location.search).has('debug');
});

type Seq = SequenceState | null;

/** 一般文字：淡入時微微上移 */
const textStyle = (cue: HeroCue, p: number) => {
  const v = presence(cue, p);
  return { opacity: v, transform: `translateY(${(1 - v) * 12}px)`, visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

/** 事件文字：淡入淡出之外，停留期間從畫面下方移到上方（設計稿 1-3 → 2-1）；--t 給 CSS 算位移 */
const incidentStyle = (p: number) => {
  const [a, b] = HERO_INCIDENT_MOVE;
  const v = presence('incident', p);
  return { opacity: v, '--t': EASE.inOut(clamp01((p - a) / (b - a))), visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

/** 4-2 殉職名單：片尾字幕式，跟著捲動從畫面底部一路走到頂部；--t 給 CSS 算位移。要等 4-2 顯示後才可見 */
const rollStyle = (p: number, seq: Seq) => {
  const [a, b] = HERO_ROLL;
  const t = clamp01((p - a) / (b - a));
  const on = c4Mid(seq) && t > 0 && t < 1;
  return { '--t': t, visibility: on ? 'visible' : 'hidden' } as const;
};

/**
 * 教訓文字。進場不看進度：4-3 播完後由外層 .sec-hero__lesson--on 的 CSS transition 在原地淡入
 * （不靠每幀重繪，停著不捲也會出現），這裡只負責跟著捲動退場。
 */
const lessonStyle = (p: number, seq: Seq) => {
  const v = c4Done(seq) ? exitPresence('lesson', p) : 0;
  return { opacity: v, visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

</script>

<template>
  <section id="hero" class="sec-hero">
    <PaperStage :key="device" :scene="scene" :track-vh="HERO_TRACK_VH" :debug="debug">
      <template #default="{ progress, sequence }">
        <div class="sec-hero__incident" :style="incidentStyle(progress)">
          <p class="sec-hero__incident-date">{{ str.incident.date }}</p>
          <p class="sec-hero__incident-body">{{ str.incident.body }}</p>
        </div>
        <p class="sec-hero__caption" :style="textStyle('mask', progress)">{{ str.mask }}</p>
        <p class="sec-hero__line sec-hero__line--last" :style="textStyle('lastWords', progress)">
          <span v-for="l in str.lastWords" :key="l">{{ l }}</span>
        </p>
        <p class="sec-hero__caption sec-hero__caption--victim" :style="textStyle('victim', progress)">{{ str.victim }}</p>
        <div class="sec-hero__roll" :style="rollStyle(progress, sequence)">
          <p class="sec-hero__roll-head">
            <span v-for="l in str.count" :key="l">{{ l }}</span>
          </p>
          <ul class="sec-hero__roll-list">
            <li v-for="p in str.roll.names" :key="p.name" class="sec-hero__roll-item">
              <span class="sec-hero__roll-name">{{ p.name }}</span>
              <span class="sec-hero__roll-date">{{ p.date }}</span>
            </li>
          </ul>
        </div>
        <div class="sec-hero__lesson" :class="{ 'sec-hero__lesson--on': c4Done(sequence) }">
          <div class="sec-hero__line sec-hero__line--lesson" :style="lessonStyle(progress, sequence)">
            <p v-for="(para, i) in str.lesson" :key="i" class="sec-hero__lesson-para">
              <span v-for="l in para" :key="l" class="sec-hero__lesson-text">{{ l }}</span>
            </p>
          </div>
        </div>
        <!-- 畫面上的標題是場景裡的影片（scene.ts title），這裡只留給螢幕閱讀器與 SEO -->
        <h1 class="sec-hero__title">{{ str.pageTitle }}</h1>
      </template>
    </PaperStage>
  </section>
</template>
