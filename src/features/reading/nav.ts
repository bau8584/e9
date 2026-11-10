// 읽기 탭에서 지금 펼쳐 둔 대목. 다른 화면(DM, 홈, 선택 대화)에서 "이 대목 읽기"를 누를 때 쓴다.
// 화면 메모리에만 둔다. 새로고침하면 서재부터 보인다.
import { useSyncExternalStore } from 'react';
import { goTo } from '../../store/store';

let openId: string | null = null;
const listeners = new Set<() => void>();

function set(next: string | null) {
  if (openId === next) return;
  openId = next;
  listeners.forEach((listen) => listen());
}

function subscribe(listen: () => void) {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

/** 그 대목을 펼친 채로 읽기 탭으로 간다. 이미 읽기 탭에 있어도 바로 바뀐다. */
export function openPassage(passageId: string): void {
  set(passageId);
  goTo('reading');
}

/** 대목을 덮고 서재로 돌아간다. */
export function closePassage(): void {
  set(null);
}

export const getOpenPassageId = (): string | null => openId;
export const useOpenPassageId = (): string | null => useSyncExternalStore(subscribe, getOpenPassageId);
