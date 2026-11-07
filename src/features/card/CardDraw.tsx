import { useRef, useState, type CSSProperties } from 'react';
import { QuoteCardView } from '../../components/QuoteCardView';
import { RankingList, useRanking } from '../../components/RankingList';
import { getCard, getCardsOf, getReading, REWARD_SCORE } from '../../data';
import { isSeasonComplete } from '../../store/progress';
import { drawCard, goTo, useSnapshot } from '../../store/store';
import { isMissionClaimed } from '../../sync/sync';
import './card.css';

export function CardDraw() {
  const { progress } = useSnapshot();
  const [justDrew, setJustDrew] = useState(false);
  // 초기화 전에 이미 팬덤에 반영한 미션이면 이번에는 팬덤 점수가 오르지 않는다.
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const favoriteId = progress.favoriteId;
  const ranking = useRanking(favoriteId, progress.score);
  // 연출 도중 집계가 바뀌어도 흔들리지 않게, 공개되는 순간의 순위를 고정한다.
  const moveRef = useRef<{ from: number; to: number } | null>(null);
  if (!favoriteId || !ranking) return null;

  if (progress.stage === 'draw') {
    return (
      <section className="draw">
        <h1 className="title">문장 카드 뽑기</h1>
        <button
          type="button"
          className="card-back"
          onClick={() => {
            setAlreadyClaimed(isMissionClaimed(getReading(favoriteId, progress.missionIndex).id));
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
  const { rankBefore: before, rankNow: after } = ranking;
  const noFandomGain = alreadyClaimed;
  if (justDrew && !moveRef.current) moveRef.current = { from: before, to: after };
  const move = moveRef.current;
  // 희귀는 떨림 400 + 회전 800 + 금빛 700. 카드가 끝난 뒤에 보상과 순위가 이어진다.
  const rareDrawn = justDrew && owned[0]?.rarity === '희귀';
  const rise = move && !noFandomGain && move.from > move.to ? { ...move, delay: rareDrawn ? 1900 : 900 } : null;

  return (
    <section className="draw" style={{ '--reward-delay': rareDrawn ? '1500ms' : '650ms' } as CSSProperties}>
      <h1 className="title">{justDrew ? '카드 획득' : '내가 얻은 카드'}</h1>
      {owned.map((card, index) =>
        justDrew && index === 0 ? (
          <div key={card.id} className={`flip${rareDrawn ? ' is-rare' : ''}`}>
            <div className="flip-inner">
              <div className="flip-front">
                <QuoteCardView card={card} />
              </div>
              <div className="flip-back" aria-hidden="true">
                <span className="card-back-mark">讀</span>
              </div>
            </div>
            {rareDrawn && (
              <>
                <span className="flip-shine" aria-hidden="true" />
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="flip-dust" aria-hidden="true" />
                ))}
              </>
            )}
          </div>
        ) : (
          <QuoteCardView key={card.id} card={card} />
        ),
      )}
      {justDrew && (
        <div className="reward reward-in">
          {noFandomGain ? (
            <p className="reward-score">
              내 점수 <strong data-testid="reward-total">{progress.score}</strong>점. 이 미션은 전에 팬덤 점수에 반영돼 순위 점수는 그대로예요.
            </p>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
      <RankingList ranking={ranking} rise={rise} />
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
