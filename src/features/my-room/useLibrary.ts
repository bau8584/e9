// 서고의 상태와 저장 동작 전부. 화면은 RoomView, LibraryDialogs 가 그린다.
import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_KEY, libraryStats, mergeLegacy, saveLibrary, selectBooks, validateBook } from '../../library.mjs';
import { findEdition } from '../../editions.mjs';
import { books as legacyCatalog } from '../../legacy-data';
import { cleanNickname, renameNickname } from './myRoomData';
import { sampleBooks, nietzscheShelfBooks, type PersonalBook, type LibraryData } from './libraryData';
import { notifyLibraryChanged, onLibraryMerged } from '../../sync/sync';
import { blankBook, readInitial, today, type BookDraft } from './storage';

type Popup = 'add' | 'detail' | 'profile' | 'reset' | null;

export function useLibrary(seedNickname: string) {
  const [initial] = useState(() => readInitial(seedNickname));
  const [data,setData]=useState<LibraryData>(initial.data as LibraryData);
  const [error,setError]=useState(initial.error);
  const [preview,setPreview]=useState(false);
  const [shelf,setShelf]=useState('all');
  const [query,setQuery]=useState('');
  const [sort,setSort]=useState('recent');
  const [popup,setPopup]=useState<Popup>(null);
  const [selected,setSelected]=useState<PersonalBook|null>(null);
  const [draft,setDraft]=useState<BookDraft>(blankBook);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [dirty,setDirty]=useState(false);
  const [nickname,setNickname]=useState(data.nickname);
  const [toast,setToast]=useState('');
  const referenceBooks=nietzscheShelfBooks.filter(reference=>!data.books.some(book=>findEdition(book)?.id===reference.editionId));
  const books=preview?sampleBooks:[...data.books,...referenceBooks];
  const counts=libraryStats(preview?sampleBooks:data.books);
  const visible=selectBooks(books,shelf,query,sort);
  const bookArea=useRef<HTMLElement>(null);
  const say=(s:string)=>setToast(s);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn);},[dirty]);
  useEffect(()=>initial.blocked?undefined:onLibraryMerged(merged=>setData(merged as LibraryData)),[initial.blocked]);
  function commit(next:LibraryData){if(initial.blocked){say('원본 데이터 보존을 위해 저장을 멈췄어요. 먼저 기록을 백업해 주세요.');return false;}try{if(!saveLibrary(localStorage,next))throw Error('save');setData(next);setError('');notifyLibraryChanged();return true;}catch{setError('저장하지 못했어요. 입력 내용은 유지됩니다. 브라우저 저장 공간과 설정을 확인해 주세요.');return false;}}
  function close(){if(dirty&&!confirm('저장하지 않은 내용이 있어요. 닫을까요?'))return;setDirty(false);setPopup(null);}
  function add(){setEditingId(null);setDraft(blankBook());setErrors({});setDirty(false);setPopup('add');}
  function registerBook(book:PersonalBook){setEditingId(null);setDraft({...blankBook(),title:book.title,author:book.author,genre:book.genre,color:book.color,finishedAt:'',editionId:findEdition(book)?.id});setErrors({});setDirty(false);setPopup('add');}
  function detail(b:PersonalBook){setSelected(b);setDirty(false);setPopup('detail');}
  function edit(){if(!selected||preview||selected.isReference)return;setDraft({...selected});setEditingId(selected.id);setErrors({});setPopup('add');}
  function submit(e:React.FormEvent){e.preventDefault();const normalized={...draft,editionId:findEdition(draft)?.id,title:draft.title.trim(),author:draft.author.trim(),quote:draft.quote.trim(),memo:draft.memo.trim()};const validation=validateBook(normalized);setErrors(validation);if(Object.keys(validation).length)return;const now=new Date().toISOString();const previous=data.books.find(b=>b.id===editingId);const book={...normalized,id:editingId||crypto.randomUUID(),createdAt:previous?.createdAt||now,updatedAt:now};const next={...data,books:editingId?data.books.map(b=>b.id===editingId?book:b):[...data.books,book]};if(!commit(next))return;setPreview(false);setShelf('all');setQuery('');setDirty(false);setPopup(null);say(editingId?'독서 기록을 수정했어요.':'읽은 책 한 권이 내 방에 놓였어요.');}
  function backup(){try{const raw=localStorage.getItem(STORAGE_KEY)||JSON.stringify(data,null,2);const blob=new Blob([raw],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`hipdok-library-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{say('브라우저에서 기록을 내보낼 수 없어요. 저장 설정을 확인해 주세요.');}}
  function importLegacy(){try{const raw=localStorage.getItem('chaeksai.v1');if(!raw){say('같은 주소의 브라우저 저장소에 책사이 기록이 없어요. 책사이 백업 JSON을 선택해 주세요.');return;}importValue(JSON.parse(raw));}catch{say('책사이 기록을 읽을 수 없어요. 원본 데이터는 변경하지 않았어요.');}}
  function importValue(value:unknown){try{const result=mergeLegacy(data.books,value,legacyCatalog);if(!result.count){say('가져올 새로운 완독 기록이 없어요. 읽는 중인 책과 이미 가져온 책은 제외됩니다.');return;}if(commit({...data,books:result.books})){setPreview(false);setShelf('all');setQuery('');say(`책사이 완독 기록 ${result.count}권을 가져왔어요.`);}}catch{say('책사이 백업 JSON 형식을 확인해 주세요. 기존 기록은 변경하지 않았어요.');}}
  async function readImport(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;if(file.size>5_000_000){say('5MB 이하의 책사이 백업 파일을 선택해 주세요.');e.target.value='';return;}try{importValue(JSON.parse(await file.text()));}catch{say('올바른 JSON 파일이 아니에요. 기존 기록은 유지됩니다.');}e.target.value='';}
  function chooseShelf(id:string){setShelf(id);setQuery('');requestAnimationFrame(()=>bookArea.current?.scrollIntoView({behavior:'smooth',block:'start'}));}
  const showSample=()=>{setPreview(v=>!v);setShelf('all');setQuery('');};
  const selectedEdition=selected?findEdition(selected):undefined;
  function saveNickname(e:React.FormEvent){e.preventDefault();const name=cleanNickname(nickname);if(!name)return;if(commit({...data,nickname:name})){renameNickname(name);setDirty(false);setPopup(null);say('내 방의 이름표를 바꿨어요.');}}
  /** 사용자가 고른 이름 하나로 홈과 서고를 맞춘다. 사용자가 누를 때만 실행한다. */
  function unifyName(raw:string){const name=cleanNickname(raw);if(!name)return;if(commit({...data,nickname:name})){renameNickname(name);say(`이제 어디서나 ${name}(으)로 불러요.`);}}
  return { blocked:!!initial.blocked, say, unifyName, data, error, preview, shelf, setShelf, query, setQuery, sort, setSort, popup, setPopup, selected, draft, setDraft, editingId, errors, setDirty, nickname, setNickname, toast, referenceBooks, books, counts, visible, bookArea, close, add, registerBook, detail, edit, submit, backup, importLegacy, readImport, chooseShelf, showSample, selectedEdition, saveNickname };
}
export type Library = ReturnType<typeof useLibrary>;
