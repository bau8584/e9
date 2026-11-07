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
const cards = draft.split(/\r?\n/).filter(line => /^\| [ETML]\d{2} \|/.test(line)).map(line => {
  const [id, title, topic, reply] = line.split('|').slice(1).map(cell => cell.trim());
  return { id, title, topic, reply };
});
const storageKey = 'hipdok.nietzsche.souvenirs.v1';
function readCollection(): string[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter(id => cards.some(card => card.id === id)))] : [];
  } catch { return []; }
}

export function NietzscheCards() {
  const [period, setPeriod] = useState(periods[0]);
  const [owned, setOwned] = useState(readCollection);
  const [selected, setSelected] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) setOwned(readCollection());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const candidates = cards.filter(card => card.id.startsWith(period.prefix));
  const available = candidates.filter(card => !owned.includes(card.id));
  const current = cards.find(card => card.id === selected);
  const currentPeriod = periods.find(item => item.prefix === selected[0]);
  function draw() {
    if (!available.length) return;
    const card = available[Math.floor(Math.random() * available.length)];
    const next = [...new Set([...readCollection(), ...owned, card.id])];
    setOwned(next);
    setSelected(card.id);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }
  return <section className="panel nietzsche-album">
    <h2 className="section-title">니체 포토카드 <small>{owned.length} / {cards.length}</small></h2>
    <label>만나고 싶은 니체
      <select value={period.prefix} onChange={event => {
        setPeriod(periods.find(item => item.prefix === event.target.value)!);
        setSelected('');
      }}>
        {periods.map(item => <option key={item.prefix} value={item.prefix}>{item.year} · {item.name}</option>)}
      </select>
    </label>
    <button type="button" className="btn btn-primary btn-block" disabled={!available.length} onClick={draw}>
      {available.length ? '이 시기의 포토카드 뽑기' : '이 시기의 10종을 모두 모았어요'}
    </button>
    {current && currentPeriod && <article className="nietzsche-feature" key={current.id} data-period={currentPeriod.prefix} aria-live="polite">
      <img src={portrait} alt="" />
      <div><small>{currentPeriod.year} · {current.id}</small><h3>{current.title}</h3>
        <p>{current.topic}</p><small>창작 답장</small><p>{current.reply}</p></div>
    </article>}
    {saveFailed && <p role="status">브라우저에 저장할 수 없어 이번 방문 동안만 보관해요.</p>}
    {!!owned.length && <><h3>내가 뽑은 니체 카드</h3><ul className="nietzsche-grid">
      {owned.map(id => {
        const card = cards.find(item => item.id === id)!;
        return <li key={id}><button type="button" data-period={id[0]} onClick={() => setSelected(id)} aria-pressed={selected === id}>
          <img src={portrait} alt="" loading="lazy" /><small>{id}</small><strong>{card.title}</strong>
        </button></li>;
      })}
    </ul></>}
  </section>;
}
