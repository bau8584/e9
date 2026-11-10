// 덕질 개편(docs/PLAN-덕질-개편.md)의 자료 모양. 여러 사람이 이 모양에 맞춰 따로 만든다. 바꾸려면 조율 담당에게 먼저 알린다.
// 모든 대사는 제작진 각색. {name}은 닉네임으로 바뀐다.
import type { CharacterId } from './types';

/** 읽기 본문 한 덩이. text = 번역한 원문 문단, aside = 읽는 중간에 인물이 끼어드는 한마디(각색) */
export interface PassageBlock {
  kind: 'text' | 'aside';
  text: string;
}

/** 대목 끝에서 인물이 묻는 질문의 답. 정답은 없다. */
export interface PassageOption {
  id: string;
  text: string;
  /** 이 답을 골랐을 때 인물의 반응(말풍선 여러 개) */
  reaction: string[];
  /** 호감 보너스 0~3 */
  affinity: number;
}

export interface Passage {
  /** `${bookId}-1` 부터 차례로 */
  id: string;
  bookId: string;
  title: string;
  /** 읽는 데 걸리는 분(한국어 분당 500자 기준) */
  minutes: number;
  /** 출처 표기(책, 장, 절) */
  source: string;
  /** 목록에 보일 한 줄. 인물 말투로 읽고 싶게 */
  hook: string;
  blocks: PassageBlock[];
  question: { prompt: string; options: PassageOption[] };
  /** "이 대목으로 말 걸기"로 DM에 갔을 때 인물이 먼저 꺼내는 말 */
  talkPrompt: string;
}

export interface Book {
  id: string;
  characterId: CharacterId;
  title: string;
  /** 원제와 연도 */
  original: string;
  /** 인물이 자기 책을 소개하는 한두 줄(각색) */
  intro: string;
  /** 번역 출처와 상태. 예: "제작진 초벌 번역(검수 필요). 저본: ..." */
  translationNote: string;
  passages: Passage[];
}

export interface EpisodeChoice {
  id: string;
  text: string;
  reply: string[];
  /** 호감 보너스 0~3 */
  affinity: number;
}

/** 인물이 말하고(say), 고를 것이 있으면 고른다(choices). choices가 없으면 다음 beat로 이어진다. */
export interface EpisodeBeat {
  say: string[];
  choices?: EpisodeChoice[];
}

/** 선택 대화 한 편 */
export interface Episode {
  /** `${characterId}-ep1` 부터 차례로 */
  id: string;
  characterId: CharacterId;
  title: string;
  /** 이 호감 단계(0~3)부터 열린다 */
  minStage: number;
  /** 목록과 홈 배너의 미리보기 */
  preview: string;
  beats: EpisodeBeat[];
  /** 끝에서 인물이 권하는 대목 id */
  recommend?: string;
}

export type FanRarity = '일반' | '희귀' | '초희귀' | '한정';

/** 인물 그림 카드. 한정은 팩에서 나오지 않고 호감 단계가 오를 때 받는다(id: `${characterId}-limited-${단계 1~3}`). */
export interface FanCard {
  id: string;
  characterId: CharacterId;
  rarity: FanRarity;
  title: string;
  /** 시기나 장면. 예: "1872 · 음악에 빠진 니체" */
  scene: string;
  /** 카드 뒷면의 한 줄(각색) */
  line: string;
  /** 그림 색감 구분용 0~3. 그림이 생기기 전까지 틀 색으로 쓴다. */
  tone: number;
  /** 나중에 그릴 일러스트 메모 */
  artNote: string;
}
