import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MOBILE_BREAKPOINTS,
  PC_BREAKPOINTS,
  TABLET_BREAKPOINTS,
  ULTRA_BREAKPOINTS,
} from '../app/utils/constants';

// SCSS 的 rwd mixin 與 JS 的 matchMedia 各自持有一份斷點，改一邊忘了另一邊不會有任何錯誤訊號。
const scss = readFileSync(resolve(__dirname, '../app/assets/styles/mixins.scss'), 'utf8');

function scssBreakpoint(name: string) {
  const match = scss.match(new RegExp(`'${name}':\\s*(\\d+)px`));
  return match ? Number(match[1]) : undefined;
}

describe('breakpoints', () => {
  it.each([
    ['mobile', MOBILE_BREAKPOINTS],
    ['tablet', TABLET_BREAKPOINTS],
    ['pc', PC_BREAKPOINTS],
    ['ultra', ULTRA_BREAKPOINTS],
  ])('mixins.scss 的 %s 與 constants.ts 一致', (name, value) => {
    expect(scssBreakpoint(name)).toBe(value);
  });
});
