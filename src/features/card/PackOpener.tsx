// 카드 팩 열기. 남은 팩 수와 봉투 버튼, 여는 연출까지 혼자 한다. 홈, 읽기, DM, 내 방 어디에 끼워도 된다.
// 팩이 0이고 열어 둔 결과도 없으면 아무것도 그리지 않는다.
// autoOpen이면 처음 그려질 때 팩 하나를 바로 연다(한 번만). 남은 팩은 "하나 더 열기"로.
import { useEffect, useRef, useState } from 'react';
import { getCharacter, type CharacterId } from '../../data';
import { fanCardsOf } from '../../data/fancards';
import type { FanRarity } from '../../data/fanTypes';
import { openPack, PACK_SIZE, RARITY_RATES, useFan, type Drawn } from '../../store/fan';
import { FanCardView, RARITY_CLASS } from './FanCardView';
import './pack-opener.css';

/** 뒤집기 전에 뜸 들이는 시간(ms). 등급이 높을수록 길다. */
const SUSPENSE: Record<FanRarity, number> = { 일반: 450, 희귀: 1000, 초희귀: 2100, 한정: 1700 };
/** 봉투가 찢어지는 시간(ms). 초희귀가 들어 있으면 조금 더 뜸을 들인다. */
const TEAR = 700;
const TEAR_EPIC = 1300;
/** 여는 순간의 진동(ms). 팩에서 가장 높은 등급을 따른다. */
const VIBRATION: Record<FanRarity, number[]> = { 일반: [25], 희귀: [40, 60, 40], 초희귀: [60, 70, 60, 70, 220], 한정: [60, 70, 60] };
const RANK: Record<FanRarity, number> = { 일반: 0, 희귀: 1, 초희귀: 2, 한정: 3 };

const reducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 진동이 되는 기기에서만 짧게 울린다. 안 되면 조용히 넘어간다. */
function buzz(rarity: FanRarity) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(VIBRATION[rarity]);
  } catch {
    /* 진동이 막힌 기기 */
  }
}

const bestOf = (drawn: Drawn[]): FanRarity =>
  drawn.reduce<FanRarity>((best, d) => (RANK[d.card.rarity] > RANK[best] ? d.card.rarity : best), '일반');

/** 화면에 그대로 적는 확률 문구 */
export const rateText = () =>
  `나올 확률: 일반 ${RARITY_RATES.일반}%, 희귀 ${RARITY_RATES.희귀}%, 초희귀 ${RARITY_RATES.초희귀}%. 한 팩에 ${PACK_SIZE}장. 한정 카드는 팩에서 나오지 않아요.`;

export function PackOpener({ characterId, autoOpen = false }: { characterId: CharacterId; autoOpen?: boolean }) {
  const { packs } = useFan();
  const [drawn, setDrawn] = useState<Drawn[] | null>(null);
  const [shown, setShown] = useState(0);
  const [tearing, setTearing] = useState(false);
  const [empty, setEmpty] = useState(false);
  const autoDone = useRef(false);
  const character = getCharacter(characterId);
  const hasEpic = !!drawn?.some((d) => d.card.rarity === '초희귀');

  // 봉투가 다 찢어지면 카드 공개로 넘어간다.
  useEffect(() => {
    if (!tearing) return;
    const timer = window.setTimeout(() => setTearing(false), hasEpic ? TEAR_EPIC : TEAR);
    return () => window.clearTimeout(timer);
  }, [tearing, hasEpic]);

  // 한 장씩 차례로 공개한다. 움직임을 줄인 기기는 한 번에 보인다.
  useEffect(() => {
    if (tearing || !drawn || shown >= drawn.length) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), SUSPENSE[drawn[shown].card.rarity]);
    return () => window.clearTimeout(timer);
  }, [drawn, shown, tearing]);

  function open() {
    const result = openPack(fanCardsOf(characterId));
    if (!result.length) {
      setEmpty(true);
      return;
    }
    setEmpty(false);
    buzz(bestOf(result));
    const instant = reducedMotion();
    setDrawn(result);
    setShown(instant ? result.length : 0);
    setTearing(!instant);
  }

  // 보상 직후 화면: 단추를 누르지 않아도 팩 하나를 바로 연다. 한 번만.
  useEffect(() => {
    if (!autoOpen || autoDone.current || drawn || packs <= 0) return;
    autoDone.current = true;
    open();
    // open은 그릴 때마다 새로 만들어지지만 처음 한 번만 부르면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, packs, drawn]);

  if (packs <= 0 && !drawn) return null;

  const done = !!drawn && !tearing && shown >= drawn.length;
  const fresh = drawn?.filter((d) => !d.duplicate).length ?? 0;
  const shards = drawn?.reduce((sum, d) => sum + d.shards, 0) ?? 0;
  const epicShown = !!drawn && !tearing && drawn.some((d, index) => index < shown && d.card.rarity === '초희귀');

  const packFace = (
    <>
      <span className="po-flap" aria-hidden="true" />
      <span className="po-seal" aria-hidden="true">{character.monogram}</span>
      <span className="po-pack-label">
        <small>힙독 카드 팩</small>
        <strong>{character.name}</strong>
        {!drawn && <span>눌러서 열기</span>}
      </span>
    </>
  );

  return (
    <div className="fandom-scope">
      <section className={`po${epicShown ? ' po-epic-moment' : ''}`} aria-label={`${character.name} 카드 팩`}>
        <div className="po-head">
          <h2 className="po-title">카드 팩 <strong>{packs}</strong>개</h2>
          {!drawn && <p className="po-hint">대목을 읽거나 대화를 마치면 하나씩 받아요.</p>}
        </div>

        {!drawn ? (
          <button type="button" className={`po-pack po-tone-${characterId}`} onClick={open} aria-label={`${character.name} 카드 팩 열기, 남은 팩 ${packs}개`}>
            {packFace}
            <i className="po-glint" aria-hidden="true" />
          </button>
        ) : tearing ? (
          <button
            type="button"
            className={`po-pack po-tone-${characterId} po-tearing${hasEpic ? ' po-tearing-epic' : ''}`}
            onClick={() => setTearing(false)}
            aria-label="팩을 여는 중. 누르면 바로 카드를 봐요"
          >
            {packFace}
            <i className="po-rip" aria-hidden="true" />
          </button>
        ) : (
          <>
            {epicShown && <i className="po-flash" aria-hidden="true" />}
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
              {done
                ? `${epicShown ? '초희귀가 나왔어요. ' : ''}새 카드 ${fresh}장${shards ? `, 조각 +${shards}` : ''}. 카드를 누르면 뒷면을 봐요.`
                : '두근두근...'}
            </p>
            {done && (
              <div className="po-actions">
                {packs > 0 && <button type="button" className="btn btn-primary" onClick={open}>하나 더 열기 ({packs}개 남음)</button>}
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
