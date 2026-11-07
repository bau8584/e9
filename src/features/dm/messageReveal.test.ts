import { describe, expect, it } from 'vitest';
import { dms } from '../../data';
import { buildTimeline, typingMs } from './messageReveal';

describe('DM 도착 시간표', () => {
  it('입력 시간은 글 길이를 따르되 0.9~2초를 넘지 않는다', () => {
    expect(typingMs('네')).toBe(900);
    expect(typingMs('가'.repeat(30))).toBe(1440);
    expect(typingMs('가'.repeat(200))).toBe(2000);
    expect(typingMs('가 나')).toBe(typingMs('가나'));
  });

  it('접속, 입력, 말풍선 순서로 하나씩 도착하고 쉬는 상태로 끝난다', () => {
    const steps = buildTimeline(['첫째', '둘째'], 'arrive');
    expect(steps.map((s) => [s.phase, s.count])).toEqual([
      ['online', 0],
      ['typing', 0],
      ['online', 1],
      ['typing', 1],
      ['online', 2],
      ['idle', 2],
    ]);
  });

  it('답장에 대한 응답은 접속 표시 없이 입력부터 시작한다', () => {
    expect(buildTimeline(['응답'], 'answer')[0]).toEqual({ delay: 450, count: 0, phase: 'typing' });
  });

  it('보낼 글이 없으면 재생하지 않는다', () => {
    expect(buildTimeline([], 'answer')).toEqual([]);
  });

  it('실제 DM 한 묶음은 6초 안에 도착한다', () => {
    for (const dm of dms) {
      for (const texts of [dm.messages, ...dm.replies.map((r) => r.answer)]) {
        const total = buildTimeline(texts, 'arrive').reduce((sum, step) => sum + step.delay, 0);
        expect(total).toBeLessThan(6000);
      }
    }
  });
});
