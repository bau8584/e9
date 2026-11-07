import { beforeEach, describe, expect, it, vi } from 'vitest';
import { characters, getCard, getDm, getMissionCount, getReading, REWARD_SCORE, cards, dms, readings, type CharacterId } from '../data';
import { getCards, getFavorite, getNickname, getScore, resetAll } from '../features/my-room/myRoomData';
import { cleanNickname, computeRanking, drawCard, favoriteCardCount, isSeasonComplete, rankOf, sanitize, createInitial, switchCharacter } from './progress';
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
    store.drawCard();
    expect(getScore()).toBe(REWARD_SCORE);
    expect(getCards().map((c) => c.rarity)).toEqual(['일반']);
  });
  it('뽑기를 여러 번 눌러도 보상은 한 번만 들어온다', () => {
    reachDraw();
    store.drawCard();
    store.drawCard();
    expect(getScore()).toBe(REWARD_SCORE);
    expect(getCards()).toHaveLength(1);
    expect(getCards()[0].rarity).toBe('일반');
  });
});

describe('복원과 저장 실패', () => {
  it('다시 읽어도 최애, 단계, 카드, 점수가 그대로다', () => {
    reachDraw();
    store.drawCard();
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
    expect(dms.filter((d) => d.characterId === id)).toHaveLength(2);
    expect(readings.filter((r) => r.characterId === id)).toHaveLength(2);
    [0, 1].forEach((mission) => {
      const dm = getDm(id, mission);
      expect(dm.replies.length).toBeGreaterThanOrEqual(2);
      expect(dm.replies.length).toBeLessThanOrEqual(3);
      const reading = getReading(id, mission);
      expect(reading.options.some((o) => o.id === reading.correctOptionId)).toBe(true);
      expect(reading.source).not.toMatch(/추정|확인 필요/);
      expect(reading.source).not.toMatch(/초벌|검수/);
      expect(getCard(reading.cardId)?.source).toBe(reading.source);
      expect(reading.translation).toContain(reading.hintPassage);
      expect(getCard(reading.cardId)?.characterId).toBe(id);
      expect(getCard(reading.cardId)?.rarity).toBe(mission === 0 ? '일반' : '희귀');
    });
    expect(cards.filter((c) => c.characterId === id).map((c) => c.rarity).sort()).toEqual(['일반', '희귀'].sort());
  });
});

const playMission = (id: CharacterId, mission: number) => {
  store.chooseReply(getDm(id, mission).replies[0].id);
  store.answerQuiz(getReading(id, mission).correctOptionId);
  store.drawCard();
};

describe('미션 2개', () => {
  it.each(characters.map((c) => c.id))('%s 미션 2개로 일반, 희귀 카드와 40점을 얻는다', (id) => {
    store.completeOnboarding('덕구', id);
    playMission(id, 0);
    expect(store.getProgress().stage).toBe('done');
    store.goTo('home');
    expect(store.getProgress()).toMatchObject({ missionIndex: 1, stage: 'dm', dmChoiceId: null, dmRead: false });
    playMission(id, 1);
    store.goTo('home');
    expect(getCards().map((c) => c.rarity)).toEqual(['일반', '희귀']);
    expect(getScore()).toBe(REWARD_SCORE * 2);
    expect(store.getProgress().missionIndex).toBe(getMissionCount(id) - 1);
    expect(isSeasonComplete(store.getProgress())).toBe(true);
  });
  it('시즌을 끝낸 뒤 다시 눌러도 점수와 카드가 늘지 않는다', () => {
    store.completeOnboarding('덕구', 'xunzi');
    playMission('xunzi', 0);
    store.goTo('home');
    playMission('xunzi', 1);
    store.goTo('home');
    playMission('xunzi', 1);
    store.drawCard();
    expect(getScore()).toBe(40);
    expect(getCards()).toHaveLength(2);
  });
  it('첫 미션 뒤 결과 화면에 머물면 새로고침해도 다음 미션으로 넘어가지 않는다', () => {
    reachDraw();
    store.goTo('reading');
    store.drawCard();
    store.reloadFromStorage();
    expect(store.getProgress()).toMatchObject({ missionIndex: 0, stage: 'done', screen: 'reading' });
  });
  it('둘째 미션 중간에 새로고침해도 이어진다', () => {
    store.completeOnboarding('덕구', 'austen');
    playMission('austen', 0);
    store.goTo('dm');
    const reply = getDm('austen', 1).replies[1].id;
    store.chooseReply(reply);
    store.reloadFromStorage();
    expect(store.getProgress()).toMatchObject({ missionIndex: 1, stage: 'reading', dmChoiceId: reply, score: 20 });
  });
});

