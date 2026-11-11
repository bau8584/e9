import { useEffect, useState } from 'react';
import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import { getCharacter, type Character } from '../../data';
import { bonds, type BondStage } from '../../data/bonds';
import { getFanCard } from '../../data/fancards';
import { markStageSeen, readSeenStage } from '../../store/bond';
import { affinityOf, grantCard, stageOfAffinity, useFan } from '../../store/fan';
import { useSnapshot } from '../../store/store';
import { FanCardView } from '../card/FanCardView';
import './bond.css';

/**
 * 단계 장면을 어느 화면에서든 띄운다. App에 한 번 둔다.
 * 호감이 올라 단계가 바뀌면 그 화면 위에 바로 뜬다. 여러 단계를 한꺼번에 건너뛰었으면
 * 본 단계 다음부터 오른 단계까지 차례로 하나씩 보여 주고, 단계마다 한정 카드를 준다.
 */
export function BondMomentHost({ enabled = true }: { enabled?: boolean }) {
  const { progress } = useSnapshot();
  const fan = useFan();
  // 본 단계는 localStorage에 있어 바뀌어도 다시 그려지지 않으므로, 닫을 때 직접 다시 그린다.
  const [, redraw] = useState(0);
  const id = progress.favoriteId;
  if (!enabled || !id || !progress.nickname) return null;
  const earned = stageOfAffinity(affinityOf(id, fan));
  const seen = readSeenStage(id);
  if (earned <= seen) return null;
  const stage = seen + 1;
  const bond = bonds[id]?.[stage];
  if (!bond) return null;
  const character = getCharacter(id);
  const fill = (text: string) => text.replaceAll('{name}', progress.nickname);

  return (
    <div className="fandom-scope">
      {/* 단계마다 새로 그려 스크롤이 맨 위에서 시작한다 */}
      <div key={`${id}-${stage}`} className="bondm-layer" role="dialog" aria-modal="true" aria-label={`${character.name}, 새로운 관계`}>
        <BondMoment
          character={character}
          bond={bond}
          stage={stage}
          fill={fill}
          more={earned - stage}
          onClose={() => {
            markStageSeen(id, stage);
            redraw((n) => n + 1);
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  character: Character;
  bond: BondStage;
  stage: number;
  fill: (text: string) => string;
  /** 이 장면 뒤에 이어서 나올 단계 수 */
  more?: number;
  onClose: () => void;
}

/** 관계 단계가 오를 때 한 번 나오는 장면. 대사가 한 줄씩 나오고, 끝에 새 관계와 새 호칭, 한정 카드를 받는다. */
export function BondMoment({ character, bond, stage, fill, more = 0, onClose }: Props) {
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
                {more > 0 ? '간직하고 다음 이야기 보기' : '간직하기'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
