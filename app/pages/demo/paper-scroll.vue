<script setup lang="ts">
import str from '~/locales/demo-paper.json';
import { sampleNumber } from '~/utils/paper-scroll/keyframes';
import { doorFireScene } from '~/utils/paper-scroll/scenes/door-fire';
import type { Keyframe } from '~/utils/paper-scroll/types';

useHead({ title: str.title });

// 結尾文字：黑底停頓後淡入、微微上移（y 這裡是 px）
const TEXT_KF: Keyframe[] = [
  { p: 0.93, opacity: 0, y: 16 },
  { p: 0.98, opacity: 1, y: 0, ease: 'out' },
];
const textStyle = (p: number) => ({
  opacity: sampleNumber(TEXT_KF, 'opacity', p, 0),
  transform: `translateY(${sampleNumber(TEXT_KF, 'y', p, 0)}px)`,
});
</script>

<template>
  <div class="paper-demo">
    <section class="paper-demo__intro">
      <h1>{{ str.title }}</h1>
      <p>{{ str.intro }}</p>
    </section>

    <PaperStage :scene="doorFireScene" :track-vh="600" debug>
      <template #default="{ progress }">
        <div class="paper-demo__ending" :style="textStyle(progress)">
          <h2>{{ str.ending.title }}</h2>
          <p>{{ str.ending.body }}</p>
        </div>
      </template>
    </PaperStage>

    <section class="paper-demo__outro">
      <p>{{ str.outro }}</p>
    </section>
  </div>
</template>

<style lang="scss">
.paper-demo {
  &__intro,
  &__outro {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 16px;
    text-align: center;
  }

  &__ending {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 24px;
    color: #fff;
    text-align: center;
    will-change: opacity, transform;
  }
}
</style>