describe('미션 1개 시절 기록 옮기기', () => {
  const legacy = (over: object) => ({
    version: 1,
    nickname: '덕구',
    favoriteId: 'nietzsche',
    screen: 'home',
    stage: 'done',
    dmRead: true,
    dmChoiceId: 'nietzsche-a',
    lastWrongOptionId: null,
    cards: ['card-nietzsche-common'],
    score: 20,
    rewardedMissions: ['reading-nietzsche-1'],
    ...over,
  });
  it('중간까지 한 기록은 첫 미션의 그 자리에서 이어진다', () => {
    expect(sanitize(legacy({ stage: 'reading', cards: [], score: 0, rewardedMissions: [] }))).toMatchObject({
      missionIndex: 0,
      stage: 'reading',
      dmChoiceId: 'nietzsche-a',
    });
  });
  it('끝낸 기록은 카드와 점수를 지키고 다음 DM을 연다', () => {
    expect(sanitize(legacy({}))).toMatchObject({
      missionIndex: 1,
      stage: 'dm',
      dmChoiceId: null,
      score: 20,
      cards: ['card-nietzsche-common'],
    });
  });
  it('끝낸 결과 화면에서 저장됐으면 결과를 그대로 보여 준다', () => {
    expect(sanitize(legacy({ screen: 'reading' }))).toMatchObject({ missionIndex: 0, stage: 'done', screen: 'reading' });
  });
  it('옛 뽑기로 희귀를 먼저 받았으면 둘째 미션에서 일반을 받아 2장, 40점이 된다', () => {
    window.localStorage.setItem(store.STORAGE_KEY, JSON.stringify(legacy({ cards: ['card-nietzsche-rare'] })));
    store.reloadFromStorage();
    playMission('nietzsche', 1);
    expect(getCards().map((c) => c.rarity).sort()).toEqual(['일반', '희귀'].sort());
    expect(getScore()).toBe(40);
  });
  it('이상한 미션 순서 값은 첫 미션으로 읽는다', () => {
    expect(sanitize(legacy({ stage: 'dm', missionIndex: 99 })).missionIndex).toBe(0);
    expect(sanitize(legacy({ stage: 'dm', missionIndex: -1 })).missionIndex).toBe(0);
    expect(sanitize(legacy({ stage: 'dm', missionIndex: '1' })).missionIndex).toBe(0);
  });
});

describe('입덕 중 닉네임', () => {
  it('적던 닉네임이 남고 입덕을 끝내거나 초기화하면 지워진다', () => {
    store.saveNicknameDraft('덕구');
    expect(store.readNicknameDraft()).toBe('덕구');
    store.completeOnboarding('덕구', 'nietzsche');
    expect(store.readNicknameDraft()).toBe('');
    store.saveNicknameDraft('다시');
    store.resetProgress();
    expect(store.readNicknameDraft()).toBe('');
  });
});

