// 호감도. 카드와 서고의 책 수로 계산하므로 진행 기록과 서버 규칙을 건드리지 않는다.
// 저장하는 것은 "단계 상승 장면을 봤는지"뿐이다. 기기를 옮기면 장면이 한 번 더 나올 수 있다.
import type { CharacterId } from '../data';
import { loadLibrary } from '../library.mjs';
import { relationStage } from './progress';
import { useSnapshot } from './store';

export const BOND_SEEN_KEY = 'hipdok:bond:v1';

export function countBooks(): number {
  try {
    const { data, blocked } = loadLibrary(localStorage);
    return blocked ? 0 : data.books.length;
  } catch {
    return 0;
  }
}

/** 지금 관계 단계. 책은 화면을 그릴 때 다시 센다. */
export function useBondStage(): number {
  const { progress } = useSnapshot();
  return relationStage(progress, countBooks());
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
