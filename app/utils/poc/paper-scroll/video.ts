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
  if (playback.mode === 'trigger') return; // 由場景的 sequence 控制播放與重置（見 sequence.ts）
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

/**
 * sequence 的指令：play 從頭播放；reset 暫停並回到第一格。
 * loadVideo 預設 loop = true（給 loop 模式用），有 loop 的影片 ended 永遠是 false、播到底會跳回 0，
 * 所以 trigger 影片一拿到序列指令就把 loop 關掉，播完才會停在最後一格。
 */
export function applySequenceEvent(video: HTMLVideoElement, type: 'play' | 'reset') {
  video.loop = false;
  if (!video.paused) video.pause();
  video.currentTime = 0;
  if (type === 'play') void video.play().catch(() => {});
}

/** duration 還不知道時（metadata 未到）時間保險用的片長 */
const FALLBACK_DURATION_S = 5;

/**
 * 原速播到底了。elapsedMs 是進區後經過的時間：play() 被瀏覽器拒絕或解碼卡住時影片會停在第 0 格，
 * 超過「片長 + 1 秒」就當播完，序列才不會永遠卡在 playing。
 */
export function videoEnded(video: HTMLVideoElement, elapsedMs: number): boolean {
  const duration = Number.isFinite(video.duration) ? video.duration : FALLBACK_DURATION_S;
  if (video.ended || (Number.isFinite(video.duration) && video.currentTime >= duration - 0.05)) return true;
  return elapsedMs > duration * 1000 + 1000;
}
