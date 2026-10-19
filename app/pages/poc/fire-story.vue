<script setup lang="ts">
import str from '~/locales/poc/fire-story.json';
import { clamp01, EASE } from '~/utils/poc/paper-scroll/keyframes';
import { FIRE_STORY_TEXT, fireStoryScene } from '~/utils/poc/paper-scroll/scenes/fire-story';

useHead({ title: str.title });

// 除錯面板在手機上會蓋住半個畫面，網址加 ?debug 才開；prerender 時不知道 query，掛載後才判斷以免 hydration 不一致
const debug = ref(false);
onMounted(() => {
  debug.value = new URLSearchParams(location.search).has('debug');
});

type Cue = keyof typeof FIRE_STORY_TEXT;

/** 0 → 1 → 0：進場淡入、退場淡出 */
function presence(cue: Cue, p: number) {
  const { in: [a, b], out: [c, d] } = FIRE_STORY_TEXT[cue];
  if (p < c) return EASE.out(clamp01((p - a) / (b - a)));
  return 1 - EASE.in(clamp01((p - c) / (d - c)));
}

/** 一般文字：淡入時微微上移 */
const textStyle = (cue: Cue, p: number) => {
  const v = presence(cue, p);
  return { opacity: v, transform: `translateY(${(1 - v) * 12}px)`, visibility: v > 0 ? 'visible' : 'hidden' } as const;
};

/** 標題：退場用模糊、放大、字距拉開代替粉末化（佔位，等動畫師的版本） */
const titleStyle = (p: number) => {
  const { out: [c, d] } = FIRE_STORY_TEXT.title;
  const v = presence('title', p);
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
    </section>

    <PocPaperStage :scene="fireStoryScene" :track-vh="1800" :debug="debug">
      <template #default="{ progress }">
        <div class="fire-story__incident" :style="textStyle('incident', progress)">
          <p class="fire-story__incident-date">{{ str.incident.date }}</p>
          <p class="fire-story__incident-body">{{ str.incident.body }}</p>
        </div>
        <p class="fire-story__line" :style="textStyle('lastWords', progress)">{{ str.lastWords }}</p>
        <p class="fire-story__caption" :style="textStyle('victim', progress)">{{ str.victim }}</p>
        <p class="fire-story__count" :style="textStyle('count', progress)">
          <span>{{ str.count.number }}</span>
          <span>{{ str.count.label }}</span>
        </p>
        <p class="fire-story__line" :style="textStyle('lesson', progress)">
          <span v-for="l in str.lesson" :key="l">{{ l }}</span>
        </p>
        <h2 class="fire-story__title" :style="titleStyle(progress)">{{ str.pageTitle }}</h2>
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

  &__incident,
  &__line,
  &__caption,
  &__count,
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

  &__count {
    bottom: 8cqh;
    display: flex;
    flex-direction: column;
    gap: 1cqw;
    font-size: 4.4cqw;
    letter-spacing: 0.1em;
    text-align: center;
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
