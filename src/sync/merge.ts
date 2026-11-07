// 기기의 기록과 서버의 기록을 합치는 규칙. 화면도 Firebase도 모르는 순수한 계산이다.
import { cards, readings, type CharacterId } from '../data';
import { freshLibrary, validateBook } from '../library.mjs';
import { createInitial, sanitize, type Progress } from '../store/progress';

/** 서버에 올리는 진행 기록. 어느 화면을 보고 있었는지(screen)는 기기마다 달라 올리지 않는다. */
export type RemoteProgress = Omit<Progress, 'screen' | 'version'>;

const unique = (ids: string[]) => [...new Set(ids)];
const SCORE_MAX = 100000;
const SHORT_ID_MAX = 64;
const shortOrNull = (v: string | null) => (v !== null && v.length > SHORT_ID_MAX ? null : v);

/** 서버 규칙에 맞는 값만 올린다. 옛 카드 id 같은 값은 이 기기에 그대로 두고 올리기에서만 뺀다. */
export const toRemoteProgress = ({ screen: _screen, version: _version, ...rest }: Progress): RemoteProgress => ({
  ...rest,
  dmChoiceId: shortOrNull(rest.dmChoiceId),
  lastWrongOptionId: shortOrNull(rest.lastWrongOptionId),
  score: Math.min(Math.floor(rest.score), SCORE_MAX),
  cards: unique(rest.cards).filter((id) => cards.some((c) => c.id === id)),
  rewardedMissions: unique(rest.rewardedMissions).filter((id) => readings.some((r) => r.id === id)),
});

/** 규칙의 시각 상한(2100-01-01)과 같은 값 */
export const STAMP_MAX = 4102444800000;
export const clampStamp = (at: number): number => Math.min(Math.max(0, Math.floor(at)), STAMP_MAX);

export const fromRemoteProgress = (remote: unknown, screen: Progress['screen']): Progress =>
  sanitize({ ...(remote && typeof remote === 'object' ? remote : {}), version: 1, screen });

export const isBlankProgress = (p: Progress): boolean =>
  JSON.stringify(toRemoteProgress(p)) === JSON.stringify(toRemoteProgress(createInitial()));

interface Book { id: string; updatedAt: string; [key: string]: unknown }
export interface LibraryDoc { version: 1; nickname: string; books: Book[] }

const usableBook = (b: unknown): b is Book => {
  const book = b as Book | null;
  return Boolean(book) && typeof book!.id === 'string' && Boolean(book!.id) && typeof book!.createdAt === 'string' && typeof book!.updatedAt === 'string' && Object.keys(validateBook(book)).length === 0;
};

/** 서버 값이 앱 형식에 맞는 서고면 돌려준다. 안 맞는 책은 뺀다(로컬 서고가 읽기 불가가 되지 않게). */
export function usableLibrary(raw: unknown): LibraryDoc | null {
  const r = raw as Partial<LibraryDoc> | null;
  if (!r || r.version !== 1 || typeof r.nickname !== 'string' || !r.nickname.trim() || r.nickname.length > 30 || !Array.isArray(r.books)) return null;
  return { version: 1, nickname: r.nickname, books: r.books.filter(usableBook) };
}

/** 책은 삭제 기능이 없으니 합집합. 같은 책은 수정 시각이 늦은 쪽. 이름표는 서고가 늦게 바뀐 쪽. */
export function mergeLibraries(local: LibraryDoc | null, localAt: number, remote: LibraryDoc | null, remoteAt: number): LibraryDoc {
  const base = local ?? remote ?? (freshLibrary() as LibraryDoc);
  const byId = new Map<string, Book>();
  for (const book of [...(local?.books ?? []), ...(remote?.books ?? [])]) {
    const known = byId.get(book.id);
    if (!known || known.updatedAt < book.updatedAt) byId.set(book.id, book);
  }
  const nickname = local && remote ? (remoteAt > localAt ? remote.nickname : local.nickname) : base.nickname;
  return { version: 1, nickname, books: [...byId.values()] };
}

export interface ProgressPlan { pull: boolean; push: boolean }

/** 늦게 바뀐 쪽이 이긴다. 서버에 없으면 기존 기록을 올린다. 아무것도 안 한 빈 기록은 올리지 않는다. */
export function planProgress(local: Progress, localAt: number, hasRemote: boolean, remoteAt: number): ProgressPlan {
  if (hasRemote && remoteAt > localAt) return { pull: true, push: false };
  if (hasRemote && remoteAt === localAt) return { pull: false, push: false };
  return { pull: false, push: localAt > 0 || !isBlankProgress(local) };
}

/** 보상 표시의 인물을 읽는다. 앱에 없는 미션이면 null */
export const characterOfMission = (missionId: string): CharacterId | null =>
  readings.find((r) => r.id === missionId)?.characterId ?? null;

/** 새로 팬덤 점수를 올려야 할 미션. 이미 받았거나 대기 중인 것은 뺀다. */
export const newClaims = (rewarded: string[], claimed: string[], pending: string[]): string[] =>
  rewarded.filter((id) => characterOfMission(id) && !claimed.includes(id) && !pending.includes(id));

/** 서버 문서 한도(1MiB)와 규칙 한도(200권) 안쪽에서 멈춘다. 넘으면 서버에만 안 올리고 기기 기록은 그대로 둔다. */
export const LIBRARY_MAX_BOOKS = 200;
export const LIBRARY_MAX_BYTES = 900_000;
export const libraryTooLarge = (library: LibraryDoc): boolean =>
  library.books.length > LIBRARY_MAX_BOOKS || new TextEncoder().encode(JSON.stringify(library)).length > LIBRARY_MAX_BYTES;

export const RETRY_MIN = 5_000;
export const RETRY_MAX = 300_000;
/** 실패할수록 간격을 두 배로 늘리되 5분에서 멈춘다. */
export const nextRetryDelay = (current: number): number => Math.min(current * 2, RETRY_MAX);

/** 앞 단계가 실패해도 뒤 단계를 끝까지 돌린다. 실패가 하나라도 있으면 true */
export async function runSteps(steps: Array<() => Promise<unknown>>): Promise<boolean> {
  let failed = false;
  for (const step of steps) {
    try {
      await step();
    } catch {
      failed = true;
    }
  }
  return failed;
}
