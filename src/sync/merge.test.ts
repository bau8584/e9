import { describe, expect, it } from 'vitest';
import { computeRealRanking, createInitial, sanitize } from '../store/progress';
import { characterOfMission, clampStamp, fromRemoteProgress, LIBRARY_MAX_BOOKS, libraryTooLarge, mergeLibraries, newClaims, nextRetryDelay, planProgress, RETRY_MAX, RETRY_MIN, runSteps, STAMP_MAX, toRemoteProgress, usableLibrary, type LibraryDoc } from './merge';

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

describe('서버 규칙에 맞춰 올리기', () => {
  it('옛 카드와 미션 id, 중복은 올릴 때만 빼고 기기 기록은 그대로 둔다', () => {
    const local = { ...started, cards: ['card-old', 'card-nietzsche-rare', 'card-nietzsche-rare'], rewardedMissions: ['reading-old', 'reading-nietzsche-1'] };
    const remote = toRemoteProgress(local);
    expect(remote.cards).toEqual(['card-nietzsche-rare']);
    expect(remote.rewardedMissions).toEqual(['reading-nietzsche-1']);
    expect(local.cards).toHaveLength(3);
  });
  it('점수와 짧은 값도 규칙 범위로 맞춘다', () => {
    const remote = toRemoteProgress({ ...started, score: 100005.5, lastWrongOptionId: 'x'.repeat(65) });
    expect(remote.score).toBe(100000);
    expect(remote.lastWrongOptionId).toBeNull();
  });
  it('시각은 규칙 상한 안으로 맞춘다', () => {
    expect(clampStamp(Number.MAX_SAFE_INTEGER)).toBe(STAMP_MAX);
    expect(clampStamp(-5)).toBe(0);
    expect(clampStamp(STAMP_MAX - 1)).toBe(STAMP_MAX - 1);
  });
  it('없는 미션 번호는 적립하지 않는다', () => {
    expect(characterOfMission('reading-nietzsche-2')).toBe('nietzsche');
    expect(characterOfMission('reading-nietzsche-9')).toBeNull();
  });
});

describe('서고 크기 한도', () => {
  it('200권까지는 올리고 201권이면 멈춘다', () => {
    const many = (n: number) => lib('나', Array.from({ length: n }, (_, i) => book(String(i))));
    expect(libraryTooLarge(many(LIBRARY_MAX_BOOKS))).toBe(false);
    expect(libraryTooLarge(many(LIBRARY_MAX_BOOKS + 1))).toBe(true);
  });
  it('약 900KB를 넘으면 멈춘다. 한글은 바이트로 잰다', () => {
    expect(libraryTooLarge(lib('나', [book('a', undefined, 'a'.repeat(800_000))]))).toBe(false);
    expect(libraryTooLarge(lib('나', [book('a', undefined, '가'.repeat(300_001))]))).toBe(true);
  });
});

describe('실패 처리', () => {
  it('재시도 간격은 두 배씩 늘고 5분에서 멈춘다', () => {
    const delays = [RETRY_MIN];
    for (let i = 0; i < 10; i++) delays.push(nextRetryDelay(delays[i]));
    expect(delays.slice(0, 3)).toEqual([5000, 10000, 20000]);
    expect(delays.at(-1)).toBe(RETRY_MAX);
    expect(Math.max(...delays)).toBe(RETRY_MAX);
  });
  it('앞 단계가 실패해도 뒤 단계를 돌리고 실패를 알린다', async () => {
    const ran: string[] = [];
    const failed = await runSteps([
      async () => { throw new Error('user'); },
      async () => { ran.push('claims'); },
    ]);
    expect(ran).toEqual(['claims']);
    expect(failed).toBe(true);
    expect(await runSteps([async () => {}])).toBe(false);
  });
});
