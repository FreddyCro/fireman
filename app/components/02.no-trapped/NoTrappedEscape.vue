<!--
  02「超哥故事」捲動動畫：引言之後、美福倉儲之前。分鏡與時間軸在 utils/02.no-trapped/escape.ts，
  設計見 architecture/2026-11-16-no-trapped-escape-design.md。
  三載具構圖不同，各有一份場景；斷點改變時以 :key 重掛 PaperStage。
-->
<script setup lang="ts">
import {
  ESCAPE_CAPTION_PC,
  ESCAPE_CUES,
  ESCAPE_DARK_CUES,
  ESCAPE_TRACK_VH,
  escapeDeviceOf,
  escapePresence,
  escapeScene,
  type EscapeCue,
  type EscapeDevice,
} from '~/utils/02.no-trapped/escape';
import './NoTrappedEscape.scss';

const str = useCopy().noTrapped.escape;

// prerender 不知道寬度，先出 pc；掛載後依寬度決定，之後只在跨斷點時換
const device = ref<EscapeDevice>('pc');
const debug = ref(false);
const onResize = () => {
  device.value = escapeDeviceOf(document.documentElement.clientWidth);
};
onMounted(() => {
  debug.value = new URLSearchParams(location.search).has('debug');
  onResize();
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

const scene = computed(() => escapeScene(device.value));

/** PC 照分鏡定位（設計畫布 1280×720 的比例）；Pad／Mob 交給 CSS */
const captionStyle = (cue: EscapeCue, p: number) => {
  const v = escapePresence(cue, p);
  const base = { opacity: v, visibility: v > 0 ? 'visible' : 'hidden' } as const;
  if (device.value !== 'pc') return base;
  const [x, y, w] = ESCAPE_CAPTION_PC[cue];
  return { ...base, left: `${(x / 1280) * 100}%`, top: `${(y / 720) * 100}%`, width: `${(w / 1280) * 100}%` };
};
</script>

<template>
  <div class="no-trapped-escape" :class="`no-trapped-escape--${device}`">
    <PaperStage :key="device" :scene="scene" :track-vh="ESCAPE_TRACK_VH" :debug="debug" lazy>
      <template #default="{ progress }">
        <p
          v-for="cue in ESCAPE_CUES"
          :key="cue"
          class="no-trapped-escape__caption"
          :class="{ 'no-trapped-escape__caption--dark': ESCAPE_DARK_CUES.includes(cue) }"
          :style="captionStyle(cue, progress)"
        >
          {{ str[cue] }}
        </p>
      </template>
    </PaperStage>
  </div>
</template>
