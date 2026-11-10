// 인물 그림 카드 한 장. 누르면 뒤집혀 뒷면의 한 줄(제작진 각색)이 보인다.
// 그림은 인물 초상 하나를 같이 쓰고, tone(0~3)으로 틀과 배경 색감을 나눈다. 한정 카드는 호감 단계 초상을 쓴다.
import { useState } from 'react';
import { Portrait } from '../../components/Portrait';
import { getCharacter } from '../../data';
import type { FanCard, FanRarity } from '../../data/fanTypes';
import './fan-card.css';

export const RARITY_CLASS: Record<FanRarity, string> = { 일반: 'common', 희귀: 'rare', 초희귀: 'epic', 한정: 'limited' };
const RARITY_PIPS: Record<FanRarity, number> = { 일반: 1, 희귀: 2, 초희귀: 3, 한정: 0 };

/** 한정 카드 id 끝의 단계(1~3). 그 단계 초상을 쓴다. 아니면 0. */
const limitedStage = (card: FanCard): number => {
  const match = card.rarity === '한정' ? /-limited-(\d)$/.exec(card.id) : null;
  return match ? Number(match[1]) : 0;
};

const toneOf = (tone: number) => (Number.isInteger(tone) && tone >= 0 && tone <= 3 ? tone : 0);

export function RarityBadge({ rarity }: { rarity: FanRarity }) {
  const pips = RARITY_PIPS[rarity];
  return (
    <span className={`fc-badge fc-badge-${RARITY_CLASS[rarity]}`}>
      {pips > 0 && <span className="fc-pips" aria-hidden="true">{Array.from({ length: pips }, (_, i) => <i key={i} />)}</span>}
      {rarity}
    </span>
  );
}

interface Props {
  card: FanCard;
  /** 아직 없는 카드. 실루엣과 ??? 로 보인다. */
  locked?: boolean;
  /** 가진 장수. 2 이상이면 표시한다. */
  count?: number;
}

export function FanCardView({ card, locked = false, count = 0 }: Props) {
  const [flipped, setFlipped] = useState(false);
  const character = getCharacter(card.characterId);
  const rarity = RARITY_CLASS[card.rarity];
  const className = `fc fc-${rarity} fc-tone-${toneOf(card.tone)}${locked ? ' fc-locked' : ''}${flipped ? ' fc-flipped' : ''}`;

  const front = (
    <span className="fc-face fc-front">
      <span className="fc-top">
        <RarityBadge rarity={card.rarity} />
        <span className="fc-name">{character.name}</span>
      </span>
      <span className="fc-art">
        <Portrait character={character} stage={limitedStage(card)} className="fc-portrait" />
        {!locked && (card.rarity === '초희귀' || card.rarity === '한정') && <span className="fc-foil" aria-hidden="true" />}
      </span>
      <span className="fc-plate">
        <strong className="fc-title">{locked ? '???' : card.title}</strong>
        <small className="fc-scene">{locked ? (card.rarity === '한정' ? '더 가까워지면 받는 장면' : '아직 만나지 못한 장면') : card.scene}</small>
      </span>
      {!locked && count >= 2 && <span className="fc-count" aria-label={`${count}장`}>x{count}</span>}
    </span>
  );

  if (locked) {
    return (
      <div className={className} role="img" aria-label={`${character.name} ${card.rarity} 카드, 아직 없음`}>
        <span className="fc-inner">{front}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-pressed={flipped}
      aria-label={`${character.name} ${card.rarity} 카드 ${card.title}. ${flipped ? card.line : '누르면 뒷면을 봐요'}`}
      onClick={() => setFlipped((value) => !value)}
    >
      <span className="fc-inner">
        {front}
        <span className="fc-face fc-back" aria-hidden={!flipped}>
          <span className="fc-back-mark" aria-hidden="true">{character.monogram}</span>
          <span className="fc-line">{card.line}</span>
          <small className="fc-back-note">{character.name} · 제작진 각색</small>
        </span>
      </span>
    </button>
  );
}
