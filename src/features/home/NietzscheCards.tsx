// 옛 니체 포토카드(hipdok.nietzsche.souvenirs.v1). 덕질 개편으로 새로 뽑지 않고, 전에 모은 것만 읽어서 보여 준다.
// 저장된 값은 읽기만 하고 고치지 않는다. 새 카드는 src/features/card(팩과 앨범)가 맡는다.
import { useEffect, useState } from 'react';
import portrait from '../../assets/nietzsche.png';
import draft from './nietzsche-cards.md?raw';
import './nietzsche-cards.css';

const periods = [
  { prefix: 'E', year: 1872, name: '음악에 빠진 니체' },
  { prefix: 'T', year: 1877, name: '혼자 걷기 시작한 니체' },
  { prefix: 'M', year: 1881, name: '자유롭게 의심하는 니체' },
  { prefix: 'L', year: 1888, name: '차라투스트라를 만난 니체' },
];

export interface Souvenir {
  id: string;
  title: string;
  topic: string;
  reply: string;
  year: number;
  period: string;
}

const cards: Souvenir[] = draft.split(/\r?\n/).filter(line => /^\| [ETML]\d{2} \|/.test(line)).map(line => {
  const [id, title, topic, reply] = line.split('|').slice(1).map(cell => cell.trim());
  const period = periods.find(item => item.prefix === id[0])!;
  return { id, title, topic, reply, year: period.year, period: period.name };
});

export const SOUVENIR_KEY = 'hipdok.nietzsche.souvenirs.v1';
export const SOUVENIR_TOTAL = cards.length;
export const souvenirPortrait = portrait;

/** 전에 모은 니체 포토카드. 모르는 id는 빼고, 저장값은 고치지 않는다. */
export function readSouvenirs(): Souvenir[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(SOUVENIR_KEY) || '[]');
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids)].flatMap(id => cards.filter(card => card.id === id));
  } catch { return []; }
}

/** 다른 탭에서 바뀌어도 따라가는 읽기 전용 값 */
export function useSouvenirs(): Souvenir[] {
  const [owned, setOwned] = useState(readSouvenirs);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === SOUVENIR_KEY || event.key === null) setOwned(readSouvenirs());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return owned;
}

/** 모은 옛 포토카드 목록. 하나도 없으면 아무것도 그리지 않는다. 뽑기는 없앴다(새 카드는 카드 팩으로). */
export function NietzscheCards() {
  const owned = useSouvenirs();
  const [selected, setSelected] = useState('');
  if (!owned.length) return null;
  const current = owned.find(card => card.id === selected);
  return <section className="panel nietzsche-album">
    <h2 className="section-title">옛 니체 포토카드 <small>{owned.length} / {cards.length}</small></h2>
    {current && <article className="nietzsche-feature" key={current.id} data-period={current.id[0]} aria-live="polite">
      <img src={portrait} alt="" />
      <div><small>{current.year} · {current.id}</small><h3>{current.title}</h3>
        <p>{current.topic}</p><small>창작 답장</small><p>{current.reply}</p></div>
    </article>}
    <ul className="nietzsche-grid">
      {owned.map(card => <li key={card.id}><button type="button" data-period={card.id[0]} onClick={() => setSelected(card.id)} aria-pressed={selected === card.id}>
        <img src={portrait} alt="" loading="lazy" /><small>{card.id}</small><strong>{card.title}</strong>
      </button></li>)}
    </ul>
  </section>;
}
