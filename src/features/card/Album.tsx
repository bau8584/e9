// 카드 앨범. 지금 최애의 카드만 세고 보여 준다(가진 카드와 아직 없는 카드). 다른 인물 카드는 가진 것만 접힌 구역에.
// 조각으로 없는 카드를 바꾸고, 맨 아래에는 전에 모은 옛 카드(문장 카드, 니체 포토카드, 사상가 카드)를 읽기만 해서 보여 준다.
import { useState } from 'react';
import { QuoteCardView } from '../../components/QuoteCardView';
import { getCard, getCharacter, PLAYABLE_IDS, type CharacterId, type QuoteCard } from '../../data';
import { fanCardsOf } from '../../data/fancards';
import type { FanCard, FanRarity } from '../../data/fanTypes';
import { exchangeCard, SHARD_COST, SHARDS_FROM_DUPLICATE, useFan } from '../../store/fan';
import { useSnapshot } from '../../store/store';
import { SOUVENIR_TOTAL, souvenirPortrait, useSouvenirs } from '../home/NietzscheCards';
import { philosopherCatalog, readCards as readPhilosopherCards } from '../my-room/PortraitPacks';
import { ShareCardButton } from '../share/ShareCardButton';
import { FanCardView } from './FanCardView';
import './album.css';

const RARITY_ORDER: Record<FanRarity, number> = { 일반: 0, 희귀: 1, 초희귀: 2, 한정: 3 };

/** 인물의 카드를 등급 순서(일반 → 한정)로. 같은 등급은 목록 순서 그대로. */
export const albumCardsOf = (id: CharacterId): FanCard[] =>
  fanCardsOf(id)
    .map((card, index) => ({ card, index }))
    .sort((a, b) => RARITY_ORDER[a.card.rarity] - RARITY_ORDER[b.card.rarity] || a.index - b.index)
    .map(({ card }) => card);

/** 최애를 맨 앞에 둔 입덕 가능 인물 순서 */
export const albumOrder = (favoriteId: CharacterId | null): CharacterId[] =>
  favoriteId && PLAYABLE_IDS.includes(favoriteId) ? [favoriteId, ...PLAYABLE_IDS.filter((id) => id !== favoriteId)] : [...PLAYABLE_IDS];

function Cell({ card, count, shards, onExchanged }: { card: FanCard; count: number; shards: number; onExchanged: (card: FanCard) => void }) {
  if (count > 0)
    return (
      <li className="al-cell">
        <FanCardView card={card} count={count} />
        <ShareCardButton card={card} />
      </li>
    );
  if (card.rarity === '한정')
    return (
      <li className="al-cell">
        <FanCardView card={card} locked />
        <p className="al-cell-note">더 가까워지면 받는 장면</p>
      </li>
    );
  const cost = SHARD_COST[card.rarity];
  const enough = shards >= cost;
  return (
    <li className="al-cell">
      <FanCardView card={card} locked />
      <button
        type="button"
        className={`al-exchange${enough ? ' al-exchange-ready' : ''}`}
        disabled={!enough}
        onClick={() => {
          if (exchangeCard(card)) onExchanged(card);
        }}
      >
        {enough ? `조각 ${cost}개로 받기` : `조각 ${cost - shards}개 더 필요`}
      </button>
    </li>
  );
}

