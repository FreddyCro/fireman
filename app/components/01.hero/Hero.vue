<!-- 「消防員之死」捲動動畫，來自 POC C 版（/poc/fire-story-paced）。分鏡與時間軸在 utils/01.hero/scene.ts。 -->
<script setup lang="ts">
import { clamp01 } from '~/utils/paper-scroll/keyframes';
import type { SequenceState } from '~/utils/paper-scroll/sequence';
import {
  HERO_ROLL,
  HERO_TEXT,
  HERO_TRACK_VH,
  c4Done,
  c4Mid,
  exitPresence,
  heroScene,
  presence,
  type HeroCue,
} from '~/utils/01.hero/scene';
import './Hero.scss';

const str = useCopy().hero;

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

/** 標題：退場用模糊、放大、字距拉開代替粉末化（佔位，等動畫師的版本）。要等 4-3 播完 */
const titleStyle = (p: number, seq: Seq) => {
  const { out: [c, d] } = HERO_TEXT.title;
  const v = c4Done(seq) ? presence('title', p) : 0;
  const t = clamp01((p - c) / (d - c));
  return {
    opacity: v,
    filter: `blur(${t * 14}px)`,
    letterSpacing: `${t * 0.6}em`,
    transform: `scale(${1 + t * 0.15})`,
    visibility: v > 0 ? 'visible' : 'hidden',
  } as const;
};
</script>

<template>
  <section id="hero" class="sec-hero">
    <PaperStage :scene="heroScene" :track-vh="HERO_TRACK_VH" :debug="debug">
      <template #default="{ progress, sequence }">
        <div class="sec-hero__incident" :style="textStyle('incident', progress)">
          <p class="sec-hero__incident-date">{{ str.incident.date }}</p>
          <p class="sec-hero__incident-body">{{ str.incident.body }}</p>
        </div>
        <p class="sec-hero__caption" :style="textStyle('mask', progress)">{{ str.mask }}</p>
        <p class="sec-hero__line" :style="textStyle('lastWords', progress)">{{ str.lastWords }}</p>
        <p class="sec-hero__caption" :style="textStyle('victim', progress)">{{ str.victim }}</p>
        <div class="sec-hero__roll" :style="rollStyle(progress, sequence)">
          <p class="sec-hero__roll-head">
            <span>{{ str.count.number }}</span>
            <span>{{ str.count.label }}</span>
          </p>
          <ul class="sec-hero__roll-list">
            <li v-for="name in str.roll.names" :key="name">{{ name }}</li>
          </ul>
        </div>
        <div class="sec-hero__lesson" :class="{ 'sec-hero__lesson--on': c4Done(sequence) }">
          <p class="sec-hero__line" :style="lessonStyle(progress, sequence)">
            <span v-for="l in str.lesson" :key="l">{{ l }}</span>
          </p>
        </div>
        <h1 class="sec-hero__title" :style="titleStyle(progress, sequence)">{{ str.pageTitle }}</h1>
      </template>
    </PaperStage>
  </section>
</template>
