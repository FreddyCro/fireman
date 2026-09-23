import { describe, expect, it } from 'vitest';
import { applySequenceEvent, videoEnded } from '../app/utils/poc/paper-scroll/video';

// node 沒有 HTMLVideoElement，用最小假物件；只碰 loop／paused／currentTime／duration／ended／play／pause
function fakeVideo(over: Partial<{ ended: boolean; paused: boolean; loop: boolean; currentTime: number; duration: number }> = {}) {
  const calls: string[] = [];
  const v = {
    ended: false,
    paused: true,
    loop: true,
    currentTime: 0,
    duration: 3,
    play() {
      calls.push('play');
      v.paused = false;
      return Promise.resolve();
    },
    pause() {
      calls.push('pause');
      v.paused = true;
    },
    ...over,
  };
  return { v: v as unknown as HTMLVideoElement, raw: v, calls };
}

describe('applySequenceEvent', () => {
  // 評審發現：loadVideo 對所有影片設 loop = true，有 loop 的影片 ended 永遠是 false、播到底會跳回 0，
  // 序列的「播完」偵測就會失效。trigger 影片一拿到序列指令就要把 loop 關掉。
  it('play：關掉 loop、回到第 0 格、開始播放', () => {
    const { v, raw, calls } = fakeVideo({ paused: false, currentTime: 1.2 });
    applySequenceEvent(v, 'play');
    expect(raw.loop).toBe(false);
    expect(raw.currentTime).toBe(0);
    expect(calls).toEqual(['pause', 'play']);
  });

  it('reset：關掉 loop、回到第 0 格、保持暫停', () => {
    const { v, raw, calls } = fakeVideo({ paused: false, currentTime: 2 });
    applySequenceEvent(v, 'reset');
    expect(raw.loop).toBe(false);
    expect(raw.currentTime).toBe(0);
    expect(raw.paused).toBe(true);
    expect(calls).toEqual(['pause']);
  });
});

describe('videoEnded', () => {
  it('ended 旗標或接近結尾都算播完', () => {
    expect(videoEnded(fakeVideo({ ended: true }).v, 0)).toBe(true);
    expect(videoEnded(fakeVideo({ currentTime: 2.97 }).v, 0)).toBe(true);
  });

  it('剛 reset 到第 0 格不算播完', () => {
    expect(videoEnded(fakeVideo({ currentTime: 0 }).v, 100)).toBe(false);
  });

  it('play() 被拒絕或解碼卡住：進區超過「片長 + 1 秒」就當播完，序列不會卡住', () => {
    const stuck = fakeVideo({ currentTime: 0, paused: true, duration: 3 }).v;
    expect(videoEnded(stuck, 3900)).toBe(false);
    expect(videoEnded(stuck, 4100)).toBe(true);
  });

  it('duration 還不知道時只靠時間保險（當作 5 秒）', () => {
    const v = fakeVideo({ duration: Number.NaN }).v;
    expect(videoEnded(v, 1000)).toBe(false);
    expect(videoEnded(v, 6100)).toBe(true);
  });
});
