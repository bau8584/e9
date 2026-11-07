import type { Character } from './types';

// 인물 소개. 한 줄 문구는 모두 제작진 각색 초안이며 팀이 고쳐 쓰면 된다.
export const characters: Character[] = [
  {
    id: 'siddhartha',
    name: '싯다르타',
    englishName: 'Siddhartha Gautama',
    tagline: '그 분노, 지금 누구를 먼저 태우고 있습니까.',
    monogram: '싯',
    portraitFile: 'portrait-siddhartha.png',
  },
  {
    id: 'nietzsche',
    name: '니체',
    englishName: 'Friedrich Nietzsche',
    tagline: '남들이 좋다는 걸 좋아하는 삶, 아직도 재밌나?',
    monogram: '니',
    portraitFile: 'portrait-nietzsche.png',
  },
  {
    id: 'austen',
    name: '제인 오스틴',
    englishName: 'Jane Austen',
    tagline: '당신의 연애, 제 소설에선 조연의 웃음거리예요.',
    monogram: '오',
    portraitFile: 'portrait-austen.png',
  },
  {
    id: 'xunzi',
    name: '순자',
    englishName: 'Xunzi',
    tagline: '타고나길 착하다고? 그 말부터 고쳐라.',
    monogram: '순',
    portraitFile: 'portrait-xunzi.png',
  },
];
