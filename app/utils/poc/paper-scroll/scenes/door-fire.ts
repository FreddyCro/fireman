// 示範劇本：人走進門 → 門內失火 → 火蓋過人 → 火熄滅、背景轉黑 → 文字。
// 分鏡進度見 architecture/2026-10-13-paper-scroll-design.md。
import type { ElementConfig, SceneConfig, SpriteConfig } from '../types';

const BOTTOM: [number, number] = [0.5, 1];
const WALKER: SpriteConfig = { src: '/poc/paper-scroll/walker.svg', frames: 4, cellW: 240, cellH: 320, anchor: BOTTOM };
const DOOR: SpriteConfig = { src: '/poc/paper-scroll/door.svg', frames: 5, cellW: 320, cellH: 420, anchor: BOTTOM };
const FLAME: SpriteConfig = { src: '/poc/paper-scroll/flame.svg', frames: 4, cellW: 200, cellH: 260, anchor: BOTTOM };

/** 地面 y（設計畫布比例） */
const GROUND = 0.8;
/** 門開口在 door 格子中的比例，與 scripts/poc/generate-sprites.mjs 的 DOOR_OPENING_FRACTIONS 一致（有測試對帳） */
export const DOOR_OPENING: [number, number, number, number] = [0.125, 0.048, 0.75, 0.905];

const flame = (id: string, x: number, mul: number, delay: number): ElementConfig => ({
  id,
  sprite: FLAME,
  frameMode: 'time',
  fps: 10,
  phase: 'random',
  jitter: { rot: 1.5, px: 2 },
  clip: { ref: 'door', rect: DOOR_OPENING, until: 0.6, fade: 0.08 },
  keyframes: [
    { p: 0.38 + delay, x, y: GROUND - 0.02, scale: 0, opacity: 0, layer: 2 },
    { p: 0.42 + delay, scale: 0.4 * mul, opacity: 1, ease: 'out' },
    { p: 0.55, scale: 1.2 * mul, ease: 'inOut' },
    { p: 0.6, layer: 3 },
    { p: 0.78, scale: 4 * mul, fps: 10, ease: 'in' },
    { p: 0.85, opacity: 1 },
    { p: 0.92, scale: 0, opacity: 0, fps: 4, ease: 'inOut' },
  ],
});

export const doorFireScene: SceneConfig = {
  design: { w: 1920, h: 1080 },
  background: [
    { p: 0, color: '#f2e9d8' },
    { p: 0.78, color: '#f2e9d8' },
    { p: 0.92, color: '#000000' },
  ],
  elements: [
    {
      id: 'door',
      sprite: DOOR,
      frameMode: 'scroll',
      range: [0.2, 0.35],
      loop: 'clamp',
      keyframes: [
        { p: 0, x: 0.5, y: GROUND, layer: 1, opacity: 1 },
        { p: 0.8, opacity: 1 },
        { p: 0.88, opacity: 0 },
      ],
    },
    {
      id: 'walker',
      sprite: WALKER,
      frameMode: 'scroll',
      pxPerFrame: 60,
      loop: 'repeat',
      maxStepPerTick: 1,
      clip: { ref: 'door', rect: DOOR_OPENING, from: 0.3 },
      triggers: [{ p: 0.3, set: { frameMode: 'hold', holdFrame: 2 } }],
      keyframes: [
        { p: 0, x: 0.08, y: GROUND, scale: 1, opacity: 1, layer: 2 },
        { p: 0.3, x: 0.5, y: GROUND },
        { p: 0.34, y: GROUND - 0.02, opacity: 1 },
        { p: 0.42, scale: 0.7, opacity: 0, ease: 'in' },
      ],
    },
    flame('flame-a', 0.47, 1, 0.01),
    flame('flame-b', 0.5, 1.3, 0),
    flame('flame-c', 0.53, 1, 0.02),
  ],
};
