// 옛 사상가 카드팩. 덕질 개편(2026-11-10)으로 내 방에서 뺐다. 지금은 앨범이 readCards, philosopherCatalog 로 모은 카드만 읽는다.
// 아래 PortraitPacks 화면은 쓰지 않지만 되돌릴 때를 위해 남겨 둔다. 독서 기록 1권마다 팩을 하나 열 수 있었다.
// 연 횟수만 기기에 저장한다. 책 기록과 진행 기록의 저장 형식은 건드리지 않는다.
import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import packPage from '../home/philosopher-pack.html?raw';

const CARDS_KEY = 'hipdok.philosopher.cards.v1';
const OPENED_KEY = 'hipdok.philosopher.opened.v1';
const catalog: { name: string; theme: string; image: string }[] = JSON.parse(
  packPage.split('<script id="portrait-data" type="application/json">')[1].split('</script>')[0],
);
/** 옛 사상가 카드 목록. 덕질 개편 뒤에는 앨범의 "옛 카드"에서 읽기만 한다. */
export const philosopherCatalog = catalog;

const validIds = (value: unknown): number[] =>
  Array.isArray(value) ? [...new Set(value.filter((id) => Number.isInteger(id) && catalog[id]))] : [];

/** 전에 모은 사상가 카드 번호(읽기만 한다) */
export function readCards(): number[] {
  try {
    return validIds(JSON.parse(localStorage.getItem(CARDS_KEY) || '[]'));
  } catch {
    return [];
  }
}

function readOpened(): number {
  try {
    const value = Number(localStorage.getItem(OPENED_KEY));
    return Number.isInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export const packsLeft = (bookCount: number, opened: number) => Math.max(0, bookCount - opened);

export function PortraitPacks({ bookCount, onAddBook }: { bookCount: number; onAddBook: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [showPage, setShowPage] = useState(false);
  const [owned, setOwned] = useState(readCards);
  const [opened, setOpened] = useState(readOpened);
  const left = packsLeft(bookCount, opened);
  const leftRef = useRef(left);
  leftRef.current = left;

  useEffect(() => {
    if (showPage) dialog.current?.showModal();
  }, [showPage]);

  useEffect(() => {
    const changed = (event: Event) => setOwned(validIds((event as CustomEvent).detail));
    // 카드팩 화면이 팩을 열기 전에 묻는다. 남은 팩이 있을 때만 하나 쓰고 허락한다.
    const openPack = (event: Event) => {
      if (leftRef.current <= 0) return;
      const next = readOpened() + 1;
      try {
        localStorage.setItem(OPENED_KEY, String(next));
      } catch {
        /* 저장이 막히면 이번 방문에서만 센다 */
      }
      leftRef.current -= 1;
      setOpened(next);
      (event as CustomEvent<{ ok: boolean }>).detail.ok = true;
    };
    window.addEventListener('hipdok:portraits', changed);
    window.addEventListener('hipdok:open-pack', openPack);
    return () => {
      window.removeEventListener('hipdok:portraits', changed);
      window.removeEventListener('hipdok:open-pack', openPack);
    };
  }, []);

  return (
    <section className="portrait-packs" aria-label="사상가 카드팩">
      <span className="eyebrow">PHILOSOPHER PACK</span>
      <h2>사상가 카드팩</h2>
      <p>{left > 0 ? `열 수 있는 팩 ${left}개. 읽은 책 한 권마다 하나씩 열려요.` : '읽은 책을 기록하면 팩을 하나 열 수 있어요.'}</p>
      {left > 0 ? (
        <button
          type="button"
          className="primary"
          onClick={() => setShowPage(true)}
        >
          <BookOpen size={18} />
          카드팩 열기
        </button>
      ) : (
        <button type="button" className="secondary" onClick={onAddBook}>
          읽은 책 기록하기
        </button>
      )}
      <h3>
        내가 뽑은 사상가 <small>{owned.length} / {catalog.length}</small>
      </h3>
      {owned.length > 0 && (
        <ul>
          {owned.map((id) => (
            <li key={id}>
              <img src={catalog[id].image} alt="" />
              <div>
                <strong>{catalog[id].name}</strong>
                <small>{catalog[id].theme}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
      {showPage && (
        <dialog ref={dialog} aria-label="사상가 카드팩" onClose={() => setShowPage(false)}>
          <form method="dialog">
            <button type="submit">닫기</button>
          </form>
          <iframe title="사상가 카드팩" srcDoc={packPage} />
        </dialog>
      )}
    </section>
  );
}
