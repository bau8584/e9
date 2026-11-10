import { useEffect, useState } from 'react';
import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import type { Character } from '../../data';
import type { BondStage } from '../../data/bonds';
import { getFanCard } from '../../data/fancards';
import { grantCard } from '../../store/fan';
import { FanCardView } from '../card/FanCardView';
import './bond.css';

interface Props {
  character: Character;
  bond: BondStage;
  stage: number;
  fill: (text: string) => string;
  onClose: () => void;
}

/** 관계 단계가 오를 때 한 번 나오는 장면. 대사가 한 줄씩 나오고, 끝에 새 관계와 새 호칭, 한정 카드를 받는다. */
export function BondMoment({ character, bond, stage, fill, onClose }: Props) {
  const lines = bond.moment;
  const [shown, setShown] = useState(Math.min(1, lines.length));
  const done = shown >= lines.length;
  const card = getFanCard(`${character.id}-limited-${stage}`);
  const cardId = card?.id;

  // 한정 카드는 장면이 시작될 때 받는다. 이미 있으면 그대로 둔다.
  useEffect(() => {
    if (cardId) grantCard(cardId);
  }, [cardId]);

  const advance = () => setShown((n) => Math.min(n + 1, lines.length));

  return (
    <div className="page home" data-testid="bond-moment">
      <section className="bondm">
        <Portrait character={character} className="bondm-portrait" stage={stage} />
        <div className="bondm-body">
          {!done && (
            <button type="button" className="bondm-talk" onClick={advance} aria-label="다음 대사">
              <span className="bondm-who">{character.name}</span>
              <span className="bondm-log">
                {lines.slice(0, shown).map((line, index) => (
                  <span key={index} className={index === shown - 1 ? 'bondm-line is-new' : 'bondm-line'}>
                    {fill(line)}
                  </span>
                ))}
              </span>
              <span className="bondm-tap" aria-hidden="true">
                눌러서 넘기기 ({shown}/{lines.length})
              </span>
            </button>
          )}

          {done && (
            <div className="bondm-reveal" data-testid="bond-reveal">
              {lines.length > 0 && (
                <p className="bondm-last">
                  {fill(lines[lines.length - 1])}
                </p>
              )}
              <p className="bondm-kicker">새로운 관계</p>
              <p className="bondm-title">{bond.title}</p>
              <p className="bondm-desc">{fill(bond.description)}</p>
              {bond.callName && (
                <div className="bondm-call">
                  <p className="bondm-kicker">나를 부르는 새 호칭</p>
                  <p className="bondm-callname">“{fill(bond.callName)}”</p>
                </div>
              )}
              {card && (
                <div className="bondm-card">
                  <p className="bondm-kicker">한정 카드를 받았어요</p>
                  <FanCardView card={card} />
                </div>
              )}
              <AdaptedLabel />
              <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
                간직하기
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
