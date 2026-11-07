// 콘텐츠 파일들의 모양을 정하는 곳. 글을 고칠 때는 이 파일을 건드릴 필요가 없다.

export type CharacterId = 'siddhartha' | 'nietzsche' | 'austen' | 'xunzi';

export interface Character {
  id: CharacterId;
  name: string;
  englishName: string;
  /** 받침에 맞춘 '○○와/과'. 'DM' 앞에 붙인다. */
  nameWith: string;
  /** 첫 화면의 도발적인 한 줄 (제작진 각색) */
  tagline: string;
  /** 이름 첫 글자 자리 표시. 이미지가 없을 때 보인다. */
  monogram: string;
  /** public/images 안의 파일 이름 */
  portraitFile: string;
}

export interface DmReply {
  id: string;
  /** 사용자가 고르는 답장 */
  text: string;
  /** 인물이 이어서 하는 말 */
  answer: string[];
}

export interface DmSet {
  characterId: CharacterId;
  /** 홈 배너에 보이는 미리보기 */
  preview: string;
  messages: string[];
  replies: DmReply[];
  /** 원문으로 넘어가는 버튼 문구 */
  readButton: string;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface Reading {
  id: string;
  characterId: CharacterId;
  /** 이 미션을 끝내면 받는 카드. 첫 미션은 일반, 둘째 미션은 희귀 */
  cardId: string;
  /** 미션 제목 */
  title: string;
  /** 원문(원어) 짧게 */
  original: string;
  /** 제작진 초벌 번역 */
  translation: string;
  /** 확정 출처 표기. 추정 표현을 쓰지 않는다. 사람 확인 여부는 "검수 필요" 라벨이 나타낸다. */
  source: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  /** 오답일 때 보여 줄 대목 */
  hintPassage: string;
  hintNote: string;
}

export type Rarity = '일반' | '희귀';

export interface QuoteCard {
  id: string;
  characterId: CharacterId;
  rarity: Rarity;
  /** 카드에 쓰는 문장 (제작진 초벌 번역) */
  quote: string;
  source: string;
  imageFile: string;
}

/** 최애별 시연용 순위표. 바깥 칸 = 사용자의 최애, 안쪽 칸 = 각 팬덤의 예시 점수 */
export type ExampleRanking = Record<CharacterId, Record<CharacterId, number>>;
