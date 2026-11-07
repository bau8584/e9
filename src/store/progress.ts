// 진행 기록의 규칙만 모은 곳. 화면도 저장소도 모르는 순수한 계산이라 테스트하기 쉽다.
import {
  characters,
  exampleRanking,
  getCard,
  getCardsOf,
  getDm,
  getMissionCount,
  getReading,
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
  /** 지금 하는 미션 순서(0부터). 값이 없던 옛 기록은 첫 미션으로 읽는다. */
  missionIndex: number;
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
  missionIndex: 0,
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
  if (!getDm(p.favoriteId, p.missionIndex).replies.some((r) => r.id === replyId)) return p;
  return { ...p, dmRead: true, dmChoiceId: replyId, stage: p.stage === 'dm' ? 'reading' : p.stage };
}

export function answerQuiz(p: Progress, optionId: string): { next: Progress; correct: boolean } {
  if (!p.favoriteId || p.stage !== 'reading') return { next: p, correct: false };
  const correct = getReading(p.favoriteId, p.missionIndex).correctOptionId === optionId;
  return {
    correct,
    next: correct
      ? { ...p, stage: 'draw', lastWrongOptionId: null }
      : { ...p, lastWrongOptionId: optionId },
  };
}

/**
 * 카드 뽑기. 미션마다 받는 카드가 정해져 있어 운에 따라 못 얻는 일이 없다.
 * 같은 미션의 보상은 몇 번을 눌러도 한 번만 들어온다.
 * 옛 뽑기로 희귀 카드를 먼저 받은 사람은 둘째 미션에서 아직 없는 카드를 받는다.
 */
export function drawCard(p: Progress): Progress {
  if (!p.favoriteId || p.stage !== 'draw') return p;
  const reading = getReading(p.favoriteId, p.missionIndex);
  const missionId = reading.id;
  if (p.rewardedMissions.includes(missionId)) return { ...p, stage: 'done' };
  const cardId = p.cards.includes(reading.cardId)
    ? getCardsOf(p.favoriteId).find((c) => !p.cards.includes(c.id))?.id
    : reading.cardId;
  return {
    ...p,
    stage: 'done',
    cards: cardId ? [...p.cards, cardId] : p.cards,
    score: p.score + REWARD_SCORE,
    rewardedMissions: [...p.rewardedMissions, missionId],
  };
}

/** 끝낸 미션 다음에 미션이 남아 있으면 다음 DM부터 다시 시작한다. */
export function advanceMission(p: Progress): Progress {
  if (!p.favoriteId || p.stage !== 'done' || p.missionIndex + 1 >= getMissionCount(p.favoriteId)) return p;
  return {
    ...p,
    missionIndex: p.missionIndex + 1,
    stage: 'dm',
    dmRead: false,
    dmChoiceId: null,
    lastWrongOptionId: null,
  };
}

/** 인물의 마지막 미션까지 끝냈는지 */
export const isSeasonComplete = (p: Progress): boolean =>
  Boolean(p.favoriteId) && p.stage === 'done' && p.missionIndex + 1 >= getMissionCount(p.favoriteId as CharacterId);

/** 화면 이동 규칙. 홈이나 DM으로 가면 끝낸 미션 다음의 새 DM이 열린다. */
export function moveTo(p: Progress, screen: Screen): Progress {
  const moved = { ...p, screen };
  return screen === 'home' || screen === 'dm' ? advanceMission(moved) : moved;
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

/** 실제 팬덤 점수로 줄을 세운다. 점수가 같으면 같은 순위, 내 최애를 먼저 적는다. 전부 0이어도 그대로 보인다. */
export function computeRealRanking(favoriteId: CharacterId, scores: Record<CharacterId, number>): RankRow[] {
  const rows = characters
    .map((c) => ({ id: c.id, name: c.name, score: scores[c.id] ?? 0, isFavorite: c.id === favoriteId }))
    .sort((a, b) => b.score - a.score || Number(b.isFavorite) - Number(a.isFavorite));
  return rows.map((row) => ({ ...row, rank: rows.findIndex((other) => other.score === row.score) + 1 }));
}

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
  const missionIndex =
    favoriteId && Number.isInteger(r.missionIndex) && (r.missionIndex as number) >= 0 && (r.missionIndex as number) < getMissionCount(favoriteId)
      ? (r.missionIndex as number)
      : 0;
  const dmChoiceId =
    favoriteId && getDm(favoriteId, missionIndex).replies.some((reply) => reply.id === r.dmChoiceId)
      ? (r.dmChoiceId as string)
      : null;
  const stage: Stage = onboarded && STAGES.includes(r.stage as Stage) ? (r.stage as Stage) : 'dm';
  const clean: Progress = {
    version: 1,
    nickname,
    favoriteId,
    screen: !onboarded && needsOnboarding ? 'landing' : screen,
    missionIndex,
    stage,
    dmRead: r.dmRead === true,
    // 단계가 dm인데 답장만 남아 있으면 답장도 못 하고 원문도 안 열려 DM과 읽기를 끝없이 오간다. 답장을 비운다.
    dmChoiceId: stage === 'dm' ? null : dmChoiceId,
    lastWrongOptionId: typeof r.lastWrongOptionId === 'string' ? r.lastWrongOptionId : null,
    cards: Array.isArray(r.cards) ? r.cards.filter((id) => typeof id === 'string' && getCard(id)) : [],
    score: typeof r.score === 'number' && Number.isFinite(r.score) && r.score >= 0 ? r.score : 0,
    rewardedMissions: Array.isArray(r.rewardedMissions)
      ? r.rewardedMissions.filter((id) => typeof id === 'string')
      : [],
  };
  // 미션이 1개이던 시절에 끝낸 기록은 홈이나 DM에 있으면 바로 다음 DM을 연다.
  return clean.screen === 'home' || clean.screen === 'dm' ? advanceMission(clean) : clean;
}
