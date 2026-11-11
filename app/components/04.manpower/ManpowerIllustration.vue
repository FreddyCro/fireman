<!--
  04 8 人小分隊插畫（設計稿 pc 2423:5598、pad 2423:26591、mob 2423:16354）。
  跑道依說明句數分段，舞台 sticky 100svh：說明在上（逐句淡入淡出）、插畫在下；
  插畫暫時兩張，前半段第一張、後半段第二張原地淡入淡出置換。
-->
<script setup lang="ts">
import { useStepTrack } from '~/composables/04.manpower/useStepTrack';
import { ILLUSTRATIONS } from '~/utils/04.manpower/illustration';
import './ManpowerIllustration.scss';

const props = defineProps<{ lines: string[] }>();

const track = ref<HTMLElement | null>(null);
// 至少兩段，插畫才有得換
const steps = computed(() => Math.max(props.lines.length, ILLUSTRATIONS.length));
const { active, progress } = useStepTrack(track, steps);

const activeLine = computed(() => Math.min(active.value, props.lines.length - 1));
const activePic = computed(() => Math.min(Math.floor(progress.value * ILLUSTRATIONS.length), ILLUSTRATIONS.length - 1));
</script>

<template>
  <div ref="track" class="mp-illustration" :style="{ '--steps': steps }">
    <figure class="mp-illustration__stage">
      <figcaption class="mp-illustration__lines">
        <p
          v-for="(line, i) in lines"
          :key="i"
          class="mp-illustration__line"
          :class="{ 'mp-illustration__line--active': i === activeLine }"
          :aria-hidden="i !== activeLine"
        >
          {{ line }}
        </p>
      </figcaption>
      <div class="mp-illustration__pics">
        <UPic
          v-for="(src, i) in ILLUSTRATIONS"
          :key="src"
          :classname="`mp-illustration__pic${i === activePic ? ' mp-illustration__pic--active' : ''}`"
          :src="src"
          ext="png"
          :srcset="['pc', 'pad', 'mob']"
          default="pc"
          :use2x="false"
          :webp="false"
          alt=""
        />
      </div>
    </figure>
  </div>
</template>
