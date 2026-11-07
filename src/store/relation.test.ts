import { beforeEach, describe, expect, it } from 'vitest';
import { bonds } from '../data/bonds';
import { characters } from '../data';
import { activityPoints, BOND_THRESHOLDS, latestBookTitle, markStageSeen, readSeenStage, stageOfPoints } from './bond';
import * as store from './store';

describe('호감도', () => {
  beforeEach(() => localStorage.clear());

  it('책 등록, 충분한 문장과 감상, 미션 완료를 활동으로 센다', () => {
    expect(activityPoints(0, [])).toBe(0);
    expect(activityPoints(2, [])).toBe(2);
    expect(activityPoints(0, [{ quote: '', memo: '' }])).toBe(1);
    expect(activityPoints(0, [{ quote: '짧다', memo: '좋았다' }])).toBe(1);
    expect(activityPoints(1, [{ quote: '다섯 글자 이상', memo: '열 글자가 넘는 감상을 적었다' }])).toBe(4);
  });

  it('활동이 기준에 닿아야 단계가 오른다', () => {
    expect([0, 2, 3, 5, 6, 9, 10, 99].map(stageOfPoints)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('가장 최근에 등록한 책을 찾는다', () => {
    expect(latestBookTitle([])).toBeNull();
    expect(latestBookTitle([{ title: '옛 책', createdAt: '2026-01-01' }, { title: '새 책', createdAt: '2026-02-01' }])).toBe('새 책');
  });

  it('모든 인물에 단계별 문구가 있고 책 제목을 넣을 수 있다', () => {
    for (const c of characters) {
      expect(bonds[c.id]).toHaveLength(BOND_THRESHOLDS.length);
      bonds[c.id].forEach((b) => expect(b.bookReaction).toContain('{book}'));
      bonds[c.id].slice(1).forEach((b) => {
        expect(b.moment.length).toBeGreaterThan(0);
        expect(b.opener).toBeTruthy();
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
