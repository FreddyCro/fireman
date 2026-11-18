<!-- 「消防員之死」捲動動畫，原為 fire-story POC 的 C 版（paced）。分鏡與時間軸在 utils/01.hero/scene.ts。 -->
<script setup lang="ts">
import { deviceOfWidth, type Device } from '~/utils/get-device';
import type { SequenceState } from '~/utils/paper-scroll/sequence';
import {
  HERO_FIRST_IMAGE,
  HERO_TRACK_VH,
  c4Done,
  c4Mid,
  exitPresence,
  heroScene,
  type HeroLocale,
  presence,
  type HeroCue,
  type HeroScrollCue,
  scrollT,
} from '~/utils/01.hero/scene';
import './Hero.scss';

const str = useCopy().hero;

// 設計師回饋（FEEDBACK_1 hero-1）：第一張窗戶圖 preload，免得一進站畫面全黑。場景也把它標成 priority，載到就開始畫
const assetUrl = useAssetUrl();
useHead({
  link: [{ rel: 'preload', as: 'image', href: assetUrl(HERO_FIRST_IMAGE), fetchpriority: 'high', type: 'image/webp' }],
});

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

// 設計師回饋（FEEDBACK_1 hero-2）：文字動態只有兩種

/** a. 向上滾動：從畫面底下進來、往上滑走，不淡入淡出；--t 給 CSS（.sec-hero__scroll）算位移 */
const scrollStyle = (cue: HeroScrollCue, p: number, on = true) => {
  const t = scrollT(cue, p);
  return { '--t': t, visibility: on && t > 0 && t < 1 ? 'visible' : 'hidden' } as const;
};

/** b. 原地淡入淡出 */
const fadeStyle = (cue: HeroCue, p: number) => {
  const v = presence(cue, p);
  return { opacity: v, visibility: v > 0 ? 'visible' : 'hidden' } as const;
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
        <div class="sec-hero__scroll sec-hero__incident" :style="scrollStyle('incident', progress)">
          <p class="sec-hero__incident-date">{{ str.incident.date }}</p>
          <p class="sec-hero__incident-body">{{ str.incident.body }}</p>
        </div>
        <p class="sec-hero__scroll sec-hero__caption" :style="scrollStyle('mask', progress)">{{ str.mask }}</p>
        <p class="sec-hero__line sec-hero__line--last" :style="fadeStyle('lastWords', progress)">
          <span v-for="l in str.lastWords" :key="l">{{ l }}</span>
        </p>
        <!-- 4-1 播完（4-2 出現）才可見：說明文字、27 名、名單一起片尾字幕式往上 -->
        <div class="sec-hero__scroll sec-hero__roll" :style="scrollStyle('roll', progress, c4Mid(sequence))">
          <p class="sec-hero__caption sec-hero__caption--victim">{{ str.victim }}</p>
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
