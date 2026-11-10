import type { BondStage } from '../../data/bonds';
import { nextBondOf, type BondStatus } from '../../store/bond';
import { goTo } from '../../store/store';
import './bond.css';

interface Props {
  stages: BondStage[];
  status: BondStatus;
  fill: (text: string) => string;
}

const HOW: { title: string; text: string; label: string; screen: 'reading' | 'dm' }[] = [
  { title: '이야기 읽기', text: '같이 이야기를 읽고 한 줄 남기면 마음이 크게 가까워져요.', label: '이야기 읽으러 가기', screen: 'reading' },
  { title: '대화하기', text: '고르는 말에 따라 어떻게 반응하는지가 달라져요.', label: '대화하러 가기', screen: 'dm' },
  { title: '직접 이야기하기', text: '내 얘기를 들려주면 기억해 두고 다음에 꺼내요.', label: '말 걸러 가기', screen: 'dm' },
];

/** 게이지 옆에 붙는 느낌 한 줄. 숫자보다 이것이 먼저 읽힌다. */
function feelOf(ratio: number): string {
  if (ratio >= 0.8) return '조금만 더!';
  if (ratio >= 0.5) return '꽤 가까워졌어요';
  if (ratio >= 0.2) return '조금씩 가까워지는 중';
  return '이제 막 시작이에요';
}

/** 나와 최애의 관계가 지금 어느 정도이고, 무엇을 하면 가까워지는지 보여 준다. */
export function BondPanel({ stages, status, fill }: Props) {
  const { stage, points, latestBook } = status;
  const bond = stages[stage];
  const next = nextBondOf(stage, points);
  const teaser = next ? stages[stage + 1]?.teaser : undefined;
  const percent = next ? Math.round(next.ratio * 100) : 100;

  return (
    <section className="panel bondp" data-testid="bond-panel">
      <h2 className="section-title">나와의 관계</h2>
      <p className="bondp-now">{bond.title}</p>
      <p className="bondp-desc">{fill(bond.description)}</p>
      {bond.callName && (
        <p className="bondp-call">
          나를 부르는 호칭 <strong>“{fill(bond.callName)}”</strong>
        </p>
      )}

      <ol className="bondp-steps" aria-label={`관계 ${stages.length}단계 중 ${stage + 1}단계`}>
        {stages.map((step, index) => (
          <li key={step.title} className={index === stage ? 'is-now' : index < stage ? 'is-past' : ''}>
            {index <= stage ? step.title : '???'}
          </li>
        ))}
      </ol>

      <div className="bondp-next" data-testid="bond-next">
        <div className="bondp-feel">
          <strong>{next ? feelOf(next.ratio) : '가장 가까운 사이예요'}</strong>
          {next && <small>{next.remaining}점 남음</small>}
        </div>
        <div
          className="bondp-gauge"
          role="progressbar"
          aria-label="다음 관계까지"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>

      {teaser && <p className="bondp-teaser">{teaser}</p>}

      {latestBook && <p className="bondp-reaction">{fill(bond.bookReaction).replaceAll('{book}', latestBook)}</p>}

      {next && (
        <div className="bondp-how">
          <p className="bondp-how-head">가까워지는 법</p>
          <ul>
            {HOW.map((item) => (
              <li key={item.title}>
                <div>
                  <p className="bondp-how-title">{item.title}</p>
                  <p className="bondp-how-text">{item.text}</p>
                </div>
                <button type="button" className="btn bondp-go" onClick={() => goTo(item.screen)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
