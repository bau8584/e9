import type { QuoteCard } from './types';

/** 미션 하나를 끝내면 오르는 점수 */
export const REWARD_SCORE = 20;

// 문장 카드. 모두 제작진 초벌 번역이며 사람 확인 전까지 검수 필요 상태다.
export const cards: QuoteCard[] = [
  {
    id: 'card-siddhartha-common',
    characterId: 'siddhartha',
    rarity: '일반',
    quote: '미움은 미움으로는 결코 가라앉지 않는다.',
    source: '『담마파다』 쌍품 5게 (팔리어 원문, 제작진 초벌 번역)',
    imageFile: 'card-siddhartha-common.png',
  },
  {
    id: 'card-siddhartha-rare',
    characterId: 'siddhartha',
    rarity: '희귀',
    quote: '마음의 일들은 마음이 앞서 이끈다.',
    source: '『담마파다』 쌍품 1게 앞부분 (팔리어 원문, 제작진 초벌 번역)',
    imageFile: 'card-siddhartha-rare.png',
  },
  {
    id: 'card-nietzsche-common',
    characterId: 'nietzsche',
    rarity: '일반',
    quote: '나를 죽이지 않는 것은 나를 더 강하게 만든다.',
    source: '『우상의 황혼』 「잠언과 화살」 8 (독일어 원문, 제작진 초벌 번역)',
    imageFile: 'card-nietzsche-common.png',
  },
  {
    id: 'card-nietzsche-rare',
    characterId: 'nietzsche',
    rarity: '희귀',
    quote: '춤추는 별을 낳으려면 자기 안에 아직 혼돈을 지니고 있어야 한다.',
    source: '『차라투스트라는 이렇게 말했다』 서문 5절, 차라투스트라의 말 (독일어 원문, 제작진 초벌 번역)',
    imageFile: 'card-nietzsche-rare.png',
  },
  {
    id: 'card-austen-common',
    characterId: 'austen',
    rarity: '일반',
    quote: '재산이 넉넉한 독신 남자라면 틀림없이 아내가 필요할 것이라는 점은 누구나 인정하는 진리다.',
    source: '『오만과 편견』 1권 1장, 1813년 초판 전사본 (제작진 초벌 번역)',
    imageFile: 'card-austen-common.png',
  },
  {
    id: 'card-austen-rare',
    characterId: 'austen',
    rarity: '희귀',
    quote: '역시 독서만 한 즐거움은 없다니까요!',
    source: '『오만과 편견』 1권 11장, 빙리 양의 대사, 1813년 초판 전사본 (제작진 초벌 번역)',
    imageFile: 'card-austen-rare.png',
  },
  {
    id: 'card-xunzi-common',
    characterId: 'xunzi',
    rarity: '일반',
    quote: '사람의 본성은 악하다. 그 선함은 애써 만든 것이다.',
    source: '『순자』 「성악」 첫머리 (한문 원문, 제작진 초벌 번역)',
    imageFile: 'card-xunzi-common.png',
  },
  {
    id: 'card-xunzi-rare',
    characterId: 'xunzi',
    rarity: '희귀',
    quote: '푸른빛은 쪽에서 얻지만 쪽보다 더 푸르다.',
    source: '『순자』 「권학」 첫머리 (한문 원문, 제작진 초벌 번역)',
    imageFile: 'card-xunzi-rare.png',
  },
];
