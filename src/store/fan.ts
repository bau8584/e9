// 덕질 개편의 기록. 옛 진행 기록(hipdok:v1)과 서버 규칙을 건드리지 않도록 따로 저장한다. 이 기기에만 남는다.
// 규칙: 대목을 읽거나 선택 대화 한 편을 끝내면 호감 + 팩 1개 + 대화 시간 1회. 자유대화를 마치면 호감 + 팩 1개.
import { useSyncExternalStore } from 'react';
import type { CharacterId } from '../data/types';
import type { FanCard, FanRarity } from '../data/fanTypes';

export const FAN_KEY = 'hipdok:fan:v1';

/** 호감 단계(0~3)에 오르는 데 필요한 호감 */
// 끝 단계는 읽기와 대화만으로는 닿지 않고(평균 115 안팎), 날마다 찾아온 날이 쌓여야 닿는다(2~3주).
export const AFFINITY_THRESHOLDS = [0, 15, 60, 160];
/** 날이 바뀌고 처음 왔을 때 최애에게 오르는 호감 */
export const DAILY_AFFINITY = 3;
/** 함께한 날이 이만큼 쌓이면 팩을 더 준다 */
export const DAY_MILESTONES = [7, 14, 30];
export const MILESTONE_PACKS = 3;
/** 자유대화에서 내 말이 이보다 적으면 팩을 주지 않는다 */
export const CHAT_MIN_TURNS = 3;
export const PASSAGE_AFFINITY = 10;
export const EPISODE_AFFINITY = 5;
export const CHAT_AFFINITY = 5;
/** 모아 둘 수 있는 대화 시간 */
export const TICKET_CAP = 3;
/** 호감 단계별 자유대화 한 번에 보낼 수 있는 말 수 */
export const CHAT_TURNS_BY_STAGE = [8, 10, 12, 15];
export const PACK_SIZE = 3;
/** 팩에서 나올 확률(%). 화면에 그대로 적는다. */
export const RARITY_RATES: Record<Exclude<FanRarity, '한정'>, number> = { 일반: 70, 희귀: 25, 초희귀: 5 };
/** 겹친 카드가 바뀌는 조각 수 */
export const SHARDS_FROM_DUPLICATE: Record<FanRarity, number> = { 일반: 2, 희귀: 6, 초희귀: 20, 한정: 0 };
/** 조각으로 카드를 바꿀 때 드는 수. 한정은 바꿀 수 없다. */
export const SHARD_COST: Record<Exclude<FanRarity, '한정'>, number> = { 일반: 8, 희귀: 24, 초희귀: 60 };

export interface FanState {
  affinity: Partial<Record<CharacterId, number>>;
  /** 끝낸 대목 id → 고른 답 id */
  passages: Record<string, string>;
  /** 끝낸 선택 대화 id → 고른 답 id들 */
  episodes: Record<string, string[]>;
  packs: number;
  /** 가진 카드 id → 장수 */
  cards: Record<string, number>;
  shards: number;
  chatTickets: number;
  /** 인물이 기억하는 자유대화 한 줄들(최근 5개) */
  memories: Partial<Record<CharacterId, string[]>>;
  /** DM에서 이야기할 대목 id. 읽기에서 "말 걸기"를 누르면 들어간다. */
  talkTopic: string | null;
  /** 마지막으로 온 날(YYYY-MM-DD). 날짜 장치용. */
  lastVisit: string | null;
  /** 함께한 날 수(누적. 쉬어도 줄지 않는다) */
  days: number;
  /** 처음 끝낸 선택 대화 id → 끝낸 날 */
  episodeDays: Record<string, string>;
}

const initial = (): FanState => ({
  affinity: {},
  passages: {},
  episodes: {},
  packs: 1,
  cards: {},
  shards: 0,
  chatTickets: 1,
  memories: {},
  talkTopic: null,
  lastVisit: null,
  days: 0,
  episodeDays: {},
});

