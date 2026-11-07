import { useState } from 'react';
import { QuoteCardView } from '../../components/QuoteCardView';
import { RankingList } from '../../components/RankingList';
import { getCard, getCardsOf, REWARD_SCORE } from '../../data';
import { isSeasonComplete, rankOf } from '../../store/progress';
import { drawCard, goTo, useSnapshot } from '../../store/store';
import './card.css';

export function CardDraw() {
  const { progress } = useSnapshot();
  const [justDrew, setJustDrew] = useState(false);
  const favoriteId = progress.favoriteId;
  if (!favoriteId) return null;

  if (progress.stage === 'draw') {
    return (
      <section className="draw">
        <h1 className="title">문장 카드 뽑기</h1>
        <button
          type="button"
          className="card-back"
          onClick={() => {
            setJustDrew(true);
            drawCard();
          }}
        >
          <span className="card-back-mark">讀</span>
          <span className="card-back-text">눌러서 뒤집기</span>
        </button>
      </section>
    );
  }

  // 방금 얻은 카드를 맨 위에 두고, 그 카드만 공개 연출을 한다.
  const owned = progress.cards
    .flatMap((id) => {
      const card = getCard(id);
      return card && card.characterId === favoriteId ? [card] : [];
    })
    .reverse();
  const missing = getCardsOf(favoriteId).filter((c) => !progress.cards.includes(c.id));
  const before = rankOf(favoriteId, Math.max(0, progress.score - REWARD_SCORE));
  const after = rankOf(favoriteId, progress.score);

  return (
    <section className="draw">
      <h1 className="title">{justDrew ? '카드 획득' : '내가 얻은 카드'}</h1>
      {owned.map((card, index) => (
        <QuoteCardView key={card.id} card={card} reveal={justDrew && index === 0} />
      ))}
      <div className={`reward${justDrew ? ' reward-in' : ''}`}>
        <p className="reward-score">
          팬덤 점수 <strong>+{REWARD_SCORE}</strong>, 내 점수 <strong data-testid="reward-total">{progress.score}</strong>점
        </p>
        <p className="reward-rank">
          {before === after ? (
            <>
              팬덤 순위 <strong>{after}위</strong> 유지
            </>
          ) : (
            <>
              팬덤 순위 {before}위에서 <strong>{after}위</strong>로
            </>
          )}
        </p>
      </div>
      <RankingList favoriteId={favoriteId} score={progress.score} animate={justDrew} />
      {missing.map((card) => (
        <p key={card.id} className="locked-note">
          {card.rarity} 카드 한 장이 더 남아 있어요. 홈에 온 다음 DM에 답하면 얻을 수 있어요.
        </p>
      ))}
      {isSeasonComplete(progress) && <p className="locked-note">이번 시즌 완료. 다음 시즌을 기다려 주세요.</p>}
      <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('home')}>
        홈으로
      </button>
    </section>
  );
}
