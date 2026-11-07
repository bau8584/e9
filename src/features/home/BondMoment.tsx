import { AdaptedLabel } from '../../components/Labels';
import { Portrait } from '../../components/Portrait';
import type { Character } from '../../data';
import type { BondStage } from '../../data/bonds';

interface Props {
  character: Character;
  bond: BondStage;
  stage: number;
  fill: (text: string) => string;
  onClose: () => void;
}

/** 관계 단계가 오를 때 한 번 나오는 장면. 숫자 대신 그림과 말투의 변화로 보여 준다. */
export function BondMoment({ character, bond, stage, fill, onClose }: Props) {
  return (
    <div className="page home" data-testid="bond-moment">
      <section className="bond-moment">
        <Portrait character={character} className="bond-portrait" stage={stage} />
        <div className="bond-body">
          <p className="bond-title">{bond.title}</p>
          <div className="bond-lines">
            {bond.moment.map((line) => (
              <p key={line}>{fill(line)}</p>
            ))}
          </div>
          <AdaptedLabel />
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
            간직하기
          </button>
        </div>
      </section>
    </div>
  );
}
