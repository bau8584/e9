import type { Reading } from './types';

// 원문과 문제. 모두 제작진의 기억으로 적은 초안이라 검수 전까지 사실로 쓰지 않는다.
// 번역은 제작진 임시 번역이다. 시중 번역서 문장을 그대로 넣지 않는다.
// 확인할 내용은 docs/콘텐츠-검수표.md 에 있다.
export const readings: Reading[] = [
  {
    id: 'reading-siddhartha-1',
    characterId: 'siddhartha',
    title: '미움을 끝내는 법',
    original: 'Na hi verena verāni sammantīdha kudācanaṃ.',
    translation: '이 세상에서 미움은 미움으로 가라앉지 않는다.',
    source: '『담마파다』 5게로 추정. 판본과 번호 확인 필요',
    question: '이 문장에 따르면 미움으로 가라앉힐 수 없는 것은 무엇인가요?',
    options: [
      { id: 'a', text: '미움' },
      { id: 'b', text: '슬픔' },
      { id: 'c', text: '배고픔' },
    ],
    correctOptionId: 'a',
    hintPassage: '이 세상에서 미움은 미움으로 가라앉지 않는다.',
    hintNote: '문장의 앞부분을 다시 보세요. 무엇이 가라앉지 않는다고 하나요?',
  },
  {
    id: 'reading-nietzsche-1',
    characterId: 'nietzsche',
    title: '버거운 날의 한 줄',
    original: 'Was mich nicht umbringt, macht mich stärker.',
    translation: '나를 죽이지 않는 것은 나를 더 강하게 만든다.',
    source: '『우상의 황혼』 「잠언과 화살」 8로 추정. 판본과 번호 확인 필요',
    question: '이 문장에서 나를 더 강하게 만든다고 한 것은 무엇인가요?',
    options: [
      { id: 'a', text: '남들의 칭찬' },
      { id: 'b', text: '나를 죽이지 않는 것' },
      { id: 'c', text: '충분한 휴식' },
    ],
    correctOptionId: 'b',
    hintPassage: '나를 죽이지 않는 것은 나를 더 강하게 만든다.',
    hintNote: '문장의 주어를 찾아보세요. 칭찬이나 휴식은 나오지 않아요.',
  },
  {
    id: 'reading-austen-1',
    characterId: 'austen',
    title: '가장 유명한 첫 문장',
    original:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
    translation: '재산이 넉넉한 독신 남자라면 틀림없이 아내를 원할 것이라는 점은 누구나 인정하는 진리다.',
    source: '『오만과 편견』 1장 첫 문장으로 추정. 판본과 쪽수 확인 필요',
    question: '이 문장에서 "누구나 인정하는 진리"라고 비꼬는 내용은 무엇인가요?',
    options: [
      { id: 'a', text: '가난한 사람은 결혼하지 못한다' },
      { id: 'b', text: '여성은 재산을 가질 수 없다' },
      { id: 'c', text: '재산 많은 독신 남자는 아내를 원한다' },
    ],
    correctOptionId: 'c',
    hintPassage: '재산이 넉넉한 독신 남자라면 틀림없이 아내를 원할 것이라는 점',
    hintNote: '"점은" 앞까지가 진리라고 말하는 내용이에요.',
  },
  {
    id: 'reading-xunzi-1',
    characterId: 'xunzi',
    title: '가장 욕먹은 대목',
    original: '人之性惡,其善者僞也。',
    translation: '사람의 본성은 악하다. 그 선함은 사람이 애써 만든 것이다.',
    source: '『순자』 「성악」 첫머리로 추정. 판본과 글자 확인 필요',
    question: '이 문장에서 사람의 선함은 어디에서 온다고 하나요?',
    options: [
      { id: 'a', text: '사람이 애써 만든 것' },
      { id: 'b', text: '타고난 본성' },
      { id: 'c', text: '하늘의 선물' },
    ],
    correctOptionId: 'a',
    hintPassage: '그 선함은 사람이 애써 만든 것이다.',
    hintNote: '뒤쪽 문장을 다시 보세요. 본성은 앞에서 악하다고 했어요.',
  },
];
