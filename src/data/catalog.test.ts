import { describe, expect, it } from 'vitest';
import { characters, getMissionCount } from './index';
import { PLAYABLE_IDS, upcomingAuthors } from './catalog';

describe('작가 목록', () => {
  it('입덕은 니체와 순자만 열려 있고 콘텐츠가 있다', () => {
    expect(PLAYABLE_IDS).toEqual(['nietzsche', 'xunzi']);
    PLAYABLE_IDS.forEach((id) => expect(getMissionCount(id)).toBeGreaterThan(0));
  });

  it('준비 중 목록에 이름이 겹치거나 입덕 가능한 인물이 섞이지 않는다', () => {
    const names = upcomingAuthors.flatMap((group) => group.authors.map((a) => a.name));
    const playableNames = characters.filter((c) => PLAYABLE_IDS.includes(c.id)).map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    playableNames.forEach((name) => expect(names).not.toContain(name));
  });

  it('기존 사용자를 위해 옛 인물 자료는 그대로 남아 있다', () => {
    expect(characters.map((c) => c.id)).toEqual(['siddhartha', 'nietzsche', 'austen', 'xunzi']);
  });
});
