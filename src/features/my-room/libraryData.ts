import { NIETZSCHE_EDITIONS } from '../../editions.mjs';
export type PersonalBook = { id:string; title:string; author:string; genre:string; finishedAt:string; quote:string; memo:string; color:string; createdAt:string; updatedAt:string; editionId?:string; isReference?:boolean };
export type LibraryData = { version:number; nickname:string; books:PersonalBook[] };
export const shelves = [
  {id:'all',label:'모든 책',color:'#9677ae'},
  {id:'문학',label:'문학',color:'#c19476'},
  {id:'철학',label:'철학',color:'#8f82b4'},
  {id:'에세이',label:'에세이',color:'#8aa997'},
  {id:'인문·사회',label:'인문·사회',color:'#9baec6'},
  {id:'quotes',label:'문장이 남은 책',color:'#c4aa6f'},
].map((s,i)=>({...s,x:26+(i%3)*19,y:i<3?26:49}));
const titles = [
  ['데미안','헤르만 헤세','문학','#46635d'],
  ['차라투스트라는 이렇게 말했다','프리드리히 니체','철학','#70557f'],
  ['싯다르타','헤르만 헤세','문학','#a37851'],
  ['오만과 편견','제인 오스틴','문학','#a3646e'],
  ['명상록','마르쿠스 아우렐리우스','철학','#687b8b'],
  ['자기만의 방','버지니아 울프','에세이','#9a8d63'],
  ['선악의 저편','프리드리히 니체','철학','#59536f'],
  ['이방인','알베르 카뮈','문학','#b17d55'],
  ['도덕의 계보학','프리드리히 니체','철학','#ac322d'],
];
// 예시 보기 전용입니다. 개인 저장 데이터에 섞거나 자동 저장하지 않습니다.
export const sampleBooks:PersonalBook[] = titles.map(([title,author,genre,color],i)=>({id:`sample-${i}`,title,author,genre,color,finishedAt:`2026-10-${String(28-i*2).padStart(2,'0')}`,quote:'',memo:'화면 구성을 보여주기 위한 예시 기록입니다. 실제 이용자의 독서 기록이 아닙니다.',createdAt:`2026-10-${String(28-i*2).padStart(2,'0')}T12:00:00Z`,updatedAt:'2026-11-07T00:00:00Z'}));

// 서고에 놓인 참고 도서입니다. 실제 완독 기록으로 저장하거나 집계하지 않습니다.
export const nietzscheShelfBooks:PersonalBook[] = NIETZSCHE_EDITIONS.map(edition=>({
  id:`reference-${edition.id}`, title:edition.title, author:edition.author, genre:'철학',
  color:edition.color, editionId:edition.id, isReference:true,
  finishedAt:'', quote:'', memo:'', createdAt:'', updatedAt:'',
}));
