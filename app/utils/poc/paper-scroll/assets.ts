import type { LoadedStrip } from './scene';

/**
 * 載入 sprite strip 並一次點陣化成 ImageBitmap（SVG 每幀 drawImage 會重新點陣化，Safari 特別慢）。
 * 不支援 createImageBitmap 時退回複製到 canvas。
 */
export async function loadStrip(url: string, cellW: number, frames: number): Promise<LoadedStrip> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  let source: CanvasImageSource = img;
  try {
    source = await createImageBitmap(img);
  } catch {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')?.drawImage(img, 0, 0);
    source = c;
  }
  return { source, pixelRatio: img.naturalWidth / (cellW * frames) };
}

/**
 * 載入影片（muted + playsinline 才能在 iOS 自動播放）。先 play 一下再暫停：
 * iOS Safari 不播放就不會解碼第一格，loadeddata 永遠等不到。
 */
export async function loadVideo(url: string, cellW: number): Promise<LoadedStrip> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'auto';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.src = url;
  const loaded = new Promise<void>((resolve, reject) => {
    if (video.readyState >= 2) return resolve();
    video.addEventListener('loadeddata', () => resolve(), { once: true });
    video.addEventListener('error', () => reject(video.error), { once: true });
  });
  void video.play().catch(() => {});
  await loaded;
  video.pause();
  video.currentTime = 0;
  return { source: video, pixelRatio: video.videoWidth / cellW, video };
}
