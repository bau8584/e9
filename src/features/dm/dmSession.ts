// 진행 중인 선택 대화와 자유대화를 이 탭에만 잠시 둔다(sessionStorage). 화면을 떠났다 와도 이어진다.
// 오래 남길 기록(끝낸 대화, 대화 시간, 기억)은 store/fan.ts가 맡는다.
import type { EpisodePicks } from './episodeFlow';

export interface Reward {
  first: boolean;
  affinity: number;
  ticket: boolean;
  ticketFull: boolean;
}

export interface EpisodeSession {
  id: string;
  picks: EpisodePicks;
  /** 연출을 다 본 말풍선 수 */
  seen: number;
  /** 끝까지 보았으면 그때 받은 것 */
  finished: Reward | null;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  note?: string;
}

export interface FreeChatSession {
  /** 대화 시간 1회를 이미 썼다(첫 답이 온 뒤) */
  started: boolean;
  /** 인물이 먼저 꺼낸 말(화제, 기억). 서버에는 context로만 보낸다. */
  intro: string[];
  /** 이 대화의 화제 대목 id */
  topicId: string | null;
  turns: ChatTurn[];
  finished: Reward | null;
}

const read = <T,>(key: string): T | null => {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장이 막혀도 이 화면 안에서는 이어진다 */
  }
};

const episodeKey = (characterId: string) => `hipdok:dm-episode:${characterId}`;
const chatKey = (characterId: string) => `hipdok:free-chat:${characterId}`;

export const readEpisodeSession = (characterId: string) => read<EpisodeSession>(episodeKey(characterId));
export const writeEpisodeSession = (characterId: string, value: EpisodeSession | null) => write(episodeKey(characterId), value);
export const readChatSession = (characterId: string) => {
  const saved = read<FreeChatSession>(chatKey(characterId));
  return saved && Array.isArray(saved.turns) && Array.isArray(saved.intro) ? saved : null;
};
export const writeChatSession = (characterId: string, value: FreeChatSession | null) => write(chatKey(characterId), value);
