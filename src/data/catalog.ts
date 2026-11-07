import type { CharacterId } from './types';

// 첫 화면의 작가 목록. 후보 초안이며 팀이 늘리거나 뺄 수 있다.
// characterId 가 있고 PLAYABLE_IDS 에 든 인물만 입덕할 수 있다.
export const PLAYABLE_IDS: CharacterId[] = ['nietzsche', 'xunzi'];

export interface CatalogAuthor {
  name: string;
  englishName: string;
  /** 대표 분야 한 낱말 */
  field: string;
}

export interface CatalogRegion {
  region: string;
  authors: CatalogAuthor[];
}

export const upcomingAuthors: CatalogRegion[] = [
  {
    region: '한국',
    authors: [
      { name: '허난설헌', englishName: 'Heo Nanseolheon', field: '시' },
      { name: '박지원', englishName: 'Park Jiwon', field: '산문' },
      { name: '정약용', englishName: 'Jeong Yakyong', field: '사상' },
      { name: '이상', englishName: 'Yi Sang', field: '소설' },
      { name: '윤동주', englishName: 'Yun Dongju', field: '시' },
      { name: '박경리', englishName: 'Park Kyongni', field: '소설' },
    ],
  },
  {
    region: '동아시아',
    authors: [
      { name: '공자', englishName: 'Confucius', field: '철학' },
      { name: '장자', englishName: 'Zhuangzi', field: '철학' },
      { name: '무라사키 시키부', englishName: 'Murasaki Shikibu', field: '소설' },
      { name: '나쓰메 소세키', englishName: 'Natsume Soseki', field: '소설' },
      { name: '루쉰', englishName: 'Lu Xun', field: '소설' },
    ],
  },
  {
    region: '남아시아와 중동',
    authors: [
      { name: '싯다르타', englishName: 'Siddhartha Gautama', field: '사상' },
      { name: '루미', englishName: 'Rumi', field: '시' },
      { name: '이븐 할둔', englishName: 'Ibn Khaldun', field: '역사' },
      { name: '타고르', englishName: 'Rabindranath Tagore', field: '시' },
    ],
  },
  {
    region: '유럽',
    authors: [
      { name: '플라톤', englishName: 'Plato', field: '철학' },
      { name: '세네카', englishName: 'Seneca', field: '철학' },
      { name: '단테', englishName: 'Dante Alighieri', field: '시' },
      { name: '몽테뉴', englishName: 'Michel de Montaigne', field: '수필' },
      { name: '셰익스피어', englishName: 'William Shakespeare', field: '희곡' },
      { name: '제인 오스틴', englishName: 'Jane Austen', field: '소설' },
      { name: '도스토옙스키', englishName: 'Fyodor Dostoevsky', field: '소설' },
      { name: '카프카', englishName: 'Franz Kafka', field: '소설' },
      { name: '버지니아 울프', englishName: 'Virginia Woolf', field: '소설' },
      { name: '시몬 드 보부아르', englishName: 'Simone de Beauvoir', field: '철학' },
    ],
  },
  {
    region: '아메리카와 아프리카',
    authors: [
      { name: '소로', englishName: 'Henry David Thoreau', field: '수필' },
      { name: '에밀리 디킨슨', englishName: 'Emily Dickinson', field: '시' },
      { name: '프레더릭 더글러스', englishName: 'Frederick Douglass', field: '자서전' },
      { name: '보르헤스', englishName: 'Jorge Luis Borges', field: '소설' },
      { name: '치누아 아체베', englishName: 'Chinua Achebe', field: '소설' },
    ],
  },
];
