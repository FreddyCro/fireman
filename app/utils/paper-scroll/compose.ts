// 單一元素的離屏合成：逐格交叉淡化（見 frame.ts scrollBlend）與邊緣遮罩（見 edge-mask.ts）共用一張暫存 canvas。
//
// 交叉淡化用 'lighter'（premultiplied 顏色相加）把兩格依權重 (1 − mix, mix) 疊在透明的暫存 canvas 上，
// 結果正好是兩格的線性內插：不透明 JPG 不會在中段變暗，透明 PNG 也不會殘留前一格的完整身影。
// 再視需要 destination-in 乘上遮罩，最後以元素的 opacity 畫回主畫布。
import { edgeMaskAlpha, type EdgeMaskConfig } from './edge-mask';

export interface ComposeLayer {
  source: CanvasImageSource;
  /** 來源矩形（裝置像素） */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** 權重 0～1，各層加總應為 1 */
  weight: number;
}

const MAX_SIDE = 4096;
const CACHE_LIMIT = 8;

/** 暫存 canvas 與遮罩快取；每個場景一個 */
export class Composer {
  private buffer: HTMLCanvasElement | null = null;
  private masks = new Map<string, HTMLCanvasElement>();

  private mask(w: number, h: number, m: EdgeMaskConfig): HTMLCanvasElement {
    const key = `${w}x${h}|${JSON.stringify(m)}`;
    const hit = this.masks.get(key);
    if (hit) {
      // 移到最後＝最近用過
      this.masks.delete(key);
      this.masks.set(key, hit);
      return hit;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(w, h);
    const alpha = edgeMaskAlpha(w, h, m);
    for (let i = 0; i < alpha.length; i++) img.data[i * 4 + 3] = alpha[i]!;
    ctx.putImageData(img, 0, 0);
    this.masks.set(key, c);
    if (this.masks.size > CACHE_LIMIT) this.masks.delete(this.masks.keys().next().value!);
    return c;
  }

  /**
   * 把 layers 合成後畫到目前座標系的 (dx, dy, dw, dh)，globalAlpha 沿用呼叫端設定（元素的 opacity）。
   * 暫存解析度依目前的變換換算成裝置像素，縮放後不會糊。
   */
  draw(
    ctx: CanvasRenderingContext2D,
    layers: ComposeLayer[],
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    mask?: EdgeMaskConfig,
  ) {
    const t = ctx.getTransform();
    const k = Math.hypot(t.a, t.b);
    const w = Math.max(1, Math.min(MAX_SIDE, Math.round(dw * k)));
    const h = Math.max(1, Math.min(MAX_SIDE, Math.round(dh * k)));
    const buf = (this.buffer ??= document.createElement('canvas'));
    if (buf.width !== w || buf.height !== h) {
      buf.width = w;
      buf.height = h;
    } else {
      buf.getContext('2d')!.clearRect(0, 0, w, h);
    }
    const b = buf.getContext('2d')!;
    b.globalCompositeOperation = 'lighter';
    for (const l of layers) {
      if (l.weight <= 0) continue;
      b.globalAlpha = l.weight;
      b.drawImage(l.source, l.sx, l.sy, l.sw, l.sh, 0, 0, w, h);
    }
    b.globalAlpha = 1;
    if (mask) {
      b.globalCompositeOperation = 'destination-in';
      b.drawImage(this.mask(w, h, mask), 0, 0);
    }
    b.globalCompositeOperation = 'source-over';
    ctx.drawImage(buf, 0, 0, w, h, dx, dy, dw, dh);
  }
}
