// 호감도. 인물과 보낸 시간과 선택(대목 읽기, 선택 대화, 자유대화)으로 쌓인 호감 점수에서 단계를 정한다.
// 점수는 fan.ts 가 쌓는다. 여기에 저장하는 것은 "단계 상승 장면을 본 단계"뿐이다. 기기를 옮기면 장면이 한 번 더 나올 수 있다.
// 옛 방식(독서 기록 수)으로 이미 오른 사용자는 본 단계 아래로 내려가지 않는다.
import type { CharacterId } from '../data';
import { loadLibrary } from '../library.mjs';
import { AFFINITY_THRESHOLDS, affinityOf, stageOfAffinity, useFan } from './fan';
import { useSnapshot } from './store';

export const BOND_SEEN_KEY = 'hipdok:bond:v1';

export interface BookActivity {
  title?: string;
  createdAt?: string;
}

/** 가장 최근에 등록한 책의 제목. 없으면 null. 인물이 내 책에 반응하는 대사에만 쓴다. */
export function latestBookTitle(books: BookActivity[]): string | null {
  const latest = books.reduce<BookActivity | null>(
    (best, book) => (!best || (book.createdAt ?? '') > (best.createdAt ?? '') ? book : best),
    null,
  );
  return latest?.title?.trim() || null;
}

function readBooks(): BookActivity[] {
  try {
    const { data, blocked } = loadLibrary(localStorage);
    return blocked ? [] : (data.books as BookActivity[]);
  } catch {
    return [];
  }
}

function readAll(): Partial<Record<CharacterId, number>> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(BOND_SEEN_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<CharacterId, number>>) : {};
  } catch {
    return {};
  }
}

export function readSeenStage(id: CharacterId): number {
  const seen = readAll()[id];
  return typeof seen === 'number' ? seen : 0;
}

export function markStageSeen(id: CharacterId, stage: number) {
  try {
    localStorage.setItem(BOND_SEEN_KEY, JSON.stringify({ ...readAll(), [id]: stage }));
  } catch {
    /* 저장이 막히면 장면이 다음에 한 번 더 나올 뿐이다 */
  }
}

export interface BondStatus {
  /** 호감 점수만으로 계산한 단계 */
  earned: number;
  /** 화면에 쓰는 단계. 이미 본 단계 아래로 내려가지 않는다. */
  stage: number;
  /** 지금 최애의 호감 점수 */
  points: number;
  latestBook: string | null;
}

/** 점수와 본 단계로 화면에 쓸 단계를 정한다. */
export function bondOf(points: number, seen: number): Pick<BondStatus, 'earned' | 'stage' | 'points'> {
  const earned = stageOfAffinity(points);
  return { earned, stage: Math.max(earned, seen), points };
}

export interface NextBond {
  /** 다음 단계에 오르는 데 필요한 점수 */
  need: number;
  /** 남은 점수(최소 1) */
  remaining: number;
  /** 지금 단계에서 다음 단계까지 온 비율 0~1 */
  ratio: number;
}

/** 다음 단계까지의 거리. 가장 가까운 단계면 null. */
export function nextBondOf(stage: number, points: number): NextBond | null {
  const need = AFFINITY_THRESHOLDS[stage + 1];
  if (need === undefined) return null;
  const from = AFFINITY_THRESHOLDS[Math.min(stage, stageOfAffinity(points))];
  const ratio = Math.min(1, Math.max(0, (points - from) / (need - from)));
  return { need, remaining: Math.max(need - points, 1), ratio };
}

/** 점수가 바뀌면 화면도 바뀐다. */
export function useBond(): BondStatus {
  const { progress } = useSnapshot();
  const fan = useFan();
  const id = progress.favoriteId;
  const points = id ? affinityOf(id, fan) : 0;
  const seen = id ? readSeenStage(id) : 0;
  return { ...bondOf(points, seen), latestBook: latestBookTitle(readBooks()) };
}