describe('여러 작가 덕질', () => {
  const nietzscheMidway = () => {
    store.completeOnboarding('덕구', 'nietzsche');
    playMission('nietzsche', 0);
    store.goTo('dm');
    store.chooseReply(getDm('nietzsche', 1).replies[1].id);
  };
  const fresh = { missionIndex: 0, stage: 'dm', dmRead: false, dmChoiceId: null, lastWrongOptionId: null };

  it('다른 작가로 가면 새 미션, 돌아오면 하던 자리에서 이어진다', () => {
    nietzscheMidway();
    const before = store.getProgress();
    store.switchFavorite('xunzi');
    expect(store.getProgress()).toMatchObject({ ...fresh, favoriteId: 'xunzi', screen: before.screen, score: 20, nickname: '덕구' });
    expect(store.getProgress().cards).toEqual(before.cards);
    store.switchFavorite('nietzsche');
    expect(store.getProgress()).toEqual(before);
  });
  it('새로고침해도 빼 둔 상태가 남는다', () => {
    nietzscheMidway();
    const before = store.getProgress();
    store.switchFavorite('xunzi');
    store.reloadFromStorage();
    store.switchFavorite('nietzsche');
    expect(store.getProgress()).toEqual(before);
  });
  it('같은 작가로 바꾸면 아무것도 안 한다', () => {
    nietzscheMidway();
    const before = store.getProgress();
    store.switchFavorite('nietzsche');
    expect(store.getProgress()).toBe(before);
    expect(window.localStorage.getItem(store.ROSTER_KEY)).toBeNull();
  });
  it('두 작가 미션을 하면 보상이 각각 들어오고 시즌 완료도 작가별이다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    playMission('nietzsche', 0);
    store.goTo('home');
    playMission('nietzsche', 1);
    expect(isSeasonComplete(store.getProgress())).toBe(true);
    store.switchFavorite('xunzi');
    expect(isSeasonComplete(store.getProgress())).toBe(false);
    playMission('xunzi', 0);
    expect(getScore()).toBe(60);
    expect(store.getProgress().cards).toContain(getReading('xunzi', 0).cardId);
    expect(store.getProgress().cards).toHaveLength(3);
  });
  it('둘째 미션의 대체 카드는 다른 작가 카드로 새지 않는다', () => {
    const p = { ...sanitize({ ...createInitial(), nickname: '덕구', favoriteId: 'xunzi', screen: 'reading', stage: 'draw', missionIndex: 1 }), cards: [getReading('nietzsche', 0).cardId, getReading('xunzi', 1).cardId] };
    expect(drawCard(p).cards.at(-1)).toBe(getReading('xunzi', 0).cardId);
  });
  it('깨진 저장값이어도 멈추지 않고 공통 기록은 덮이지 않는다', () => {
    nietzscheMidway();
    window.localStorage.setItem(store.ROSTER_KEY, JSON.stringify({ xunzi: { missionIndex: 99, stage: '이상', dmChoiceId: 5, score: 999, cards: [] } }));
    store.switchFavorite('xunzi');
    expect(store.getProgress()).toMatchObject({ ...fresh, favoriteId: 'xunzi', score: 20 });
    expect(store.getProgress().cards).toHaveLength(1);
    window.localStorage.setItem(store.ROSTER_KEY, '{깨짐');
    expect(() => store.switchFavorite('austen')).not.toThrow();
    expect(switchCharacter(store.getProgress(), 'nietzsche', 'x')).toMatchObject({ ...fresh, favoriteId: 'nietzsche' });
  });
  it('저장이 막혀도 전환은 된다', () => {
    nietzscheMidway();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('가득 참');
    });
    store.switchFavorite('xunzi');
    expect(store.getProgress().favoriteId).toBe('xunzi');
  });
  it('입덕한 사람의 startOnboarding은 상태를 덮어쓰지 않고 DM으로 간다', () => {
    nietzscheMidway();
    const before = store.getProgress();
    store.startOnboarding('xunzi');
    expect(store.getProgress()).toMatchObject({ ...fresh, favoriteId: 'xunzi', screen: 'dm' });
    store.startOnboarding('nietzsche');
    expect(store.getProgress()).toEqual({ ...before, screen: 'dm' });
  });
  it('미입덕자의 startOnboarding은 그대로 신고서로 간다', () => {
    store.startOnboarding('xunzi');
    expect(store.getProgress()).toMatchObject({ screen: 'onboarding', favoriteId: 'xunzi' });
  });
  it('서버 기록이 다른 작가면 지금 작가 상태를 보존한다', () => {
    nietzscheMidway();
    const before = store.getProgress();
    store.replaceProgress({ ...before, favoriteId: 'xunzi', missionIndex: 0, stage: 'dm', dmRead: false, dmChoiceId: null });
    expect(store.getProgress().favoriteId).toBe('xunzi');
    store.switchFavorite('nietzsche');
    expect(store.getProgress()).toEqual(before);
  });
  it('서버 기록이 같은 작가면 빼 두지 않는다', () => {
    nietzscheMidway();
    store.replaceProgress({ ...store.getProgress(), score: 100 });
    expect(window.localStorage.getItem(store.ROSTER_KEY)).toBeNull();
  });
  it('초기화하면 빼 둔 상태도 지운다', () => {
    nietzscheMidway();
    store.switchFavorite('xunzi');
    expect(window.localStorage.getItem(store.ROSTER_KEY)).not.toBeNull();
    store.resetProgress();
    expect(window.localStorage.getItem(store.ROSTER_KEY)).toBeNull();
  });
  it('카드 수는 지금 작가 것만 센다', () => {
    const cardsOfBoth = [getReading('nietzsche', 0).cardId, getReading('nietzsche', 1).cardId, getReading('xunzi', 0).cardId];
    const p = { ...createInitial(), cards: cardsOfBoth };
    expect(favoriteCardCount({ ...p, favoriteId: 'nietzsche' })).toBe(2);
    expect(favoriteCardCount({ ...p, favoriteId: 'xunzi' })).toBe(1);
    expect(favoriteCardCount({ ...p, favoriteId: 'austen' })).toBe(0);
    expect(favoriteCardCount(p)).toBe(0);
  });
  it('작가 하나만 한 기존 사용자의 카드 수는 전과 같다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    playMission('nietzsche', 0);
    expect(favoriteCardCount(store.getProgress())).toBe(store.getProgress().cards.length);
  });
});

describe('조사', () => {
  it('받침에 맞는 조사를 쓴다', () => {
    expect(characters.map((c) => c.nameWith)).toEqual(['싯다르타와', '니체와', '제인 오스틴과', '순자와']);
  });
});
