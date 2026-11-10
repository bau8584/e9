import { beforeEach, describe, expect, it } from 'vitest';
import { bonds } from '../data/bonds';
import { characters } from '../data';
import { bondOf, latestBookTitle, markStageSeen, nextBondOf, readSeenStage } from './bond';
import { AFFINITY_THRESHOLDS, stageOfAffinity } from './fan';
import * as store from './store';

describe('호감도', () => {
  beforeEach(() => localStorage.clear());

  it('호감 점수가 기준에 닿아야 단계가 오른다', () => {
    expect([0, 14, 15, 59, 60, 119, 120, 999].map(stageOfAffinity)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(bondOf(15, 0)).toEqual({ earned: 1, stage: 1, points: 15 });
  });

  it('옛 방식으로 이미 오른 단계 아래로는 내려가지 않는다', () => {
    expect(bondOf(0, 2)).toEqual({ earned: 0, stage: 2, points: 0 });
    expect(bondOf(130, 2).stage).toBe(3);
  });

  it('다음 단계까지 남은 점수와 비율을 알려 준다', () => {
    expect(nextBondOf(0, 0)).toEqual({ need: 15, remaining: 15, ratio: 0 });
    expect(nextBondOf(0, 12)).toEqual({ need: 15, remaining: 3, ratio: 0.8 });
    expect(nextBondOf(1, 15)).toEqual({ need: 60, remaining: 45, ratio: 0 });
    expect(nextBondOf(2, 90)?.ratio).toBe(0.5);
    expect(nextBondOf(3, 500)).toBeNull();
    // 이미 본 단계가 점수보다 높아도 남은 점수와 비율이 말이 된다
    const legacy = nextBondOf(2, 0);
    expect(legacy).toEqual({ need: 120, remaining: 120, ratio: 0 });
  });

  it('가장 최근에 등록한 책을 찾는다', () => {
    expect(latestBookTitle([])).toBeNull();
    expect(latestBookTitle([{ title: '옛 책', createdAt: '2026-01-01' }, { title: '새 책', createdAt: '2026-02-01' }])).toBe('새 책');
  });

  it('모든 인물에 단계별 문구가 있고 책 제목을 넣을 수 있다', () => {
    for (const c of characters) {
      expect(bonds[c.id]).toHaveLength(AFFINITY_THRESHOLDS.length);
      bonds[c.id].forEach((b) => expect(b.bookReaction).toContain('{book}'));
      bonds[c.id].slice(1).forEach((b) => {
        expect(b.moment.length).toBeGreaterThan(0);
        expect(b.opener).toBeTruthy();
      });
    }
  });

  it('니체와 순자는 단계마다 호칭이 있고, 오를 때 한 장면(4줄 이상)이 나온다', () => {
    for (const id of ['nietzsche', 'xunzi'] as const) {
      const stages = bonds[id];
      stages.forEach((b) => expect(b.callName).toBeTruthy());
      expect(new Set(stages.map((b) => b.callName)).size).toBe(stages.length);
      stages.slice(1).forEach((b) => {
        expect(b.moment.length).toBeGreaterThanOrEqual(4);
        expect(b.moment.length).toBeLessThanOrEqual(6);
        expect(b.teaser).toBeTruthy();
      });
    }
  });

  it('장면을 본 기록은 인물별로 남고, 초기화하면 지워진다', () => {
    markStageSeen('xunzi', 2);
    expect(readSeenStage('xunzi')).toBe(2);
    expect(readSeenStage('austen')).toBe(0);
    store.resetProgress();
    expect(readSeenStage('xunzi')).toBe(0);
  });
});
