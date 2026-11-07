import { describe, expect, it } from 'vitest';
import { computeRealRanking, createInitial, sanitize } from '../store/progress';
import { characterOfMission, fromRemoteProgress, mergeLibraries, newClaims, planProgress, toRemoteProgress, usableLibrary, type LibraryDoc } from './merge';

const book = (id: string, updatedAt = '2026-11-01T00:00:00Z', memo = '') => ({ id, title: '책', author: '나', genre: '문학', finishedAt: '2026-11-01', quote: '', memo, color: '#73547e', createdAt: '2026-11-01T00:00:00Z', updatedAt });
const lib = (nickname: string, books: ReturnType<typeof book>[]): LibraryDoc => ({ version: 1, nickname, books });
const started = { ...createInitial(), nickname: '덕구', favoriteId: 'nietzsche' as const, screen: 'home' as const };

describe('서고 합치기', () => {
  it('양쪽 책을 모두 남기고 같은 책은 늦게 고친 쪽', () => {
    const merged = mergeLibraries(lib('나', [book('a'), book('b', '2026-11-01T00:00:00Z', '옛')]), 5, lib('너', [book('b', '2026-11-02T00:00:00Z', '새'), book('c')]), 3);
    expect(merged.books.map((b) => b.id)).toEqual(['a', 'b', 'c']);
    expect(merged.books[1].memo).toBe('새');
    expect(merged.nickname).toBe('나');
  });
  it('이름표는 서고가 늦게 바뀐 쪽', () => {
    expect(mergeLibraries(lib('나', []), 3, lib('너', []), 5).nickname).toBe('너');
  });
  it('한쪽만 있으면 그쪽 그대로', () => {
    expect(mergeLibraries(null, 0, lib('너', [book('c')]), 5)).toEqual(lib('너', [book('c')]));
  });
  it('형식이 틀린 서버 값은 쓰지 않고, 잘못된 책은 빼서 로컬 서고가 깨지지 않게 한다', () => {
    expect(usableLibrary(null)).toBeNull();
    expect(usableLibrary({ version: 2, nickname: 'a', books: [] })).toBeNull();
    expect(usableLibrary({ version: 1, nickname: 'a', books: [book('a'), { id: 'x' }, null] })?.books).toHaveLength(1);
  });
});

describe('진행 기록 충돌', () => {
  it('늦은 쪽이 이긴다', () => {
    expect(planProgress(started, 5, true, 9)).toEqual({ pull: true, push: false });
    expect(planProgress(started, 9, true, 5)).toEqual({ pull: false, push: true });
    expect(planProgress(started, 5, true, 5)).toEqual({ pull: false, push: false });
  });
  it('처음 연결이면 기존 기록을 올리고, 아무것도 안 한 빈 기록은 올리지 않는다', () => {
    expect(planProgress(started, 1, false, 0).push).toBe(true);
    expect(planProgress(createInitial(), 0, false, 0).push).toBe(false);
  });
  it('초기화한 빈 기록은 시각이 있으니 서버의 옛 진행을 덮는다', () => {
    expect(planProgress(createInitial(), 9, true, 5).push).toBe(true);
  });
  it('서버에 올리는 값에 화면 위치가 없고, 받을 때는 이 기기 화면을 유지한다', () => {
    const remote = toRemoteProgress(started);
    expect(remote).not.toHaveProperty('screen');
    expect(fromRemoteProgress(remote, 'myroom')).toMatchObject({ nickname: '덕구', screen: 'myroom' });
    expect(fromRemoteProgress(null, 'home').screen).toBe('landing');
  });
});

describe('팬덤 적립 대기', () => {
  it('이미 받았거나 대기 중인 미션, 모르는 형식은 빼서 초기화 뒤 재입덕해도 중복 적립하지 않는다', () => {
    expect(newClaims(['reading-nietzsche-1', 'reading-nietzsche-2', 'reading-austen-1', 'hack'], ['reading-nietzsche-1'], ['reading-austen-1'])).toEqual(['reading-nietzsche-2']);
    expect(characterOfMission('reading-hacker-1')).toBeNull();
  });
});

describe('실제 점수 순위', () => {
  it('모두 0이어도 깨지지 않고 같은 순위, 내 최애가 위', () => {
    const rows = computeRealRanking('austen', { siddhartha: 0, nietzsche: 0, austen: 0, xunzi: 0 });
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 1, 1]);
    expect(rows[0].id).toBe('austen');
  });
  it('점수 순서와 공동 순위', () => {
    const rows = computeRealRanking('austen', { siddhartha: 40, nietzsche: 20, austen: 20, xunzi: 0 });
    expect(rows.map((r) => [r.id, r.rank])).toEqual([['siddhartha', 1], ['austen', 2], ['nietzsche', 2], ['xunzi', 4]]);
  });
});

describe('깨진 단계 복구', () => {
  it('단계가 dm이면 답장을 비워 DM과 읽기를 끝없이 오가지 않는다', () => {
    const p = sanitize({ version: 1, nickname: '덕구', favoriteId: 'nietzsche', screen: 'dm', stage: 'dm', dmChoiceId: 'nietzsche-a' });
    expect(p.stage).toBe('dm');
    expect(p.dmChoiceId).toBeNull();
  });
});
