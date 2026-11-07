import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { REWARD_SCORE, type CharacterId } from '../data';
import { computeRanking, computeRealRanking, type RankRow } from '../store/progress';
import { useFandomScores } from '../sync/sync';
import { motionOff } from './motion';

/** 몇 위에서 몇 위로, 몇 밀리초 뒤에 움직일지 */
export interface RankRise {
  from: number;
  to: number;
  delay: number;
}

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

const RISE_MS = 700;

/** 순위가 실제로 오른 만큼만 줄을 옮기고, 내 점수를 올려 보인다. 저장과는 상관없는 표시 효과다. */
function useRankRise(listRef: RefObject<HTMLOListElement | null>, rise: RankRise | null | undefined, score: number) {
  const [shownScore, setShownScore] = useState<number | null>(null);
  const from = rise?.from;
  const to = rise?.to;
  const delay = rise?.delay ?? 0;
  const startScore = useRef(score);
  useEffect(() => {
    const items = Array.from(listRef.current?.children ?? []) as HTMLElement[];
    if (from === undefined || to === undefined || from <= to || motionOff() || !items[to - 1]?.animate) return;
    const height = items[to - 1].offsetHeight;
    const options = { duration: RISE_MS, delay, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'backwards' as const };
    const animations = [items[to - 1].animate([{ transform: `translateY(${height * (from - to)}px)` }, { transform: 'none' }], options)];
    // 내가 앞지른 줄은 한 칸씩 아래로 밀려난다.
    for (const item of items.slice(to, from)) {
      animations.push(item.animate([{ transform: `translateY(${-height}px)` }, { transform: 'none' }], options));
    }
    const target = startScore.current;
    const first = Math.max(0, target - REWARD_SCORE);
    const begin = performance.now() + delay;
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, Math.max(0, (now - begin) / RISE_MS));
      setShownScore(t >= 1 ? null : Math.round(first + (target - first) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
      animations.forEach((a) => a.cancel());
      setShownScore(null);
    };
  }, [listRef, from, to, delay]);
  return shownScore;
}

export function RankingList({ ranking, rise }: { ranking: Ranking; rise?: RankRise | null }) {
  const listRef = useRef<HTMLOListElement>(null);
  const myScore = ranking.rows.find((r) => r.isFavorite)?.score ?? 0;
  const shownScore = useRankRise(listRef, rise, myScore);
  return (
    <section className="panel" aria-labelledby="ranking-title">
      <div className="panel-head">
        <h2 id="ranking-title" className="section-title">
          이번 주 팬덤 순위
        </h2>
        {ranking.isReal && <span className="tag" data-testid="ranking-kind">실시간 참여 집계</span>}
      </div>
      <ol className="ranking" ref={listRef}>
        {ranking.rows.map((row) => (
          <li
            key={row.id}
            className={`${row.isFavorite ? 'is-mine' : ''}${row.isFavorite && rise ? ' is-rising' : ''}`}
            style={row.isFavorite && rise ? ({ '--rise-delay': `${rise.delay}ms` } as CSSProperties) : undefined}
          >
            <span className="rank-no">{row.rank}</span>
            <span className="rank-name">
              {row.name} 팬덤{row.isFavorite && <small> 내 최애</small>}
            </span>
            <span className="rank-score">{(row.isFavorite && shownScore !== null ? shownScore : row.score).toLocaleString('ko-KR')}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
