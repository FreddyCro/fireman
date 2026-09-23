<script setup lang="ts">
import type { ModeOverride } from '~/utils/poc/paper-scroll/scene';
import type { ViewportInfo } from '~/utils/poc/paper-scroll/viewport';

defineProps<{
  target: number;
  progress: number;
  fps: number;
  viewport: ViewportInfo | null;
  elements: { id: string; mode: string; frame: number }[];
}>();

const override = defineModel<ModeOverride>('override', { default: 'config' });
const showSafe = defineModel<boolean>('showSafe', { default: true });
const showClips = defineModel<boolean>('showClips', { default: false });
</script>

<template>
  <div class="paper-debug">
    <div class="paper-debug__row">p {{ progress.toFixed(3) }} → {{ target.toFixed(3) }} · {{ fps }} fps</div>
    <div v-if="viewport" class="paper-debug__row">
      stage {{ viewport.width }}×{{ viewport.stageHeight }} · safe {{ viewport.safeHeight }} · dpr {{ viewport.dpr }}
    </div>
    <div class="paper-debug__row">
      <label>
        mode
        <select v-model="override">
          <option value="config">config</option>
          <option value="time">all time</option>
          <option value="scroll">all scroll</option>
        </select>
      </label>
      <label><input v-model="showSafe" type="checkbox" /> safe</label>
      <label><input v-model="showClips" type="checkbox" /> clips</label>
    </div>
    <div v-for="e in elements" :key="e.id" class="paper-debug__row">{{ e.id }} · {{ e.mode }} · #{{ e.frame }}</div>
  </div>
</template>

<style lang="scss">
.paper-debug {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  padding: 8px 10px;
  font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace;
  color: #fff;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  pointer-events: auto;

  &__row {
    display: flex;
    gap: 10px;
    white-space: nowrap;
  }
}
</style>
