// 影片元素：scroll 模式依進度 scrub（素材要逐格 keyframe，否則每次 seek 都要從前一個 keyframe 解碼），
// loop 模式照時鐘循環播放、看不到時暫停。canvas 直接 drawImage(video)。
import { clamp01 } from './keyframes';
import type { PlaybackConfig } from './types';

/** scroll 模式：進度 → 影片秒數。停在最後一格之前，避免 seek 到 duration 時部分瀏覽器畫出黑格 */
export function scrubTime(range: [number, number], p: number, duration: number, fps = 30): number {
  const [from, to] = range;
  const t = to > from ? clamp01((p - from) / (to - from)) : 1;
  return t * Math.max(0, duration - 1 / fps);
}

export function syncVideo(
  video: HTMLVideoElement,
  playback: PlaybackConfig,
  p: number,
  visible: boolean,
  reduceMotion: boolean,
) {
  if (playback.mode === 'loop') {
    if (visible && !reduceMotion) {
      if (video.paused) void video.play().catch(() => {});
    } else if (!video.paused) video.pause();
    return;
  }
  if (!video.paused) video.pause();
  // 看不到時也先 seek，淡入時才會是正確的那一格；超出區間後目標不變，不會一直 seek
  if (video.seeking || !Number.isFinite(video.duration)) return;
  const t = scrubTime(playback.range, p, video.duration);
  if (Math.abs(video.currentTime - t) > 1 / 120) video.currentTime = t;
}
