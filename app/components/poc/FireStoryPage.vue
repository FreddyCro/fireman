<!-- fire-story 兩個版本共用的頁面內容：variant 決定 C4 用 scrub（A）或 trigger（B）場景，以及幾處文字的顯示門檻。 -->
<script setup lang="ts">
import str from '~/locales/poc/fire-story.json';
import { clamp01, EASE } from '~/utils/poc/paper-scroll/keyframes';
import {
  FIRE_STORY_AUTO_ROLL,
  FIRE_STORY_ROLL,
  FIRE_STORY_TEXT,
  c4Done,
  c4Mid,
  exitPresence,
  fireStoryAutoScene,
  fireStoryScene,
  type FireStoryVariant,
} from '~/utils/poc/paper-scroll/scenes/fire-story';
import type { SequenceState } from '~/utils/poc/paper-scroll/sequence';

const props = defineProps<{ variant: FireStoryVariant }>();

const scene = props.variant === 'trigger' ? fireStoryAutoScene : fireStoryScene;
const roll = props.variant === 'trigger' ? FIRE_STORY_AUTO_ROLL : FIRE_STORY_ROLL;
const other =
  props.variant === 'trigger'
    ? { to: '/poc/fire-story', label: str.variants.scrub }
    : { to: '/poc/fire-story-auto', label: str.variants.trigger };

useHead({ title: str.title });

// 除錯面板在手機上會蓋住半個畫面，網址加 ?debug 才開；prerender 時不知道 query，掛載後才判斷以免 hydration 不一致
const debug = ref(false);
onMounted(() => {
  debug.value = new URLSearchParams(location.search).has('debug');
});

type Cue = keyof typeof FIRE_STORY_TEXT;
type Seq = SequenceState | null;

/** 0 → 1 → 0：進場淡入、退場淡出 */
function presence(cue: Cue, p: number) {
  const { in: [a, b], out: [c, d] } = FIRE_STORY_TEXT[cue];
  if (p < c) return EASE.out(clamp01((p - a) / (b - a)));
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}

