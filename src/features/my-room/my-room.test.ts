// 내 방(최애 구역, 카드 구역, 이름 바꾸기, 초기화) 시험. 화면을 실제로 그려 눌러 본다.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cards as allCards, getDm, getReading } from '../../data';
import { STORAGE_KEY as LIBRARY_KEY } from '../../library.mjs';
import * as fan from '../../store/fan';
import * as store from '../../store/store';
import { fanCardsOf } from '../../data/fancards';
import { MyRoomPage } from './MyRoomPage';
import { cardShareText, groupCards, namesDiffer } from './myRoomData';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.removeAttribute('open'); };
window.scrollTo = () => {};

const nietzsche = allCards.filter((c) => c.characterId === 'nietzsche');
const austen = allCards.filter((c) => c.characterId === 'austen');
const library = (nickname: string) => JSON.stringify({ version: 1, nickname, books: [{ id: 'b1', title: '내 책', author: '나', genre: '문학', finishedAt: '2026-11-01', quote: '', memo: '', color: '#73547e', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' }] });
const earnCard = () => {
  store.chooseReply(getDm('nietzsche').replies[0].id);
  store.answerQuiz(getReading('nietzsche').correctOptionId);
  store.drawCard();
};

let root: Root;
let host: HTMLElement;
const show = () => act(() => { root.render(createElement(MyRoomPage)); });
const click = (text: string) => act(() => { [...host.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!.click(); });

beforeEach(() => {
  localStorage.clear();
  store.resetProgress();
  fan.resetFan();
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('카드 묶기', () => {
  it('최애를 맨 앞에 두고, 인물당 여러 장이어도 한 묶음으로 모은다', () => {
    const groups = groupCards([austen[0], nietzsche[0], nietzsche[1]], 'nietzsche');
    expect(groups.map((g) => g.character.id)).toEqual(['nietzsche', 'austen']);
    expect(groups[0].cards).toHaveLength(2);
    expect(groups[0].isFavorite).toBe(true);
    expect(groupCards([], 'nietzsche')).toEqual([]);
  });
  it('복사 글에 문장과 출처가 들어가고 미완성 표시는 없다', () => {
    const card = nietzsche[0];
    expect(cardShareText(card)).toContain(card.quote);
    expect(cardShareText(card)).toContain(card.source);
    expect(cardShareText(card)).not.toMatch(/검수|초벌/);
  });
});

describe('내 카드 구역(팩과 앨범)', () => {
  it('입덕하면 팩 1개가 보이고, 열면 3장이 차례로 공개되어 앨범에 들어간다', () => {
    vi.useFakeTimers();
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    const text = () => host.querySelector('.my-cards')!.textContent!;
    expect(text()).toContain('카드 팩 1개');
    expect(text()).toContain('일반 70%');
    expect(text()).toContain('카드 앨범');
    click('눌러서 열기');
    expect(fan.getFan().packs).toBe(0);
    expect(host.querySelectorAll('.po-revealed')).toHaveLength(0);
    for (let i = 0; i < 6; i += 1) act(() => { vi.advanceTimersByTime(2500); }); // 봉투 찢기 + 카드 3장 공개
    expect(host.querySelectorAll('.po-revealed')).toHaveLength(3);
    expect(text()).toMatch(/NEW/);
    const owned = Object.values(fan.getFan().cards).reduce((a, b) => a + b, 0);
    expect(owned).toBe(3);
    click('닫기');
    expect(host.querySelector('.po')).toBeNull();
    expect(host.querySelectorAll('.al-grid button.fc').length).toBeGreaterThan(0);
  });
  it('팩도 카드도 없으면 팩 상자 대신 읽기로 가는 안내가 나온다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    localStorage.setItem(fan.FAN_KEY, JSON.stringify({ packs: 0 }));
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: fan.FAN_KEY })); });
    show();
    expect(host.querySelector('.po')).toBeNull();
    expect(host.textContent).toContain('아직 카드가 없어요');
    click('읽으러 가기');
    expect(store.getProgress().screen).toBe('reading');
  });
  it('조각이 모자라면 몇 개 더 필요한지 알려 준다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.textContent).toContain(`조각 ${fan.SHARD_COST.일반}개 더 필요`);
    expect(host.textContent).toContain('더 가까워지면 받는 장면');
  });
  it('옛 문장 카드는 옛 카드 구역에 그대로 보이고, 옛 카드가 없으면 그 구역이 없다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.querySelector('.al-old')).toBeNull();
    act(() => { root.unmount(); });
    root = createRoot(host);
    earnCard();
    show();
    const old = host.querySelector('.al-old')!;
    expect(old.textContent).toContain('문장 카드');
    expect(old.textContent).not.toContain('검수 필요');
  });
});

