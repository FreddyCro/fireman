// 04 四縣市地圖：各鄉鎮 2024 年火災通報數（app/assets/data/manpower-fire-counts.json）與圖資對得上
import { describe, expect, it } from 'vitest';
import counts from '../app/assets/data/manpower-fire-counts.json';
import topo from '../app/assets/data/tw-towns-full.json';

const COUNTIES: Record<string, number> = {
  // 縣市代碼 → 消防年報 2024 年火災總數（xlsx 註明「完全符合」）
  '10013': 1510, // 屏東縣
  '65000': 1630, // 新北市
  '68000': 1206, // 桃園市
  '66000': 1320, // 臺中市
};

type Props = { TOWNCODE: string; COUNTYCODE: string; TOWNNAME: string };
const towns = (topo as unknown as { objects: { towns: { geometries: { properties: Props }[] } } }).objects.towns.geometries
  .map((g) => g.properties)
  .filter((p) => p.COUNTYCODE in COUNTIES);
const data = counts as Record<string, number>;

describe('各鄉鎮火災通報數', () => {
  it('四縣市每個鄉鎮都有資料，沒有多出來的代碼', () => {
    expect(towns.filter((t) => !(t.TOWNCODE in data)).map((t) => t.TOWNNAME)).toEqual([]);
    expect(Object.keys(data).sort()).toEqual(towns.map((t) => t.TOWNCODE).sort());
  });

  it.each(Object.entries(COUNTIES))('縣市 %s 的加總等於消防年報 %i 件', (county, total) => {
    const sum = towns.filter((t) => t.COUNTYCODE === county).reduce((s, t) => s + data[t.TOWNCODE]!, 0);
    expect(sum).toBe(total);
  });

  it('都是非負整數', () => {
    for (const v of Object.values(data)) expect(Number.isInteger(v) && v >= 0).toBe(true);
  });
});
