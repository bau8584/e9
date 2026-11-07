import { REWARD_SCORE, type CharacterId } from '../data';
import { computeRanking, computeRealRanking, type RankRow } from '../store/progress';
import { useFandomScores } from '../sync/sync';

export interface Ranking {
  rows: RankRow[];
  isReal: boolean;
  /** 방금 받은 20점이 없었다면 몇 위였는지 */
  rankBefore: number;
  rankNow: number;
}

const rankIn = (rows: RankRow[]) => rows.find((r) => r.isFavorite)?.rank ?? 0;

/** 실제 점수가 오면 그것으로, 연결이 안 되면 예시 점수로 줄을 세운다. 화면에 있는 동안만 구독한다. */
export function useRanking(favoriteId: CharacterId | null, score: number): Ranking | null {
  const scores = useFandomScores();
  if (!favoriteId) return null;
  if (scores) {
    const rows = computeRealRanking(favoriteId, scores);
    const lower = { ...scores, [favoriteId]: Math.max(0, scores[favoriteId] - REWARD_SCORE) };
    return { rows, isReal: true, rankBefore: rankIn(computeRealRanking(favoriteId, lower)), rankNow: rankIn(rows) };
  }
  const rows = computeRanking(favoriteId, score);
  return { rows, isReal: false, rankBefore: rankIn(computeRanking(favoriteId, Math.max(0, score - REWARD_SCORE))), rankNow: rankIn(rows) };
}

export function RankingList({ ranking, animate = false }: { ranking: Ranking; animate?: boolean }) {
  return (
    <section className="panel" aria-labelledby="ranking-title">
      <div className="panel-head">
        <h2 id="ranking-title" className="section-title">
          이번 주 팬덤 순위
        </h2>
        <span className="tag" data-testid="ranking-kind">{ranking.isReal ? '실시간 점수' : '예시 점수'}</span>
      </div>
      <ol className="ranking">
        {ranking.rows.map((row) => (
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
