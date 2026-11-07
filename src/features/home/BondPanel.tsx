import type { BondStage } from '../../data/bonds';
import { BOND_THRESHOLDS, MEMO_MIN_CHARS, QUOTE_MIN_CHARS, type BondStatus } from '../../store/bond';
import { goTo } from '../../store/store';

interface Props {
  stages: BondStage[];
  status: BondStatus;
  fill: (text: string) => string;
}

/** 나와 최애의 관계가 지금 어느 정도이고, 무엇을 하면 가까워지는지 보여 준다. */
export function BondPanel({ stages, status, fill }: Props) {
  const { stage, points, latestBook } = status;
  const bond = stages[stage];
  const need = BOND_THRESHOLDS[stage + 1];
  const nextIsOpen = need !== undefined;
  const remaining = nextIsOpen ? Math.max(need - points, 1) : 0;

  return (
    <section className="panel bond-panel" data-testid="bond-panel">
      <h2 className="section-title">나와의 관계</h2>
      <p className="bond-now">{bond.title}</p>
      <p className="mission-text">{bond.description}</p>

      <ol className="bond-steps" aria-label={`관계 ${stages.length}단계 중 ${stage + 1}단계`}>
        {stages.map((step, index) => (
          <li key={step.title} className={index === stage ? 'is-now' : index < stage ? 'is-past' : ''}>
            {index <= stage ? step.title : '???'}
          </li>
        ))}
      </ol>

      {nextIsOpen ? (
        <p className="bond-next" data-testid="bond-next">
          독서 활동 <strong>{points}</strong>개. 다음 관계까지 <strong>{remaining}</strong>개 남았어요.
        </p>
      ) : (
        <p className="bond-next" data-testid="bond-next">
          독서 활동 <strong>{points}</strong>개. 가장 가까운 관계예요.
        </p>
      )}

      {latestBook && <p className="bond-reaction">{fill(bond.bookReaction).replaceAll('{book}', latestBook)}</p>}

      {nextIsOpen && (
        <>
          <ul className="bond-how">
            <li>읽은 책 등록 +1</li>
            <li>인상 깊은 문장 기록 +1 ({QUOTE_MIN_CHARS}자 이상)</li>
            <li>감상 기록 +1 ({MEMO_MIN_CHARS}자 이상)</li>
            <li>읽기 미션 완료 +1</li>
          </ul>
          <button type="button" className="btn btn-primary btn-block" onClick={() => goTo('myroom')}>
            내 방에 독서 기록하기
          </button>
        </>
      )}
    </section>
  );
}
