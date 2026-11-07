import { beforeEach, describe, expect, it, vi } from 'vitest';
import { characters, getDm, getReading, REWARD_SCORE, cards, dms, readings } from '../data';
import { getCards, getFavorite, getNickname, getScore, resetAll } from '../features/my-room/myRoomData';
import { cleanNickname, computeRanking, rankOf, sanitize, createInitial } from './progress';
import * as store from './store';

const reachDraw = () => {
  store.completeOnboarding('덕구', 'nietzsche');
  store.chooseReply(getDm('nietzsche').replies[0].id);
  store.answerQuiz(getReading('nietzsche').correctOptionId);
};

beforeEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  store.reloadFromStorage();
});

describe('닉네임과 최애', () => {
  it('빈 닉네임이면 다음 화면으로 넘어가지 않는다', () => {
    store.startOnboarding('nietzsche');
    store.completeOnboarding('   ', 'nietzsche');
    expect(store.getProgress().screen).toBe('onboarding');
  });
  it('닉네임은 앞뒤 빈칸을 빼고 20자까지만 받는다', () => {
    expect(cleanNickname('  덕구  ')).toBe('덕구');
    expect(cleanNickname('가'.repeat(30))).toHaveLength(20);
  });
  it('내 방 함수로 닉네임과 최애를 읽는다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    expect(getNickname()).toBe('덕구');
    expect(getFavorite()?.name).toBe('니체');
  });
});

describe('문제와 보상', () => {
  it('오답이면 단계가 그대로이고 틀린 답을 기억한다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    store.chooseReply(getDm('nietzsche').replies[0].id);
    expect(store.answerQuiz('a')).toBe(false);
    expect(store.getProgress().stage).toBe('reading');
    expect(store.getProgress().lastWrongOptionId).toBe('a');
    expect(getScore()).toBe(0);
  });
  it('DM에 답하기 전에는 문제를 풀어도 보상 단계로 가지 않는다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    store.answerQuiz(getReading('nietzsche').correctOptionId);
    expect(store.getProgress().stage).toBe('dm');
  });
  it('정답 뒤 뽑기는 20점과 카드 한 장을 준다', () => {
    reachDraw();
    store.drawCard(() => 0.99);
    expect(getScore()).toBe(REWARD_SCORE);
    expect(getCards().map((c) => c.rarity)).toEqual(['일반']);
  });
  it('뽑기를 여러 번 눌러도 보상은 한 번만 들어온다', () => {
    reachDraw();
    store.drawCard(() => 0);
    store.drawCard(() => 0);
    expect(getScore()).toBe(REWARD_SCORE);
    expect(getCards()).toHaveLength(1);
    expect(getCards()[0].rarity).toBe('희귀');
  });
});

describe('복원과 저장 실패', () => {
  it('다시 읽어도 최애, 단계, 카드, 점수가 그대로다', () => {
    reachDraw();
    store.drawCard(() => 0.99);
    store.goTo('reading');
    store.reloadFromStorage();
    const p = store.getProgress();
    expect(p).toMatchObject({ favoriteId: 'nietzsche', stage: 'done', score: 20, screen: 'reading' });
    expect(p.cards).toHaveLength(1);
  });
  it('저장이 실패하면 표시하고 기록은 유지하며, 다시 시도로 복구한다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('가득 참');
    });
    const reply = getDm('nietzsche').replies[1].id;
    store.chooseReply(reply);
    expect(store.getProgress().dmChoiceId).toBe(reply);
    const snapshotAfterFail = window.localStorage.getItem(store.STORAGE_KEY);
    expect(JSON.parse(snapshotAfterFail as string).dmChoiceId).toBeNull();
    store.retrySave();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
    store.retrySave();
    expect(JSON.parse(window.localStorage.getItem(store.STORAGE_KEY) as string).dmChoiceId).toBe(reply);
  });
  it('깨진 저장값이면 처음 상태로 시작한다', () => {
    window.localStorage.setItem(store.STORAGE_KEY, '{깨짐');
    store.reloadFromStorage();
    expect(store.getProgress().screen).toBe('landing');
    expect(sanitize({ version: 1, screen: 'home' }).screen).toBe('landing');
    expect(sanitize(null)).toEqual(createInitial());
  });
  it('초기화하면 모두 지워지고 첫 화면으로 간다', () => {
    reachDraw();
    store.drawCard();
    expect(resetAll()).toBe(true);
    expect(getScore()).toBe(0);
    expect(getNickname()).toBe('');
    expect(store.getProgress().screen).toBe('landing');
    expect(window.localStorage.getItem(store.STORAGE_KEY)).toBeNull();
  });
});

describe('순위와 콘텐츠', () => {
  it.each(characters.map((c) => c.id))('%s 팬은 미션 한 번으로 순위가 오른다', (id) => {
    expect(rankOf(id, 0)).toBe(2);
    expect(rankOf(id, REWARD_SCORE)).toBe(1);
    expect(computeRanking(id, 0)).toHaveLength(4);
  });
  it.each(characters.map((c) => c.id))('%s 콘텐츠가 빠짐없이 있다', (id) => {
    expect(dms.filter((d) => d.characterId === id)).toHaveLength(1);
    const dm = getDm(id);
    expect(dm.replies.length).toBeGreaterThanOrEqual(2);
    expect(dm.replies.length).toBeLessThanOrEqual(3);
    expect(readings.filter((r) => r.characterId === id)).toHaveLength(1);
    const reading = getReading(id);
    expect(reading.options.some((o) => o.id === reading.correctOptionId)).toBe(true);
    expect(cards.filter((c) => c.characterId === id).map((c) => c.rarity).sort()).toEqual(['일반', '희귀'].sort());
  });
});
