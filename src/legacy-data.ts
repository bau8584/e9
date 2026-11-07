export type Profile = { id:string; nickname:string; gradeId:string; avatarColor:string };
export type Book = {id:string; title:string; subtitle:string; author:string; description:string; gradeIds:string[]; tags:string[]; color:string; ink:string; pattern:number};
export type ReadingRecord = {id:string; userId:string; bookId:string; status:'reading'|'finished'; readingRange:string; page:number; quote:string; reason:string; emotions:string[]; edition:string; createdAt:string};
export type Post = {id:string; userId:string; bookId:string; type:'reflection'|'question'|'modern'; body:string; visibility:'private'|'class'; spoiler:boolean; likedBy:string[]; isDemo:boolean; createdAt:string; updatedAt:string; readingRecordId?:string};
export type Reply = {id:string; postId:string; userId:string; body:string; isDemo:boolean; createdAt:string};
export type Data = {version:number; profile:Profile|null; profiles:Record<string,Profile>; records:ReadingRecord[]; posts:Post[]; replies:Reply[]; demoLikes:Record<string,string[]>};
export const grades = Array.from({length:6},(_,i)=>({id:`g${i+1}`,label:`${i+1}학년`, color:['#e7bd71','#8cae97','#93afd1','#b0a0cd','#d9a194','#85aaa7'][i]}));
const names = ['마음이 자라는 숲','조금 느려도 괜찮아','별을 모으는 아이','우리 사이의 작은 다리','바람이 데려온 편지','달빛 아래 비밀 정원','내 안의 작은 용기','질문이 피어나는 날','일곱 번째 계절','우리가 만든 우주','다른 빛깔의 세상','내일을 걷는 우리'];
const colors = ['#e7b7a1','#c8d5b5','#e7c56c','#a9c4c7','#bbb1ce','#e7b4b4','#c6c6a3','#c0ced6','#d9b88e','#b5c5a0','#d6bbcf','#adbabb'];
export const books:Book[] = names.map((name,i)=>({id:`b${i+1}`,title:`시연 도서 ${String(i+1).padStart(2,'0')}`,subtitle:name,author:'책사이 창작 예시',description:`‘${name}’이라는 주제로 서로의 생각을 나누기 위한 시연용 도서입니다. 실제 출판된 작품이 아니며, 제목과 표지·소개는 화면 시연을 위해 구성했습니다. 읽고 있는 실제 책의 구절과 생각을 자유롭게 기록해 보세요.`,gradeIds:[`g${Math.floor(i/2)+1}`,...(i===4?['g2']:[])],tags:[['우정','함께 성장'],['나의 속도','자기 이해'],['상상','발견']][i%3],color:colors[i],ink:i%3===2?'#604b22':'#35493c',pattern:i%4}));
export const postTypes = { reflection:'느낀 점',question:'질문',modern:'지금이라면' } as const;
export const demoPosts:Post[] = [
 {id:'demo1',userId:'demo-sprout',bookId:'b5',type:'question',body:'친구와 생각이 다를 때, 먼저 내 마음을 이야기하는 것과 친구의 이야기를 듣는 것 중 무엇이 더 필요할까요?',visibility:'class',spoiler:false,likedBy:[],isDemo:true,createdAt:'2026-11-01T05:00:00Z',updatedAt:'2026-11-01T05:00:00Z'},
 {id:'demo2',userId:'demo-moon',bookId:'b5',type:'modern',body:'오늘 우리 교실이라면 익명 편지함을 만들어 보고 싶어요. 말로 하기 어려운 마음도 편지로는 조금 더 용감하게 전할 수 있을 것 같아요.',visibility:'class',spoiler:true,likedBy:[],isDemo:true,createdAt:'2026-11-01T04:00:00Z',updatedAt:'2026-11-01T04:00:00Z'},
 {id:'demo3',userId:'demo-sprout',bookId:'b1',type:'reflection',body:'서로 다른 생각을 발견하는 경험이 좋아요. 같은 장면을 읽고도 친구는 어떤 마음이 들었을지 궁금해졌어요.',visibility:'class',spoiler:false,likedBy:[],isDemo:true,createdAt:'2026-11-01T03:00:00Z',updatedAt:'2026-11-01T03:00:00Z'}
];
export const demoReplies:Reply[] = [{id:'demo-reply',postId:'demo1',userId:'demo-moon',body:'저는 먼저 들어 보고 싶어요. 친구가 왜 그렇게 생각했는지 알게 되면 내 마음도 잘 전할 수 있을 것 같아요.',isDemo:true,createdAt:'2026-11-01T06:00:00Z'}];