function load(): FanState {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(FAN_KEY) ?? 'null');
    return raw && typeof raw === 'object' ? { ...initial(), ...(raw as Partial<FanState>) } : initial();
  } catch {
    return initial();
  }
}

let state = load();
const listeners = new Set<() => void>();

function commit(next: FanState) {
  state = next;
  try {
    localStorage.setItem(FAN_KEY, JSON.stringify(next));
  } catch {
    /* 저장이 막혀도 이번 방문 동안은 이어진다 */
  }
  listeners.forEach((listen) => listen());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === FAN_KEY || event.key === null) {
      state = load();
      listeners.forEach((listen) => listen());
    }
  });
}

function subscribe(listen: () => void) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

export const getFan = (): FanState => state;
export const useFan = (): FanState => useSyncExternalStore(subscribe, getFan);

export const affinityOf = (id: CharacterId, s: FanState = state): number => s.affinity[id] ?? 0;
export const stageOfAffinity = (points: number): number =>
  AFFINITY_THRESHOLDS.reduce((stage, need, index) => (points >= need ? index : stage), 0);

/** 오늘 날짜(이 기기 시각) */
export function todayKey(now: Date = new Date()): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

export interface DailyGift {
  /** 함께한 날 수 */
  days: number;
  packs: number;
  ticket: boolean;
  affinity: number;
  /** 7, 14, 30일째면 그 숫자 */
  milestone: number | null;
}

/** 앱을 열 때 부른다. 날이 바뀌고 처음이면 함께한 날을 하나 올리고 선물을 준다. 첫날은 날만 세고 선물은 없다(null). 같은 날 다시 부르면 null. */
export function checkIn(id: CharacterId | null, now: Date = new Date()): DailyGift | null {
  const today = todayKey(now);
  if (state.lastVisit === today) return null;
  const days = state.days + 1;
  if (days === 1) {
    commit({ ...state, lastVisit: today, days });
    return null;
  }
  const milestone = DAY_MILESTONES.includes(days) ? days : null;
  const packs = 1 + (milestone ? MILESTONE_PACKS : 0);
  const ticket = state.chatTickets < TICKET_CAP;
  commit({
    ...state,
    lastVisit: today,
    days,
    packs: state.packs + packs,
    chatTickets: Math.min(TICKET_CAP, state.chatTickets + 1),
    affinity: id ? { ...state.affinity, [id]: affinityOf(id) + DAILY_AFFINITY } : state.affinity,
  });
  return { days, packs, ticket, affinity: id ? DAILY_AFFINITY : 0, milestone };
}

/** 오늘 이 인물의 새 선택 대화를 몇 편 더 열 수 있나. 첫날은 2편, 그 뒤로는 하루 1편. 이미 끝낸 편은 언제든 다시 볼 수 있다. */
export function episodeSlotsLeft(id: CharacterId, s: FanState = state, now: Date = new Date()): number {
  const today = todayKey(now);
  const doneToday = Object.entries(s.episodeDays).filter(([episodeId, day]) => episodeId.startsWith(`${id}-`) && day === today).length;
  return Math.max(0, (s.days <= 1 ? 2 : 1) - doneToday);
}

const withReward = (s: FanState, id: CharacterId, gain: number, ticket: boolean): FanState => ({
  ...s,
  affinity: { ...s.affinity, [id]: affinityOf(id, s) + gain },
  packs: s.packs + 1,
  chatTickets: ticket ? Math.min(TICKET_CAP, s.chatTickets + 1) : s.chatTickets,
});

/** 대목을 끝까지 읽고 답을 골랐다. 처음일 때만 보상을 주고 true를 돌려준다. 다시 읽으면 고른 답만 바뀐다. */
export function completePassage(id: CharacterId, passageId: string, optionId: string, bonus = 0): boolean {
  const first = !(passageId in state.passages);
  const base = { ...state, passages: { ...state.passages, [passageId]: optionId } };
  commit(first ? withReward(base, id, PASSAGE_AFFINITY + bonus, true) : base);
  return first;
}