/** 一般文字：淡入時微微上移；gate 為 false 時整段不顯示（B 版要等影片播完） */
const textStyle = (cue: Cue, p: number, gate = true) => {
  const v = gate ? presence(cue, p) : 0;
  return { opacity: v, transform: `translateY(${(1 - v) * 12}px)`, visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

/** 4-2 殉職名單：片尾字幕式，跟著捲動從畫面底部一路走到頂部；--t 給 CSS 算位移。B 版要等 4-2 顯示後才可見 */
const rollStyle = (p: number, seq: Seq) => {
  const [a, b] = roll;
  const t = clamp01((p - a) / (b - a));
  const on = c4Mid(seq, scene) && t > 0 && t < 1;
  return { '--t': t, visibility: on ? 'visible' : 'hidden' } as const;
};

/**
 * 教訓文字。A 版照進度進出場。B 版進場不看進度：4-3 播完後由外層 .fire-story__lesson--on 的 CSS transition
 * 在原地淡入（不靠每幀重繪，停著不捲也會出現），這裡只負責跟著捲動退場。
 */
const lessonStyle = (p: number, seq: Seq) => {
  if (props.variant === 'scrub') return textStyle('lesson', p);
  const v = c4Done(seq, scene) ? exitPresence('lesson', p) : 0;
  return { opacity: v, visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

/** 標題：退場用模糊、放大、字距拉開代替粉末化（佔位，等動畫師的版本）。B 版要等 4-3 播完 */
const titleStyle = (p: number, seq: Seq) => {
  const { out: [c, d] } = FIRE_STORY_TEXT.title;
  const v = c4Done(seq, scene) ? presence('title', p) : 0;
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
  <div class="fire-story">
    <section class="fire-story__intro">
      <h1>{{ str.title }}</h1>
      <p>{{ str.intro }}</p>
      <p class="fire-story__variant">
        {{ str.variants[variant] }} ·
        <NuxtLink :to="other.to">{{ str.switchTo }}{{ other.label }}</NuxtLink>
      </p>
    </section>

    <PocPaperStage :scene="scene" :track-vh="1800" :debug="debug">
      <template #default="{ progress, sequence }">
        <div class="fire-story__incident" :style="textStyle('incident', progress)">
          <p class="fire-story__incident-date">{{ str.incident.date }}</p>
          <p class="fire-story__incident-body">{{ str.incident.body }}</p>
        </div>
        <p class="fire-story__caption" :style="textStyle('mask', progress)">{{ str.mask }}</p>
        <p class="fire-story__line" :style="textStyle('lastWords', progress)">{{ str.lastWords }}</p>
        <p class="fire-story__caption" :style="textStyle('victim', progress)">{{ str.victim }}</p>
        <div class="fire-story__roll" :style="rollStyle(progress, sequence)">
          <p class="fire-story__roll-head">
            <span>{{ str.count.number }}</span>
            <span>{{ str.count.label }}</span>
          </p>
          <ul class="fire-story__roll-list">
            <li v-for="name in str.roll.names" :key="name">{{ name }}</li>
          </ul>
        </div>
        <div class="fire-story__lesson" :class="{ 'fire-story__lesson--on': c4Done(sequence, scene) }">
          <p class="fire-story__line" :style="lessonStyle(progress, sequence)">
            <span v-for="l in str.lesson" :key="l">{{ l }}</span>
          </p>
        </div>
        <h2 class="fire-story__title" :style="titleStyle(progress, sequence)">{{ str.pageTitle }}</h2>
      </template>
    </PocPaperStage>

    <section class="fire-story__outro">
      <p>{{ str.outro }}</p>
    </section>
  </div>
</template>

<style lang="scss">
// overlay 是 container（PaperStage），字級用 cqw 跟著畫面寬（手機滿版、桌機置中直欄）縮放
.fire-story {
  background: #000;
  color: #fff;

  &__intro,
  &__outro {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 16px;
    text-align: center;
  }

  &__variant {
    margin-top: 24px;
    font-size: 14px;
    opacity: 0.8;

    a {
      color: inherit;
    }
  }

  &__incident,
  &__line,
  &__caption,
  &__roll,
  &__title {
    position: absolute;
    left: 0;
    right: 0;
    margin: 0;
    padding: 0 6cqw;
    text-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
    will-change: opacity, transform;
  }

  &__incident {
    top: 12cqh;
  }

  &__incident-date {
    margin: 0 0 6cqw;
    font-family: 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif;
    font-size: 7cqw;
    letter-spacing: 0.08em;
    text-align: center;
  }

  &__incident-body {
    margin: 0;
    font-size: 4cqw;
    line-height: 2;
    letter-spacing: 0.12em;
  }

  &__line {
    top: 50%;
    display: flex;
    flex-direction: column;
    gap: 2cqw;
    font-size: 4cqw;
    letter-spacing: 0.12em;
    text-align: center;
    translate: 0 -50%;
  }

  &__caption {
    bottom: 8cqh;
    font-size: 3.6cqw;
    line-height: 1.9;
    letter-spacing: 0.1em;
  }

  // B 版教訓文字的時間淡入層：4-3 淡黑（400ms）後再花 600ms 淡入；關閉時立刻開始淡出。
  // 內層 .fire-story__line 的 inline opacity 只管跟著捲動退場，兩層分開才不會讓 transition 拖慢捲動驅動的變化。
  &__lesson {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 600ms ease;

    &--on {
      opacity: 1;
      transition-delay: 400ms;
    }
  }

  // 片尾字幕式名單：元素頂端貼齊容器底部，--t 0→1 時往上移「自身高度 + 容器高度」，
  // 所以 t=1 時名單底部剛好離開容器頂端（translateY 的 % 是相對自身高度）
  &__roll {
    top: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4cqw;
    text-align: center;
    letter-spacing: 0.1em;
    transform: translateY(calc(var(--t) * (-100% - 100cqh)));
  }

  &__roll-head {
    display: flex;
    flex-direction: column;
    gap: 1cqw;
    margin: 0;
    font-size: 4.4cqw;
  }

  &__roll-list {
    display: flex;
    flex-direction: column;
    gap: 1.6cqw;
    margin: 0;
    padding: 0;
    font-size: 3.6cqw;
    line-height: 1.6;
    list-style: none;
  }

  &__title {
    top: 50%;
    font-family: 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif;
    font-size: 15cqw;
    font-weight: 900;
    line-height: 1.15;
    text-align: center;
    writing-mode: vertical-rl;
    margin: 0 auto;
    width: fit-content;
    padding: 0;
    translate: 0 -50%;
  }
}
</style>