describe('초기화', () => {
  it('확인 전에는 지우지 않고, 취소하면 그대로다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    earnCard();
    show();
    click('카드와 입덕 기록 초기화');
    expect(store.getProgress().cards).toHaveLength(1);
    expect(host.querySelector('dialog')!.textContent).toContain('지워지는 것');
    expect(document.activeElement?.textContent).toBe('취소');
    click('취소');
    expect(host.querySelector('dialog')).toBeNull();
    expect(store.getProgress().cards).toHaveLength(1);
  });
  it('확인하면 카드, 점수, 입덕, 새 카드 팩 기록만 지우고 책 기록은 한 글자도 안 바뀐다', () => {
    const saved = library('덕구');
    localStorage.setItem(LIBRARY_KEY, saved);
    store.completeOnboarding('덕구', 'nietzsche');
    earnCard();
    act(() => { fan.openPack(fanCardsOf('nietzsche')); });
    expect(fan.getFan().packs).toBe(0);
    show();
    click('카드와 입덕 기록 초기화');
    click('카드와 입덕 기록 지우기');
    const p = store.getProgress();
    expect([p.cards.length, p.score, p.nickname, p.favoriteId, p.screen]).toEqual([0, 0, '', null, 'landing']);
    expect(fan.getFan()).toMatchObject({ cards: {}, shards: 0, packs: 1 });
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(saved);
  });
});

describe('이름 바꾸기', () => {
  it('입덕 전(빈 이름)이나 같은 이름은 다르다고 하지 않는다', () => {
    expect(namesDiffer('', '문장수집가')).toBe(false);
    expect(namesDiffer('덕구', '덕구')).toBe(false);
    expect(namesDiffer('덕구', '서고이름')).toBe(true);
  });
  it('이름 칸은 입덕 글자 수 제한과 같고, 저장하면 홈 이름이 바뀌며 책 기록은 안 건드린다', () => {
    const saved = library('서고이름');
    localStorage.setItem(LIBRARY_KEY, saved);
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    click('바꾸기');
    const input = host.querySelector('#nickname') as HTMLInputElement;
    expect(input.maxLength).toBe(20);
    expect(input.value).toBe('덕구');
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '새이름');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click('저장하기');
    expect(store.getProgress().nickname).toBe('새이름');
    expect(host.textContent).toContain('닉네임 새이름');
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(saved);
  });
});

describe('내 방 구성', () => {
  it('최애 구역에 단계 이름, 함께한 날, 읽은 이야기와 나눈 대화, 기억 한 줄이 나온다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    act(() => { fan.checkIn('nietzsche'); });
    act(() => { fan.finishFreeChat('nietzsche', '덕구는 밤에 읽는다', 5); });
    show();
    const fav = host.querySelector('.mr-fav')!;
    expect(fav.textContent).toContain('니체');
    expect(fav.textContent).toContain('함께한 지 1일째');
    expect(fav.textContent).toContain('읽은 이야기');
    expect(fav.textContent).toContain('나눈 대화');
    expect(fav.textContent).toContain('덕구는 밤에 읽는다');
    expect(fav.querySelector('[role=progressbar]')).not.toBeNull();
  });
  it('서고 화면(방, 책 등록, 검색, 백업)과 영어 장식 문구가 없다', () => {
    localStorage.setItem(LIBRARY_KEY, library('덕구'));
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.querySelector('.map, .player, .shelf-tabs, .search-box, .import-panel')).toBeNull();
    expect(host.textContent).not.toMatch(/MY CARD ALBUM|A ROOM OF YOUR OWN|PERSONAL LIBRARY/);
    expect(host.textContent).not.toMatch(/책 등록|기록 백업|책사이|이름이 두 개/);
  });
  it('예전 책 기록이 있을 때만 보관 중이라는 한 줄이 나온다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.textContent).not.toContain('예전 독서 기록');
    act(() => { root.unmount(); });
    root = createRoot(host);
    localStorage.setItem(LIBRARY_KEY, library('덕구'));
    show();
    expect(host.textContent).toContain('예전 독서 기록 1권은 그대로 보관 중이에요');
    expect(host.textContent).toContain('기록은 이 기기에만 저장돼요');
  });
});
