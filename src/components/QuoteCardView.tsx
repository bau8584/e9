import { getCharacter, type QuoteCard } from '../data';
import { ImageSlot } from './ImageSlot';
import { Portrait } from './Portrait';

export function QuoteCardView({ card }: { card: QuoteCard }) {
  const character = getCharacter(card.characterId);
  const rare = card.rarity === '희귀';
  return (
    <article className={`quote-card${rare ? ' is-rare' : ''}`}>
      <ImageSlot file={card.imageFile} alt={`${character.name} ${card.rarity} 카드 그림`} className="quote-card-art">
        {/* 카드 전용 그림이 없으면 인물 초상을 대신 쓴다 */}
        <Portrait character={character} className="quote-card-portrait" />
      </ImageSlot>
      <div className="quote-card-body">
        <p className="rarity">{card.rarity} 카드</p>
        <blockquote className="quote">{card.quote}</blockquote>
        <p className="quote-who">{character.name}</p>
        <p className="quote-source">{card.source}</p>
      </div>
    </article>
  );
}
