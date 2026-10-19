// 場景設定檔的型別。所有數值都是「進度 p（0～1）的函數」，往回捲自然可逆。
export type EaseName = 'linear' | 'in' | 'out' | 'inOut';
export type FrameMode = 'time' | 'scroll' | 'hold';
export type LoopMode = 'repeat' | 'pingpong' | 'clamp';

export type NumericProp = 'x' | 'y' | 'scale' | 'rot' | 'opacity' | 'fps';

export interface Keyframe {
  p: number;
  /** 由前一幀到此幀所用的 easing（預設 linear） */
  ease?: EaseName;
  /** x、y 為設計畫布的 0～1 比例；rot 為度 */
  x?: number;
  y?: number;
  scale?: number;
  rot?: number;
  opacity?: number;
  fps?: number;
  /** 階梯屬性：取最後一個 p <= 進度 的值 */
  layer?: number;
}

export interface SpriteConfig {
  src: string;
  /** video：src 是影片，frames 固定 1，cellW／cellH 是影片在設計畫布上的尺寸 */
  kind?: 'image' | 'video';
  frames: number;
  cellW: number;
  cellH: number;
  /** 定位與旋轉錨點（格子的比例），預設 [0.5, 1] 底部中央 */
  anchor?: [number, number];
}

/** 影片播放方式：scroll 依進度區間 scrub（素材需逐格 keyframe）；loop 依時鐘循環播放，看不到時暫停 */
export type PlaybackConfig = { mode: 'scroll'; range: [number, number] } | { mode: 'loop' };

export interface ClipConfig {
  /** 參考元素 id，rect 是它目前繪製格子的比例 [x, y, w, h] */
  ref: string;
  rect: [number, number, number, number];
  from?: number;
  until?: number;
  /** 解除前 fade 這段進度內把裁切矩形放大到 4×，避免突然跳出 */
  fade?: number;
}

export interface Trigger {
  p: number;
  set: Partial<Omit<ElementConfig, 'id' | 'sprite' | 'keyframes' | 'triggers'>>;
}

export interface ElementConfig {
  id: string;
  sprite: SpriteConfig;
  frameMode: FrameMode;
  /** time 模式 */
  fps?: number;
  phase?: number | 'random';
  /** scroll 模式：二選一。pxPerFrame 每捲 N px 換一格；range 把進度區間平均分給各格 */
  pxPerFrame?: number;
  range?: [number, number];
  loop?: LoopMode;
  /** 每 tick 最多前進幾格（0 = 不限），預設 1 */
  maxStepPerTick?: number;
  /** hold 模式 */
  holdFrame?: number;
  /** 換格時的隨機擺動：rot 度、px 設計畫布像素 */
  jitter?: { rot?: number; px?: number };
  clip?: ClipConfig;
  /** 僅 sprite.kind = 'video' */
  playback?: PlaybackConfig;
  keyframes: Keyframe[];
  triggers?: Trigger[];
}

export interface BackgroundStop {
  p: number;
  color: string;
}

/**
 * cover：填滿舞台、裁掉多出來的部分。contain：整張放進舞台，其餘露出背景色。
 * smart：cover 會裁掉超過 maxCrop 的寬或高時改用 contain（直式素材：手機 cover、桌機變置中直欄）。
 */
export type FitMode = 'cover' | 'contain' | 'smart';

export interface SceneConfig {
  design: { w: number; h: number };
  /** 預設 cover */
  fit?: FitMode;
  /** smart 模式容許 cover 裁掉的比例，預設 0.25 */
  maxCrop?: number;
  /** 設計畫布在舞台中的對齊，預設靠上置中 {x: 0.5, y: 0} */
  anchor?: { x: number; y: number };
  background: BackgroundStop[];
  elements: ElementConfig[];
}
