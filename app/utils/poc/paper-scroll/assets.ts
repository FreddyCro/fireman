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
