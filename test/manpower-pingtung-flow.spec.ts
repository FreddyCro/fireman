// 04 屏東地圖：分鏡資料與小圓點移動（stations.ts、flow.ts）
import { describe, expect, it } from 'vitest';
import { arcPoint, dotOpacity, dotProgress } from '../app/utils/04.manpower/flow';
import { FLOW_DOTS, PINGTUNG_BEATS, STATION_BASE, STATION_IDS } from '../app/utils/04.manpower/stations';

describe('PINGTUNG_BEATS', () => {
  it('換文字的那一格維持上一格的人數與圓點（先換文字，再捲才動）', () => {
    for (let i = 1; i < PINGTUNG_BEATS.length; i++) {
      const prev = PINGTUNG_BEATS[i - 1]!;
      const cur = PINGTUNG_BEATS[i]!;
      if (cur.text === prev.text || !prev.counts) continue;
      expect(cur.counts).toEqual(prev.counts);
      expect(cur.flow).toBe(prev.flow);
      expect(cur.deltas).toEqual(prev.deltas);
    }
  });

  it('標的增減等於相對起點 STATION_BASE 的變化', () => {
    for (const b of PINGTUNG_BEATS) {
      for (const id of STATION_IDS) {
        const d = b.deltas[id];
        if (d != null) expect(b.counts![id] - STATION_BASE[id]).toBe(d);
      }
    }
  });

  it('移過去的人數與小圓點數一致（每條路線 FLOW_DOTS 人）', () => {
    const moved = PINGTUNG_BEATS.find((b) => b.flow === 'jianguo')!;
    expect(STATION_BASE.pingtung - moved.counts!.pingtung).toBe(FLOW_DOTS);
    expect(STATION_BASE.gongguan - moved.counts!.gongguan).toBe(FLOW_DOTS);
  });
});

describe('flow', () => {
  it('弧線兩端是起點、終點', () => {
    expect(arcPoint([0, 0], [10, 0], 0.3, 0)).toEqual([0, 0]);
    expect(arcPoint([0, 0], [10, 0], 0.3, 1)).toEqual([10, 0]);
    expect(arcPoint([0, 0], [10, 0], 0.3, 0.5)[1]).not.toBe(0);
  });

  it('p＝0、1 時所有圓點在端點且隱藏', () => {
    for (let i = 0; i < FLOW_DOTS; i++) {
      expect(dotProgress(0, i, FLOW_DOTS)).toBe(0);
      expect(dotProgress(1, i, FLOW_DOTS)).toBe(1);
      expect(dotOpacity(dotProgress(0, i, FLOW_DOTS))).toBe(0);
      expect(dotOpacity(dotProgress(1, i, FLOW_DOTS))).toBe(0);
    }
  });

  it('移動中前面的圓點領先', () => {
    expect(dotProgress(0.5, 0, FLOW_DOTS)).toBeGreaterThan(dotProgress(0.5, FLOW_DOTS - 1, FLOW_DOTS));
  });
});
