// 카드 팩 열기. 남은 팩 수와 봉투 버튼, 여는 연출까지 혼자 한다. 홈, 읽기, DM, 내 방 어디에 끼워도 된다.
// 팩이 0이고 열어 둔 결과도 없으면 아무것도 그리지 않는다.
import { useEffect, useState } from 'react';
import { getCharacter, type CharacterId } from '../../data';
import { fanCardsOf } from '../../data/fancards';
import type { FanRarity } from '../../data/fanTypes';
import { openPack, PACK_SIZE, RARITY_RATES, useFan, type Drawn } from '../../store/fan';
import { FanCardView, RARITY_CLASS } from './FanCardView';
import './pack-opener.css';

/** 뒤집기 전에 뜸 들이는 시간(ms). 등급이 높을수록 길다. */
const SUSPENSE: Record<FanRarity, number> = { 일반: 450, 희귀: 1000, 초희귀: 1700, 한정: 1700 };

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 화면에 그대로 적는 확률 문구 */
export const rateText = () =>
  `나올 확률: 일반 ${RARITY_RATES.일반}%, 희귀 ${RARITY_RATES.희귀}%, 초희귀 ${RARITY_RATES.초희귀}%. 한 팩에 ${PACK_SIZE}장. 한정 카드는 팩에서 나오지 않아요.`;

export function PackOpener({ characterId }: { characterId: CharacterId }) {
  const { packs } = useFan();
  const [drawn, setDrawn] = useState<Drawn[] | null>(null);
  const [shown, setShown] = useState(0);
  const [empty, setEmpty] = useState(false);
  const character = getCharacter(characterId);

  // 한 장씩 차례로 공개한다. 움직임을 줄인 기기는 한 번에 보인다.
  useEffect(() => {
    if (!drawn || shown >= drawn.length) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), SUSPENSE[drawn[shown].card.rarity]);
    return () => window.clearTimeout(timer);
  }, [drawn, shown]);

  if (packs <= 0 && !drawn) return null;

  function open() {
    const result = openPack(fanCardsOf(characterId));
    if (!result.length) {
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setDrawn(result);
    setShown(reducedMotion() ? result.length : 0);
  }

  const done = !!drawn && shown >= drawn.length;
  const fresh = drawn?.filter((d) => !d.duplicate).length ?? 0;
  const shards = drawn?.reduce((sum, d) => sum + d.shards, 0) ?? 0;

  return (
    <div className="fandom-scope">
      <section className="po" aria-label={`${character.name} 카드 팩`}>
        <div className="po-head">
          <h2 className="po-title">카드 팩 <strong>{packs}</strong>개</h2>
          {!drawn && <p className="po-hint">대목을 읽거나 대화를 마치면 하나씩 받아요.</p>}
        </div>

        {!drawn ? (
          <button type="button" className={`po-pack po-tone-${characterId}`} onClick={open} aria-label={`${character.name} 카드 팩 열기, 남은 팩 ${packs}개`}>
            <span className="po-flap" aria-hidden="true" />
            <span className="po-seal" aria-hidden="true">{character.monogram}</span>
            <span className="po-pack-label">
              <small>HIP讀 FAN PACK</small>
              <strong>{character.name}</strong>
              <span>눌러서 열기</span>
            </span>
            <i className="po-glint" aria-hidden="true" />
          </button>
        ) : (
          <>
            <ol className="po-row" aria-label="이번 팩에서 나온 카드">
              {drawn.map((d, index) => {
                const revealed = index < shown;
                const waiting = index === shown;
                return (
                  <li key={index} className={`po-slot po-${RARITY_CLASS[d.card.rarity]}${revealed ? ' po-revealed' : ''}${waiting ? ' po-waiting' : ''}`}>
                    {revealed ? (
                      <>
                        <div className="po-card"><FanCardView card={d.card} /></div>
                        <span className={d.duplicate ? 'po-tag po-tag-dup' : 'po-tag po-tag-new'}>
                          {d.duplicate ? `조각 +${d.shards}` : 'NEW'}
                        </span>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="po-back"
                        aria-label="이 카드 바로 보기"
                        onClick={() => setShown(index + 1)}
                      >
                        <span aria-hidden="true">{character.monogram}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="po-result" aria-live="polite">
              {done ? `새 카드 ${fresh}장${shards ? `, 조각 +${shards}` : ''}. 카드를 누르면 뒷면을 봐요.` : '두근두근...'}
            </p>
            {done && (
              <div className="po-actions">
                {packs > 0 && <button type="button" className="btn btn-primary" onClick={open}>한 팩 더 열기 ({packs}개 남음)</button>}
                <button type="button" className="btn po-close" onClick={() => setDrawn(null)}>닫기</button>
              </div>
            )}
          </>
        )}

        {empty && <p className="po-result" role="status">지금은 이 인물의 카드를 준비하고 있어요. 팩은 그대로 남아 있어요.</p>}
        <p className="po-rates">{rateText()}</p>
      </section>
    </div>
  );
}
