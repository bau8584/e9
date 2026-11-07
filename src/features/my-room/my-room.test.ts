// 내 방의 카드 구역, 초기화, 이름 안내 시험. 화면을 실제로 그려 눌러 본다.
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cards as allCards, getDm, getReading } from '../../data';
import { STORAGE_KEY as LIBRARY_KEY } from '../../library.mjs';
import * as store from '../../store/store';
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
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

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

describe('내 문장 카드 구역', () => {
  it('카드가 없으면 첫 미션 안내가 나오고 누르면 DM으로 간다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.textContent).toContain('아직 뽑은 카드가 없어요');
    click('첫 미션 하러 가기');
    expect(store.getProgress().screen).toBe('dm');
  });
  it('뽑은 카드, 팬 배지, 점수를 보여 준다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    earnCard();
    show();
    const text = host.querySelector('.my-cards')!.textContent!;
    expect(text).toContain('니체 팬');
    expect(text).toContain(`${store.getProgress().score}점`);
    expect(text).not.toContain('검수 필요');
    expect(text).not.toContain('아직 뽑은 카드');
  });
});

describe('초기화', () => {
  it('확인 전에는 지우지 않고, 취소하면 그대로다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    earnCard();
    show();
    click('카드와 입덕 기록 초기화');
    expect(store.getProgress().cards).toHaveLength(1);
    expect(host.querySelector('dialog')!.textContent).toContain('그대로 남는 것');
    expect(document.activeElement?.textContent).toBe('취소');
    click('취소');
    expect(host.querySelector('dialog')).toBeNull();
    expect(store.getProgress().cards).toHaveLength(1);
  });
  it('확인하면 카드, 점수, 입덕만 지우고 책 기록은 한 글자도 안 바뀐다', () => {
    const saved = library('덕구');
    localStorage.setItem(LIBRARY_KEY, saved);
    store.completeOnboarding('덕구', 'nietzsche');
    earnCard();
    show();
    click('카드와 입덕 기록 초기화');
    click('카드와 입덕 기록 지우기');
    const p = store.getProgress();
    expect([p.cards.length, p.score, p.nickname, p.favoriteId, p.screen]).toEqual([0, 0, '', null, 'landing']);
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(saved);
  });
});

describe('홈과 서고 이름이 다를 때', () => {
  it('입덕 전(빈 이름)이나 같은 이름은 다르다고 하지 않는다', () => {
    expect(namesDiffer('', '문장수집가')).toBe(false);
    expect(namesDiffer('덕구', '덕구')).toBe(false);
    expect(namesDiffer('덕구', '서고이름')).toBe(true);
  });
  it('보는 것만으로는 저장값을 안 바꾸고 안내만 띄운다', () => {
    const saved = library('서고이름');
    localStorage.setItem(LIBRARY_KEY, saved);
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    expect(host.querySelector('.name-notice')!.textContent).toContain('서고이름');
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(saved);
    expect(store.getProgress().nickname).toBe('덕구');
  });
  it('고른 이름으로 양쪽을 맞추면 안내가 사라지고 책 기록은 남는다', () => {
    localStorage.setItem(LIBRARY_KEY, library('서고이름'));
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    click('서고이름(으)로 통일');
    expect(store.getProgress().nickname).toBe('서고이름');
    expect(host.querySelector('.name-notice')).toBeNull();
    expect(JSON.parse(localStorage.getItem(LIBRARY_KEY)!).books).toHaveLength(1);
  });
  it('이름 칸은 입덕 글자 수 제한과 같아 두 이름이 잘려서 달라지지 않는다', () => {
    store.completeOnboarding('덕구', 'nietzsche');
    show();
    act(() => { (host.querySelector('.top-user') as HTMLElement).click(); });
    expect((host.querySelector('#nickname') as HTMLInputElement).maxLength).toBe(20);
  });
});

describe('키보드 이동', () => {
  const press = (init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    act(() => { document.body.dispatchEvent(event); });
    return event;
  };
  it('방향키와 WASD로 아바타가 움직인다', () => {
    show();
    const where = () => (host.querySelector('.player') as HTMLElement).style.left;
    const start = where();
    press({ key: 'a' });
    expect(where()).not.toBe(start);
  });
  it('Ctrl+S 같은 브라우저 단축키는 가로채지 않는다', () => {
    show();
    const where = (host.querySelector('.player') as HTMLElement).style.top;
    expect(press({ key: 's', ctrlKey: true }).defaultPrevented).toBe(false);
    expect((host.querySelector('.player') as HTMLElement).style.top).toBe(where);
  });
});
