import type { QuoteCard } from './types';

/** 희귀 카드가 나올 확률. 0.3 = 30% */
export const RARE_CHANCE = 0.3;

/** 미션 하나를 끝내면 오르는 점수 */
export const REWARD_SCORE = 20;

// 문장 카드. 모두 제작진 임시 번역이며 검수 필요 상태다.
export const cards: QuoteCard[] = [
  {
    id: 'card-siddhartha-common',
    characterId: 'siddhartha',
    rarity: '일반',
    quote: '미움은 미움으로 가라앉지 않는다.',
    source: '『담마파다』 5게로 추정',
    imageFile: 'card-siddhartha-common.png',
  },
  {
    id: 'card-siddhartha-rare',
    characterId: 'siddhartha',
    rarity: '희귀',
    quote: '마음이 모든 것에 앞선다.',
    source: '『담마파다』 1게로 추정',
    imageFile: 'card-siddhartha-rare.png',
  },
  {
    id: 'card-nietzsche-common',
    characterId: 'nietzsche',
    rarity: '일반',
    quote: '나를 죽이지 않는 것은 나를 더 강하게 만든다.',
    source: '『우상의 황혼』으로 추정',
    imageFile: 'card-nietzsche-common.png',
  },
  {
    id: 'card-nietzsche-rare',
    characterId: 'nietzsche',
    rarity: '희귀',
    quote: '춤추는 별을 낳으려면 자기 안에 혼돈을 품고 있어야 한다.',
    source: '『차라투스트라는 이렇게 말했다』 서문으로 추정',
    imageFile: 'card-nietzsche-rare.png',
  },
  {
    id: 'card-austen-common',
    characterId: 'austen',
    rarity: '일반',
    quote: '재산이 넉넉한 독신 남자라면 틀림없이 아내를 원한다. 누구나 인정하는 진리다.',
    source: '『오만과 편견』 1장으로 추정',
    imageFile: 'card-austen-common.png',
  },
  {
    id: 'card-austen-rare',
    characterId: 'austen',
    rarity: '희귀',
    quote: '뭐니 뭐니 해도 독서만 한 즐거움은 없다니까요.',
    source: '『오만과 편견』 11장, 캐럴라인 빙리의 대사로 추정',
    imageFile: 'card-austen-rare.png',
  },
  {
    id: 'card-xunzi-common',
    characterId: 'xunzi',
    rarity: '일반',
    quote: '사람의 본성은 악하다. 그 선함은 애써 만든 것이다.',
    source: '『순자』 「성악」으로 추정',
    imageFile: 'card-xunzi-common.png',
  },
  {
    id: 'card-xunzi-rare',
    characterId: 'xunzi',
    rarity: '희귀',
    quote: '푸른빛은 쪽에서 나왔으나 쪽보다 더 푸르다.',
    source: '『순자』 「권학」으로 추정',
    imageFile: 'card-xunzi-rare.png',
  },
];
