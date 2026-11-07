// 진행 기록의 규칙만 모은 곳. 화면도 저장소도 모르는 순수한 계산이라 테스트하기 쉽다.
import {
  characters,
  exampleRanking,
  getCard,
  getCardsOf,
  getDm,
  getReading,
  RARE_CHANCE,
  REWARD_SCORE,
  type CharacterId,
} from '../data';

export type Screen = 'landing' | 'onboarding' | 'badge' | 'home' | 'dm' | 'reading' | 'myroom';
export type Stage = 'dm' | 'reading' | 'draw' | 'done';

export interface Progress {
  version: 1;
  nickname: string;
  favoriteId: CharacterId | null;
  screen: Screen;
  stage: Stage;
  dmRead: boolean;
  dmChoiceId: string | null;
  lastWrongOptionId: string | null;
  cards: string[];
  score: number;
  rewardedMissions: string[];
}

export const NICKNAME_MAX = 20;
export const EMPTY_NICKNAME_MESSAGE = '뭐라고 불러 드릴까요?';

export const createInitial = (): Progress => ({
  version: 1,
  nickname: '',
  favoriteId: null,
  screen: 'landing',
  stage: 'dm',
  dmRead: false,
  dmChoiceId: null,
  lastWrongOptionId: null,
  cards: [],
  score: 0,
  rewardedMissions: [],
});

export const cleanNickname = (raw: string): string => raw.trim().slice(0, NICKNAME_MAX);

export function completeOnboarding(p: Progress, rawNickname: string, favoriteId: CharacterId): Progress {
  const nickname = cleanNickname(rawNickname);
  if (!nickname) return p;
  return { ...p, nickname, favoriteId, screen: 'badge' };
}

export function chooseReply(p: Progress, replyId: string): Progress {
  if (!p.favoriteId || p.dmChoiceId) return p;
  if (!getDm(p.favoriteId).replies.some((r) => r.id === replyId)) return p;
  return { ...p, dmRead: true, dmChoiceId: replyId, stage: p.stage === 'dm' ? 'reading' : p.stage };
}

export function answerQuiz(p: Progress, optionId: string): { next: Progress; correct: boolean } {
  if (!p.favoriteId || p.stage !== 'reading') return { next: p, correct: false };
  const correct = getReading(p.favoriteId).correctOptionId === optionId;
  return {
    correct,
    next: correct
      ? { ...p, stage: 'draw', lastWrongOptionId: null }
      : { ...p, lastWrongOptionId: optionId },
  };
}

/** 카드 뽑기. 같은 미션의 보상은 몇 번을 눌러도 한 번만 들어온다. */
export function drawCard(p: Progress, random: () => number = Math.random): Progress {
  if (!p.favoriteId || p.stage !== 'draw') return p;
  const missionId = getReading(p.favoriteId).id;
  if (p.rewardedMissions.includes(missionId)) return { ...p, stage: 'done' };
  const owned = getCardsOf(p.favoriteId);
  const rarity = random() < RARE_CHANCE ? '희귀' : '일반';
  const card = owned.find((c) => c.rarity === rarity) ?? owned[0];
  return {
    ...p,
    stage: 'done',
    cards: p.cards.includes(card.id) ? p.cards : [...p.cards, card.id],
    score: p.score + REWARD_SCORE,
    rewardedMissions: [...p.rewardedMissions, missionId],
  };
}

export interface RankRow {
  id: CharacterId;
  name: string;
  score: number;
  rank: number;
  isFavorite: boolean;
}

/** 이번 주 팬덤 순위. 예시 점수에 내 점수를 더해 줄을 세운다. */
export function computeRanking(favoriteId: CharacterId, myScore: number): RankRow[] {
  const base = exampleRanking[favoriteId];
  return characters
    .map((c) => ({
      id: c.id,
      name: c.name,
      score: base[c.id] + (c.id === favoriteId ? myScore : 0),
      isFavorite: c.id === favoriteId,
    }))
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export const rankOf = (favoriteId: CharacterId, myScore: number): number =>
  computeRanking(favoriteId, myScore).find((r) => r.isFavorite)?.rank ?? 0;

const SCREENS: Screen[] = ['landing', 'onboarding', 'badge', 'home', 'dm', 'reading', 'myroom'];
const STAGES: Stage[] = ['dm', 'reading', 'draw', 'done'];

/** 저장된 값이 깨졌거나 옛 모양이어도 앱이 멈추지 않게 걸러 낸다. */
export function sanitize(raw: unknown): Progress {
  const init = createInitial();
  if (!raw || typeof raw !== 'object') return init;
  const r = raw as Partial<Progress>;
  if (r.version !== 1) return init;
  const favoriteId = characters.some((c) => c.id === r.favoriteId) ? (r.favoriteId as CharacterId) : null;
  const nickname = typeof r.nickname === 'string' ? cleanNickname(r.nickname) : '';
  const onboarded = Boolean(favoriteId && nickname);
  const screen = SCREENS.includes(r.screen as Screen) ? (r.screen as Screen) : init.screen;
  const needsOnboarding = screen === 'badge' || screen === 'home' || screen === 'dm' || screen === 'reading' || screen === 'myroom';
  return {
    version: 1,
    nickname,
    favoriteId,
    screen: !onboarded && needsOnboarding ? 'landing' : screen,
    stage: onboarded && STAGES.includes(r.stage as Stage) ? (r.stage as Stage) : 'dm',
    dmRead: r.dmRead === true,
    dmChoiceId: typeof r.dmChoiceId === 'string' ? r.dmChoiceId : null,
    lastWrongOptionId: typeof r.lastWrongOptionId === 'string' ? r.lastWrongOptionId : null,
    cards: Array.isArray(r.cards) ? r.cards.filter((id) => typeof id === 'string' && getCard(id)) : [],
    score: typeof r.score === 'number' && Number.isFinite(r.score) && r.score >= 0 ? r.score : 0,
    rewardedMissions: Array.isArray(r.rewardedMissions)
      ? r.rewardedMissions.filter((id) => typeof id === 'string')
      : [],
  };
}
