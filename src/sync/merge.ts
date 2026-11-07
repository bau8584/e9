// 기기의 기록과 서버의 기록을 합치는 규칙. 화면도 Firebase도 모르는 순수한 계산이다.
import { characters, type CharacterId } from '../data';
import { freshLibrary, validateBook } from '../library.mjs';
import { createInitial, sanitize, type Progress } from '../store/progress';

/** 서버에 올리는 진행 기록. 어느 화면을 보고 있었는지(screen)는 기기마다 달라 올리지 않는다. */
export type RemoteProgress = Omit<Progress, 'screen' | 'version'>;

export const toRemoteProgress = ({ screen: _screen, version: _version, ...rest }: Progress): RemoteProgress => rest;

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

const MISSION = /^reading-([a-z]+)-\d+$/;

/** 보상 표시의 인물을 읽는다. 앱에 없는 인물이면 null */
export function characterOfMission(missionId: string): CharacterId | null {
  const id = MISSION.exec(missionId)?.[1];
  return characters.some((c) => c.id === id) ? (id as CharacterId) : null;
}

/** 새로 팬덤 점수를 올려야 할 미션. 이미 받았거나 대기 중인 것은 뺀다. */
export const newClaims = (rewarded: string[], claimed: string[], pending: string[]): string[] =>
  rewarded.filter((id) => characterOfMission(id) && !claimed.includes(id) && !pending.includes(id));