/** 선택 대화 한 편을 끝냈다. 처음일 때만 보상을 주고 true를 돌려준다. */
export function completeEpisode(id: CharacterId, episodeId: string, choiceIds: string[], bonus = 0): boolean {
  const first = !(episodeId in state.episodes);
  const base = {
    ...state,
    episodes: { ...state.episodes, [episodeId]: choiceIds },
    episodeDays: first ? { ...state.episodeDays, [episodeId]: todayKey() } : state.episodeDays,
  };
  commit(first ? withReward(base, id, EPISODE_AFFINITY + bonus, true) : base);
  return first;
}

/** 자유대화를 시작한다. 대화 시간이 없으면 false. */
export function startFreeChat(): boolean {
  if (state.chatTickets <= 0) return false;
  commit({ ...state, chatTickets: state.chatTickets - 1 });
  return true;
}

/** 자유대화를 마쳤다. memory는 인물이 기억할 한 줄(없어도 된다). */
export function finishFreeChat(id: CharacterId, memory?: string, turns = CHAT_MIN_TURNS) {
  const enough = turns >= CHAT_MIN_TURNS;
  const next = enough
    ? withReward(state, id, CHAT_AFFINITY, false)
    : { ...state, affinity: { ...state.affinity, [id]: affinityOf(id) + Math.min(2, turns) } };
  const kept = memory?.trim() ? [...(state.memories[id] ?? []), memory.trim().slice(0, 80)].slice(-5) : state.memories[id];
  commit({ ...next, memories: { ...next.memories, [id]: kept } });
}

export const setTalkTopic = (passageId: string | null) => commit({ ...state, talkTopic: passageId });

export interface Drawn {
  card: FanCard;
  duplicate: boolean;
  /** 겹쳐서 받은 조각 수 */
  shards: number;
}

function pick(pool: FanCard[], random: () => number): FanCard {
  const roll = random() * 100;
  const rarity: FanRarity = roll < RARITY_RATES.초희귀 ? '초희귀' : roll < RARITY_RATES.초희귀 + RARITY_RATES.희귀 ? '희귀' : '일반';
  const tier = pool.filter((card) => card.rarity === rarity);
  const from = tier.length ? tier : pool;
  return from[Math.floor(random() * from.length)];
}

/** 팩 하나를 연다. pool은 뽑힐 수 있는 카드(한정 제외)를 넘긴다. 팩이 없거나 pool이 비면 빈 배열. */
export function openPack(pool: FanCard[], random: () => number = Math.random): Drawn[] {
  const candidates = pool.filter((card) => card.rarity !== '한정');
  if (state.packs <= 0 || !candidates.length) return [];
  const cards = { ...state.cards };
  let shards = state.shards;
  const drawn = Array.from({ length: PACK_SIZE }, (): Drawn => {
    const card = pick(candidates, random);
    const duplicate = (cards[card.id] ?? 0) > 0;
    const gained = duplicate ? SHARDS_FROM_DUPLICATE[card.rarity] : 0;
    cards[card.id] = (cards[card.id] ?? 0) + 1;
    shards += gained;
    return { card, duplicate, shards: gained };
  });
  commit({ ...state, packs: state.packs - 1, cards, shards });
  return drawn;
}

/** 조각으로 아직 없는 카드를 바꾼다. 조각이 모자라거나 한정이면 false. */
export function exchangeCard(card: FanCard): boolean {
  if (card.rarity === '한정') return false;
  const cost = SHARD_COST[card.rarity];
  if (state.shards < cost) return false;
  commit({ ...state, shards: state.shards - cost, cards: { ...state.cards, [card.id]: (state.cards[card.id] ?? 0) + 1 } });
  return true;
}

/** 한정 카드처럼 뽑기 밖에서 주는 카드. 이미 있으면 그대로 둔다. */
export function grantCard(cardId: string) {
  if (state.cards[cardId]) return;
  commit({ ...state, cards: { ...state.cards, [cardId]: 1 } });
}

/** 입덕 기록을 초기화할 때 같이 부른다. */
export function resetFan() {
  commit(initial());
}
