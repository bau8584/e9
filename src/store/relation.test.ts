import { beforeEach, describe, expect, it } from 'vitest';
import { bonds, BOND_STAGE_MAX } from '../data/bonds';
import { characters } from '../data';
import { markStageSeen, readSeenStage } from './bond';
import { relationStage } from './progress';
import * as store from './store';

describe('호감도', () => {
  beforeEach(() => localStorage.clear());

  it('카드 수를 따르고, 책은 카드 2장 뒤에만 단계를 올린다', () => {
    expect([[], ['a'], ['a', 'b'], ['a', 'b', 'c']].map((cards) => relationStage({ cards }))).toEqual([0, 1, 2, 2]);
    expect(relationStage({ cards: [] }, 5)).toBe(0);
    expect(relationStage({ cards: ['a'] }, 5)).toBe(1);
    expect(relationStage({ cards: ['a', 'b'] }, 1)).toBe(3);
  });

  it('모든 인물에 단계별 문구가 있고 오르는 단계에는 대사가 있다', () => {
    for (const c of characters) {
      expect(bonds[c.id]).toHaveLength(BOND_STAGE_MAX + 1);
      bonds[c.id].slice(1).forEach((b) => expect(b.moment.length).toBeGreaterThan(0));
    }
  });

  it('장면을 본 기록은 인물별로 남고, 초기화하면 지워진다', () => {
    expect(readSeenStage('xunzi')).toBe(0);
    markStageSeen('xunzi', 2);
    expect(readSeenStage('xunzi')).toBe(2);
    expect(readSeenStage('austen')).toBe(0);
    store.resetProgress();
    expect(readSeenStage('xunzi')).toBe(0);
  });
});
