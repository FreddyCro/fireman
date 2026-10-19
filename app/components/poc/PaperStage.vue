<!-- sticky 舞台 + canvas。跑道高度 trackVh（vh），舞台 100lvh；文字 overlay 由 slot 提供並拿到 progress。 -->
<script setup lang="ts">
import type { ModeOverride } from '~/utils/poc/paper-scroll/scene';
import { usePaperScene } from '~/composables/poc/usePaperScene';
import type { SceneConfig } from '~/utils/poc/paper-scroll/types';

const props = withDefaults(defineProps<{ scene: SceneConfig; trackVh?: number; debug?: boolean }>(), {
  trackVh: 600,
  debug: false,
});

const track = ref<HTMLElement | null>(null);
const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const assetUrl = useAssetUrl();

const { target, progress, fps, viewport, designRect, elements, showClips, sequence, setOverride } = usePaperScene({
  track,
  stage,
  canvas,
  scene: props.scene,
  assetUrl,
});

const override = ref<ModeOverride>('config');
watch(override, setOverride);
const showSafe = ref(true);

// overlay 只蓋在看得到的設計畫布上（contain 時是置中直欄），文字可用 cqw／cqh 跟著縮放
const overlayStyle = computed(() => {
  const r = designRect.value;
  return r ? { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` } : { inset: 0 };
});
</script>

<template>
  <div ref="track" class="paper-stage" :style="{ '--paper-track': trackVh }">
    <div ref="stage" class="paper-stage__stage">
      <canvas ref="canvas" class="paper-stage__canvas" />
      <div class="paper-stage__overlay" :style="overlayStyle"><slot :progress="progress" :sequence="sequence" /></div>
      <div
        v-if="debug && showSafe && viewport"
        class="paper-stage__safe"
        :style="{ height: `${viewport.safeHeight}px` }"
      />
      <PocPaperDebug
        v-if="debug"
        v-model:override="override"
        v-model:show-safe="showSafe"
        v-model:show-clips="showClips"
        :target="target"
        :progress="progress"
        :fps="fps"
        :viewport="viewport"
        :elements="elements"
      />
    </div>
  </div>
</template>

<style lang="scss">
.paper-stage {
  position: relative;
  height: calc(var(--paper-track) * 1vh);

  &__stage {
    position: sticky;
    top: 0;
    height: 100vh;
    height: 100lvh; // 手機網址列收起時的高度；伸縮時不變，不會跳
    overflow: hidden;
    background: #000;
  }

  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  &__overlay {
    position: absolute;
    container-type: size;
    pointer-events: none;
  }

  // 安全區（網址列出現時也看得到的高度）底線
  &__safe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border-bottom: 1px dashed rgba(255, 0, 0, 0.7);
    pointer-events: none;
  }
}
</style>
