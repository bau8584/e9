import type { CharacterId } from '../data';
import { computeRanking } from '../store/progress';

export function RankingList({ favoriteId, score, animate = false }: { favoriteId: CharacterId; score: number; animate?: boolean }) {
  return (
    <section className="panel" aria-labelledby="ranking-title">
      <div className="panel-head">
        <h2 id="ranking-title" className="section-title">
          이번 주 팬덤 순위
        </h2>
        <span className="tag">예시 점수</span>
      </div>
      <ol className="ranking">
        {computeRanking(favoriteId, score).map((row) => (
          <li key={row.id} className={`${row.isFavorite ? 'is-mine' : ''}${row.isFavorite && animate ? ' rise' : ''}`}>
            <span className="rank-no">{row.rank}</span>
            <span className="rank-name">
              {row.name} 팬덤{row.isFavorite && <small> 내 최애</small>}
            </span>
            <span className="rank-score">{row.score.toLocaleString('ko-KR')}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