function OldCards() {
  const { progress } = useSnapshot();
  const souvenirs = useSouvenirs();
  const [philosophers] = useState(readPhilosopherCards);
  const quotes = progress.cards.flatMap((id): QuoteCard[] => {
    const card = getCard(id);
    return card ? [card] : [];
  });
  const total = quotes.length + souvenirs.length + philosophers.length;
  if (!total) return null;
  return (
    <details className="al-old">
      <summary>옛 카드 <span>{total}장</span></summary>
      <p className="al-note">덕질 개편 전에 모은 카드예요. 그대로 간직해 둘게요.</p>
      {quotes.length > 0 && (
        <>
          <h4 className="al-old-title">문장 카드 <small>{quotes.length}장</small></h4>
          <ul className="al-old-quotes">
            {quotes.map((card) => <li key={card.id}><QuoteCardView card={card} /></li>)}
          </ul>
        </>
      )}
      {souvenirs.length > 0 && (
        <>
          <h4 className="al-old-title">니체 포토카드 <small>{souvenirs.length} / {SOUVENIR_TOTAL}</small></h4>
          <ul className="al-old-tiles">
            {souvenirs.map((card) => (
              <li key={card.id}>
                <img src={souvenirPortrait} alt="" loading="lazy" />
                <div><small>{card.year} · {card.id}</small><strong>{card.title}</strong></div>
              </li>
            ))}
          </ul>
        </>
      )}
      {philosophers.length > 0 && (
        <>
          <h4 className="al-old-title">사상가 카드 <small>{philosophers.length} / {philosopherCatalog.length}</small></h4>
          <ul className="al-old-tiles">
            {philosophers.map((id) => (
              <li key={id}>
                <img src={philosopherCatalog[id].image} alt="" loading="lazy" />
                <div><small>{philosopherCatalog[id].theme}</small><strong>{philosopherCatalog[id].name}</strong></div>
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}

/** 한 인물의 카드 묶음. 최애는 전부(잠긴 카드와 교환 포함), 다른 인물은 가진 카드만. */
function PersonCards({ id, ownedOnly, favorite = false, onExchanged }: { id: CharacterId; ownedOnly: boolean; favorite?: boolean; onExchanged: (card: FanCard) => void }) {
  const fan = useFan();
  const character = getCharacter(id);
  const all = albumCardsOf(id);
  const owned = all.filter((card) => (fan.cards[card.id] ?? 0) > 0).length;
  const list = ownedOnly ? all.filter((card) => (fan.cards[card.id] ?? 0) > 0) : all;
  return (
    <section className="al-person" aria-label={`${character.name} 카드`}>
      <h3 className="al-person-title">
        {character.name}
        {favorite && <small className="al-fav">최애</small>}
        <span className="al-count">{owned} / {all.length}</span>
      </h3>
      {!ownedOnly && <div className="al-bar" aria-hidden="true"><i style={{ width: all.length ? `${(owned / all.length) * 100}%` : 0 }} /></div>}
      {list.length ? (
        <ul className="al-grid">
          {list.map((card) => (
            <Cell key={card.id} card={card} count={fan.cards[card.id] ?? 0} shards={fan.shards} onExchanged={onExchanged} />
          ))}
        </ul>
      ) : (
        <p className="al-note">카드를 준비하고 있어요.</p>
      )}
    </section>
  );
}

export function Album() {
  const fan = useFan();
  const { progress } = useSnapshot();
  const [status, setStatus] = useState('');
  const favoriteId = progress.favoriteId && PLAYABLE_IDS.includes(progress.favoriteId) ? progress.favoriteId : null;
  const onExchanged = (c: FanCard) => setStatus(`조각으로 "${c.title}" 카드를 받았어요.`);
  // 최애가 없으면 예전처럼 모든 인물을 펼친다. 최애가 있으면 최애만 세고, 다른 인물은 가진 카드가 있을 때만 접어 둔다.
  const others = favoriteId
    ? PLAYABLE_IDS.filter((id) => id !== favoriteId && fanCardsOf(id).some((card) => (fan.cards[card.id] ?? 0) > 0))
    : [];
  const otherCount = others.reduce((sum, id) => sum + fanCardsOf(id).filter((card) => (fan.cards[card.id] ?? 0) > 0).length, 0);
  return (
    <div className="fandom-scope">
      <section className="al" aria-labelledby="album-title">
        <div className="al-head">
          <h2 id="album-title" className="al-title">카드 앨범</h2>
          <p className="al-shards">조각 <strong>{fan.shards}</strong>개</p>
        </div>
        <p className="al-note">
          겹친 카드는 조각이 돼요(일반 {SHARDS_FROM_DUPLICATE.일반}, 희귀 {SHARDS_FROM_DUPLICATE.희귀}, 초희귀 {SHARDS_FROM_DUPLICATE.초희귀}).
          조각 일반 {SHARD_COST.일반}, 희귀 {SHARD_COST.희귀}, 초희귀 {SHARD_COST.초희귀}개로 아직 없는 카드를 받을 수 있어요.
        </p>
        <p className="al-status" role="status" aria-live="polite">{status}</p>
        {favoriteId ? (
          <PersonCards id={favoriteId} ownedOnly={false} favorite onExchanged={onExchanged} />
        ) : (
          albumOrder(null).map((id) => <PersonCards key={id} id={id} ownedOnly={false} onExchanged={onExchanged} />)
        )}
        {others.length > 0 && (
          <details className="al-old al-others">
            <summary>다른 인물 카드 <span>{otherCount}장</span></summary>
            <p className="al-note">전에 다른 인물을 좋아할 때 모은 카드예요. 그대로 간직해 둘게요.</p>
            {others.map((id) => <PersonCards key={id} id={id} ownedOnly onExchanged={onExchanged} />)}
          </details>
        )}
        <OldCards />
      </section>
    </div>
  );
}
