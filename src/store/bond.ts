// 호감도. 독서 활동 수로 계산하므로 진행 기록과 서버 규칙을 건드리지 않는다.
// 저장하는 것은 "단계 상승 장면을 본 단계"뿐이다. 기기를 옮기면 장면이 한 번 더 나올 수 있다.
import type { CharacterId } from '../data';
import { loadLibrary } from '../library.mjs';
import { useSnapshot } from './store';

export const BOND_SEEN_KEY = 'hipdok:bond:v1';

/** 각 단계에 오르는 데 필요한 독서 활동 수. 앞으로 조정할 때 여기만 고친다. */
export const BOND_THRESHOLDS = [0, 3, 6, 10];
/** 낙서로 호감을 쌓지 않도록 둔 최소 글자 수 */
export const QUOTE_MIN_CHARS = 5;
export const MEMO_MIN_CHARS = 10;

export interface BookActivity {
  title?: string;
  quote?: string;
  memo?: string;
  createdAt?: string;
}

/** 독서 활동 수: 미션 완료 1개당 1, 책 등록 1, 문장 기록 1, 감상 기록 1 */
export function activityPoints(cardCount: number, books: BookActivity[]): number {
  return books.reduce(
    (sum, book) =>
      sum +
      1 +
      ((book.quote ?? '').trim().length >= QUOTE_MIN_CHARS ? 1 : 0) +
      ((book.memo ?? '').trim().length >= MEMO_MIN_CHARS ? 1 : 0),
    cardCount,
  );
}

export function stageOfPoints(points: number): number {
  return BOND_THRESHOLDS.reduce((stage, need, index) => (points >= need ? index : stage), 0);
}

/** 가장 최근에 등록한 책의 제목. 없으면 null */
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
  /** 활동 수만으로 계산한 단계 */
  earned: number;
  /** 화면에 쓰는 단계. 책을 지워도 이미 본 단계 아래로 내려가지 않는다. */
  stage: number;
  points: number;
  latestBook: string | null;
}

/** 화면을 그릴 때마다 서고를 다시 읽어 계산한다. */
export function useBond(): BondStatus {
  const { progress } = useSnapshot();
  const books = readBooks();
  const points = activityPoints(progress.cards.length, books);
  const earned = stageOfPoints(points);
  const seen = progress.favoriteId ? readSeenStage(progress.favoriteId) : 0;
  return { earned, stage: Math.max(earned, seen), points, latestBook: latestBookTitle(books) };
}
