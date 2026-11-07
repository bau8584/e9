import { getCharacter, type QuoteCard } from '../data';
import { ImageSlot } from './ImageSlot';
import { ReviewLabel } from './Labels';

export function QuoteCardView({ card, reveal = false }: { card: QuoteCard; reveal?: boolean }) {
  const character = getCharacter(card.characterId);
  const rare = card.rarity === '희귀';
  return (
    <article className={`quote-card${rare ? ' is-rare' : ''}${reveal ? ' reveal' : ''}`}>
      <ImageSlot file={card.imageFile} alt={`${character.name} ${card.rarity} 카드 그림`} className="quote-card-art">
        <span className="monogram" aria-hidden="true">
          {character.monogram}
        </span>
      </ImageSlot>
      <div className="quote-card-body">
        <p className="rarity">{card.rarity} 카드</p>
        <blockquote className="quote">{card.quote}</blockquote>
        <p className="quote-who">{character.name}</p>
        <p className="quote-source">{card.source}</p>
        <p className="quote-meta">
          <ReviewLabel />
          <span>제작진 초벌 번역</span>
        </p>
      </div>
    </article>
  );
}
